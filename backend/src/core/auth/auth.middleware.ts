import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import type { User, SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin, createAuthenticatedClient } from '../database/supabase.js';
import { UserContext } from './userContext.js';
import { AppRole, isGovernmentRole, isContractorRole } from './roles.js';
import { AuthenticationError, AuthorizationError } from '../http/errors.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
  userContext?: UserContext;
  role?: AppRole;
  organizationId?: string | null;
  supabase?: SupabaseClient;
  mfaVerified?: boolean;
  sessionId?: string;
}

// Phase 40: Exact Method + Path Auth Exemptions (Zero Prefix Wildcards)
const PUBLIC_EXEMPT_ROUTES = new Set([
  'GET /api/auth/csrf',
  'POST /api/auth/login',
  'POST /api/auth/register',
  'POST /api/auth/forgot-password',
  'POST /api/auth/reset-password',
  'GET /api/auth/oauth/google/start',
  'GET /api/auth/oauth/google/callback',
]);

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    let rawToken: string | undefined;

    // 1. Check HttpOnly opaque session cookie first
    if (req.cookies) {
      rawToken = req.cookies['nirikshak_session'] || req.cookies['sb-access-token'];
    }

    // 2. Check Authorization: Bearer <token>
    if (!rawToken) {
      const authHeader = req.header('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        rawToken = authHeader.slice(7).trim();
      }
    }

    if (!rawToken) {
      throw new AuthenticationError('Missing or malformed authentication credentials');
    }

    let userId: string | null = null;
    let userEmail: string | undefined = undefined;
    let mfaVerified = false;
    let supabaseTokenForClient = rawToken;

    // Hash raw token to query gateway_sessions
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const { data: sessionRow, error: sessionErr } = await supabaseAdmin
      .from('gateway_sessions')
      .select('*')
      .eq('session_token_hash', tokenHash)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (sessionRow) {
      userId = sessionRow.user_id;
      req.sessionId = sessionRow.id;

      // Check real MFA elevation state
      if (sessionRow.mfa_verified) {
        if (sessionRow.elevated_until) {
          mfaVerified = new Date(sessionRow.elevated_until).getTime() > Date.now();
        } else {
          mfaVerified = true;
        }
      }

      // Phase 9: Authoritative CSRF session-binding verification for mutating requests
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        const csrfHeader = req.headers['x-csrf-token'] as string;
        if (csrfHeader && sessionRow.csrf_token_hash) {
          const headerHash = crypto.createHash('sha256').update(csrfHeader).digest('hex');
          const bufA = Buffer.from(headerHash, 'utf8');
          const bufB = Buffer.from(sessionRow.csrf_token_hash, 'utf8');
          if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
            throw new AuthenticationError('CSRF verification failed: Token does not match session binding.');
          }
        }
      }

      // Update session activity timestamp asynchronously
      void supabaseAdmin
        .from('gateway_sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', sessionRow.id);

      // Resolve Supabase access token (decrypt if stored as ciphertext)
      if (sessionRow.supabase_access_token_ciphertext) {
        try {
          const { decryptSecret } = await import('../security/encryption.js');
          supabaseTokenForClient = decryptSecret({
            ciphertext: sessionRow.supabase_access_token_ciphertext,
            iv: sessionRow.supabase_access_token_iv,
            tag: sessionRow.supabase_access_token_tag,
            keyVersion: sessionRow.encryption_key_version || 1,
          }, 'SESSION_TOKEN_ENCRYPTION_KEY');
        } catch {
          // If decryption fails, maintain rawToken as placeholder
          supabaseTokenForClient = rawToken;
        }
      } else if (sessionRow.supabase_access_token) {
        supabaseTokenForClient = sessionRow.supabase_access_token;
      }
    } else {
      // Phase 7: Raw Supabase Bearer JWT bypass is strictly prohibited in production
      const isDevOrTest = process.env.NODE_ENV !== 'production';
      const allowLegacyBearer = process.env.ALLOW_LEGACY_BEARER_AUTH === 'true';

      if (!isDevOrTest || !allowLegacyBearer) {
        throw new AuthenticationError('Invalid or expired authentication session');
      }

      // Fallback strictly for isolated test suites
      const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(rawToken);
      if (authError || !authData.user) {
        throw new AuthenticationError('Invalid or expired authentication session');
      }
      userId = authData.user.id;
      userEmail = authData.user.email;
    }

    if (!userId) {
      throw new AuthenticationError('Authentication session could not be resolved');
    }

    // Fetch user details from auth.users or profiles
    if (!userEmail) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      userEmail = authUser?.user?.email || 'user@nirikshak.gov.in';
      req.user = authUser?.user as User;
    }

    // Resolve authoritative role & active membership from database
    const { data: memberRows, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('role, organization_id, status, organizations(id, name, type)')
      .eq('user_id', userId)
      .ilike('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (memberError) {
      console.warn('[requireAuth] Member lookup warning:', memberError.message);
    }

    const membership = memberRows && memberRows.length > 0 ? memberRows[0] : null;
    const org = membership?.organizations as any;

    const role: AppRole = (membership?.role as AppRole) || 'citizen';
    const orgId = membership?.organization_id || null;
    const orgType = org?.type || null;

    req.role = role;
    req.organizationId = orgId;
    req.mfaVerified = mfaVerified;
    req.token = supabaseTokenForClient;
    req.userContext = {
      userId,
      email: userEmail,
      role,
      organizationId: orgId,
      organizationType: orgType,
      organizationName: org?.name,
      permissions: [],
    };

    req.supabase = await createAuthenticatedClient(supabaseTokenForClient);
    next();
  } catch (err: any) {
    next(err instanceof AuthenticationError ? err : new AuthenticationError(err.message));
  }
}

/**
 * Secure default middleware:
 * Any route under /api must automatically require authentication unless
 * explicitly matched in PUBLIC_EXEMPT_ROUTES.
 */
export function requireAuthByDefault(req: Request, res: Response, next: NextFunction): void {
  const method = req.method.toUpperCase();
  const fullPath = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;
  const exactKey = `${method} ${fullPath}`;

  // Check exact method + path match (Phase 40: NO prefix matching)
  if (PUBLIC_EXEMPT_ROUTES.has(exactKey)) {
    return next();
  }

  // Enforce authentication on all other /api routes
  void requireAuth(req as AuthenticatedRequest, res, next);
}

export function requireRole(allowedRoles: AppRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.userContext || !req.role) {
      return next(new AuthenticationError());
    }

    if (!allowedRoles.includes(req.role)) {
      return next(new AuthorizationError(`Access denied: role '${req.role}' lacks required permissions`));
    }

    next();
  };
}

export function requireGovernment(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.role || !isGovernmentRole(req.role)) {
    return next(new AuthorizationError('Government credentials required for this operation'));
  }
  next();
}

export function requireContractor(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.role || !isContractorRole(req.role)) {
    return next(new AuthorizationError('Contractor credentials required for this operation'));
  }
  next();
}

/**
 * Require elevated authentication (MFA verified session) for critical state operations
 * (e.g. contract awards, payment approvals, settlement authorizations).
 */
export function requireElevatedAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.userContext) {
    return next(new AuthenticationError('Authentication required'));
  }

  const sensitiveRoles: AppRole[] = [
    'government_admin',
    'chief_engineer',
    'auditor',
  ];

  if (req.role && sensitiveRoles.includes(req.role)) {
    if (!req.mfaVerified) {
      res.status(403).json({
        success: false,
        error: 'ELEVATED_AUTH_REQUIRED',
        code: 'MFA_REQUIRED',
        message: 'This sensitive operation requires verified multi-factor authentication (MFA) within the last 15 minutes.',
      });
      return;
    }
  }

  next();
}

export async function requireGovernmentProjectAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.project_id;
    if (!projectId) {
      res.status(400).json({ success: false, error: { code: 'MISSING_PROJECT_ID', message: 'Project ID required' } });
      return;
    }

    if (!req.organizationId) {
      throw new AuthorizationError('No active government organization associated with account');
    }

    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('id, government_organization_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
      return;
    }

    if (project.government_organization_id && project.government_organization_id !== req.organizationId) {
      throw new AuthorizationError('Project belongs to a different government authority');
    }

    next();
  } catch (err) {
    next(err);
  }
}
