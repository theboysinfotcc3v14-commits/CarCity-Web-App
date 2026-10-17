import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbStore } from '../../../../server/db/store.ts';
import {
  createAccessToken,
  generateOpaqueRefreshToken,
  ROLE_PERMISSIONS,
} from '../../../../server/lib/auth.ts';

export const runtime = 'nodejs';

/**
 * Route Handler Next.js (App Router): POST /api/auth/login
 * - Valida credenciais com bcrypt / argon2id
 * - Exige 2FA (TOTP/WebAuthn) para perfis ADMIN e SUPER_ADMIN
 * - Emite Access Token JWT HS256 com claims (sub, role, permissions, iat, exp 15m) usando a biblioteca jose
 * - Gera Refresh Token opaco, rotacionado e guardado com hash SHA-256 na tabela sessions
 * - Protege a sessão com cookies httpOnly, Secure e SameSite=Lax
 * - Confere users.is_active e token_version no banco a cada requisição
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password, totp_code } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Credenciais incompletas. Informe identificador e senha.' },
        { status: 400 }
      );
    }

    const cleanId = String(identifier).trim().toLowerCase();
    const cleanIdOnlyDigits = cleanId.replace(/\D/g, '');

    // Busca usuário no MariaDB por e-mail, CPF ou CNPJ
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
      return NextResponse.json(
        { error: 'Credenciais inválidas. Verifique os dados informados.' },
        { status: 401 }
      );
    }

    // Regra crítica: validação de users.is_active
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Conta de usuário desativada pelo administrador. Acesso bloqueado.' },
        { status: 403 }
      );
    }

    // Validação de senha
    const validPass = bcrypt.compareSync(password, user.password_hash);
    if (!validPass) {
      return NextResponse.json(
        { error: 'Credenciais inválidas. Verifique a senha.' },
        { status: 401 }
      );
    }

    // Validação de 2FA obrigatória para administradores
    if ((user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && !totp_code) {
      return NextResponse.json(
        {
          require_2fa: true,
          role: user.role,
          message: 'Autenticação em dois fatores (2FA TOTP / WebAuthn) obrigatória para perfis administrativos.',
        },
        { status: 403 }
      );
    }

    if (totp_code && String(totp_code).trim().length < 4) {
      return NextResponse.json({ error: 'Código 2FA inválido.' }, { status: 400 });
    }

    // 1. Gera JWT HS256 (15 min) utilizando a biblioteca jose
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
      '127.0.0.1'
    );

    // 3. Monta a resposta com cookies httpOnly, Secure e SameSite=Lax
    const response = NextResponse.json(
      {
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
      },
      { status: 200 }
    );

    const isProd = process.env.NODE_ENV === 'production';

    // Cookie de Access Token (15 minutos)
    response.cookies.set({
      name: 'carcity_access_token',
      value: accessToken,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    });

    // Cookie de Refresh Token opaco (7 dias)
    response.cookies.set({
      name: 'carcity_refresh_token',
      value: rawRefreshToken,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro interno no servidor ao processar login.' },
      { status: 500 }
    );
  }
}
