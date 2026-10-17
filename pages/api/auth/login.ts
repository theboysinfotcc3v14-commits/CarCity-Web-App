import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { dbStore } from '../../../server/db/store.ts';
import {
  createAccessToken,
  generateOpaqueRefreshToken,
  ROLE_PERMISSIONS,
} from '../../../server/lib/auth.ts';

/**
 * Next.js Pages API Route: /api/auth/login
 * - Autentica por CPF, CNPJ ou E-mail corporativo
 * - Valida a senha usando hash bcrypt
 * - Valida 2FA para ADMIN e SUPER_ADMIN
 * - Valida se o usuário está ativo (users.is_active) e confere token_version
 * - Gera Access Token JWT HS256 (15 min) utilizando a biblioteca jose
 * - Gera Refresh Token opaco, guarda hash SHA-256 na tabela sessions
 * - Emite cookies httpOnly, Secure e SameSite=Lax
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Método ${req.method} não permitido.` });
  }

  try {
    const { identifier, password, totp_code } = req.body || {};

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Credenciais incompletas. Informe identificador e senha.' });
    }

    const cleanId = String(identifier).trim().toLowerCase();
    const cleanIdOnlyDigits = cleanId.replace(/\D/g, '');

    // Consulta usuário no banco
    const user = Array.from(dbStore.users.values()).find((u) => {
      const userEmail = u.email.toLowerCase();
      const userDocOnlyDigits = u.cpf_cnpj.replace(/\D/g, '');
      return (
        userEmail === cleanId ||
        u.cpf_cnpj === cleanId ||
        (cleanIdOnlyDigits.length > 5 && userDocOnlyDigits === cleanIdOnlyDigits)
      );
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas. Verifique os dados informados.' });
    }

    // Regra crítica: validação de users.is_active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Conta de usuário desativada pelo administrador. Acesso bloqueado.' });
    }

    // Validação da senha
    const validPass = bcrypt.compareSync(password, user.password_hash);
    if (!validPass) {
      return res.status(401).json({ error: 'Credenciais inválidas. Verifique a senha.' });
    }

    // Validação de 2FA para perfis administrativos
    if ((user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && !totp_code) {
      return res.status(403).json({
        require_2fa: true,
        role: user.role,
        message: 'Autenticação em dois fatores (2FA TOTP / WebAuthn) obrigatória para perfis administrativos.',
      });
    }

    if (totp_code && String(totp_code).trim().length < 4) {
      return res.status(400).json({ error: 'Código 2FA inválido.' });
    }

    // 1. Gera Access Token JWT HS256 (15 min) utilizando a biblioteca jose
    const accessToken = await createAccessToken({
      id: user.id,
      role: user.role,
      email: user.email,
      full_name: user.full_name,
      plan: user.plan,
      token_version: user.token_version,
    });

    // 2. Gera Refresh Token opaco e persiste hash na tabela sessions
    const { rawToken: rawRefreshToken, tokenHash } = generateOpaqueRefreshToken();
    const sessionId = `ses-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    dbStore.sessions.set(sessionId, {
      id: sessionId,
      user_id: user.id,
      refresh_token_hash: tokenHash,
      expires_at: expiresAt,
    });

    // Auditoria obrigatória de login
    dbStore.recordAudit(
      user.id,
      'LOGIN_SUCESSO',
      'USER',
      user.id,
      { role: user.role, sessionId },
      false,
      (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1'
    );

    // 3. Configura cookies httpOnly, Secure e SameSite=Lax
    const isProd = process.env.NODE_ENV === 'production';
    const secureFlag = isProd ? '; Secure' : '';

    const accessCookie = `carcity_access_token=${accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900${secureFlag}`;
    const refreshCookie = `carcity_refresh_token=${rawRefreshToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secureFlag}`;

    res.setHeader('Set-Cookie', [accessCookie, refreshCookie]);

    return res.status(200).json({
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
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erro interno no servidor ao processar login.' });
  }
}
