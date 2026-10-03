import { supabase } from '@/core/supabase/client';
import type { DocumentItem, Paginated, ListQuery } from '@/modules/government/types';

function matchesQuery<T extends object>(items: T[], q?: ListQuery): T[] {
  if (!q?.search) return items;
  const s = q.search.toLowerCase();
  return items.filter((item) =>
    Object.values(item as Record<string, unknown>).some(
      (v) => typeof v === 'string' && v.toLowerCase().includes(s)
    )
  );
}

function paginate<T>(items: T[], q?: ListQuery): Paginated<T> {
  const page = q?.page ?? 1;
  const pageSize = q?.pageSize ?? 20;
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

export const documentsService = {
  async all(): Promise<DocumentItem[]> {
    try {
      const { data, error } = await supabase
        .from('project_documents')
        .select('*')
        .order('document_date', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => {
          let category: DocumentItem['category'] = 'Work Order';
          if (d.document_type === 'DPR') category = 'Administrative Approval';
          else if (d.document_type === 'EIA') category = 'Technical Approval';
          else if (d.document_type === 'CONTRACT') category = 'Contract Agreement';
          else if (d.document_type === 'INSPECTION') category = 'Inspection Report';

          return {
            id: d.id,
            name: d.title || 'Project Document',
            category,
            projectId: d.project_id,
            uploadedOn: d.document_date || '2025-01-01',
            uploadedBy: d.publisher || 'Department Engineer',
            fileSizeKb: 2450,
            version: 1,
            accessLevel: d.is_public ? 'Public' : 'Internal',
          };
        });
      }
    } catch (err) {
      console.warn('[documentsService] Error fetching project documents:', err);
    }
    return [];
  },

  async list(q?: ListQuery): Promise<Paginated<DocumentItem>> {
    const all = await this.all();
    return paginate(matchesQuery(all, q), q);
  },
};
