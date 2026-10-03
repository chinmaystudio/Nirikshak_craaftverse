export interface ScheduleInspectionInput {
  project_id: string;
  inspection_type: string;
  scheduled_date: string;
  summary?: string;
}

export interface CompleteInspectionInput {
  inspection_date: string;
  overall_rating?: string;
  summary: string;
}

export interface CreateFindingInput {
  project_id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
}

export interface ResolveFindingInput {
  resolution_notes: string;
}

export interface InspectionRecord {
  id: string;
  project_id: string;
  inspector_id: string | null;
  inspection_type: string;
  scheduled_date: string | null;
  inspection_date: string | null;
  status: string;
  overall_rating: string | null;
  summary: string | null;
  created_at: string;
}

export interface InspectionFindingRecord {
  id: string;
  inspection_id: string;
  project_id: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
}
