import { supabase } from '@/lib/supabase/client';
import type { Project } from '../types/contractor.types';
import { normalizeProjectStatus } from '@/shared/constants/statuses';

export class ContractorProjectsService {
  /**
   * Fetches assigned projects for the authenticated contractor from the authoritative database view.
   * Never fabricates fake milestone, expense, or forecast data in live mode.
   */
  static async getAssignedProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('contractor_assigned_projects_view')
      .select('*')
      .order('total_cost_inr_crore', { ascending: false, nullsFirst: false })
      .limit(100);

    if (error) {
      console.error('[ContractorProjectsService] Error querying assigned projects:', error);
      throw error;
    }

    const records = (data as any[]) || [];
    return records.map((p) => {
      const cost = Number(p.contract_value ?? p.total_cost_inr_crore) || 0;
      const progress = Number(p.physical_progress_percent) || 0;
      const normalized = normalizeProjectStatus(p.normalized_status);
      const status: Project['status'] =
        normalized === 'COMPLETED' ? 'Completed' : normalized === 'DELAYED' ? 'Delayed' : normalized === 'AT_RISK' ? 'At Risk' : 'Active';

      const projId = p.nirikshak_project_id || p.id;
      return {
        id: p.id || projId,
        code: projId,
        name: p.project_name || 'Infrastructure Project',
        department: p.project_authority || 'Not available',
        deptAbbr: (p.project_authority || 'N/A').slice(0, 4).toUpperCase(),
        officer: 'Not available',
        officerRole: 'Not available',
        officerPhone: '',
        officerEmail: '',
        location: p.location_text || 'Not available',
        district: 'Not available',
        category: p.sector || p.subsector || 'Not available',
        value: cost,
        budgetApproved: cost,
        spent: 0,
        received: 0,
        progress,
        planned: null,
        start: '',
        deadline: p.scheduled_completion_date || '',
        months: 0,
        status,
        risk: null,
        lastUpdate: '',
        lastUpdateNote: '',
        workOrder: p.contract_number || 'Not available',
        scope: 'Not available',
        milestones: [],
        upcoming: [],
        history: [],
        compliance: [],
        complianceScore: 0,
        forecast: {
          predicted: p.scheduled_completion_date || '',
          earlyDays: 0,
          confidence: 0,
          factors: [],
          actions: [],
        },
        health: null,
        expenses: [],
      };
    });
  }

  static async getProjectById(id: string): Promise<Project | null> {
    const all = await this.getAssignedProjects();
    return all.find((p) => p.id === id || p.code === id) || null;
  }
}

export const contractorProjectsService = ContractorProjectsService;
