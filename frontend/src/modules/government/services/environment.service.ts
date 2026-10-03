import { apiClient } from '@/lib/api/apiClient';

export interface EnvironmentalClearance {
  id: string;
  project_id: string;
  clearance_type: string;
  issuing_authority: string;
  reference_number: string;
  status: 'PENDING' | 'GRANTED' | 'REJECTED' | 'EXPIRED';
  application_date: string;
  grant_date: string | null;
  expiry_date: string | null;
  conditions_summary: string | null;
  created_at: string;
}

export interface EnvironmentalObservation {
  id: string;
  project_id: string;
  parameter_type: string;
  observed_value: number;
  unit_of_measure: string;
  compliance_status: 'COMPLIANT' | 'NON_COMPLIANT';
  observation_date: string;
  reporter_role: string;
  notes: string | null;
}

export interface EnvironmentalIncident {
  id: string;
  project_id: string;
  incident_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  incident_date: string;
  description: string;
  containment_action: string | null;
  status: 'OPEN' | 'INVESTIGATING' | 'CLOSED';
}

export interface EnvironmentalSummary {
  project_id: string;
  total_clearances: number;
  pending_clearances: number;
  open_incidents: number;
  non_compliant_observations: number;
}

export const environmentService = {
  async getClearances(projectId: string): Promise<EnvironmentalClearance[]> {
    return apiClient.get<EnvironmentalClearance[]>(`/api/environment/project/${projectId}/clearances`);
  },

  async recordClearance(projectId: string, payload: Partial<EnvironmentalClearance>): Promise<EnvironmentalClearance> {
    return apiClient.post<EnvironmentalClearance>(`/api/environment/project/${projectId}/clearances`, payload);
  },

  async getObservations(projectId: string): Promise<EnvironmentalObservation[]> {
    return apiClient.get<EnvironmentalObservation[]>(`/api/environment/project/${projectId}/observations`);
  },

  async recordObservation(projectId: string, payload: Partial<EnvironmentalObservation>): Promise<EnvironmentalObservation> {
    return apiClient.post<EnvironmentalObservation>(`/api/environment/project/${projectId}/observations`, payload);
  },

  async getIncidents(projectId: string): Promise<EnvironmentalIncident[]> {
    return apiClient.get<EnvironmentalIncident[]>(`/api/environment/project/${projectId}/incidents`);
  },

  async reportIncident(projectId: string, payload: Partial<EnvironmentalIncident>): Promise<EnvironmentalIncident> {
    return apiClient.post<EnvironmentalIncident>(`/api/environment/project/${projectId}/incidents`, payload);
  },

  async getSummary(projectId: string): Promise<EnvironmentalSummary> {
    return apiClient.get<EnvironmentalSummary>(`/api/environment/project/${projectId}/summary`);
  },
};
