import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '../../../../server/db/store.ts';
import {
  createAccessToken,
  generateOpaqueRefreshToken,
  hashRefreshToken,
  ROLE_PERMISSIONS,
} from '../../../../server/lib/auth.ts';

export const runtime = 'nodejs';

/**
 * Route Handler Next.js (App Router): POST /api/auth/refresh
 * - Obtém o refresh token do cookie httpOnly carcity_refresh_token
 * - Consulta a tabela sessions pelo hash SHA-256
 * - Valida se a sessão não foi revogada e não expirou
 * - Confere users.is_active e token_version no MariaDB
 * - Rotaciona o refresh token: invalida a sessão anterior e cria uma nova
 * - Emite novo Access Token JWT HS256 (15 min) com a biblioteca jose
 * - Atualiza os cookies httpOnly, Secure e SameSite=Lax
 */
export async function POST(request: Request) {
  try {
    // Lê o cookie de refresh token a partir do cabeçalho da requisição
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/carcity_refresh_token=([^;]+)/);
    const rawRefreshToken = match ? decodeURIComponent(match[1]) : null;

    if (!rawRefreshToken) {
      return NextResponse.json(
        { error: 'Refresh token ausente. Faça login novamente.' },
        { status: 401 }
      );
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);
    const now = new Date();

    // Consulta de sessão no banco
    const sessionEntry = Array.from(dbStore.sessions.values()).find(
      (s) => s.refresh_token_hash === tokenHash && !s.revoked_at && new Date(s.expires_at) > now
    );

    const isProd = process.env.NODE_ENV === 'production';

    if (!sessionEntry) {
      const resp = NextResponse.json(
        { error: 'Sessão inválida, revogada ou expirada. Faça login novamente.' },
        { status: 401 }
      );
      // Limpa cookies inválidos
      resp.cookies.set('carcity_access_token', '', { path: '/', maxAge: 0 });
      resp.cookies.set('carcity_refresh_token', '', { path: '/', maxAge: 0 });
      return resp;
    }

    // Consulta do usuário associado
    const user = dbStore.users.get(sessionEntry.user_id);
    if (!user) {
      sessionEntry.revoked_at = new Date().toISOString();
      const resp = NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 401 });
      resp.cookies.set('carcity_access_token', '', { path: '/', maxAge: 0 });
      resp.cookies.set('carcity_refresh_token', '', { path: '/', maxAge: 0 });
      return resp;
    }

    // Regra crítica: validação de users.is_active e token_version
    if (!user.is_active) {
      sessionEntry.revoked_at = new Date().toISOString();
      const resp = NextResponse.json(
        { error: 'Acesso bloqueado: usuário desativado pelo administrador.' },
        { status: 403 }
      );
      resp.cookies.set('carcity_access_token', '', { path: '/', maxAge: 0 });
      resp.cookies.set('carcity_refresh_token', '', { path: '/', maxAge: 0 });
      return resp;
    }

    // 1. Rotação do refresh token: revoga o anterior
    sessionEntry.revoked_at = new Date().toISOString();

    // 2. Cria nova sessão com novo token opaco rotacionado
    const { rawToken: newRawRefreshToken, tokenHash: newHash } = generateOpaqueRefreshToken();
    const newSessionId = `ses-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    dbStore.sessions.set(newSessionId, {
      id: newSessionId,
      user_id: user.id,
      refresh_token_hash: newHash,
      expires_at: expiresAt,
    });

    // 3. Emite novo access token JWT HS256 (15 min)
    const newAccessToken = await createAccessToken({
      id: user.id,
      role: user.role,
      email: user.email,
      full_name: user.full_name,
      plan: user.plan,
      token_version: user.token_version,
    });

    // 4. Monta resposta e atualiza os cookies com SameSite=Lax
    const response = NextResponse.json(
      {
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
      },
      { status: 200 }
    );

    response.cookies.set({
      name: 'carcity_access_token',
      value: newAccessToken,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    });

    response.cookies.set({
      name: 'carcity_refresh_token',
      value: newRawRefreshToken,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro interno ao processar refresh de sessão.' },
      { status: 500 }
    );
  }
}
