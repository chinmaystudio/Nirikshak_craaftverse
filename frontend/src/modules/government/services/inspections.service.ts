import { apiClient } from '@/lib/api/apiClient';

export interface InspectionFinding {
  id: string;
  inspection_id: string;
  finding_type: string;
  severity: string;
  description: string;
  location_reference: string | null;
  status: 'OPEN' | 'ACTION_REQUIRED' | 'RESOLVED' | 'VERIFIED';
  corrective_action_required: string | null;
  corrective_action_taken: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface InspectionVisit {
  id: string;
  project_id: string;
  inspection_type: string;
  scheduled_date: string;
  actual_date: string | null;
  status: string;
  summary: string | null;
  overall_rating: string | null;
  findings?: InspectionFinding[];
}

export interface ScheduleInspectionPayload {
  inspection_type: string;
  scheduled_date: string;
  lead_inspector_user_id?: string;
  scope_notes?: string;
}

export interface CompleteInspectionPayload {
  actual_date: string;
  overall_rating: 'SATISFACTORY' | 'NEEDS_IMPROVEMENT' | 'CRITICAL_DEFECTS';
  summary: string;
}

export interface CreateFindingPayload {
  finding_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  location_reference?: string;
  corrective_action_required?: string;
}

export const inspectionsService = {
  async getProjectInspections(projectId: string): Promise<InspectionVisit[]> {
    return apiClient.get<InspectionVisit[]>(`/api/inspections/project/${projectId}`);
  },

  async scheduleInspection(projectId: string, payload: ScheduleInspectionPayload): Promise<InspectionVisit> {
    return apiClient.post<InspectionVisit>(`/api/inspections/project/${projectId}`, payload);
  },

  async completeInspection(inspectionId: string, payload: CompleteInspectionPayload): Promise<InspectionVisit> {
    return apiClient.post<InspectionVisit>(`/api/inspections/${inspectionId}/complete`, payload);
  },

  async createFinding(inspectionId: string, payload: CreateFindingPayload): Promise<InspectionFinding> {
    return apiClient.post<InspectionFinding>(`/api/inspections/${inspectionId}/findings`, payload);
  },

  async verifyFinding(findingId: string, remarks?: string): Promise<InspectionFinding> {
    return apiClient.patch<InspectionFinding>(`/api/inspections/findings/${findingId}/resolve`, {
      corrective_action_taken: remarks || 'Verified by government engineer on site',
    });
  },
};
