import crypto from 'crypto';
import { supabase } from '../../core/database/supabase.js';
import { fabricClient } from './blockchain.client.js';
import { hashCanonicalPayload } from './blockchain.hash.js';
import { AuditRecord, VerificationResult, EntityType, EventType } from './blockchain.types.js';

export interface CreateAnchorParams {
  projectId: string;
  entityType: EntityType | string;
  entityId: string;
  entityExternalId?: string;
  eventType: EventType | string;
  payload: any;
  actorOrganizationId?: string;
  actorRole?: string;
  databaseVersion?: number;
  previousEntityAnchorId?: string | null;
}

export class BlockchainService {
  public async createAnchor(params: CreateAnchorParams): Promise<AuditRecord> {
    const payloadHash = hashCanonicalPayload(params.payload);
    const auditId = `AUD-${params.entityType}-${params.entityId.slice(0, 8)}-${crypto.randomBytes(4).toString('hex')}`;
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

    // 2. Persist to database anchors table if Supabase client available
    try {
      await supabase.from('blockchain_anchors').insert({
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
      });
    } catch (err: any) {
      // In local testing without table, ledger proof remains active in fabricClient
      console.warn(`[BlockchainService] DB anchor write non-fatal notice: ${err.message}`);
    }

    return record;
  }

  public async verifyEntityIntegrity(
    entityType: string,
    entityId: string,
    currentData: any,
    auditId?: string
  ): Promise<VerificationResult> {
    const currentHash = hashCanonicalPayload(currentData);

    let targetAuditId = auditId;

    if (!targetAuditId) {
      // Look up latest anchor for this entity
      const history = await fabricClient.getEntityHistory(entityType, entityId);
      if (history.length > 0) {
        // Latest by timestamp
        targetAuditId = history[history.length - 1].auditId;
      }
    }

    if (!targetAuditId) {
      return {
        auditId: 'NONE',
        status: 'NOT_ANCHORED',
        expectedHash: currentHash,
        entityType,
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

export const blockchainService = new BlockchainService();
