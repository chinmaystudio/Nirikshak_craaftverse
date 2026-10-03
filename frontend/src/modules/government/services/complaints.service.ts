import { supabase } from '@/core/supabase/client';
import type { Grievance } from '@/modules/government/types';

export const complaintsService = {
  async all(): Promise<Grievance[]> {
    const { data, error } = await supabase
      .from('complaints')
      .select('*, projects(project_name, nirikshak_project_id)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[complaintsService] Error loading complaints:', error);
      return [];
    }

    return (data || []).map((c: any) => {
      const sev = String(c.severity || '').toLowerCase();
      const priority: Grievance['priority'] = sev === 'critical' ? 'urgent' : sev === 'high' ? 'high' : sev === 'low' ? 'low' : 'medium';
      const st = String(c.status || '').toUpperCase();
      const status: Grievance['status'] = st === 'RESOLVED' ? 'resolved' : st === 'IN_PROGRESS' ? 'action_taken' : 'submitted';

      return {
        id: c.reference_number || c.id,
        projectId: c.projects?.nirikshak_project_id || c.project_id || 'NIR-PUN-000',
        category: c.category || 'Quality of Work',
        status,
        subject: c.title || 'Public Works Grievance',
        description: c.description || 'Grievance submitted regarding infrastructure status.',
        submittedOn: (c.created_at || '').slice(0, 10),
        submittedBy: '(identity protected)',
        slaDeadline: '',
        assignedTo: c.assigned_user_id || 'Not assigned',
        priority,
        district: 'Not available',
        timeline: [
          {
            timestamp: c.created_at || '',
            actor: 'System',
            action: 'Grievance registered and geolocated',
            note: 'Submitted through the citizen portal',
          },
        ],
        attachments: 0,
      };
    });
  },

  async get(id: string): Promise<Grievance | undefined> {
    const all = await this.all();
    return all.find((g) => g.id === id);
  },

  async update(id: string, patch: Partial<Grievance>): Promise<Grievance> {
    if (patch.status) {
      const dbStatus = patch.status === 'resolved' ? 'RESOLVED' : patch.status === 'action_taken' ? 'IN_PROGRESS' : 'SUBMITTED';
      await supabase.from('complaints').update({ status: dbStatus }).or(`id.eq.${id},reference_number.eq.${id}`);
    }
    const found = await this.get(id);
    return found!;
  },
};
