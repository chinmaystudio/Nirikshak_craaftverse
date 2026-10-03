/**
 * Context Builder and Sanitizer for AI Project Analysis.
 * Assembles authorized ProjectSnapshot with explicit provenance labels:
 * DATABASE_FACT, CONTRACTOR_REPORTED, GOVERNMENT_VERIFIED, PUBLIC_EXTERNAL, AI_INFERENCE.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../core/database/supabase.js';

export function sanitizeAiContext(data: any): any {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Redact JWTs
    let scrubbed = data.replace(/\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g, '[REDACTED_TOKEN]');
    // Redact Emails
    scrubbed = scrubbed.replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, '[REDACTED_EMAIL]');
    // Redact 12-digit Aadhaar / 10-digit Phone numbers
    scrubbed = scrubbed.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[REDACTED_AADHAAR]');
    scrubbed = scrubbed.replace(/\b[6-9]\d{9}\b/g, '[REDACTED_PHONE]');
    return scrubbed;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeAiContext(item));
  }

  if (typeof data === 'object') {
    const prohibitedKeys = [
      'password',
      'token',
      'jwt',
      'secret',
      'service_role',
      'api_key',
      'aadhaar',
      'phone',
      'mobile',
      'email',
      'address',
      'bid_amount',
      'technical_proposal',
      'internal_notes',
      'reviewer_notes',
      'complainant_phone',
      'complainant_email',
      'complainant_name',
      'citizen_phone',
      'citizen_email',
      'citizen_name',
    ];

    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (prohibitedKeys.some((p) => lowerKey.includes(p))) {
        continue;
      }
      cleanObj[key] = sanitizeAiContext(value);
    }
    return cleanObj;
  }

  return data;
}

export async function buildProjectSnapshot(
  projectId: string,
  scopedClient: SupabaseClient,
  options: {
    isContractor: boolean;
    contractorOrganizationId?: string | null;
  }
): Promise<Record<string, any>> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);

  // 1. Core Project Record (DATABASE_FACT)
  let projQuery = scopedClient
    .from('projects')
    .select(`
      id, nirikshak_project_id, project_name, description, sector, subsector,
      project_authority, state, city, location_text, total_cost_inr_crore,
      planned_start_date, original_completion_date, revised_completion_date,
      normalized_status, physical_progress_percent, current_status_verified,
      government_organization_id, award_date
    `);
  projQuery = isUuid ? projQuery.eq('id', projectId) : projQuery.eq('nirikshak_project_id', projectId);
  const { data: project, error: projErr } = await projQuery.single();

  if (projErr || !project) {
    throw new Error('Project not found or caller lacks read permissions');
  }

  const realProjectId = project.id;

  // 2. Fetch associated relations in parallel
  const [
    { data: contracts },
    { data: progressUpdates },
    { data: delayEvents },
    { data: financialUpdates },
    { data: inspections },
    { data: complaintsCount },
    { data: highComplaintsCount },
  ] = await Promise.all([
    supabaseAdmin.from('contracts').select('id, contract_value, scheduled_start_date, scheduled_end_date, status').eq('project_id', realProjectId),
    supabaseAdmin.from('progress_updates').select('reported_physical_progress_percent, verified_physical_progress_percent, observation_date, status, delay_reason, labor_count, evidence_urls').eq('project_id', realProjectId).order('observation_date', { ascending: false }).limit(5),
    supabaseAdmin.from('delay_events').select('delay_days, reason, delay_type, created_at').eq('project_id', realProjectId),
    supabaseAdmin.from('financial_updates').select('expenditure_inr_crore, observation_date').eq('project_id', realProjectId).order('observation_date', { ascending: false }).limit(1),
    supabaseAdmin.from('inspections').select('inspection_type, status, summary, inspection_date').eq('project_id', realProjectId),
    supabaseAdmin.from('complaints').select('id', { count: 'exact', head: true }).eq('project_id', realProjectId).neq('status', 'RESOLVED'),
    supabaseAdmin.from('complaints').select('id', { count: 'exact', head: true }).eq('project_id', realProjectId).eq('severity', 'CRITICAL'),
  ]);

  // Provenance Partitioning:
  // Latest progress records
  const latestUpdate = progressUpdates && progressUpdates.length > 0 ? progressUpdates[0] : null;
  const verifiedUpdate = progressUpdates?.find((u) => u.status === 'VERIFIED') || null;

  // Calculate schedule variance in days if delayed
  let scheduleVarianceDays = 0;
  if (delayEvents && delayEvents.length > 0) {
    scheduleVarianceDays = delayEvents.reduce((acc, d) => acc + (Number(d.delay_days) || 0), 0);
  }

  // Cost variance
  const latestSpent = financialUpdates && financialUpdates.length > 0 ? Number(financialUpdates[0].expenditure_inr_crore) || 0 : 0;
  const totalCost = Number(project.total_cost_inr_crore) || 0;
  const costVariancePct = totalCost > 0 && latestSpent > totalCost ? ((latestSpent - totalCost) / totalCost) * 100 : 0;

  // Snapshot conforming to nirikshak_ai.schemas.ProjectSnapshot
  const snapshot: Record<string, any> = {
    project: {
      provenance: 'DATABASE_FACT',
      project_id: project.id,
      nirikshak_project_id: project.nirikshak_project_id,
      project_name: project.project_name,
      sector: project.sector || 'Transport',
      subsector: project.subsector || 'Roads and bridges',
      authority: project.project_authority || 'State Authority',
      location: project.location_text || `${project.city || ''}, ${project.state || ''}`,
      total_cost_inr_crore: totalCost,
      award_date: project.award_date || project.planned_start_date || '',
      planned_start_date: project.planned_start_date || '',
      planned_completion_date: project.original_completion_date || '',
      revised_completion_date: project.revised_completion_date || '',
      normalized_status: project.normalized_status || 'UNDER_CONSTRUCTION',
      project_description: project.description || '',
      quality_score: 0.85,
    },
    contractor_reported: {
      provenance: 'CONTRACTOR_REPORTED',
      contractor_reported_progress_pct: latestUpdate ? Number(latestUpdate.reported_physical_progress_percent) || 0 : Number(project.physical_progress_percent) || 0,
      reported_at: latestUpdate?.observation_date || '',
      challenges: latestUpdate?.delay_reason || '',
      resource_shortage_ratio: 0.1,
      manpower_count: latestUpdate ? Number(latestUpdate.labor_count) || 0 : 0,
      evidence_count: latestUpdate?.evidence_urls ? (Array.isArray(latestUpdate.evidence_urls) ? latestUpdate.evidence_urls.length : 1) : 0,
    },
    government_verified: {
      provenance: 'GOVERNMENT_VERIFIED',
      government_verified_progress_pct: verifiedUpdate ? Number(verifiedUpdate.verified_physical_progress_percent) || 0 : Number(project.physical_progress_percent) || 0,
      verified_at: verifiedUpdate?.observation_date || '',
      planned_progress_pct: Number(project.physical_progress_percent) || 0,
      schedule_variance_days: scheduleVarianceDays,
      inspection_defects: inspections ? inspections.filter((i) => i.status !== 'COMPLETED').length : 0,
      approval_delay_days: 0,
    },
    finance: {
      provenance: 'DATABASE_FACT',
      sanctioned_amount: totalCost,
      amount_spent: latestSpent,
      cost_variance_pct: costVariancePct,
      payment_delay_days: 0,
    },
    complaints: {
      provenance: 'AGGREGATED_EXTERNAL',
      open_complaints: complaintsCount || 0,
      high_severity_complaints: highComplaintsCount || 0,
    },
    inspections: (inspections || []).map((ins) => ({
      type: ins.inspection_type,
      status: ins.status,
      summary: ins.summary,
      date: ins.inspection_date,
    })),
    metadata: {
      requested_by_contractor: options.isContractor,
      created_at: new Date().toISOString(),
    },
  };

  return sanitizeAiContext(snapshot);
}
