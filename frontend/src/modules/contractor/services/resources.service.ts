import { apiClient } from '@/lib/api/apiClient';

export interface ResourceUsageUpdate {
  id: string;
  project_id: string;
  reported_by_organization_id: string;
  update_date: string;
  workforce_deployed_count: number;
  workforce_planned_count: number;
  equipment_deployed_count: number;
  equipment_planned_count: number;
  shortage_ratio: number | null;
  verification_status: string;
  remarks: string | null;
  created_at: string;
}

export interface SubmitResourceUsagePayload {
  update_date: string;
  workforce_deployed_count: number;
  workforce_planned_count: number;
  equipment_deployed_count: number;
  equipment_planned_count: number;
  remarks?: string;
}

export class ContractorResourcesService {
  static async getUsageUpdates(projectId: string): Promise<ResourceUsageUpdate[]> {
    return apiClient.get<ResourceUsageUpdate[]>(`/api/resources/project/${projectId}/usage`);
  }

  static async submitUsage(projectId: string, payload: SubmitResourceUsagePayload): Promise<ResourceUsageUpdate> {
    return apiClient.post<ResourceUsageUpdate>(`/api/resources/project/${projectId}/usage`, payload);
  }

  static async getShortageRatio(projectId: string): Promise<{ shortage_ratio: number | null }> {
    return apiClient.get<{ shortage_ratio: number | null }>(`/api/resources/project/${projectId}/shortage`);
  }
}
