import { Response } from 'express';
import { z } from 'zod';
import { blockchainService } from './blockchain.service.js';
import { blockchainEntityResolver } from './blockchain.entityResolver.js';
import { AuthenticatedRequest } from '../../core/auth/auth.middleware.js';
import { supabaseAdmin } from '../../core/database/supabase.js';
import { AuthorizationError, NotFoundError } from '../../core/http/errors.js';
import { ApiResponseHelper } from '../../core/http/response.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function assertProjectAuthorization(req: AuthenticatedRequest, projectId: string): Promise<void> {
  if (!projectId || !UUID_REGEX.test(projectId)) {
    throw new NotFoundError('Invalid or missing project identifier.');
  }

  // 1. Direct RPC check under caller credentials if scoped Supabase client exists
  if (req.supabase) {
    try {
      const { data: hasAccess } = await req.supabase.rpc('can_access_project', { p_project_id: projectId });
      if (hasAccess === true) return;
    } catch {}
  }

  // 2. Authoritative role & organization scope check
  const role = req.userContext?.role;
  const userOrgId = req.userContext?.organizationId;

  const { data: project, error: projErr } = await supabaseAdmin
    .from('projects')
    .select('id, government_organization_id, is_public')
    .eq('id', projectId)
    .maybeSingle();

  if (projErr || !project) {
    throw new NotFoundError(`Project '${projectId}' not found.`);
  }

  if ((role as string) === 'platform_admin') {
    return;
  }

  if (role === 'citizen') {
    if (project.is_public) return;
    throw new AuthorizationError('Citizen accounts may only view public project audit trails.');
  }

  // Government tenant check
  if (role?.startsWith('government') || role === 'chief_engineer' || role === 'project_officer' || role === 'auditor') {
    if (!project.government_organization_id || project.government_organization_id === userOrgId) {
      return;
    }
    // Check auditor assignment
    if (role === 'auditor') {
      const { data: assignment } = await supabaseAdmin
        .from('auditor_project_assignments')
        .select('id')
        .eq('project_id', projectId)
        .eq('auditor_user_id', req.userContext?.userId)
        .eq('status', 'ACTIVE')
        .maybeSingle();
      if (assignment) return;
    }
    throw new AuthorizationError('You are not authorized to access audit records for this government authority.');
  }

  // Contractor tenant check
  if (role?.startsWith('contractor') && userOrgId) {
    const { data: assignment } = await supabaseAdmin
      .from('contracts')
      .select('id')
      .eq('project_id', projectId)
      .eq('contractor_organization_id', userOrgId)
      .maybeSingle();
    if (assignment) return;

    const { data: projOrg } = await supabaseAdmin
      .from('project_organizations')
      .select('id')
      .eq('project_id', projectId)
      .eq('organization_id', userOrgId)
      .maybeSingle();
    if (projOrg) return;

    throw new AuthorizationError('Contractor organization is not assigned to this project.');
  }

  throw new AuthorizationError('Access denied: insufficient project authorization.');
}

const VerifyEntitySchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().uuid(),
  auditId: z.string().optional(),
});

export class BlockchainController {
  public async getProjectIntegrityTrail(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { projectId } = req.params;

    // Zero-trust: Project Authorization Enforcement
    await assertProjectAuthorization(req, projectId);

    const trail = await blockchainService.getProjectAuditTrail(projectId);

    // Sanitize records: return only audit metadata & hashes, never internal keys
    const sanitized = trail.map((r) => ({
      auditId: r.auditId,
      entityType: r.entityType,
      entityId: r.entityId,
      eventType: r.eventType,
      payloadHash: r.payloadHash,
      hashAlgorithm: r.hashAlgorithm,
      timestamp: r.blockTimestamp || r.timestamp,
      transactionId: r.fabricTxId,
      status: 'CONFIRMED',
    }));

    res.json({
      success: true,
      projectId,
      totalAnchors: sanitized.length,
      anchors: sanitized,
    });
  }

  public async getEntityHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { entityType, entityId } = req.params;

    if (!blockchainEntityResolver.isWhitelisted(entityType)) {
      res.status(400).json({
        success: false,
        error: { code: 'UNSUPPORTED_ENTITY_TYPE', message: `Entity type '${entityType}' is not supported.` },
      });
      return;
    }

    // Resolve entity to identify parent project
    const resolved = await blockchainEntityResolver.resolveEntity(entityType, entityId);
    if (!resolved) {
      throw new NotFoundError(`Entity of type '${entityType}' with id '${entityId}' not found.`);
    }

    // Zero-trust: Project Authorization Enforcement
    await assertProjectAuthorization(req, resolved.projectId);

    const history = await blockchainService.getEntityHistory(entityType, entityId);

    const sanitized = history.map((r) => ({
      auditId: r.auditId,
      entityType: r.entityType,
      entityId: r.entityId,
      eventType: r.eventType,
      payloadHash: r.payloadHash,
      timestamp: r.blockTimestamp || r.timestamp,
      transactionId: r.fabricTxId,
      previousEntityAnchorId: r.previousEntityAnchorId,
      status: 'CONFIRMED',
    }));

    res.json({
      success: true,
      entityType,
      entityId,
      totalVersions: sanitized.length,
      history: sanitized,
    });
  }

  public async verifyEntity(req: AuthenticatedRequest, res: Response): Promise<void> {
    const parsed = VerifyEntitySchema.parse(req.body);

    // Resolve entity to identify parent project and authoritative row
    const resolved = await blockchainEntityResolver.resolveEntity(parsed.entityType, parsed.entityId);
    if (!resolved) {
      throw new NotFoundError(`Entity of type '${parsed.entityType}' with id '${parsed.entityId}' not found.`);
    }

    // Zero-trust: Project Authorization Enforcement
    await assertProjectAuthorization(req, resolved.projectId);

    // Server-Side Verification: authoritatively compares DB row against ledger anchor
    const result = await blockchainService.verifyEntityIntegrity(
      parsed.entityType,
      parsed.entityId,
      parsed.auditId
    );

    res.json({
      success: true,
      verification: result,
    });
  }

  public async getAnchor(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { auditId } = req.params;

    // Look up anchor in database first to determine project scope
    const { data: dbAnchor, error: dbErr } = await supabaseAdmin
      .from('blockchain_anchors')
      .select('project_id, entity_type, entity_id')
      .eq('audit_id', auditId)
      .maybeSingle();

    if (dbErr || !dbAnchor) {
      res.status(404).json({
        success: false,
        error: { code: 'ANCHOR_NOT_FOUND', message: `No anchor found for audit ID '${auditId}'.` },
      });
      return;
    }

    if (dbAnchor.project_id) {
      await assertProjectAuthorization(req, dbAnchor.project_id);
    }

    const anchor = await blockchainService.getAnchorByAuditId(auditId);
    if (!anchor) {
      res.status(404).json({
        success: false,
        error: { code: 'ANCHOR_NOT_FOUND_ON_LEDGER', message: `Anchor '${auditId}' found in database but not yet committed on Fabric ledger.` },
      });
      return;
    }

    res.json({
      success: true,
      anchor: {
        auditId: anchor.auditId,
        projectId: anchor.projectId,
        entityType: anchor.entityType,
        entityId: anchor.entityId,
        eventType: anchor.eventType,
        payloadHash: anchor.payloadHash,
        hashAlgorithm: anchor.hashAlgorithm,
        timestamp: anchor.blockTimestamp || anchor.timestamp,
        transactionId: anchor.fabricTxId,
        status: 'CONFIRMED',
      },
    });
  }
}

export const blockchainController = new BlockchainController();
