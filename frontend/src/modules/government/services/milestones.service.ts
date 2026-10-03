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

export interface CreateMilestonePayload {
  title: string;
  description?: string;
  target_date: string;
  weightage_percent: number;
  sequence_order: number;
}

export interface UpdateMilestonePayload {
  title?: string;
  description?: string;
  target_date?: string;
  revised_target_date?: string;
  weightage_percent?: number;
  status?: string;
  sequence_order?: number;
  completed_at?: string;
}

export const milestonesService = {
  async getProjectMilestones(projectId: string): Promise<ProjectMilestone[]> {
    return apiClient.get<ProjectMilestone[]>(`/api/milestones/project/${projectId}`);
  },

  async createMilestone(projectId: string, payload: CreateMilestonePayload): Promise<ProjectMilestone> {
    return apiClient.post<ProjectMilestone>(`/api/milestones/project/${projectId}`, payload);
  },

  async updateMilestone(milestoneId: string, payload: UpdateMilestonePayload): Promise<ProjectMilestone> {
    return apiClient.patch<ProjectMilestone>(`/api/milestones/${milestoneId}`, payload);
  },
};
