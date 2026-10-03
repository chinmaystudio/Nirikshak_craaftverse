/**
 * Mock API layer — every function is `async` and shaped like a real REST call
 * so a live backend can replace the implementation without touching pages.
 * All data is demo/mock data (VITE_USE_MOCK_API governs the switch).
 */
import type {
  Contractor,
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
  Project,
  ListQuery,
  Paginated,
} from '@/types'
import { PROJECTS, findProject } from '@/data/projects'
import {
  CONTRACTORS,
  APPROVALS,
  TENDERS,
  GRIEVANCES,
  FUND_FLOWS,
  BILLS,
  AUDIT_FINDINGS,
  DOCUMENTS,
  LITIGATION,
  WORK_ORDERS,
  INSPECTIONS,
  AI_INSIGHTS,
  CITIZEN_PROJECTS,
  DEMO_OFFICER,
} from '@/data/modules'
import { ALERTS } from '@/data/alerts'

/** Simulated network latency so loading states are real. */
const delay = (ms = 240) => new Promise((r) => setTimeout(r, ms))

function matchesQuery<T extends object>(items: T[], q?: ListQuery): T[] {
  if (!q?.search) return items
  const s = q.search.toLowerCase()
  return items.filter((item) =>
    Object.values(item as Record<string, unknown>).some(
      (v) => typeof v === 'string' && v.toLowerCase().includes(s),
    ),
  )
}

function paginate<T>(items: T[], q?: ListQuery): Paginated<T> {
  const page = q?.page ?? 1
  const pageSize = q?.pageSize ?? 20
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    pageSize,
  }
}

/* ---------- Session ---------- */
export const authApi = {
  /** Demo sign-in — NO real government authentication is integrated. */
  async signIn(_employeeId: string, _password: string): Promise<Officer> {
    await delay(400)
    return DEMO_OFFICER
  },
  async currentOfficer(): Promise<Officer | null> {
    await delay(120)
    return DEMO_OFFICER
  },
}

/* ---------- Projects ---------- */
export const projectsApi = {
  async create(input: {
    name: string;
    department: string;
    district: string;
    category: string;
    amountCr: number;
    adminApprovalDate: string;
    technicalApprovalDate?: string;
    expectedCompletion: string;
    summary?: string;
  }): Promise<Project> {
    await delay()
    const project: Project = {
      ...PROJECTS[0],
      id: `NIR-DEMO-${Date.now().toString(16).toUpperCase()}`,
      name: input.name,
      department: input.department,
      district: input.district,
      division: input.district,
      category: input.category,
      sanctionedAmountCr: input.amountCr,
      utilizedAmountCr: 0,
      physicalProgressPct: 0,
      financialProgressPct: 0,
      adminApprovalDate: input.adminApprovalDate,
      technicalApprovalDate: input.technicalApprovalDate || input.adminApprovalDate,
      expectedCompletion: input.expectedCompletion,
      summary: input.summary || '',
      status: 'sanctioned',
    }
    PROJECTS.unshift(project)
    return project
  },
  async list(query?: ListQuery): Promise<Paginated<Project>> {
    await delay()
    return paginate(matchesQuery(PROJECTS, query), query)
  },
  async all(): Promise<Project[]> {
    await delay(120)
    return PROJECTS
  },
  async get(id: string): Promise<Project | undefined> {
    await delay()
    return findProject(id)
  },
}

/* ---------- Contractors ---------- */
export const contractorsApi = {
  async list(query?: ListQuery): Promise<Paginated<Contractor>> {
    await delay()
    return paginate(matchesQuery(CONTRACTORS, query), query)
  },
  async all(): Promise<Contractor[]> {
    await delay(120)
    return CONTRACTORS
  },
}

/* ---------- Approvals ---------- */
export const approvalsApi = {
  async list(query?: ListQuery): Promise<Paginated<ApprovalItem>> {
    await delay()
    return paginate(matchesQuery(APPROVALS, query), query)
  },
  async all(): Promise<ApprovalItem[]> {
    await delay(120)
    return APPROVALS
  },
  async get(id: string): Promise<ApprovalItem | undefined> {
    await delay()
    return APPROVALS.find((a) => a.id === id)
  },
  async approve(id: string, _notes?: string): Promise<void> {
    await delay(120)
    const item = APPROVALS.find((a) => a.id === id)
    if (item) item.status = 'approved'
  },
  async reject(id: string, _notes?: string): Promise<void> {
    await delay(120)
    const item = APPROVALS.find((a) => a.id === id)
    if (item) item.status = 'rejected'
  },
}

/* ---------- Tenders ---------- */
export const tendersApi = {
  async list(query?: ListQuery): Promise<Paginated<Tender>> {
    await delay()
    return paginate(matchesQuery(TENDERS, query), query)
  },
  async all(): Promise<Tender[]> {
    await delay(120)
    return TENDERS
  },
  async create(tender: {
    projectId: string;
    title: string;
    estimatedCostCr: number;
    mode?: string;
    scopeSummary?: string;
  }): Promise<Tender> {
    await delay()
    const newTender: Tender = {
      id: `TND-MH-${Date.now().toString().slice(-6)}`,
      title: tender.title,
      department: 'Public Works Department',
      district: 'Pune',
      status: 'published',
      estimatedCostCr: tender.estimatedCostCr,
      publishedOn: new Date().toISOString().slice(0, 10),
      submissionDeadline: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      openingDate: '',
      bidsReceived: 0,
      category: 'Infrastructure',
      mode: (tender.mode as any) || 'e-Tender',
      projectId: tender.projectId,
    }
    TENDERS.unshift(newTender)
    return newTender
  },
}

/* ---------- Grievances ---------- */
export const grievancesApi = {
  async list(query?: ListQuery): Promise<Paginated<Grievance>> {
    await delay()
    return paginate(matchesQuery(GRIEVANCES, query), query)
  },
  async all(): Promise<Grievance[]> {
    await delay(120)
    return GRIEVANCES
  },
  async get(id: string): Promise<Grievance | undefined> {
    await delay()
    return GRIEVANCES.find((g) => g.id === id)
  },
  /** Demo submit — returns a generated reference number. */
  async submitGrievance(input: { subject: string; description: string }): Promise<Grievance> {
    await delay(500)
    const seq = 9900 + GRIEVANCES.length + 1
    return {
      id: `GRV-MH-${seq}`,
      subject: input.subject,
      category: 'Citizen Report',
      district: '—',
      status: 'submitted',
      submittedOn: new Date().toISOString().slice(0, 10),
      submittedBy: '(withheld)',
      slaDeadline: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10),
      assignedTo: 'Unassigned',
      priority: 'medium',
      description: input.description,
      timeline: [{ timestamp: new Date().toISOString(), actor: 'Citizen portal', action: 'Submitted', note: '—' }],
      attachments: 0,
    }
  },}

/* ---------- Finance ---------- */
export const financeApi = {
  async fundFlows(): Promise<FundFlow[]> {
    await delay()
    return FUND_FLOWS
  },
  /** Bills across projects — Payment & Bill Management (workspace scopes by project). */
  async bills(): Promise<BillItem[]> {
    await delay()
    return BILLS
  },
  async createAllocation(_projectId: string, _amountCr: number, _head: string, _notes?: string): Promise<void> {
    await delay()
  },
}

/* ---------- Audit ---------- */
export const auditApi = {
  async findings(): Promise<AuditFinding[]> {
    await delay()
    return AUDIT_FINDINGS
  },
}

/* ---------- Alerts ---------- */
export const alertsApi = {
  async list(): Promise<AlertItem[]> {
    await delay()
    return ALERTS
  },
}

/* ---------- Documents ---------- */
export const documentsApi = {
  async list(query?: ListQuery): Promise<Paginated<DocumentItem>> {
    await delay()
    return paginate(matchesQuery(DOCUMENTS, query), query)
  },
  async all(): Promise<DocumentItem[]> {
    await delay(120)
    return DOCUMENTS
  },
}

/* ---------- Litigation ---------- */
export const litigationApi = {
  async all(): Promise<LitigationCase[]> {
    await delay()
    return LITIGATION
  },
}

/* ---------- Work orders & inspections ---------- */
export const workApi = {
  async workOrders(): Promise<WorkOrder[]> {
    await delay()
    return WORK_ORDERS
  },
  async inspections(): Promise<InspectionRecord[]> {
    await delay()
    return INSPECTIONS
  },
}

/* ---------- AI insights ---------- */
export const insightsApi = {
  async analyzeProject(): Promise<never> {
    throw new Error('Live AI analysis is unavailable while mock mode is enabled.')
  },
  async all(): Promise<AiInsight[]> {
    await delay()
    return AI_INSIGHTS
  },
  /**
   * AI-assisted contractor evaluation (demo). Returns the factor breakdown so
   * the UI can show "Why this score?". The decision itself ALWAYS remains with
   * the authorized officer.
   */
  async evaluateContractor(id: string): Promise<{
    contractorId: string
    score: number
    factors: { name: string; weight: number; score: number; evidence: string }[]
    strengths: string[]
    risks: string[]
    disclaimer: string
  } | undefined> {
    await delay(500)
    const c = CONTRACTORS.find((x) => x.id === id)
    if (!c) return undefined
    return {
      contractorId: id,
      score: c.aiScore,
      factors: [
        { name: 'On-time completion', weight: 20, score: Math.round(c.onTimeCompletionPct * 0.9), evidence: `${c.onTimeCompletionPct}% of milestones met across last 3 years.` },
        { name: 'Quality (NABL test pass rate)', weight: 18, score: Math.round(c.qualityRating * 20), evidence: `Quality rating ${c.qualityRating.toFixed(1)}/5 from ${c.completedProjects} completed works.` },
        { name: 'Pending defect liability', weight: 12, score: Math.max(0, 100 - c.pendingDefects * 12), evidence: `${c.pendingDefects} open defects across DL period.` },
        { name: 'Litigation exposure', weight: 12, score: Math.max(0, 100 - c.litigationCount * 30), evidence: `${c.litigationCount} active case(s).` },
        { name: 'Financial turnover trend', weight: 10, score: 78, evidence: 'Turnover consistent with Class registration.' },
        { name: 'Plant & machinery availability', weight: 8, score: 82, evidence: 'Regional plant census, last quarter.' },
        { name: 'Safety record', weight: 8, score: 88, evidence: 'No fatal incidents; minor LTI rate 0.9 per lakh man-hours.' },
        { name: 'Manpower & key personnel', weight: 6, score: 74, evidence: 'Site-engineer ratio 1:2.3 (norm 1:3.0).' },
        { name: 'Past e-MB accuracy', weight: 6, score: 81, evidence: 'Measurement variance within ±2% on test check.' },
      ],
      strengths: c.strengths,
      risks: c.risks,
      disclaimer: 'AI-assisted evaluation. Final decision remains with the authorized officer.',
    }
  },
}

/* ---------- Citizen portal (public-safe) ---------- */
export const citizenApi = {
  async projects(query?: ListQuery): Promise<Paginated<CitizenProjectSummary>> {
    await delay()
    return paginate(matchesQuery(CITIZEN_PROJECTS, query), query)
  },
  async all(): Promise<CitizenProjectSummary[]> {
    await delay(120)
    return CITIZEN_PROJECTS
  },
  async trackGrievance(ref: string): Promise<Grievance | undefined> {
    await delay(400)
    return GRIEVANCES.find((g) => g.id.toLowerCase() === ref.trim().toLowerCase())
  },
  /** Demo grievance submission from the public portal (no auth). */
  async submitGrievanceInput(input: { subject: string; description: string; projectId?: string }): Promise<Grievance> {
    await delay(600)
    const seq = 9950 + GRIEVANCES.length + 1
    return {
      id: `GRV-MH-${seq}`,
      subject: input.subject,
      category: 'Citizen Report',
      district: '—',
      status: 'submitted',
      submittedOn: new Date().toISOString().slice(0, 10),
      submittedBy: input.projectId ? '(withheld — project-linked)' : '(withheld)',
      slaDeadline: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10),
      assignedTo: 'Unassigned',
      priority: 'medium',
      description: input.description,
      projectId: input.projectId,
      timeline: [{ timestamp: new Date().toISOString(), actor: 'Citizen portal', action: 'Submitted', note: 'Received on the public portal.' }],
      attachments: 0,
    }
  },
}
