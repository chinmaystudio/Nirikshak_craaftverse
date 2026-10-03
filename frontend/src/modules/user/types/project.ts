export type ProjectStatus = "on-track" | "delayed" | "completed" | "under-review" | "tendering";

export type ProjectCategory =
  | "roads"
  | "bridges"
  | "metro-transit"
  | "water-supply"
  | "drainage"
  | "schools"
  | "hospitals"
  | "parks"
  | "smart-infrastructure"
  | "public-buildings";

export interface MapPoint {
  x: number;
  y: number;
}

export interface MapCoordinates {
  latitude: number;
  longitude: number;
}

export interface ProjectMarker {
  projectId: string;
  mapPoint: MapPoint;
  status: ProjectStatus;
}

export interface ProjectUpdate {
  date: string;
  text: string;
}

export interface ProjectInspection {
  date: string;
  by: string;
  remark: string;
}

export interface ProjectNextMilestone {
  name: string;
  date: string;
}

export interface ProjectFinancials {
  sanctionedAmount: number;
  revisedCost: number;
  amountSpent: number;
  fundingSource: string;
  fundingModel: string;
  varianceNote: string;
}

export interface ContractorPerformance {
  onTime: string;
  quality: string;
  safety: string;
  disputes: string;
}

export interface ContractorPreviousProject {
  name: string;
  year: number;
  note: string;
}

export interface Contractor {
  name: string;
  contractValue: number;
  start: string;
  duration: string;
  performance: ContractorPerformance;
  prevProjects: ContractorPreviousProject[];
  currentStatus: string;
}

export type MilestoneStatus = "completed" | "current" | "upcoming" | "delayed";

export interface ProjectMilestone {
  id: string;
  title: string;
  description?: string;
  date: string | null;
  status: MilestoneStatus;
  document?: string;
  image?: string;
}

export interface ProjectDocument {
  name: string;
  size: string;
  note: string;
}

export interface ProjectPhoto {
  src: string;
  caption: string;
}

export interface ProjectDates {
  tender: string;
  awarded: string;
  started: string;
  expected: string;
  actual: string | null;
  originalExpected?: string;
  revisedExpected?: string;
}

export interface ProjectDelay {
  reason: string;
  detected: string;
  revisedCompletion: string;
  penalty: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  category: ProjectCategory;
  department: string;
  agency: string;
  engineer: string;
  ward: string;
  city: string;
  state: string;
  status: ProjectStatus;
  progress: number;
  physicalProgress: number;
  financialProgress: number;
  phase: string;
  distanceKm: number | null;
  mapPoint: MapPoint | null;
  img: string | null;
  latestUpdate: ProjectUpdate;
  lastInspection: ProjectInspection;
  nextMilestone: ProjectNextMilestone;
  description: string;
  why: string;
  scope: string[];
  benefit: string;
  finance: ProjectFinancials;
  contractor: Contractor;
  dates: ProjectDates;
  delay?: ProjectDelay;
  timeline: ProjectMilestone[];
  docs: ProjectDocument[];
  photos: ProjectPhoto[];
  hotline: string;
}

export interface ContractorSummaryRow {
  name: string;
  projects: number;
  onTime: string;
  quality: string;
  safety: string;
}

export interface WardStatistics {
  id: string;
  name: string;
  projects: number;
  onTrack: number;
  delayed: number;
  critical: number;
  completed: number;
  totalValueCr: number;
  spentFYCr: number;
  expenditurePct: number;
  complaints: number;
  resolved: number;
  resolutionRate: number;
  avgDays: number;
  activeComplaints: number;
  contractors: ContractorSummaryRow[];
  statusSplit: Array<{ label: string; value: number; className: string }>;
}

export interface CityStatistics {
  activeProjects: number;
  completed: number;
  underReview: number;
  issuesResolved: number;
  avgRedressalDays: number;
}
