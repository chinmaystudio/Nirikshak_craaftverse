import crypto from 'crypto';
import { supabaseAdmin } from '../../core/database/supabase.js';
import { fabricClient } from './blockchain.client.js';
import { hashCanonicalPayload } from './blockchain.hash.js';
import { AuditRecord, VerificationResult, EntityType, EventType } from './blockchain.types.js';
import { blockchainEntityResolver, WhitelistedEntityType } from './blockchain.entityResolver.js';

export interface CreateAnchorParams {
  projectId: string;
  entityType: EntityType | string;
  entityId: string;
  entityExternalId?: string;
  eventType: EventType | string;
  payload: any;
  auditId?: string;
  actorOrganizationId?: string;
  actorRole?: string;
  databaseVersion?: number;
  previousEntityAnchorId?: string | null;
}

export class BlockchainService {
  /**
   * Internal / Admin anchor creation.
   * Business operations should go through PostgreSQL Transactional Outbox.
   */
  public async createAnchor(params: CreateAnchorParams): Promise<AuditRecord> {
    const payloadHash = hashCanonicalPayload(params.payload);
    // Use caller-provided database auditId if present, never invent a second ID
    const auditId = params.auditId || `AUD-${upperSafe(params.entityType)}-${params.entityId.slice(0, 8)}-${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date().toISOString();

    const record: AuditRecord = {
      auditId,
      schemaVersion: 1,
      projectId: params.projectId,
      entityType: params.entityType,
      entityId: params.entityId,
      entityExternalId: params.entityExternalId,
      eventType: params.eventType,
      payloadHash,
      hashAlgorithm: 'SHA-256',
      actorOrganizationId: params.actorOrganizationId,
      actorRole: params.actorRole,
      databaseVersion: params.databaseVersion || 1,
      timestamp,
      previousEntityAnchorId: params.previousEntityAnchorId,
    };

    // 1. Submit to Fabric Ledger
    const submission = await fabricClient.createAnchor(record);
    record.fabricTxId = submission.transactionId;
    record.blockTimestamp = submission.blockTimestamp;

    // 2. Persist / update database anchor record
    try {
      await supabaseAdmin.from('blockchain_anchors').upsert({
        audit_id: auditId,
        project_id: params.projectId,
        entity_type: params.entityType,
        entity_id: params.entityId,
        entity_external_id: params.entityExternalId,
        event_type: params.eventType,
        canonical_version: 1,
        payload_hash: payloadHash,
        hash_algorithm: 'SHA-256',
        transaction_id: submission.transactionId,
        status: 'CONFIRMED',
        confirmed_at: submission.blockTimestamp,
      }, { onConflict: 'audit_id' });
    } catch (err: any) {
      console.warn(`[BlockchainService] DB anchor write notice: ${err.message}`);
    }

    return record;
  }

  /**
   * Server-Side Integrity Verification.
   * Loads authoritative database state directly from database; NEVER accepts payload from browser.
   */
  public async verifyEntityIntegrity(
    entityType: string,
    entityId: string,
    auditId?: string
  ): Promise<VerificationResult> {
    // 1. Resolve authoritative row from database
    const resolved = await blockchainEntityResolver.resolveEntity(entityType, entityId);
    if (!resolved) {
      return {
        auditId: auditId || 'NONE',
        status: 'NOT_ANCHORED',
        expectedHash: '',
        entityType,
        entityId,
        details: `Entity not found in authoritative database table.`,
      };
    }

    // 2. Build deterministic canonical payload
    const canonicalPayload = blockchainEntityResolver.buildCanonicalPayload(
      resolved.entityType,
      resolved.authoritativeRow
    );

    // 3. Compute canonical SHA-256 hash
    const currentHash = hashCanonicalPayload(canonicalPayload);

    let targetAuditId = auditId;

    if (!targetAuditId) {
      // Look up latest confirmed anchor for this entity from database or Fabric
      const { data: dbAnchor } = await supabaseAdmin
        .from('blockchain_anchors')
        .select('audit_id')
        .eq('entity_type', resolved.entityType)
        .eq('entity_id', entityId)
        .eq('status', 'CONFIRMED')
        .order('confirmed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dbAnchor) {
        targetAuditId = dbAnchor.audit_id;
      } else {
        const history = await fabricClient.getEntityHistory(resolved.entityType, entityId);
        if (history.length > 0) {
          targetAuditId = history[history.length - 1].auditId;
        }
      }
    }

    if (!targetAuditId) {
      return {
        auditId: 'NONE',
        status: 'NOT_ANCHORED',
        expectedHash: currentHash,
        entityType: resolved.entityType,
        entityId,
        details: 'No cryptographic anchor has been committed for this entity yet.',
      };
    }

    return fabricClient.verifyAnchor(targetAuditId, currentHash);
  }

  public async getProjectAuditTrail(projectId: string): Promise<AuditRecord[]> {
    return fabricClient.getProjectAuditTrail(projectId);
  }

  public async getEntityHistory(entityType: string, entityId: string): Promise<AuditRecord[]> {
    return fabricClient.getEntityHistory(entityType, entityId);
  }

  public async getAnchorByAuditId(auditId: string): Promise<AuditRecord | null> {
    return fabricClient.readAnchor(auditId);
  }
}

function upperSafe(val: any): string {
  return typeof val === 'string' ? val.toUpperCase() : 'ENTITY';
}

export const blockchainService = new BlockchainService();
