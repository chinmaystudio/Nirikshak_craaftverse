export type ComplaintStatus =
  | "submitted"
  | "under-review"
  | "assigned"
  | "investigation"
  | "action-taken"
  | "resolved"
  | "closed"
  | "escalated";

export type ComplaintPriority = "low" | "medium" | "high" | "critical";

export type TimelineEventStatus = "completed" | "current" | "upcoming";

export interface ComplaintTimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string | null;
  actor: string;
  status: TimelineEventStatus;
  breach?: boolean;
}

export type EvidenceKind = "image" | "video";

export interface EvidenceItem {
  id: string;
  name: string;
  size: string;
  kind: EvidenceKind;
  meta: string;
  tone?: string;
  thumb?: string | null;
  fromVision?: boolean;
}

export interface AssignedOfficer {
  name: string;
  role: string;
  phone: string;
}

export interface ComplaintResolution {
  closedAt: string;
  note: string;
  evidence: EvidenceItem[];
}

export interface ComplaintFeedback {
  rating: number;
  comment: string;
  at: string;
}

export interface SLAInfo {
  deadline: number;
  totalHours: number;
}

export interface Complaint {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  priority: ComplaintPriority;
  projectId: string | null;
  ward: string;
  location: string;
  description: string;
  status: ComplaintStatus;
  submittedAt: string;
  updatedAt: string;
  sla: SLAInfo;
  department: string;
  officer: AssignedOfficer | null;
  evidence: EvidenceItem[];
  timeline: ComplaintTimelineEvent[];
  officerNote: string | null;
  resolution: ComplaintResolution | null;
  feedback: ComplaintFeedback | null;
}

export interface NewComplaintPayload {
  title: string;
  category: string;
  categoryLabel: string;
  priority: ComplaintPriority;
  projectId: string | null;
  department: string;
  ward: string;
  location: string;
  description: string;
  evidence: EvidenceItem[];
  aiSeverity?: string | null;
  aiConfidence?: number | null;
  aiProjectName?: string | null;
}
