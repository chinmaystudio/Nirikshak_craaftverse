/**
 * Canonical Shared TypeScript Types for NIRIKSHAK Craftverse.
 * Provides unified cross-portal domain definitions across Citizen, Contractor, and Government modules.
 */

export * from '../constants/roles';
export * from '../constants/statuses';

// ----------------------------------------------------
// Generic API & Pagination Types
// ----------------------------------------------------
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ----------------------------------------------------
// Geo & Coordinates
// ----------------------------------------------------
export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

// ----------------------------------------------------
// Core Domain Entities
// ----------------------------------------------------
export interface SharedProject {
  id: string;
  code: string;
  name: string;
  description?: string;
  department: string;
  sector?: string;
  subsector?: string;
  implementingAgency?: string;
  district?: string;
  city?: string;
  state?: string;
  status: string;
  normalizedStatus?: import('../constants/statuses').ProjectStatus;
  sanctionedAmountCr: number;
  revisedAmountCr?: number;
  spentAmountCr: number;
  physicalProgressPct: number;
  financialProgressPct?: number;
  startDate?: string;
  originalCompletionDate?: string;
  revisedCompletionDate?: string;
  contractorName?: string;
  coordinates?: GeoCoordinates;
  createdAt?: string;
  updatedAt?: string;
}

export interface SharedMilestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  plannedStartDate?: string;
  plannedEndDate: string;
  actualEndDate?: string;
  physicalProgressPct: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  weightagePct?: number;
  linkedPaymentCr?: number;
}

export interface SharedTender {
  id: string;
  tenderNumber: string;
  title: string;
  department: string;
  projectId?: string;
  estimatedCostCr: number;
  status: import('../constants/statuses').TenderStatus;
  publishedDate: string;
  bidSubmissionDeadline: string;
  bidsCount?: number;
}

export interface SharedBid {
  id: string;
  tenderId: string;
  contractorId: string;
  contractorName: string;
  bidAmountCr: number;
  submittedAt: string;
  status: 'SUBMITTED' | 'UNDER_EVALUATION' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED';
  technicalScore?: number;
  financialScore?: number;
}

export interface SharedProgressUpdate {
  id: string;
  projectId: string;
  contractorId?: string;
  submittedBy: string;
  submissionDate: string;
  reportedProgressPct: number;
  verifiedProgressPct?: number;
  status: import('../constants/statuses').ProgressStatus;
  description: string;
  locationDescription?: string;
  coordinates?: GeoCoordinates;
  photoUrls?: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  reviewRemarks?: string;
}

export interface SharedComplaint {
  id: string;
  complaintNumber: string;
  projectId?: string;
  citizenId?: string;
  title: string;
  description: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: import('../constants/statuses').ComplaintStatus;
  department: string;
  district?: string;
  coordinates?: GeoCoordinates;
  photoUrls?: string[];
  createdAt: string;
  resolvedAt?: string;
  resolutionRemarks?: string;
}

export interface SharedBill {
  id: string;
  billNumber: string;
  projectId: string;
  contractorId: string;
  contractorName: string;
  billType: 'RA Bill' | 'Final Bill' | 'Mobilization Advance' | 'Labour Bill';
  amountCr: number;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_VERIFICATION' | 'APPROVED' | 'PAID' | 'REJECTED';
  submissionDate: string;
  approvalDate?: string;
  paymentDate?: string;
  embReference?: string;
}

export interface SharedInspection {
  id: string;
  projectId: string;
  officerName: string;
  officerDesignation: string;
  inspectionDate: string;
  outcome: 'SATISFACTORY' | 'DEFECTS_NOTED' | 'WORK_STOPPAGE_RECOMMENDED';
  findings: string;
  complianceDeadline?: string;
  reportUrl?: string;
}
