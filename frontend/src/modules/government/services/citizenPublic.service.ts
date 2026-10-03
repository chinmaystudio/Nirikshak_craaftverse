import { supabase } from '@/core/supabase/client';
import { mapNormalizedStatus } from './projects.service';
import { complaintsService } from './complaints.service';
import type { CitizenProjectSummary, Grievance, Paginated, ListQuery } from '@/modules/government/types';

export const citizenPublicService = {
  async all(): Promise<CitizenProjectSummary[]> {
    const { data, error } = await supabase
      .from('public_projects_view')
      .select('*')
      .order('total_cost_inr_crore', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('[citizenPublicService] Error loading public projects view:', error);
      return [];
    }

    return (data || []).map((p: any) => ({
      id: p.nirikshak_project_id || p.id,
      name: p.project_name,
      department: p.project_authority || 'Pune Municipal Corporation',
      district: p.district || p.city || 'Pune',
      status: mapNormalizedStatus(p.normalized_status),
      physicalProgressPct: Number(p.physical_progress_percent) || 0,
      sanctionedAmountCr: Number(p.total_cost_inr_crore) || 0,
      expectedCompletion: p.original_completion_date || p.revised_completion_date || '',
      contractor: p.contractor_concessionaire || 'Not available',
      scope: p.public_summary || p.description || 'Not available',
      publicMilestones: [],
    }));
  },

  async get(id: string): Promise<CitizenProjectSummary | undefined> {
    const all = await this.all();
    return all.find((p) => p.id === id);
  },

  async trackGrievance(ref: string): Promise<Grievance | undefined> {
    return complaintsService.get(ref);
  },

  async projects(q?: ListQuery): Promise<Paginated<CitizenProjectSummary>> {
    const all = await this.all();
    const page = q?.page ?? 1;
    const pageSize = q?.pageSize ?? 20;
    return {
      items: all.slice((page - 1) * pageSize, page * pageSize),
      total: all.length,
      page,
      pageSize,
    };
  },

  async submitGrievanceInput(_input?: { subject?: string; description?: string; projectId?: string }): Promise<Grievance> {
    throw new Error('Use the canonical /user/report flow to submit a grievance.');
  },
};
