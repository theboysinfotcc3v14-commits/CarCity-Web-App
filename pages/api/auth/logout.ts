import type { NextApiRequest, NextApiResponse } from 'next';
import { dbStore } from '../../../server/db/store.ts';
import { hashRefreshToken } from '../../../server/lib/auth.ts';

/**
 * Next.js Pages API Route: /api/auth/logout
 * - Identifica o refresh token a partir dos cookies
 * - Marca a sessão como revogada no MariaDB (revoked_at = NOW)
 * - Registra em audit_logs
 * - Invalida os cookies httpOnly, Secure e SameSite=Lax (Max-Age=0)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Método ${req.method} não permitido.` });
  }

  try {
    let rawRefreshToken = req.cookies?.['carcity_refresh_token'];
    if (!rawRefreshToken && req.headers.cookie) {
      const match = req.headers.cookie.match(/carcity_refresh_token=([^;]+)/);
      if (match) rawRefreshToken = decodeURIComponent(match[1]);
    }
    if (!rawRefreshToken && req.body?.refresh_token) {
      rawRefreshToken = req.body.refresh_token;
    }

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
          (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || '127.0.0.1'
        );
      }
    }

    const isProd = process.env.NODE_ENV === 'production';
    const secureFlag = isProd ? '; Secure' : '';

    // Limpa ambos os cookies de autenticação
    res.setHeader('Set-Cookie', [
      `carcity_access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`,
      `carcity_refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`,
    ]);

    return res.status(200).json({ success: true, message: 'Sessão encerrada com sucesso.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erro ao processar logout.' });
  }
}
