import { apiClient } from '@/lib/api/apiClient';

export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  target_date: string;
  revised_target_date: string | null;
  weightage_percent: number;
  status: string;
  sequence_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export class ContractorMilestonesService {
  static async getProjectMilestones(projectId: string): Promise<ProjectMilestone[]> {
    return apiClient.get<ProjectMilestone[]>(`/api/milestones/project/${projectId}`);
  }
}
