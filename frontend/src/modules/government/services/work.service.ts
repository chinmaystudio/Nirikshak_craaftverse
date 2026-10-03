import { supabase } from '@/core/supabase/client';
import type { WorkOrder, InspectionRecord } from '@/modules/government/types';

export const workService = {
  async workOrders(): Promise<WorkOrder[]> {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*, projects(nirikshak_project_id), organizations:contractor_organization_id(name)')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((c: any) => ({
          id: c.contract_number || c.official_contract_id || c.id,
          projectId: c.projects?.nirikshak_project_id || c.project_id,
          contractor: (c.organizations as any)?.name || 'Contractor Organization',
          issuedOn: c.scheduled_start_date || (c.created_at || '').slice(0, 10),
          valueCr: Number(c.contract_value) || 0,
          completionPeriodDays: 365,
          status: (c.status || 'ACTIVE').toLowerCase() === 'active' ? 'in_execution' : 'issued',
          measurementBookNo: c.contract_number ? `eMB-${c.contract_number}` : 'eMB-Pending',
          defectLiabilityMonths: 36,
        }));
      }
    } catch (err) {
      console.warn('[workService] Error fetching contracts:', err);
    }
    return [];
  },

  async inspections(): Promise<InspectionRecord[]> {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*, projects(nirikshak_project_id)')
        .order('scheduled_date', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((i: any) => ({
          id: i.id,
          projectId: i.projects?.nirikshak_project_id || i.project_id,
          inspectedOn: i.inspection_date || i.scheduled_date || '',
          inspector: i.inspector_name || 'Designated Quality Inspector',
          type: (i.inspection_type === 'SAFETY_AUDIT'
            ? 'Safety'
            : i.inspection_type === 'QUALITY_CHECK'
            ? 'Quality'
            : 'Routine') as any,
          findings: i.summary || 'Periodic compliance check',
          geoTag: i.latitude && i.longitude ? { lat: Number(i.latitude), lng: Number(i.longitude) } : undefined,
          photosCount: 0,
          outcome: i.status === 'COMPLETED' ? 'satisfactory' : 'observations',
          correctiveAction: i.status !== 'COMPLETED' ? 'Follow-up inspection required' : undefined,
        }));
      }
    } catch (err) {
      console.warn('[workService] Error fetching inspections:', err);
    }
    return [];
  },
};
