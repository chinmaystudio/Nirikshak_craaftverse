import type { ComplaintPriority } from "./complaint";

export type IssueCategory =
  | "pothole"
  | "road-damage"
  | "construction-quality"
  | "project-delay"
  | "work-stopped"
  | "drainage"
  | "water-leakage"
  | "safety-hazard"
  | "environmental"
  | "other";

export interface IssueCategoryMeta {
  id: IssueCategory;
  label: string;
  icon: string;
  department: string;
  priority: ComplaintPriority;
}

export type CommunityIssueStatus = "open" | "confirmed" | "action-taken" | "resolved";

export interface CommunityEvidenceItem {
  name: string;
  meta: string;
  tone: string;
}

export interface CommunityConfirmation {
  name: string;
  ward: string;
  at: string;
  note: string;
}

export interface CommunityComment {
  author: string;
  ward?: string;
  at: string;
  text: string;
  official?: boolean;
  you?: boolean;
}

export interface GovernmentResponse {
  by: string;
  at: string;
  text: string;
}

export interface CommunityResolution {
  closedAt: string;
  note: string;
}

export interface CommunityIssueTimelineEntry {
  id: string;
  title: string;
  description: string;
  date: string | null;
  status: "completed" | "current" | "upcoming";
}

export interface CommunityIssue {
  id: string;
  title: string;
  category: string;
  projectId: string | null;
  ward: string;
  location: string;
  reportedBy: string;
  reportedAt: string;
  affected: number;
  confirmations: number;
  upvotes: number;
  status: CommunityIssueStatus;
  description: string;
  confirmers: CommunityConfirmation[];
  evidence: CommunityEvidenceItem[];
  timeline: CommunityIssueTimelineEntry[];
  comments: CommunityComment[];
  govResponse: GovernmentResponse | null;
  resolution: CommunityResolution | null;
}

export interface CommunityIssueView extends CommunityIssue {
  confirmPct: number;
  userConfirmed: boolean;
  userUpvoted: boolean;
}

export interface CommunityStats {
  open: number;
  resolved: number;
  confirmations: number;
  citizensAffected: number;
}
