import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { dbStore } from '../db/store.ts';
import { UserRole, UserPlan, DecodedTokenPayload } from '../../src/types/index.ts';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'carcity-enterprise-hmac-sha256-secret-key-automotive-2026'
);

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const ACCESS_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 15 * 60 * 1000, // 15 minutes
};

// Generates an opaque cryptographic refresh token and its SHA-256 hash
export function generateOpaqueRefreshToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
}

// Hash a received raw refresh token for lookup
export function hashRefreshToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  DRIVER: [
    'vehicles:read',
    'telemetry:read',
    'telemetry:simulate',
    'commands:execute',
    'risk:report',
    'community:read',
    'community:write',
    'appointments:create',
    'ai:chat',
  ],
  WORKSHOP_OWNER: [
    'workshop:manage',
    'appointments:manage',
    'offers:manage',
    'anti_fraud:submit',
    'community:read',
  ],
  ADMIN: [
    'cms:manage',
    'community:moderate',
    'analytics:read',
    'articles:delete',
    'community:delete',
  ],
  SUPER_ADMIN: [
    'cms:manage',
    'community:moderate',
    'analytics:read',
    'articles:delete',
    'community:delete',
    'trash:permanent_delete',
    'trash:restore',
    'workshops:audit',
    'team:manage',
    'system:audit',
    'impersonate:run',
    'commands:master_override',
  ],
};

// Generate access token (15 mins) with JOSE HS256
export async function createAccessToken(user: {
  id: string;
  role: UserRole;
  email: string;
  full_name: string;
  plan: UserPlan;
  token_version: number;
}): Promise<string> {
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return await new SignJWT({
    role: user.role,
    permissions,
    email: user.email,
    name: user.full_name,
    plan: user.plan,
    token_version: user.token_version,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(JWT_SECRET);
}

// Verify JWT token and confirm user state in database
export async function verifyToken(token: string): Promise<DecodedTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const sub = payload.sub as string;
    const user = dbStore.users.get(sub);

    if (!user || !user.is_active) {
      return null;
    }

    // Verify token version for instant revocation
    if (payload.token_version !== undefined && payload.token_version !== user.token_version) {
      return null;
    }

    return {
      sub,
      role: user.role, // Always server-authoritative
      permissions: ROLE_PERMISSIONS[user.role] || [],
      email: user.email,
      name: user.full_name,
      plan: user.plan,
      iat: (payload.iat as number) || Math.floor(Date.now() / 1000),
      exp: (payload.exp as number) || Math.floor(Date.now() / 1000) + 900,
    };
  } catch (err) {
    return null;
  }
}

// Middleware: Authenticate user from cookie or Bearer header
export interface AuthenticatedRequest extends Request {
  user?: DecodedTokenPayload;
  rawToken?: string;
  isAuditor?: boolean;
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token = req.cookies?.['carcity_access_token'];

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado. Token JWT ausente.' });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token JWT inválido, revogado ou expirado.' });
  }

  req.user = payload;
  req.rawToken = token;
  next();
}

// Middleware: Require specific role or list of allowed roles
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    // SUPER_ADMIN has access or auditor mode
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Acesso negado. Esta rota exige papel [${allowedRoles.join(', ')}]. Seu papel atual é [${req.user.role}].`,
      });
    }

    next();
  };
}
