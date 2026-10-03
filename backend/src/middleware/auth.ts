import { Request, Response, NextFunction } from 'express';
import type { User, SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin, createAuthenticatedClient } from '../services/supabase.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
  role?: string;
  organizationId?: string | null;
  organization?: { id: string; name: string; type: string } | null;
  supabase?: SupabaseClient;
}

/**
 * Validates Bearer token against Supabase Auth and derives authoritative role and organization.
 * Rules 3, 4, 34, 35
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.header('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing or malformed Authorization header' },
      });
      return;
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Bearer token cannot be empty' },
      });
      return;
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid or expired authentication session' },
      });
      return;
    }

    req.user = authData.user;
    req.token = token;

    // Resolve authoritative role from organization_members table (Rule 4)
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

    if (membership) {
      req.role = membership.role;
      req.organizationId = membership.organization_id;
      req.organization = membership.organizations as any;
    } else {
      req.role = 'citizen';
      req.organizationId = null;
      req.organization = null;
    }

    // Scoped client running under user JWT (subject to RLS, Rule 36)
    req.supabase = await createAuthenticatedClient(token);

    next();
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'AUTH_INTERNAL_ERROR', message: 'Internal authentication validation failure' },
    });
  }
}

/**
 * Enforces one or more specific roles.
 */
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !req.role) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    if (!allowedRoles.includes(req.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied: role '${req.role}' does not have required permissions`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Enforces government role.
 */
export function requireGovernment(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const govRoles = [
    'government_admin',
    'project_officer',
    'government_engineer',
    'chief_engineer',
    'auditor',
  ];
  return requireRole(govRoles)(req, res, next);
}

/**
 * Enforces contractor role.
 */
export function requireContractor(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const contractorRoles = [
    'contractor_admin',
    'contractor_manager',
    'contractor_engineer',
    'contractor_site_engineer',
  ];
  return requireRole(contractorRoles)(req, res, next);
}

/**
 * Enforces that caller's government organization manages the specified project (Rule 8, 24).
 */
export async function requireGovernmentProjectAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const projectId = req.params.projectId || req.params.id || req.body.project_id;
  if (!projectId) {
    res.status(400).json({ success: false, error: { code: 'MISSING_PROJECT_ID', message: 'Project ID required' } });
    return;
  }

  if (!req.organizationId) {
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No active government organization' } });
    return;
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
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Project belongs to a different government authority' },
    });
    return;
  }

  next();
}

/**
 * Enforces that caller's contractor organization is assigned to the specified project (Rule 18, 19, 27).
 */
export async function requireContractorProjectAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const projectId = req.params.projectId || req.params.id || req.body.project_id;
  if (!projectId) {
    res.status(400).json({ success: false, error: { code: 'MISSING_PROJECT_ID', message: 'Project ID required' } });
    return;
  }

  if (!req.organizationId) {
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'No active contractor organization' } });
    return;
  }

  const { data: assignment } = await supabaseAdmin
    .from('contracts')
    .select('id')
    .eq('project_id', projectId)
    .eq('contractor_organization_id', req.organizationId)
    .eq('status', 'ACTIVE')
    .limit(1);

  const { data: projectOrg } = await supabaseAdmin
    .from('project_organizations')
    .select('id')
    .eq('project_id', projectId)
    .eq('organization_id', req.organizationId)
    .limit(1);

  if ((!assignment || assignment.length === 0) && (!projectOrg || projectOrg.length === 0)) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Contractor organization is not assigned to this project' },
    });
    return;
  }

  next();
}
