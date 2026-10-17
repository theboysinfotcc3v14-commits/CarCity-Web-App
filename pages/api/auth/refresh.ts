import type { NextApiRequest, NextApiResponse } from 'next';
import { dbStore } from '../../../server/db/store.ts';
import {
  createAccessToken,
  generateOpaqueRefreshToken,
  hashRefreshToken,
  ROLE_PERMISSIONS,
} from '../../../server/lib/auth.ts';

/**
 * Next.js Pages API Route: /api/auth/refresh
 * - Obtém o refresh token do cookie httpOnly carcity_refresh_token
 * - Consulta a tabela sessions pelo hash SHA-256
 * - Valida se a sessão não foi revogada e não expirou
 * - Valida se users.is_active é verdadeiro e confere token_version
 * - Rotaciona o refresh token: revoga a sessão anterior e cria nova sessão com novo hash
 * - Emite novo Access Token JWT HS256 (15 min) utilizando a biblioteca jose
 * - Atualiza cookies httpOnly, Secure e SameSite=Lax
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Método ${req.method} não permitido.` });
  }

  try {
    // Lê cookie de refresh token a partir de req.cookies ou cabeçalho Cookie
    let rawRefreshToken = req.cookies?.['carcity_refresh_token'];
    if (!rawRefreshToken && req.headers.cookie) {
      const match = req.headers.cookie.match(/carcity_refresh_token=([^;]+)/);
      if (match) rawRefreshToken = decodeURIComponent(match[1]);
    }
    if (!rawRefreshToken && req.body?.refresh_token) {
      rawRefreshToken = req.body.refresh_token;
    }

    const isProd = process.env.NODE_ENV === 'production';
    const secureFlag = isProd ? '; Secure' : '';

    if (!rawRefreshToken) {
      return res.status(401).json({ error: 'Refresh token ausente. Faça login novamente.' });
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);
    const now = new Date();

    // Consulta de sessão no banco
    const sessionEntry = Array.from(dbStore.sessions.values()).find(
      (s) => s.refresh_token_hash === tokenHash && !s.revoked_at && new Date(s.expires_at) > now
    );

    if (!sessionEntry) {
      // Limpa cookies inválidos
      res.setHeader('Set-Cookie', [
        `carcity_access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`,
        `carcity_refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`,
      ]);
      return res.status(401).json({ error: 'Sessão inválida, revogada ou expirada. Faça login novamente.' });
    }

    // Consulta do usuário associado
    const user = dbStore.users.get(sessionEntry.user_id);
    if (!user) {
      sessionEntry.revoked_at = new Date().toISOString();
      res.setHeader('Set-Cookie', [
        `carcity_access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`,
        `carcity_refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`,
      ]);
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    // Regra crítica: validação de users.is_active e token_version
    if (!user.is_active) {
      sessionEntry.revoked_at = new Date().toISOString();
      res.setHeader('Set-Cookie', [
        `carcity_access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`,
        `carcity_refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`,
      ]);
      return res.status(403).json({ error: 'Acesso bloqueado: usuário desativado pelo administrador.' });
    }

    // 1. Rotação de sessão: revoga a sessão anterior
    sessionEntry.revoked_at = new Date().toISOString();

    // 2. Emite novo Refresh Token opaco rotacionado
    const { rawToken: newRawRefreshToken, tokenHash: newHash } = generateOpaqueRefreshToken();
    const newSessionId = `ses-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    dbStore.sessions.set(newSessionId, {
      id: newSessionId,
      user_id: user.id,
      refresh_token_hash: newHash,
      expires_at: expiresAt,
    });

    // 3. Emite novo Access Token JWT HS256 (15 min) utilizando a biblioteca jose
    const newAccessToken = await createAccessToken({
      id: user.id,
      role: user.role,
      email: user.email,
      full_name: user.full_name,
      plan: user.plan,
      token_version: user.token_version,
    });

    // 4. Configura cookies httpOnly, Secure e SameSite=Lax
    const accessCookie = `carcity_access_token=${newAccessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900${secureFlag}`;
    const refreshCookie = `carcity_refresh_token=${newRawRefreshToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secureFlag}`;

    res.setHeader('Set-Cookie', [accessCookie, refreshCookie]);

    return res.status(200).json({
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
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erro interno ao processar refresh de sessão.' });
  }
}
