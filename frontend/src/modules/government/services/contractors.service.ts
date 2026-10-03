import { supabase } from '@/core/supabase/client';
import type { Contractor, Paginated, ListQuery } from '@/modules/government/types';

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

export const contractorsService = {
  async all(): Promise<Contractor[]> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('type', 'contractor');

      if (!error && data && data.length > 0) {
        return data.map((org: any) => ({
          id: org.id,
          name: org.name || 'Contractor Entity',
          registrationNo: org.registration_number || `REG-${org.id.slice(0, 6)}`,
          class: 'Class A' as const,
          empanelledSince: org.created_at?.slice(0, 10) || '2023-01-01',
          districts: ['Pune'],
          activeProjects: 0,
          completedProjects: 0,
          totalValueCr: 0,
          aiScore: 0,
          scoreBand: 'neutral' as any,
          onTimeCompletionPct: 0,
          qualityRating: 0,
          pendingDefects: 0,
          litigationCount: 0,
          strengths: [],
          risks: [],
        }));
      }
    } catch {
      /* ignore */
    }
    return [];
  },

  async list(q?: ListQuery): Promise<Paginated<Contractor>> {
    const all = await this.all();
    return paginate(matchesQuery(all, q), q);
  },
};
