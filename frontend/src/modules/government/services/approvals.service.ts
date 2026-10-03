import { supabase } from '@/core/supabase/client';
import type { ApprovalItem, Paginated, ListQuery } from '@/modules/government/types';

export const approvalsService = {
  async all(): Promise<ApprovalItem[]> {
    const { data, error } = await supabase
      .from('progress_updates')
      .select('*, projects(project_name, nirikshak_project_id), project_milestones(milestone_name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[approvalsService] Error loading progress updates:', error);
      return [];
    }

    return (data || []).map((u: any) => ({
      id: u.id,
      type: 'Technical Sanction / Progress Verification',
      projectId: u.projects?.nirikshak_project_id || u.project_id,
      projectName: u.projects?.project_name || 'Not available',
      submittedBy: 'Contractor Organization',
      submittedOn: (u.created_at || '').slice(0, 10),
      status: u.verification_status === 'APPROVED' ? 'approved' : u.verification_status === 'REJECTED' ? 'rejected' : 'pending',
      slaDueDate: '',
      assignedTo: 'Not assigned',
      priority: 'high',
      auditTrail: [
        {
          timestamp: u.created_at || '',
          actor: 'Contractor organization',
          role: 'Submitter',
          action: 'Submitted progress update',
          remarks: u.description || 'No remarks supplied',
        },
      ],
    }));
  },

  async list(q?: ListQuery): Promise<Paginated<ApprovalItem>> {
    const all = await this.all();
    const page = q?.page ?? 1;
    const pageSize = q?.pageSize ?? 20;
    const filtered = q?.search
      ? all.filter((item) => `${item.id} ${item.projectName} ${item.type}`.toLowerCase().includes(q.search!.toLowerCase()))
      : all;
    return {
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  },

  async get(id: string): Promise<ApprovalItem | undefined> {
    return (await this.all()).find((item) => item.id === id);
  },

  async pending(): Promise<ApprovalItem[]> {
    const all = await this.all();
    return all.filter((a) => a.status === 'pending');
  },

  async approve(id: string, notes = 'Approved after verification.'): Promise<void> {
    const { error } = await supabase.rpc('approve_progress_update', {
      p_update_id: id,
      p_decision: 'APPROVED',
      p_verified_progress: null,
      p_review_notes: notes,
    });
    if (error) throw error;
  },

  async reject(id: string, notes = 'Rejected.'): Promise<void> {
    const { error } = await supabase.rpc('approve_progress_update', {
      p_update_id: id,
      p_decision: 'REJECTED',
      p_verified_progress: null,
      p_review_notes: notes,
    });
    if (error) throw error;
  },
};
