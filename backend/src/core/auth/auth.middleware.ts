import { Request, Response, NextFunction } from 'express';
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
}

// Narrowly scoped public identity bootstrap endpoints
export const AUTH_BOOTSTRAP_PUBLIC = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/csrf',
  '/api/ai/health',
];

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    // 1. Check Authorization: Bearer <token>
    const authHeader = req.header('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }

    // 2. Check HttpOnly session cookie
    if (!token && req.cookies) {
      token = req.cookies['nirikshak_session'] || req.cookies['sb-access-token'];
    }

    if (!token) {
      throw new AuthenticationError('Missing or malformed authentication credentials');
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData.user) {
      throw new AuthenticationError('Invalid or expired authentication session');
    }

    req.user = authData.user;
    req.token = token;

    // Resolve authoritative role & active membership from database
    const { data: memberRows, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('role, organization_id, status, organizations(id, name, type)')
      .eq('user_id', authData.user.id)
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
    req.userContext = {
      userId: authData.user.id,
      email: authData.user.email,
      role,
      organizationId: orgId,
      organizationType: orgType,
      organizationName: org?.name,
      permissions: [],
    };

    req.supabase = await createAuthenticatedClient(token);
    next();
  } catch (err: any) {
    next(err instanceof AuthenticationError ? err : new AuthenticationError(err.message));
  }
}

/**
 * Secure default middleware:
 * Any route under /api must automatically require authentication unless
 * explicitly listed in AUTH_BOOTSTRAP_PUBLIC.
 */
export function requireAuthByDefault(req: Request, res: Response, next: NextFunction): void {
  const fullPath = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;

  // Check if matching any public bootstrap route
  for (const publicEndpoint of AUTH_BOOTSTRAP_PUBLIC) {
    if (fullPath === publicEndpoint || fullPath.startsWith(`${publicEndpoint}/`)) {
      return next();
    }
  }

  // Enforce authentication on all other /api routes
  void requireAuth(req as AuthenticatedRequest, res, next);
}

export function requireRole(allowedRoles: AppRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !req.role) {
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
 * Require elevated authentication (recent login / MFA) for critical state operations
 * (e.g. contract awards, payment approvals, settlement authorizations).
 */
export function requireElevatedAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new AuthenticationError('Authentication required'));
  }

  // For high-privilege government roles, verify elevated authentication
  const sensitiveRoles: AppRole[] = [
    'government_admin',
    'chief_engineer',
    'auditor',
  ];

  if (req.role && sensitiveRoles.includes(req.role)) {
    const authTimeStr = req.user.last_sign_in_at || req.user.created_at;
    const authTime = new Date(authTimeStr).getTime();
    const fifteenMinutes = 15 * 60 * 1000;

    // Check if session authenticated within last 15 minutes or elevated
    if (Date.now() - authTime > fifteenMinutes && !req.mfaVerified) {
      res.status(403).json({
        success: false,
        error: 'ELEVATED_AUTH_REQUIRED',
        code: 'MFA_REQUIRED',
        message: 'This sensitive operation requires elevated authentication within the last 15 minutes.',
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
