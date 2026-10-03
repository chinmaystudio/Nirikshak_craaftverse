import type { IssueCategory } from "./community";

export type AlertSeverity = "critical" | "warning" | "notice" | "info";

export type AlertCategory = "project" | "infrastructure" | "safety";

export interface GovernmentAlert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  body: string;
  area: string;
  detour?: string;
  startTime: string;
  endTime: string | null;
  postedAt: string;
  projectId: string | null;
  contact: string;
}

export interface VisionCondition {
  label: string;
  observations: string[];
}

export interface VisionDetails {
  ageEstimate: string;
  usage: string;
  materials: string;
}

export interface VisionAuthority {
  organization: string;
  department: string;
  contact: string;
}

export interface VisionProjectMatch {
  projectId: string;
  matchConfidence: number;
}

export type VisionImageSource = "camera" | "upload";

export interface VisionAnalysis {
  id: string;
  analyzedAt: string;
  imageSource: VisionImageSource;
  thumb: string | null;
  infrastructureLabel: string;
  shortLabel: string;
  infrastructureType: string;
  confidence: number;
  description: string;
  details: VisionDetails;
  condition: VisionCondition;
  authority: VisionAuthority;
  relatedProject: VisionProjectMatch | null;
  reportCategory: IssueCategory;
  saved: boolean;
  infoSubmitted: boolean;
}

export interface VisionProfile {
  key: string;
  label: string;
  shortLabel: string;
  type: string;
  confidence: number;
  description: string;
  details: VisionDetails;
  conditionVariants: VisionCondition[] | null;
  defaultCondition: VisionCondition;
  authority: VisionAuthority;
  projectMatch: string | null;
  reportCategory: IssueCategory;
}

export interface GovernmentAlertView extends GovernmentAlert {
  read: boolean;
}
