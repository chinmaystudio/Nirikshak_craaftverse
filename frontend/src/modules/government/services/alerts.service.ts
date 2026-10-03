import { supabase } from '@/core/supabase/client';
import type { AlertItem } from '@/modules/government/types';

export const alertsService = {
  async list(): Promise<AlertItem[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((n: any) => ({
          id: n.id,
          category: n.type || 'System',
          severity: (n.metadata?.priority === 'critical'
            ? 'critical'
            : n.metadata?.priority === 'high'
            ? 'high'
            : 'medium') as any,
          title: n.title || 'Infrastructure Alert',
          body: n.message || '',
          timestamp: n.created_at || new Date().toISOString(),
          projectId: n.entity_id,
          read: Boolean(n.read_at),
          sourceModule: 'Government Oversight & Monitoring',
        }));
      }
    } catch (err) {
      console.warn('[alertsService] Error fetching notifications:', err);
    }
    return [];
  },
};
