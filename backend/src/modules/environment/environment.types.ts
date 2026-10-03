export interface CreateClearanceInput {
  project_id: string;
  clearance_type: string;
  issuing_authority: string;
  clearance_number: string;
  issue_date: string;
  valid_until?: string;
  status: 'APPLIED' | 'GRANTED' | 'REJECTED' | 'EXPIRED';
  conditions_count?: number;
  conditions_complied_count?: number;
}

export interface RecordObservationInput {
  project_id: string;
  observation_date: string;
  parameter_name: string;
  measured_value: number;
  prescribed_limit: number;
  unit: string;
  is_compliant: boolean;
  notes?: string;
}

export interface ReportIncidentInput {
  project_id: string;
  incident_date: string;
  severity: 'MINOR' | 'MODERATE' | 'MAJOR' | 'CATASTROPHIC';
  title: string;
  description: string;
  mitigation_measures?: string;
}
