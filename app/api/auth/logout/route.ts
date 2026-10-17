import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '../../../../server/db/store.ts';
import { hashRefreshToken } from '../../../../server/lib/auth.ts';

export const runtime = 'nodejs';

/**
 * Route Handler Next.js (App Router): POST /api/auth/logout
 * - Identifica a sessão a partir do cookie carcity_refresh_token
 * - Marca a sessão como revogada no MariaDB (revoked_at = NOW)
 * - Registra o encerramento da sessão em audit_logs
 * - Invalida os cookies httpOnly (Max-Age=0)
 */
export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/carcity_refresh_token=([^;]+)/);
    const rawRefreshToken = match ? decodeURIComponent(match[1]) : null;

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
          '127.0.0.1'
        );
      }
    }

    const response = NextResponse.json(
      { success: true, message: 'Sessão encerrada com sucesso.' },
      { status: 200 }
    );

    // Limpa ambos os cookies de autenticação
    response.cookies.set({
      name: 'carcity_access_token',
      value: '',
      path: '/',
      maxAge: 0,
      httpOnly: true,
      sameSite: 'lax',
    });

    response.cookies.set({
      name: 'carcity_refresh_token',
      value: '',
      path: '/',
      maxAge: 0,
      httpOnly: true,
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao processar encerramento de sessão.' },
      { status: 500 }
    );
  }
}
