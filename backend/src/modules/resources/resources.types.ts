export interface SubmitResourceUsageInput {
  project_id: string;
  allocation_id?: string;
  reporting_date: string;
  quantity_used: number;
  quantity_available: number;
  shortage_ratio: number;
  notes?: string;
}

export interface VerifyResourceUsageInput {
  verification_status: 'VERIFIED' | 'REJECTED';
  notes?: string;
}

export interface ResourceUsageRecord {
  id: string;
  project_id: string;
  allocation_id: string | null;
  reporting_date: string;
  quantity_used: number;
  quantity_available: number;
  shortage_ratio: number;
  verification_status: string;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
}
