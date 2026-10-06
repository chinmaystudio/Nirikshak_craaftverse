import { supabase } from '@/lib/supabase/client';
import { apiClient } from '@/lib/api/apiClient';
import type { ProgressReport } from '../types/contractor.types';

export class ContractorProgressService {
  /**
   * Translates project UUID or human-readable project code (e.g. NIR-PUN-...) to database UUID.
   */
  static async resolveProjectId(projectId: string): Promise<string> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
    if (isUuid) return projectId;

    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('nirikshak_project_id', projectId)
      .maybeSingle();

    if (error || !data) {
      throw new Error(`Project record not found for identifier: ${projectId}`);
    }
    return (data as any).id;
  }

  /**
   * Authoritative progress submission via PostgreSQL RPC `submit_progress_update`.
   * Never performs local state double-writes. Only returns when persisted successfully in the database.
   */
  static async submitProgress(payload: {
    projectId: string;
    reportedProgress: number;
    description: string;
    milestoneId?: string | null;
  }): Promise<{ id: string; success: boolean }> {
    const { projectId, reportedProgress, description, milestoneId } = payload;
    const targetProjectId = await ContractorProgressService.resolveProjectId(projectId);

    const data = await apiClient.post<{ id: string; success: boolean }>('/api/progress/submit', {
      project_id: targetProjectId,
      reported_progress: reportedProgress,
      description,
      milestone_id: milestoneId || null,
    });

    return {
      id: data?.id || 'submitted',
      success: true,
    };
  }

  /**
   * Queries real progress update history for a project.
   */
  static async listProgress(projectId: string): Promise<ProgressReport[]> {
    let targetProjectId = projectId;
    try {
      targetProjectId = await ContractorProgressService.resolveProjectId(projectId);
    } catch {
      // If resolution fails, attempt directly with provided ID
    }

    const { data, error } = await supabase
      .from('progress_updates')
      .select('*')
      .eq('project_id', targetProjectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ContractorProgressService] Error querying progress updates:', error);
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      milestone: row.milestone_id || 'General Execution',
      progress: Number(row.reported_progress) || 0,
      prevProgress: 0,
      completed: row.description || '',
      planned: '',
      challenges: '',
      photos: [],
      docs: [],
      submittedAt: row.created_at || '',
      status: row.status === 'APPROVED' ? 'Approved' : row.status === 'REJECTED' ? 'Changes Requested' : 'Submitted',
      reviewerNote: row.review_notes || undefined,
    }));
  }
}

export const contractorProgressService = ContractorProgressService;
