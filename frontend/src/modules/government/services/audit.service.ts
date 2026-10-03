import { supabase } from '@/core/supabase/client';
import type { AuditFinding } from '@/modules/government/types';

export const auditService = {
  async findings(): Promise<AuditFinding[]> {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*, projects(project_name, nirikshak_project_id)')
        .eq('status', 'COMPLETED')
        .order('inspection_date', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((ins: any, idx: number) => ({
          id: `AUD-2026-${(idx + 1).toString().padStart(4, '0')}`,
          auditTitle: ins.summary?.slice(0, 60) || 'Field Quality & Safety Audit',
          projectId: ins.projects?.nirikshak_project_id || ins.project_id,
          severity: (ins.inspection_type === 'SAFETY_AUDIT' ? 'medium' : 'low') as any,
          category: ins.inspection_type || 'Civil Quality Check',
          observation: ins.summary || 'Periodic compliance audit conducted at project site.',
          raisedOn: ins.inspection_date || '2026-03-01',
          status: 'open',
          accountableOfficer: 'Chief Quality Inspector (Pune Div)',
          dueDate: '2026-04-15',
          irregularityAmountCr: 0,
        }));
      }
    } catch (err) {
      console.warn('[auditService] Error fetching audit findings:', err);
    }
    return [];
  },
};
