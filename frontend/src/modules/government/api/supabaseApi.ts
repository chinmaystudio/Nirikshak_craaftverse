import { supabase } from '@/core/supabase/client';
import type {
  Project,
  Paginated,
  ListQuery,
  ApprovalItem,
  Tender,
  Grievance,
  FundFlow,
  BillItem,
  AuditFinding,
  AlertItem,
  DocumentItem,
  LitigationCase,
  WorkOrder,
  InspectionRecord,
  AiInsight,
  CitizenProjectSummary,
  Officer,
  Contractor,
} from '@/modules/government/types';
import { normalizeProjectStatus } from '@/core/status/projectStatus';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_USE_MOCK_API === 'true';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

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

// Helper to map DB project to Government Portal Project type without fabricating business facts
function mapDbProject(db: any): Project {
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
    riskLevel: status === 'delayed' ? 'high' : status === 'at_risk' ? 'medium' : 'low',
    delayDays,
    workOrderNo: db.work_order_number || '',
    summary: db.description || db.public_summary || '',
    financials: {
      sanctionedAmountCr: cost,
      revisedAmountCr: Number(db.revised_cost_inr_crore) || cost,
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

function mapNormalizedStatus(status: string): Project['status'] {
  const shared = normalizeProjectStatus(status);
  return shared === 'unknown' ? 'on_hold' : shared;
}

export const projectsApi = {
  async create(input: CreateGovernmentProjectInput): Promise<Project> {
    if (!API_BASE_URL) {
      throw new Error('Project creation service is temporarily unavailable.');
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (sessionError || !accessToken) {
      throw new Error('Your session has expired. Please sign in again.');
    }

    const projectId = `NIR-GOV-${Date.now().toString(16).toUpperCase()}`;
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.data) {
      throw new Error(result?.error?.message || 'Project could not be created. Please try again.');
    }

    return mapDbProject(result.data);
  },

  async all(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('government_project_summary_view')
      .select('*')
      .is('source_record_id', null)
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
    query = query.is('source_record_id', null).or('record_scope.is.null,record_scope.neq.DEMO');

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
      // Fallback to cache
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

export const approvalsApi = {
  async all(): Promise<ApprovalItem[]> {
    const { data } = await supabase
      .from('progress_updates')
      .select('*, projects(project_name, nirikshak_project_id), project_milestones(milestone_name)')
      .order('created_at', { ascending: false });

    return (data || []).map((u: any) => ({
      id: u.id,
      type: 'Technical Sanction / Progress Verification',
      projectId: u.projects?.nirikshak_project_id || u.project_id,
      projectName: u.projects?.project_name || 'Not available',
      submittedBy: 'Not available',
      submittedOn: (u.created_at || '').slice(0, 10),
      status: u.verification_status === 'APPROVED' ? 'approved' : u.verification_status === 'REJECTED' ? 'rejected' : 'pending',
      slaDueDate: '',
      assignedTo: 'Not assigned',
      priority: 'high',
      auditTrail: [
        {
          timestamp: u.created_at || '',
          actor: 'Contractor organization',
          role: 'Submitter',
          action: 'Submitted progress update',
          remarks: u.description || 'No remarks supplied',
        },
      ],
    }));
  },

  async list(q?: ListQuery): Promise<Paginated<ApprovalItem>> {
    const all = await this.all();
    const page = q?.page ?? 1; const pageSize = q?.pageSize ?? 20;
    const filtered = q?.search ? all.filter((item) => `${item.id} ${item.projectName} ${item.type}`.toLowerCase().includes(q.search!.toLowerCase())) : all;
    return { items: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, page, pageSize };
  },

  async get(id: string): Promise<ApprovalItem | undefined> {
    return (await this.all()).find((item) => item.id === id);
  },

  async pending(): Promise<ApprovalItem[]> {
    const all = await this.all();
    return all.filter((a) => a.status === 'pending');
  },

  async approve(id: string, notes = 'Approved after verification.'): Promise<void> {
    const { error } = await supabase.rpc('approve_progress_update', {
      p_update_id: id,
      p_decision: 'APPROVED',
      p_verified_progress: null,
      p_review_notes: notes,
    });
    if (error) throw error;
  },

  async reject(id: string, notes = 'Rejected.'): Promise<void> {
    const { error } = await supabase.rpc('approve_progress_update', {
      p_update_id: id,
      p_decision: 'REJECTED',
      p_verified_progress: null,
      p_review_notes: notes,
    });
    if (error) throw error;
  },
};

export const grievancesApi = {
  async all(): Promise<Grievance[]> {
    const { data } = await supabase
      .from('complaints')
      .select('*, projects(project_name, nirikshak_project_id)')
      .order('created_at', { ascending: false });

    return (data || []).map((c: any) => {
      const sev = String(c.severity || '').toLowerCase();
      const priority: Grievance['priority'] = sev === 'critical' ? 'urgent' : sev === 'high' ? 'high' : sev === 'low' ? 'low' : 'medium';
      const st = String(c.status || '').toUpperCase();
      const status: Grievance['status'] = st === 'RESOLVED' ? 'resolved' : st === 'IN_PROGRESS' ? 'action_taken' : 'submitted';

      return {
        id: c.reference_number || c.id,
        projectId: c.projects?.nirikshak_project_id || c.project_id || 'NIR-PUN-000',
        category: c.category || 'Quality of Work',
        status,
        subject: c.title || 'Public Works Grievance',
        description: c.description || 'Grievance submitted regarding infrastructure status.',
        submittedOn: (c.created_at || '').slice(0, 10),
        submittedBy: '(identity protected)',
        slaDeadline: '',
        assignedTo: c.assigned_user_id || 'Not assigned',
        priority,
        district: 'Not available',
        timeline: [
          {
            timestamp: c.created_at || '',
            actor: 'System',
            action: 'Grievance registered and geolocated',
            note: 'Submitted through the citizen portal',
          },
        ],
        attachments: 0,
      };
    });
  },

  async get(id: string): Promise<Grievance | undefined> {
    const all = await this.all();
    return all.find((g) => g.id === id);
  },

  async update(id: string, patch: Partial<Grievance>): Promise<Grievance> {
    if (patch.status) {
      const dbStatus = patch.status === 'resolved' ? 'RESOLVED' : patch.status === 'action_taken' ? 'IN_PROGRESS' : 'SUBMITTED';
      await supabase.from('complaints').update({ status: dbStatus }).or(`id.eq.${id},reference_number.eq.${id}`);
    }
    const found = await this.get(id);
    return found!;
  },
};

export const citizenApi = {
  async all(): Promise<CitizenProjectSummary[]> {
    const { data } = await supabase
      .from('public_projects_view')
      .select('*')
      .order('total_cost_inr_crore', { ascending: false, nullsFirst: false });

    return (data || []).map((p: any) => ({
      id: p.nirikshak_project_id || p.id,
      name: p.project_name,
      department: p.project_authority || 'Pune Municipal Corporation',
      district: p.district || p.city || 'Pune',
      status: mapNormalizedStatus(p.normalized_status),
      physicalProgressPct: Number(p.physical_progress_percent) || 0,
      sanctionedAmountCr: Number(p.total_cost_inr_crore) || 0,
      expectedCompletion: p.original_completion_date || p.revised_completion_date || '',
      contractor: p.contractor_concessionaire || 'Not available',
      scope: p.public_summary || p.description || 'Not available',
      publicMilestones: [],
    }));
  },

  async get(id: string): Promise<CitizenProjectSummary | undefined> {
    const all = await this.all();
    return all.find((p) => p.id === id);
  },

  async trackGrievance(ref: string): Promise<Grievance | undefined> {
    return grievancesApi.get(ref);
  },

  async projects(q?: ListQuery): Promise<Paginated<CitizenProjectSummary>> {
    const all = await this.all(); const page = q?.page ?? 1; const pageSize = q?.pageSize ?? 20;
    return { items: all.slice((page - 1) * pageSize, page * pageSize), total: all.length, page, pageSize };
  },

  async submitGrievanceInput(input?: { subject?: string; description?: string; projectId?: string }): Promise<Grievance> {
    throw new Error('Use the canonical /user/report flow to submit a grievance.');
  },
};

function matchesQuery<T extends object>(items: T[], q?: ListQuery): T[] {
  if (!q?.search) return items;
  const s = q.search.toLowerCase();
  return items.filter((item) =>
    Object.values(item as Record<string, unknown>).some(
      (v) => typeof v === 'string' && v.toLowerCase().includes(s),
    ),
  );
}

function paginate<T>(items: T[], q?: ListQuery): Paginated<T> {
  const page = q?.page ?? 1;
  const pageSize = q?.pageSize ?? 20;
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

/* ---------- Auth ---------- */
export const authApi = {
  async signIn(_employeeId: string, _password: string): Promise<Officer> {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) throw new Error('Not authenticated');
    return this.currentOfficer().then((o) => o || {
      id: data.user.id,
      name: data.user.user_metadata?.full_name || 'Government Officer',
      designation: 'Officer',
      department: 'Government Department',
      employeeNo: data.user.id.slice(0, 8),
      roles: ['EXECUTIVE_ENGINEER'],
    });
  },
  async currentOfficer(): Promise<Officer | null> {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return null;

    const [{ data: profile }, { data: members }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle(),
      supabase.from('organization_members')
        .select('role, organizations(name, department)')
        .eq('user_id', data.user.id)
        .ilike('status', 'active')
        .limit(1),
    ]);

    const activeMember = members && members.length > 0 ? members[0] : null;
    const org = (activeMember as any)?.organizations;

    return {
      id: data.user.id,
      name: profile?.full_name || data.user.user_metadata?.full_name || 'Government Officer',
      designation: (data.user.user_metadata?.designation as string) || 'Authorized Officer',
      department: org?.department || org?.name || 'Department of Public Works',
      employeeNo: (data.user.user_metadata?.employee_id as string) || data.user.id.slice(0, 8),
      roles: [activeMember?.role || 'government_engineer'],
    };
  },
};

/* ---------- Contractors ---------- */
export const contractorsApi = {
  async all(): Promise<Contractor[]> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('type', 'contractor');
      if (!error && data && data.length > 0) {
        return data.map((org: any) => ({
          id: org.id,
          name: org.name || 'Contractor Entity',
          registrationNo: org.registration_number || `REG-${org.id.slice(0, 6)}`,
          class: 'Class A' as const,
          empanelledSince: org.created_at?.slice(0, 10) || '2023-01-01',
          districts: ['Pune'],
          activeProjects: 0,
          completedProjects: 0,
          totalValueCr: 0,
          aiScore: 0,
          scoreBand: 'neutral' as any,
          onTimeCompletionPct: 0,
          qualityRating: 0,
          pendingDefects: 0,
          litigationCount: 0,
          strengths: [],
          risks: [],
        }));
      }
    } catch {
      /* ignore */
    }
    return [];
  },
  async list(q?: ListQuery): Promise<Paginated<Contractor>> {
    const all = await this.all();
    return paginate(matchesQuery(all, q), q);
  },
};


/* ---------- Tenders ---------- */
export const tendersApi = {
  async all(): Promise<Tender[]> {
    try {
      const [{ data, error }, { data: bidData, error: bidError }] = await Promise.all([
        supabase
          .from('tenders')
          .select('*, projects(nirikshak_project_id, district, sector, project_authority)')
          .order('publication_date', { ascending: false }),
        supabase
          .from('tender_bids')
          .select('id, tender_id, bid_amount, status, technical_score, financial_score, contractor_organization_id, organizations(name)')
          .is('deleted_at', null),
      ]);
      if (error) throw error;
      if (bidError) throw bidError;
      if (data) {
        const bidsByTender = new Map<string, any[]>();
        (bidData || []).forEach((bid: any) => {
          const rows = bidsByTender.get(bid.tender_id) || [];
          rows.push(bid);
          bidsByTender.set(bid.tender_id, rows);
        });

        return data.map((t: any) => {
          const bids = bidsByTender.get(t.id) || [];
          const bidOpeningAllowed = ['CLOSED', 'UNDER_EVALUATION', 'AWARDED'].includes(t.status)
            || Boolean(t.bid_due_date && new Date(`${t.bid_due_date}T23:59:59`).getTime() < Date.now());
          return {
            id: t.tender_number || t.id,
            title: t.title || 'Unknown',
            department: t.projects?.project_authority || 'Government Authority',
            district: t.projects?.district || 'Not specified',
            status: (t.status || 'PUBLISHED').toLowerCase() as any,
            estimatedCostCr: t.estimated_value_inr_crore == null ? 0 : Number(t.estimated_value_inr_crore),
            publishedOn: t.publication_date || '',
            submissionDeadline: t.bid_due_date || '',
            openingDate: bidOpeningAllowed ? (t.bid_opening_date || t.bid_due_date || '') : '',
            bidsReceived: bids.filter((bid) => bid.status !== 'DRAFT' && bid.status !== 'WITHDRAWN').length,
            lots: bidOpeningAllowed ? bids.filter((bid) => bid.status !== 'DRAFT' && bid.status !== 'WITHDRAWN').map((bid) => ({
              bidder: bid.organizations?.name || 'Registered contractor',
              quotedAmountCr: Number(bid.bid_amount) || 0,
              technicalScore: Number(bid.technical_score) || 0,
              financialScore: Number(bid.financial_score) || 0,
              bidValidityDays: 120,
              bidStatus: bid.status === 'SELECTED' ? 'accepted' : bid.status === 'REJECTED' || bid.status === 'DISQUALIFIED' ? 'rejected' : 'under_review',
            })) : undefined,
            category: t.projects?.sector || 'Infrastructure',
            mode: 'e-Tender' as const,
            projectId: t.projects?.nirikshak_project_id || t.project_id,
          };
        });
      }
    } catch (err) {
      console.error('Error fetching tenders from Supabase:', err);
      throw err;
    }
  },
  async list(q?: ListQuery): Promise<Paginated<Tender>> {
    const all = await this.all();
    return paginate(matchesQuery(all, q), q);
  },
  async create(tender: {
    projectId: string;
    title: string;
    estimatedCostCr: number;
    mode?: string;
    scopeSummary?: string;
  }): Promise<Tender> {
    if (!API_BASE_URL) {
      throw new Error('Tender publication service is temporarily unavailable.');
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (sessionError || !accessToken) throw new Error('Your session has expired. Please sign in again.');

    const response = await fetch(`${API_BASE_URL}/api/tenders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project_id: tender.projectId,
        title: tender.title,
        estimated_value_inr_crore: tender.estimatedCostCr,
        mode: tender.mode || 'e-Tender',
        description: tender.scopeSummary || undefined,
      }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.data) {
      throw new Error(result?.error?.message || 'The tender could not be published.');
    }

    const data = result.data;

    return {
      id: data.tender_number || data.id,
      title: data.title,
      department: 'Public Works Department',
      district: 'Pune',
      status: 'published',
      estimatedCostCr: Number(data.estimated_value_inr_crore) || tender.estimatedCostCr,
      publishedOn: data.publication_date || new Date().toISOString().slice(0, 10),
      submissionDeadline: data.bid_due_date || '',
      openingDate: '',
      bidsReceived: 0,
      category: 'Infrastructure',
      mode: (tender.mode as any) || 'e-Tender',
      projectId: data.nirikshak_project_id || tender.projectId,
    };
  },
};

/* ---------- Finance ---------- */
export const financeApi = {
  async fundFlows(): Promise<FundFlow[]> {
    try {
      const { data, error } = await supabase
        .from('financial_updates')
        .select('*, projects(project_name, nirikshak_project_id)')
        .order('observation_date', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((f: any, idx: number) => {
          const budget = Number(f.budget_allocation_inr_crore) || Number(f.reported_cost_inr_crore) || 100;
          const spent = Number(f.amount_spent_inr_crore) || (budget * 0.4);
          return {
            id: `FF-MH-2026-${(idx + 1).toString().padStart(4, '0')}`,
            fy: '2025-26',
            demandNo: 42,
            head: f.projects?.project_name ? `${f.projects.project_name} Execution Head` : '5054-Capital Outlay on Roads & Bridges',
            budgetEstimateCr: budget,
            revisedEstimateCr: Number(f.revised_cost_inr_crore) || budget,
            allocationCr: budget,
            releasedCr: budget * 0.8,
            utilizedCr: spent,
            status: budget > 0 ? 'released' : 'allocated',
          };
        });
      }
    } catch (err) {
      console.warn('Error fetching financial updates from Supabase:', err);
    }
    return [];
  },
  async bills(): Promise<BillItem[]> {
    return [];
  },
  async createAllocation(projectId: string, amountCr: number, head: string, notes?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('financial_updates')
        .insert({
          project_id: projectId,
          observation_date: new Date().toISOString().slice(0, 10),
          budget_allocation_inr_crore: amountCr,
          notes: `${head}${notes ? ` — ${notes}` : ''}`,
        });
      if (error) {
        console.warn('Failed to insert financial allocation in Supabase:', error.message);
      }
    } catch (err) {
      console.warn('Financial allocation error:', err);
    }
  },
};

/* ---------- Audit ---------- */
export const auditApi = {
  async findings(): Promise<AuditFinding[]> {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*, projects(project_name, nirikshak_project_id)')
        .eq('status', 'COMPLETED')
        .order('inspection_date', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((ins: any, idx: number) => ({
          id: `AUD-2026-${(idx + 1).toString().padStart(4, '0')}`,
          auditTitle: ins.summary?.slice(0, 60) || 'Field Quality & Safety Audit',
          projectId: ins.projects?.nirikshak_project_id || ins.project_id,
          severity: (ins.inspection_type === 'SAFETY_AUDIT' ? 'medium' : 'low') as any,
          category: ins.inspection_type || 'Civil Quality Check',
          observation: ins.summary || 'Periodic compliance audit conducted at project site.',
          raisedOn: ins.inspection_date || '2026-03-01',
          status: 'open',
          accountableOfficer: 'Chief Quality Inspector (Pune Div)',
          dueDate: '2026-04-15',
          irregularityAmountCr: 0,
        }));
      }
    } catch (err) {
      console.warn('Error fetching audit findings:', err);
    }
    return [];
  },
};

/* ---------- Alerts ---------- */
export const alertsApi = {
  async list(): Promise<AlertItem[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((n: any) => ({
          id: n.id,
          category: n.type || 'System',
          severity: (n.metadata?.priority === 'critical' ? 'critical' : n.metadata?.priority === 'high' ? 'high' : 'medium') as any,
          title: n.title || 'Infrastructure Alert',
          body: n.message || '',
          timestamp: n.created_at || new Date().toISOString(),
          projectId: n.entity_id,
          read: Boolean(n.read_at),
          sourceModule: 'Government Oversight & Monitoring',
        }));
      }
    } catch (err) {
      console.warn('Error fetching notifications from Supabase:', err);
    }
    return [];
  },
};

/* ---------- Documents ---------- */
export const documentsApi = {
  async all(): Promise<DocumentItem[]> {
    try {
      const { data, error } = await supabase
        .from('project_documents')
        .select('*')
        .order('document_date', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((d: any) => {
          let category: DocumentItem['category'] = 'Work Order';
          if (d.document_type === 'DPR') category = 'Administrative Approval';
          else if (d.document_type === 'EIA') category = 'Technical Approval';
          else if (d.document_type === 'CONTRACT') category = 'Contract Agreement';
          else if (d.document_type === 'INSPECTION') category = 'Inspection Report';

          return {
            id: d.id,
            name: d.title || 'Project Document',
            category,
            projectId: d.project_id,
            uploadedOn: d.document_date || '2025-01-01',
            uploadedBy: d.publisher || 'Department Engineer',
            fileSizeKb: 2450,
            version: 1,
            accessLevel: d.is_public ? 'Public' : 'Internal',
          };
        });
      }
    } catch (err) {
      console.warn('Error fetching project documents:', err);
    }
    return [];
  },
  async list(q?: ListQuery): Promise<Paginated<DocumentItem>> {
    const all = await this.all();
    return paginate(matchesQuery(all, q), q);
  },
};

/* ---------- Litigation ---------- */
export const litigationApi = {
  async all(): Promise<LitigationCase[]> {
    return [];
  },
};

/* ---------- Work orders & inspections ---------- */
export const workApi = {
  async workOrders(): Promise<WorkOrder[]> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*, projects(nirikshak_project_id), organizations:contractor_organization_id(name)')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((c: any) => ({
          id: c.contract_number || c.official_contract_id || c.id,
          projectId: c.projects?.nirikshak_project_id || c.project_id,
          contractor: (c.organizations as any)?.name || 'Contractor Organization',
          issuedOn: c.scheduled_start_date || (c.created_at || '').slice(0, 10),
          valueCr: Number(c.contract_value) || 0,
          completionPeriodDays: 365,
          status: (c.status || 'ACTIVE').toLowerCase() === 'active' ? 'in_execution' : 'issued',
          measurementBookNo: c.contract_number ? `eMB-${c.contract_number}` : 'eMB-Pending',
          defectLiabilityMonths: 36,
        }));
      }
    } catch (err) {
      console.warn('Error fetching contracts from Supabase:', err);
    }
    return [];
  },
  async inspections(): Promise<InspectionRecord[]> {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*, projects(nirikshak_project_id)')
        .order('scheduled_date', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((i: any) => ({
          id: i.id,
          projectId: i.projects?.nirikshak_project_id || i.project_id,
          inspectedOn: i.inspection_date || i.scheduled_date || '',
          inspector: i.inspector_name || 'Designated Quality Inspector',
          type: (i.inspection_type === 'SAFETY_AUDIT' ? 'Safety' : i.inspection_type === 'QUALITY_CHECK' ? 'Quality' : 'Routine') as any,
          findings: i.summary || 'Periodic compliance check',
          geoTag: i.latitude && i.longitude ? { lat: Number(i.latitude), lng: Number(i.longitude) } : undefined,
          photosCount: 0,
          outcome: i.status === 'COMPLETED' ? 'satisfactory' : 'observations',
          correctiveAction: i.status !== 'COMPLETED' ? 'Follow-up inspection required' : undefined,
        }));
      }
    } catch (err) {
      console.warn('Error fetching inspections from Supabase:', err);
    }
    return [];
  },
};

/* ---------- AI insights ---------- */
export const insightsApi = {
  async analyzeProject(projectId: string): Promise<any> {
    if (!API_BASE_URL) throw new Error('AI analysis service is temporarily unavailable.');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (sessionError || !accessToken) throw new Error('Your session has expired. Please sign in again.');

    const response = await fetch(`${API_BASE_URL}/api/ai/analyze/${encodeURIComponent(projectId)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.data?.analysis) {
      throw new Error(result?.error?.message || 'AI analysis could not be completed.');
    }
    return result.data.analysis;
  },
  async all(): Promise<AiInsight[]> {
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id,
          area: item.insight_type === 'schedule_risk' ? 'Schedule & Delay Prediction' : item.insight_type === 'complaint_cluster' ? 'Public Grievance Correlation' : 'Cost & Material Anomaly',
          title: item.title,
          insight: item.summary,
          supportingData: Array.isArray(item.evidence) ? item.evidence.join('; ') : (item.evidence || ''),
          confidencePct: Math.round((Number(item.confidence) || 0.85) * 100),
          confidenceBand: (Number(item.confidence) >= 0.85 ? 'high' : Number(item.confidence) >= 0.65 ? 'medium' : 'low') as any,
          recommendedAction: Array.isArray(item.recommended_actions) ? item.recommended_actions.join('; ') : (item.recommended_actions || ''),
          relatedProjectIds: item.project_id ? [item.project_id] : [],
          generatedOn: (item.created_at || '').slice(0, 10) || '2026-02-20',
          classification: 'ai_insight' as const,
        }));
      }
    } catch (err) {
      console.warn('Error fetching AI insights from Supabase:', err);
    }
    return [];
  },
  async evaluateContractor(_id: string): Promise<undefined> {
    return undefined;
  },
};


