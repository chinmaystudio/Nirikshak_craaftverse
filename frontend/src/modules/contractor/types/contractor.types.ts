export type ProjectStatus = 'Active' | 'At Risk' | 'Delayed' | 'Completed';
export type RiskLevel = 'Low' | 'Medium' | 'High';
export type MilestoneState = 'done' | 'current' | 'pending';

export interface Milestone {
  name: string;
  date: string;
  state: MilestoneState;
  progress?: number;
}

export interface Inspection {
  date: string;
  time?: string;
  stage: string;
  inspector: string;
  designation: string;
}

export interface InspectionRecord {
  date: string;
  stage: string;
  inspector: string;
  designation: string;
  result: 'Passed' | 'Passed with Remarks' | 'Defects Noted';
  remarks: string;
  corrective?: string;
}

export interface ComplianceItem {
  name: string;
  status: 'ok' | 'warn';
  note: string;
}

export interface RiskItem {
  area: string;
  level: RiskLevel;
  explanation: string;
  evidence: string[];
  action: string;
}

export interface ForecastFactor {
  label: string;
  value: number;
  detail: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  department: string;
  deptAbbr: string;
  officer: string;
  officerRole: string;
  officerPhone: string;
  officerEmail: string;
  location: string;
  district: string;
  category: string;
  value: number;
  budgetApproved: number;
  spent: number;
  received: number;
  progress: number;
  planned: number;
  start: string;
  deadline: string;
  months: number;
  status: ProjectStatus;
  risk: RiskLevel;
  lastUpdate: string;
  lastUpdateNote: string;
  workOrder: string;
  scope: string;
  milestones: Milestone[];
  upcoming: Inspection[];
  history: InspectionRecord[];
  compliance: ComplianceItem[];
  complianceScore: number;
  forecast: {
    predicted: string;
    earlyDays: number;
    confidence: number;
    factors: ForecastFactor[];
    actions: { label: string; impact: string }[];
  };
  health: {
    overall: 'GOOD' | 'FAIR' | 'POOR';
    score: number;
    scores: { label: string; value: number }[];
    risks: RiskItem[];
  };
  expenses: { label: string; budget: number; spent: number }[];
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  category: 'Skilled' | 'Unskilled' | 'Supervisor';
  area: string;
  attendance: number;
  hours: number;
  status: 'Active' | 'On Leave' | 'Transferred';
  phone: string;
}

export interface ResourceRow {
  id: string;
  name: string;
  category: 'Machinery' | 'Equipment' | 'Vehicles' | 'Materials';
  qty: number;
  allocated: number;
  used: number;
  unit: string;
  status: 'Available' | 'In Use' | 'Low Stock' | 'Idle';
}

export type InvoiceStatus = 'Draft' | 'Submitted' | 'Under Verification' | 'Approved' | 'Rejected' | 'Paid';

export interface Invoice {
  id: string;
  no: string;
  projectId: string;
  milestone: string;
  amount: number;
  date: string;
  status: InvoiceStatus;
  verification?: string;
  paidDate?: string;
  note?: string;
}

export interface ProgressReport {
  id: string;
  projectId: string;
  milestone: string;
  progress: number;
  prevProgress: number;
  completed: string;
  planned: string;
  challenges: string;
  photos: string[];
  docs: string[];
  submittedAt: string;
  status: 'Draft' | 'Submitted' | 'Under Government Review' | 'Approved' | 'Changes Requested';
  reviewerNote?: string;
}

export interface Message {
  id: string;
  projectId: string;
  dir: 'in' | 'out';
  from: string;
  role: string;
  subject: string;
  type: 'Notice' | 'Clarification' | 'Request' | 'Response' | 'Meeting' | 'General';
  body: string;
  ts: string;
  ref: string;
  status: 'Read' | 'Sent' | 'Action Required';
  attachments?: string[];
}

export interface ProjectDoc {
  id: string;
  name: string;
  type: string;
  size: string;
  uploaded: string;
  by: string;
}

export type NotifCategory = 'Project' | 'Tender' | 'Finance' | 'Inspection' | 'Government' | 'Compliance' | 'AI Alerts';

export interface Notification {
  id: string;
  category: NotifCategory;
  title: string;
  body: string;
  project?: string;
  amount?: string;
  time: string;
  read: boolean;
  link?: string;
}

export type EventType = 'Project' | 'Inspection' | 'Payment' | 'Tender' | 'Government' | 'Compliance';

export interface CalendarEvent {
  date: string;
  title: string;
  type: EventType;
  time?: string;
  link?: string;
}

export interface Tender {
  id: string;
  code: string;
  title: string;
  department: string;
  location: string;
  value: number;
  deadline: string;
  emd: number;
  category: string;
  durationMonths: number;
  opened: string;
  preBid: string;
  status: 'Open' | 'Closed';
  summary: string;
  scopePoints: string[];
  eligibility: { label: string; required: string };
  techReq: string[];
  finReq: string[];
  docs: string[];
  timeline: { label: string; date: string }[];
  contact: { name: string; role: string; phone: string; email: string };
}

export interface Bid {
  tenderId: string;
  status: 'Draft' | 'Submitted' | 'Under Evaluation' | 'Awarded' | 'Rejected' | 'Lost';
  step: number;
  updatedAt: string;
  ref?: string;
  submittedAt?: string;
  bidValue?: number;
  data: Record<string, unknown>;
}

export interface PastBid {
  id: string;
  tender: string;
  department: string;
  year: string;
  value: number;
  outcome: 'Awarded' | 'Lost' | 'Rejected';
  detail: string;
}
