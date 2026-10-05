import { supabaseAdmin } from '../../core/database/supabase.js';

export type WhitelistedEntityType =
  | 'PROJECT'
  | 'CONTRACT'
  | 'MILESTONE'
  | 'PROGRESS_UPDATE'
  | 'INSPECTION'
  | 'INSPECTION_FINDING'
  | 'PAYMENT_CLAIM'
  | 'PAYMENT'
  | 'LITIGATION'
  | 'SETTLEMENT'
  | 'AI_ANALYSIS'
  | 'DOCUMENT';

export interface EntityResolutionResult {
  entityType: WhitelistedEntityType;
  entityId: string;
  projectId: string;
  authoritativeRow: any;
}

const ENTITY_TABLE_MAP: Record<WhitelistedEntityType, { table: string; projectColumn: string }> = {
  PROJECT: { table: 'projects', projectColumn: 'id' },
  CONTRACT: { table: 'contracts', projectColumn: 'project_id' },
  MILESTONE: { table: 'project_milestones', projectColumn: 'project_id' },
  PROGRESS_UPDATE: { table: 'progress_updates', projectColumn: 'project_id' },
  INSPECTION: { table: 'inspections', projectColumn: 'project_id' },
  INSPECTION_FINDING: { table: 'inspection_findings', projectColumn: 'project_id' },
  PAYMENT_CLAIM: { table: 'payment_claims', projectColumn: 'project_id' },
  PAYMENT: { table: 'payments', projectColumn: 'project_id' },
  LITIGATION: { table: 'litigations', projectColumn: 'project_id' },
  SETTLEMENT: { table: 'settlements', projectColumn: 'project_id' },
  AI_ANALYSIS: { table: 'ai_analysis_runs', projectColumn: 'project_id' },
  DOCUMENT: { table: 'project_documents', projectColumn: 'project_id' },
};

export class BlockchainEntityResolver {
  public isWhitelisted(entityType: string): entityType is WhitelistedEntityType {
    return Object.prototype.hasOwnProperty.call(ENTITY_TABLE_MAP, entityType.toUpperCase());
  }

  public async resolveEntity(
    entityTypeRaw: string,
    entityId: string
  ): Promise<EntityResolutionResult | null> {
    const normalizedType = entityTypeRaw.toUpperCase() as WhitelistedEntityType;
    if (!this.isWhitelisted(normalizedType)) {
      throw new Error(`UNSUPPORTED_ENTITY_TYPE: Entity type '${entityTypeRaw}' is not supported for blockchain integrity operations.`);
    }

    const mapping = ENTITY_TABLE_MAP[normalizedType];
    const { data: row, error } = await supabaseAdmin
      .from(mapping.table)
      .select('*')
      .eq('id', entityId)
      .maybeSingle();

    if (error || !row) {
      return null;
    }

    const projectId = mapping.projectColumn === 'id' ? row.id : row[mapping.projectColumn];

    return {
      entityType: normalizedType,
      entityId,
      projectId,
      authoritativeRow: row,
    };
  }

  public buildCanonicalPayload(entityType: WhitelistedEntityType, row: any): any {
    switch (entityType) {
      case 'PAYMENT':
        return {
          payment_id: row.id,
          payment_claim_id: row.payment_claim_id,
          project_id: row.project_id,
          contractor_organization_id: row.contractor_organization_id,
          amount_paid: row.amount_paid,
          payment_reference: row.payment_reference,
          payment_date: row.payment_date,
          payment_method: row.payment_method,
          recorded_by: row.recorded_by,
          created_at: row.created_at,
        };

      case 'CONTRACT':
        return {
          contract_id: row.id,
          contract_number: row.contract_number,
          contract_value: row.contract_value,
          contractor_organization_id: row.contractor_organization_id,
          awarded_at: row.created_at,
        };

      case 'PROGRESS_UPDATE':
        return {
          progress_id: row.id,
          project_id: row.project_id,
          milestone_id: row.milestone_id,
          contractor_organization_id: row.contractor_organization_id,
          reported_progress: row.reported_progress,
          verified_progress: row.verified_progress,
          verification_status: row.verification_status,
          submitted_at: row.submitted_at || row.created_at,
        };

      case 'PAYMENT_CLAIM':
        return {
          claim_id: row.id,
          claim_number: row.claim_number,
          project_id: row.project_id,
          contract_id: row.contract_id,
          claimed_amount: row.claimed_amount,
          approved_amount: row.approved_amount,
          status: row.status,
          submitted_at: row.submitted_at || row.created_at,
        };

      case 'INSPECTION':
        return {
          inspection_id: row.id,
          project_id: row.project_id,
          inspection_type: row.inspection_type,
          status: row.status,
          inspection_date: row.inspection_date,
          created_at: row.created_at,
        };

      case 'PROJECT':
        return {
          project_id: row.id,
          official_id: row.official_id,
          name: row.name,
          status: row.status,
          sanctioned_cost: row.sanctioned_cost,
          created_at: row.created_at,
        };

      case 'DOCUMENT':
        return {
          document_id: row.id,
          project_id: row.project_id,
          document_type: row.document_type,
          file_name: row.file_name,
          file_hash: row.file_hash || row.storage_path,
          created_at: row.created_at,
        };

      default:
        // Default deterministic extraction for whitelisted types
        return {
          id: row.id,
          project_id: row.project_id || row.id,
          status: row.status,
          created_at: row.created_at,
        };
    }
  }
}

export const blockchainEntityResolver = new BlockchainEntityResolver();
