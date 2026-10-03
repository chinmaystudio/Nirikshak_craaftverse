export interface CreateMilestoneInput {
  project_id: string;
  milestone_code: string;
  title: string;
  description?: string;
  sequence_number: number;
  weight_percentage: number;
  planned_start_date?: string;
  planned_completion_date: string;
  payment_percentage?: number;
}

export interface UpdateMilestoneInput {
  title?: string;
  description?: string;
  weight_percentage?: number;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'CANCELLED';
  actual_completion_date?: string;
  payment_percentage?: number;
}

export interface MilestoneRecord {
  id: string;
  project_id: string;
  milestone_code: string;
  title: string;
  description: string | null;
  sequence_number: number;
  weight_percentage: number;
  planned_start_date: string | null;
  planned_completion_date: string;
  actual_completion_date: string | null;
  status: string;
  payment_percentage: number | null;
  created_at: string;
}
