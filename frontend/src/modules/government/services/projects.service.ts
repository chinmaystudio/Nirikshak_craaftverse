import { supabase } from '@/core/supabase/client';
import { env } from '@/lib/config/env';
import { apiClient } from '@/lib/api/apiClient';
import { normalizeProjectStatus } from '@/core/status/projectStatus';
import type { Project, Paginated, ListQuery } from '@/modules/government/types';

export interface CreateGovernmentProjectInput {
  name: string;
  department: string;
  district: string;
  category: string;
  amountCr: number;
  adminApprovalDate: string;
  technicalApprovalDate?: string;
  expectedCompletion: string;
  summary?: string;
}

export function mapNormalizedStatus(status: string): Project['status'] {
  const shared = normalizeProjectStatus(status);
  return shared === 'unknown' ? 'on_hold' : shared;
}

/**
 * Maps database project record to Government Portal Project type.
 * STRICT: Does NOT fabricate risk levels or health scores from project status.
 * Uses real AI review band if present, otherwise returns null.
 */
export function mapDbProject(db: any): Project {
  const cost = Number(db.total_cost_inr_crore) || Number(db.budget_approved) || 0;
  const physPct = Number(db.physical_progress_percent) || 0;
  const spent = Number(db.amount_spent_inr_crore) || 0;
  const finPct = Number(db.financial_progress_percent) || (cost > 0 ? Math.round((spent / cost) * 100) : 0);
  const status = mapNormalizedStatus(db.normalized_status);

  const dept = db.department || db.project_authority || db.implementing_agency || 'Not specified';
  const dist = db.district || db.city || 'Not specified';
  const division = db.state || 'Maharashtra';

  const plannedEnd = db.original_completion_date || db.revised_completion_date || '';
  const delayDays = status === 'delayed' && db.delay_days ? Number(db.delay_days) : 0;
  const projId = db.nirikshak_project_id || db.id;

  // Real AI risk band if available from ai_insights or review metadata; never fabricated from status
  const aiBand = db.ai_review_band || db.review_band;
  const riskLevel: Project['riskLevel'] =
    aiBand === 'HIGH' ? 'high' : aiBand === 'MEDIUM' ? 'medium' : aiBand === 'LOW' ? 'low' : null;

  return {
    id: projId,
    name: db.project_name || 'Public Infrastructure Project',
    department: dept,
    district: dist,
    division,
    category: db.sector || db.subsector || 'Infrastructure',
    status,
    sanctionedAmountCr: cost,
    utilizedAmountCr: spent,
    physicalProgressPct: physPct,
    financialProgressPct: finPct,
    adminApprovalDate: db.award_date || db.planned_start_date || '',
    technicalApprovalDate: db.planned_start_date || '',
    expectedCompletion: plannedEnd,
    actualCompletion: db.actual_completion_date || undefined,
    contractor: db.contractor_concessionaire || 'Pending Assignment',
    riskLevel,
    delayDays,
    workOrderNo: db.work_order_number || '',
    summary: db.description || db.public_summary || '',
    financials: {
      sanctionedAmountCr: cost,
      amountUtilizedCr: spent,
      amountCommittedCr: 0,
      fundingSources: [],
      lastTrancheDate: '',
      nextTrancheDueCr: 0,
    },
    milestones: [],
    inspectionsCount: Number(db.pending_inspections_count) || 0,
    openComplaints: Number(db.open_complaints_count) || 0,
    pendingApprovals: Number(db.pending_progress_updates_count) || 0,
    documentsCount: 0,
  };
}

export const projectsService = {
  async create(input: CreateGovernmentProjectInput): Promise<Project> {
    const projectId = `NIR-GOV-${Date.now().toString(16).toUpperCase()}`;
    const data = await apiClient.post<any>('/api/projects', {
        nirikshak_project_id: projectId,
        project_name: input.name,
        description: input.summary || undefined,
        sector: input.category,
        project_authority: input.department,
        state: 'Maharashtra',
        city: input.district,
        location_text: `${input.district}, Maharashtra`,
        total_cost_inr_crore: input.amountCr,
        planned_start_date: input.adminApprovalDate,
        original_completion_date: input.expectedCompletion,
        is_public: true,
    });
    return mapDbProject(data);
  },

  async all(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('government_project_summary_view')
      .select('*')
      .or('record_scope.is.null,record_scope.neq.DEMO')
      .order('total_cost_inr_crore', { ascending: false, nullsFirst: false })
      .limit(1000);

    if (error) {
      console.error('Failed to fetch projects from Supabase:', error);
      return [];
    }

    return (data || []).map(mapDbProject);
  },

  async list(q?: ListQuery): Promise<Paginated<Project>> {
    const page = q?.page ?? 1;
    const pageSize = q?.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('government_project_summary_view').select('*', { count: 'exact' });
    query = query.or('record_scope.is.null,record_scope.neq.DEMO');

    if (q?.search) {
      query = query.or(`project_name.ilike.%${q.search}%,location_text.ilike.%${q.search}%,nirikshak_project_id.ilike.%${q.search}%`);
    }

    const statusFilter = q?.filters?.status?.[0];
    if (statusFilter) {
      query = query.ilike('normalized_status', `%${statusFilter}%`);
    }

    const { data, count, error } = await query
      .order('total_cost_inr_crore', { ascending: false, nullsFirst: false })
      .range(from, to);

    if (error) {
      console.error('Failed to list projects from Supabase:', error);
      return { items: [], total: 0, page, pageSize };
    }

    const items = (data || []).map(mapDbProject);
    const total = count || items.length;
    return {
      items,
      total,
      page,
      pageSize,
    };
  },

  async get(id: string): Promise<Project | undefined> {
    const { data, error } = await supabase
      .from('government_project_summary_view')
      .select('*')
      .or(`id.eq.${id},nirikshak_project_id.eq.${id}`)
      .single();

    if (error || !data) {
      const all = await this.all();
      return all.find((p) => p.id === id);
    }
    return mapDbProject(data);
  },

  async update(id: string, patch: Partial<Project>): Promise<Project> {
    const updatePayload: Record<string, unknown> = {};
    if (patch.name) updatePayload.project_name = patch.name;
    if (patch.sanctionedAmountCr !== undefined) updatePayload.total_cost_inr_crore = patch.sanctionedAmountCr;
    if (patch.physicalProgressPct !== undefined) updatePayload.physical_progress_percent = patch.physicalProgressPct;

    const { data, error } = await supabase
      .from('projects')
      .update(updatePayload as any)
      .or(`id.eq.${id},nirikshak_project_id.eq.${id}`)
      .select()
      .single();

    if (error) throw error;
    return mapDbProject(data);
  },

  async add(p: Omit<Project, 'id'>): Promise<Project> {
    const newId = `NIR-GOV-${Date.now().toString(16).toUpperCase()}`;
    const { data, error } = await supabase
      .from('projects')
      .insert({
        nirikshak_project_id: newId,
        project_name: p.name,
        sector: p.category || 'Urban Infrastructure',
        project_authority: p.department || 'Pune Municipal Corporation',
        total_cost_inr_crore: p.sanctionedAmountCr,
        physical_progress_percent: p.physicalProgressPct,
        location_text: `${p.district}, Maharashtra`,
        is_public: true,
      })
      .select()
      .single();

    if (error) throw error;
    return mapDbProject(data);
  },
};
