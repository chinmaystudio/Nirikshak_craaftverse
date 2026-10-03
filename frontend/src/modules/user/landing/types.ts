export type ProjectStatus = 'Active' | 'Delayed' | 'High Value' | 'Completed' | 'Tender';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface ProjectMilestone {
  id: string;
  name: string;
  targetDate: string;
  completionDate?: string;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Delayed';
  percentage: number;
}

export interface ProjectItem {
  id: string;
  name: string;
  code: string;
  department: string;
  ministry: string;
  location: string;
  state: string;
  contractor: string;
  contractValue: string; // e.g. "₹4,280 Cr"
  expenditure: string;
  startDate: string;
  targetCompletion: string;
  status: ProjectStatus;
  progress: number;
  financialProgress: number;
  scheduleVariance: string; // e.g. "+14 days", "-5 days"
  risk: RiskLevel;
  description: string;
  milestones: ProjectMilestone[];
  claimsCount: number;
  activeVariations: number;
}

export interface LifecycleStageInfo {
  step: string;
  name: string;
  title: string;
  objective: string;
  governmentAction: string;
  contractorAction: string;
  aiVerification: string;
  outputs: string[];
}

export interface ContractorProfile {
  id: string;
  name: string;
  registrationNo: string;
  classGrade: string;
  activeContracts: number;
  completedProjects: number;
  performanceScore: number; // e.g. 92/100
  riskScore: 'Low' | 'Medium' | 'High';
  bidVsActualVariance: string;
  historicalDelaysAvg: string;
  disputeRate: string;
  complianceRating: string;
  specialization: string;
}
