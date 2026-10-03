/** NIRIKSHAK domain types — shared vocabulary across pages, data and mock API. */

/* ---------- Shared status vocabulary (never color-only; icon+text+tint) ---------- */
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export interface StatusDescriptor {
  /** i18n key suffix, e.g. status.on_track */
  key: string
  tone: StatusTone
  /** Material Symbols ligature name */
  icon: string
}

export type ProjectStatus =
  | 'sanctioned'
  | 'in_execution'
  | 'delayed'
  | 'at_risk'
  | 'completed'
  | 'on_hold'

export type MilestoneStatus = 'upcoming' | 'in_progress' | 'completed' | 'delayed' | 'blocked'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'returned' | 'clarification'

export type TenderStatus =
  | 'draft'
  | 'published'
  | 'bid_open'
  | 'under_evaluation'
  | 'awarded'
  | 'cancelled'

export type GrievanceStatus =
  | 'submitted'
  | 'acknowledged'
  | 'in_review'
  | 'action_taken'
  | 'resolved'
  | 'closed'
  | 'rejected'

export type LitigationStatus = 'open' | 'under_review' | 'hearing_scheduled' | 'resolved' | 'closed'

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical'

export type AlertSeverity = 'info' | 'warning' | 'critical'

/* ---------- Core entities ---------- */
export interface Department {
  id: string
  name: string
  nameHi: string
  nameMr: string
  code: string
}

export interface Contractor {
  id: string
  name: string
  registrationNo: string
  class: 'Class A' | 'Class B' | 'Class C'
  empanelledSince: string // ISO date
  districts: string[]
  activeProjects: number
  completedProjects: number
  totalValueCr: number
  /** 0–100 AI-assisted composite score */
  aiScore: number
  scoreBand: 'excellent' | 'good' | 'average' | 'poor'
  onTimeCompletionPct: number
  qualityRating: number // 0–5
  pendingDefects: number
  litigationCount: number
  strengths: string[]
  risks: string[]
}

export interface Milestone {
  id: string
  projectId: string
  title: string
  status: MilestoneStatus
  plannedStart: string
  plannedEnd: string
  actualStart?: string
  actualEnd?: string
  physicalProgressPct: number
  delayDays?: number
  remarks?: string
}

export interface ProjectFinancials {
  sanctionedAmountCr: number
  revisedAmountCr?: number
  amountUtilizedCr: number
  amountCommittedCr: number
  fundingSources: { source: string; sharePct: number; amountCr: number }[]
  lastTrancheDate?: string
  nextTrancheDueCr?: number
}

export interface Project {
  id: string // e.g. NIR-PWD-2026-0142
  name: string
  department: string
  district: string
  division: string
  category: string
  status: ProjectStatus
  sanctionedAmountCr: number
  utilizedAmountCr: number
  physicalProgressPct: number
  financialProgressPct: number
  adminApprovalDate: string
  technicalApprovalDate: string
  expectedCompletion: string
  actualCompletion?: string
  contractor?: string
  riskLevel: 'low' | 'medium' | 'high'
  delayDays: number
  workOrderNo?: string
  summary: string
  financials: ProjectFinancials
  milestones: Milestone[]
  inspectionsCount: number
  openComplaints: number
  pendingApprovals: number
  documentsCount: number
}

export interface ApprovalAction {
  timestamp: string
  actor: string
  role: string
  action: string
  remarks: string
}

export interface ApprovalItem {
  id: string
  type: string // e.g. Administrative Approval, Fund Release, Technical Sanction
  projectId: string
  projectName: string
  submittedBy: string
  submittedOn: string
  amountCr?: number
  status: ApprovalStatus
  slaDueDate: string
  assignedTo: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  auditTrail: ApprovalAction[]
}

export interface TenderLot {
  bidder: string
  quotedAmountCr: number
  technicalScore: number
  financialScore: number
  bidValidityDays: number
  bidStatus: 'accepted' | 'rejected' | 'under_review'
}

export interface Tender {
  id: string // eNIT / Tender No.
  title: string
  department: string
  district: string
  status: TenderStatus
  estimatedCostCr: number
  publishedOn: string
  submissionDeadline: string
  openingDate: string
  bidsReceived: number
  lots?: TenderLot[]
  awardedTo?: string
  awardedAmountCr?: number
  category: string
  mode: 'e-Tender' | 'Manually' | 'Global'
  /** Project workspace linkage — undefined for department-wide tenders. */
  projectId?: string
}

export interface BillItem {
  id: string // BILL-2026-0342
  projectId: string
  contractor: string
  /** Contractor's own invoice number */
  billNo: string
  type: 'RA Bill' | 'Final Bill' | 'Material Bill' | 'Labour Bill'
  amountCr: number
  submittedOn: string
  /** e-MB entry the bill claims against */
  mbEntry: string
  status: 'submitted' | 'verified' | 'approved' | 'paid' | 'returned'
  verifiedBy?: string
  approvedBy?: string
  paidOn?: string
  /** Duplicate/abnormal detection flag (AI-assisted, officer reviews) */
  flag?: 'duplicate' | 'abnormal'
  flagNote?: string
}

export interface Grievance {
  id: string // GRV-MH-9942
  subject: string
  category: string
  projectId?: string
  district: string
  status: GrievanceStatus
  submittedOn: string
  submittedBy: string // masked for internal view per privacy rules
  slaDeadline: string
  assignedTo: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  description: string
  timeline: { timestamp: string; actor: string; action: string; note: string }[]
  attachments: number
  resolutionNote?: string
}

export interface FundFlow {
  id: string
  fy: string
  demandNo: number
  head: string
  budgetEstimateCr: number
  revisedEstimateCr: number
  allocationCr: number
  releasedCr: number
  utilizedCr: number
  status: 'allocated' | 'released' | 'pending'
}

export interface AuditFinding {
  id: string
  auditTitle: string
  projectId?: string
  severity: AuditSeverity
  category: string
  observation: string
  raisedOn: string
  status: 'open' | 'response_received' | 'corrective_action' | 'closed'
  accountableOfficer: string
  dueDate: string
  irregularityAmountCr?: number
}

export interface AlertItem {
  id: string
  category: string
  severity: AlertSeverity
  title: string
  body: string
  timestamp: string
  projectId?: string
  read: boolean
  sourceModule: string
}

export interface DocumentItem {
  id: string
  name: string
  category:
    | 'Administrative Approval'
    | 'Technical Approval'
    | 'Work Order'
    | 'Tender Document'
    | 'Contract Agreement'
    | 'Inspection Report'
    | 'Financial Record'
    | 'Site Photograph'
  projectId?: string
  uploadedOn: string
  uploadedBy: string
  fileSizeKb: number
  version: number
  expiryDate?: string
  accessLevel: 'Public' | 'Internal' | 'Restricted'
  signedBy?: string
}

export interface LitigationCase {
  id: string
  title: string
  court: string
  caseNo: string
  status: LitigationStatus
  filedOn: string
  nextHearing?: string
  projectId?: string
  contractor?: string
  claimAmountCr?: number
  counsel: string
  summary: string
}

export interface WorkOrder {
  id: string
  projectId: string
  contractor: string
  issuedOn: string
  valueCr: number
  completionPeriodDays: number
  status: 'issued' | 'accepted' | 'in_execution' | 'suspended' | 'closed'
  measurementBookNo: string
  defectLiabilityMonths: number
}

export interface InspectionRecord {
  id: string
  projectId: string
  inspectedOn: string
  inspector: string
  type: 'Routine' | 'Surprise' | 'Quality' | 'Safety' | 'Financial'
  findings: string
  geoTag: { lat: number; lng: number }
  photosCount: number
  outcome: 'satisfactory' | 'observations' | 'non_compliance'
  correctiveAction?: string
}

export interface AiInsight {
  id: string
  area: string
  title: string
  insight: string
  supportingData: string
  confidencePct: number
  confidenceBand: 'low' | 'medium' | 'high'
  recommendedAction: string
  relatedProjectIds: string[]
  generatedOn: string
  /** Distinguishes AI-generated insight from verified data / officer decision */
  classification: 'ai_insight' | 'verified_data' | 'officer_decision'
}

export interface CitizenProjectSummary {
  id: string
  name: string
  department: string
  district: string
  status: ProjectStatus
  sanctionedAmountCr: number
  physicalProgressPct: number
  expectedCompletion: string
  contractor: string
  scope: string
  /** Public-facing only: excludes internal notes, officer remarks, sensitive files */
  publicMilestones: { title: string; status: MilestoneStatus; plannedEnd: string }[]
}

export interface Officer {
  id: string
  name: string
  designation: string
  department: string
  employeeNo: string
  roles: string[]
}

/* ---------- Pagination / API envelopes ---------- */
export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface ListQuery {
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  filters?: Record<string, string[]>
}
