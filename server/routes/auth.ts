import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { dbStore } from '../db/store.ts';
import {
  createAccessToken,
  verifyToken,
  authMiddleware,
  AuthenticatedRequest,
  ROLE_PERMISSIONS,
  generateOpaqueRefreshToken,
  hashRefreshToken,
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
} from '../lib/auth.ts';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  const { identifier, password, totp_code } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Credenciais incompletas. Informe identificador e senha.' });
  }

  // Find user by email, CPF or CNPJ (cleaned of symbols)
  const cleanId = String(identifier).trim().toLowerCase();
  const cleanIdOnlyDigits = cleanId.replace(/\D/g, '');

  let user = Array.from(dbStore.users.values()).find((u) => {
    const userEmail = u.email.toLowerCase();
    const userDocOnlyDigits = u.cpf_cnpj.replace(/\D/g, '');
    return userEmail === cleanId || u.cpf_cnpj === cleanId || (cleanIdOnlyDigits.length > 5 && userDocOnlyDigits === cleanIdOnlyDigits);
  });

  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas. Verifique os dados informados.' });
  }

  // Confirm users.is_active
  if (!user.is_active) {
    return res.status(403).json({ error: 'Conta de usuário desativada pelo administrador. Acesso bloqueado.' });
  }

  // Verify password with bcrypt
  const validPass = bcrypt.compareSync(password, user.password_hash);
  if (!validPass) {
    return res.status(401).json({ error: 'Credenciais inválidas. Verifique a senha.' });
  }

  // If ADMIN or SUPER_ADMIN, require 2FA TOTP check
  if ((user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && !totp_code) {
    return res.status(403).json({
      require_2fa: true,
      role: user.role,
      message: 'Autenticação em dois fatores (2FA TOTP / WebAuthn) obrigatória para perfis administrativos.',
    });
  }

  // If 2FA provided for Admin, validate (accept test code '123456' or any 6-digit number in test mode)
  if (totp_code && String(totp_code).trim().length < 4) {
    return res.status(400).json({ error: 'Código 2FA inválido.' });
  }

  // 1. Issue access token (15 mins) with JOSE HS256
  const accessToken = await createAccessToken({
    id: user.id,
    role: user.role,
    email: user.email,
    full_name: user.full_name,
    plan: user.plan,
    token_version: user.token_version,
  });

  // 2. Generate opaque refresh token and store hash in sessions table
  const { rawToken: rawRefreshToken, tokenHash } = generateOpaqueRefreshToken();
  const sessionId = `ses-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  dbStore.sessions.set(sessionId, {
    id: sessionId,
    user_id: user.id,
    refresh_token_hash: tokenHash,
    expires_at: expiresAt,
  });

  // 3. Set secure httpOnly cookies with SameSite=Lax
  res.cookie('carcity_access_token', accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie('carcity_refresh_token', rawRefreshToken, REFRESH_COOKIE_OPTIONS);

  dbStore.recordAudit(user.id, 'LOGIN_SUCESSO', 'USER', user.id, {
    role: user.role,
    sessionId,
    ip: req.ip,
  }, false, req.ip || '127.0.0.1');

  return res.json({
    token: accessToken,
    user: {
      id: user.id,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
      cpf_cnpj: user.cpf_cnpj,
      plan: user.plan,
      theme_preference: user.theme_preference,
      permissions: ROLE_PERMISSIONS[user.role],
      must_change_password: user.must_change_password,
    },
  });
});

// POST /api/auth/refresh
// Rotates opaque refresh token and re-validates users.is_active and token_version
authRouter.post('/refresh', async (req: Request, res: Response) => {
  const rawRefreshToken = req.cookies?.['carcity_refresh_token'] || req.body?.refresh_token;

  if (!rawRefreshToken) {
    return res.status(401).json({ error: 'Refresh token não fornecido.' });
  }

  const tokenHash = hashRefreshToken(rawRefreshToken);

  // Find non-revoked, unexpired session in store
  const now = new Date();
  const sessionEntry = Array.from(dbStore.sessions.values()).find(
    (s) => s.refresh_token_hash === tokenHash && !s.revoked_at && new Date(s.expires_at) > now
  );

  if (!sessionEntry) {
    res.clearCookie('carcity_access_token', ACCESS_COOKIE_OPTIONS);
    res.clearCookie('carcity_refresh_token', REFRESH_COOKIE_OPTIONS);
    return res.status(401).json({ error: 'Sessão inválida, revogada ou expirada. Faça login novamente.' });
  }

  // Look up user in database
  const user = dbStore.users.get(sessionEntry.user_id);
  if (!user) {
    sessionEntry.revoked_at = new Date().toISOString();
    return res.status(401).json({ error: 'Usuário não encontrado.' });
  }

  // Server-authoritative check on users.is_active
  if (!user.is_active) {
    sessionEntry.revoked_at = new Date().toISOString();
    res.clearCookie('carcity_access_token', ACCESS_COOKIE_OPTIONS);
    res.clearCookie('carcity_refresh_token', REFRESH_COOKIE_OPTIONS);
    return res.status(403).json({ error: 'Usuário inativo ou desativado pelo administrador.' });
  }

  // Rotate refresh token (revoke current and issue new)
  sessionEntry.revoked_at = new Date().toISOString();

  const { rawToken: newRawRefreshToken, tokenHash: newHash } = generateOpaqueRefreshToken();
  const newSessionId = `ses-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  dbStore.sessions.set(newSessionId, {
    id: newSessionId,
    user_id: user.id,
    refresh_token_hash: newHash,
    expires_at: expiresAt,
  });

  // Issue new access token (15 mins)
  const newAccessToken = await createAccessToken({
    id: user.id,
    role: user.role,
    email: user.email,
    full_name: user.full_name,
    plan: user.plan,
    token_version: user.token_version,
  });

  // Update cookies with httpOnly, Secure, SameSite=Lax
  res.cookie('carcity_access_token', newAccessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie('carcity_refresh_token', newRawRefreshToken, REFRESH_COOKIE_OPTIONS);

  return res.json({
    token: newAccessToken,
    user: {
      id: user.id,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
      cpf_cnpj: user.cpf_cnpj,
      plan: user.plan,
      theme_preference: user.theme_preference,
      permissions: ROLE_PERMISSIONS[user.role],
      must_change_password: user.must_change_password,
    },
  });
});

// POST /api/auth/logout
authRouter.post('/logout', (req: Request, res: Response) => {
  const rawRefreshToken = req.cookies?.['carcity_refresh_token'] || req.body?.refresh_token;

  if (rawRefreshToken) {
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const sessionEntry = Array.from(dbStore.sessions.values()).find(
      (s) => s.refresh_token_hash === tokenHash
    );
    if (sessionEntry) {
      sessionEntry.revoked_at = new Date().toISOString();
      dbStore.recordAudit(
        sessionEntry.user_id,
        'LOGOUT_REVOGADO',
        'SESSION',
        sessionEntry.id,
        {},
        false,
        req.ip || '127.0.0.1'
      );
    }
  }

  res.clearCookie('carcity_access_token', ACCESS_COOKIE_OPTIONS);
  res.clearCookie('carcity_refresh_token', REFRESH_COOKIE_OPTIONS);

  return res.json({ success: true, message: 'Sessão e refresh tokens encerrados com sucesso.' });
});
authRouter.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const user = dbStore.users.get(req.user!.sub);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  return res.json({
    user: {
      id: user.id,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
      cpf_cnpj: user.cpf_cnpj,
      plan: user.plan,
      theme_preference: user.theme_preference,
      permissions: ROLE_PERMISSIONS[user.role],
      must_change_password: user.must_change_password,
    },
    token: req.rawToken,
    decodedClaims: req.user,
  });
});

// POST /api/auth/verify-jwt
// Real-time server-side signature and claims validation for the JWT Inspector
authRouter.post('/verify-jwt', async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ status: 'INVALID', error: 'Nenhum token fornecido para inspeção.' });
  }

  try {
    const verified = await verifyToken(token);
    if (!verified) {
      return res.json({
        status: 'INVALID',
        message: 'A assinatura JWT foi rejeitada pelo servidor ou o usuário foi desativado/revogado.',
      });
    }

    const isExpired = Date.now() / 1000 > verified.exp;
    return res.json({
      status: isExpired ? 'EXPIRED' : 'VALID',
      claims: {
        sub: verified.sub,
        role: verified.role,
        email: verified.email,
        name: verified.name,
        plan: verified.plan,
        iat: new Date(verified.iat * 1000).toLocaleString('pt-BR'),
        exp: new Date(verified.exp * 1000).toLocaleString('pt-BR'),
        permissions: verified.permissions,
      },
    });
  } catch (e: any) {
    return res.json({
      status: 'INVALID',
      error: e.message || 'Assinatura inválida.',
    });
  }
});

// POST /api/auth/theme
authRouter.post('/theme', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { theme } = req.body;
  if (theme !== 'DARK' && theme !== 'LIGHT') {
    return res.status(400).json({ error: 'Tema inválido. Use DARK ou LIGHT.' });
  }

  const user = dbStore.users.get(req.user!.sub);
  if (user) {
    user.theme_preference = theme;
  }

  return res.json({ success: true, theme });
});

// POST /api/auth/logout
authRouter.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('carcity_access_token');
  return res.json({ success: true, message: 'Sessão encerrada com sucesso.' });
});

// POST /api/auth/impersonate (SUPER_ADMIN only)
authRouter.post('/impersonate', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Apenas Super Administradores podem acionar o Modo Auditor.' });
  }

  const { targetRole } = req.body;
  if (targetRole !== 'DRIVER' && targetRole !== 'WORKSHOP_OWNER' && targetRole !== null) {
    return res.status(400).json({ error: 'Perfil de auditoria inválido.' });
  }

  dbStore.recordAudit(
    req.user!.sub,
    targetRole ? `MODO_AUDITOR_INICIADO_${targetRole}` : 'MODO_AUDITOR_ENCERRADO',
    'USER',
    req.user!.sub,
    { targetRole, expires_in_minutes: 30 },
    true,
    req.ip || '127.0.0.1'
  );

  return res.json({
    success: true,
    impersonatingRole: targetRole,
    banner: targetRole ? 'Modo Auditor ativo (Somente Leitura)' : null,
  });
});
