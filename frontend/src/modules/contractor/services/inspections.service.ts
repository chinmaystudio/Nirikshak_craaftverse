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

export class ContractorInspectionsService {
  static async getProjectInspections(projectId: string): Promise<InspectionVisit[]> {
    return apiClient.get<InspectionVisit[]>(`/api/inspections/project/${projectId}`);
  }

  static async resolveFinding(findingId: string, correctiveActionTaken: string): Promise<InspectionFinding> {
    return apiClient.patch<InspectionFinding>(`/api/inspections/findings/${findingId}/resolve`, {
      corrective_action_taken: correctiveActionTaken,
    });
  }
}
