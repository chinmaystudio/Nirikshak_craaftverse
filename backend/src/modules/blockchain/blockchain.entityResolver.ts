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

    let projectId = mapping.projectColumn === 'id' ? row.id : row[mapping.projectColumn];

    // Special handling for INSPECTION_FINDING which references inspection_id
    if (normalizedType === 'INSPECTION_FINDING' && !projectId && row.inspection_id) {
      const { data: inspection } = await supabaseAdmin
        .from('inspections')
        .select('project_id')
        .eq('id', row.inspection_id)
        .maybeSingle();
      if (inspection) {
        projectId = inspection.project_id;
      }
    }

    return {
      entityType: normalizedType,
      entityId,
      projectId,
      authoritativeRow: row,
    };
  }

  public buildCanonicalPayload(entityType: WhitelistedEntityType, row: any): any {
    switch (entityType) {
      case 'PROJECT':
        return {
          project_id: row.id,
          nirikshak_project_id: row.nirikshak_project_id || row.official_project_id || row.id,
          project_name: row.project_name,
          approved_cost_inr_crore: row.approved_cost_inr_crore,
          status: row.normalized_status || row.reported_status || 'DRAFT',
          created_at: row.created_at,
        };

      case 'CONTRACT':
        return {
          contract_id: row.id,
          contract_number: row.contract_number,
          contract_title: row.contract_title,
          contract_value: row.contract_value,
          contractor_organization_id: row.contractor_organization_id,
          project_id: row.project_id,
          status: row.status,
          awarded_at: row.awarded_at || row.created_at,
        };

      case 'MILESTONE':
        return {
          milestone_id: row.id,
          project_id: row.project_id,
          contract_id: row.contract_id,
          milestone_name: row.milestone_name,
          milestone_code: row.milestone_code,
          planned_cost: row.planned_cost,
          planned_progress_percent: row.planned_progress_percent,
          verified_progress_percent: row.verified_progress_percent,
          status: row.status,
          created_at: row.created_at,
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

      case 'INSPECTION':
        return {
          inspection_id: row.id,
          project_id: row.project_id,
          milestone_id: row.milestone_id,
          inspection_type: row.inspection_type,
          inspection_date: row.inspection_date,
          status: row.status,
          overall_result: row.overall_result,
          created_at: row.created_at,
        };

      case 'INSPECTION_FINDING':
        return {
          finding_id: row.id,
          inspection_id: row.inspection_id,
          finding_type: row.finding_type,
          severity: row.severity,
          description: row.description,
          status: row.status,
          created_at: row.created_at,
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

      case 'LITIGATION':
        return {
          litigation_id: row.id,
          project_id: row.project_id,
          case_number: row.case_number,
          case_title: row.case_title,
          litigation_type: row.litigation_type,
          court_or_forum: row.court_or_forum,
          claimed_amount: row.claimed_amount,
          status: row.status,
          filing_date: row.filing_date,
          created_at: row.created_at,
        };

      case 'SETTLEMENT':
        return {
          settlement_id: row.id,
          project_id: row.project_id,
          litigation_id: row.litigation_id,
          settlement_number: row.settlement_number,
          settlement_type: row.settlement_type,
          proposed_amount: row.proposed_amount,
          approved_amount: row.approved_amount,
          status: row.status,
          created_at: row.created_at,
        };

      case 'AI_ANALYSIS':
        return {
          analysis_run_id: row.id,
          project_id: row.project_id,
          analysis_id: row.analysis_id,
          service_version: row.service_version,
          status: row.status,
          context_hash: row.context_hash,
          rl_policy_version: row.rl_policy_version,
          completed_at: row.completed_at || row.created_at,
        };

      case 'DOCUMENT':
        return {
          document_id: row.id,
          project_id: row.project_id,
          title: row.title,
          document_type: row.document_type,
          sha256: row.sha256 || row.checksum,
          storage_bucket: row.storage_bucket,
          version_number: row.version_number,
          created_at: row.created_at,
        };

      default:
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

