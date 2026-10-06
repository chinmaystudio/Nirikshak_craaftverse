import { supabase } from '@/core/supabase/client';
import { env } from '@/lib/config/env';
import { apiClient } from '@/lib/api/apiClient';
import type { Tender, Paginated, ListQuery } from '@/modules/government/types';

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

export const procurementService = {
  async all(): Promise<Tender[]> {
    try {
      const [{ data, error }, { data: bidData, error: bidError }] = await Promise.all([
        supabase
          .from('tenders')
          .select('*, projects(nirikshak_project_id, district, sector, project_authority)')
          .order('publication_date', { ascending: false }),
        supabase
          .from('tender_bids')
          .select('id, tender_id, bid_amount, status, technical_score, financial_score, contractor_organization_id, organizations(name)')
          .is('deleted_at', null),
      ]);
      if (error) throw error;
      if (bidError) throw bidError;
      if (data) {
        const bidsByTender = new Map<string, any[]>();
        (bidData || []).forEach((bid: any) => {
          const rows = bidsByTender.get(bid.tender_id) || [];
          rows.push(bid);
          bidsByTender.set(bid.tender_id, rows);
        });

        return data.map((t: any) => {
          const bids = bidsByTender.get(t.id) || [];
          const bidOpeningAllowed =
            ['CLOSED', 'UNDER_EVALUATION', 'AWARDED'].includes(t.status) ||
            Boolean(t.bid_due_date && new Date(`${t.bid_due_date}T23:59:59`).getTime() < Date.now());
          return {
            id: t.tender_number || t.id,
            title: t.title || 'Unknown',
            department: t.projects?.project_authority || 'Government Authority',
            district: t.projects?.district || 'Not specified',
            status: (t.status || 'PUBLISHED').toLowerCase() as any,
            estimatedCostCr: t.estimated_value_inr_crore == null ? 0 : Number(t.estimated_value_inr_crore),
            publishedOn: t.publication_date || '',
            submissionDeadline: t.bid_due_date || '',
            openingDate: bidOpeningAllowed ? t.bid_opening_date || t.bid_due_date || '' : '',
            bidsReceived: bids.filter((bid) => bid.status !== 'DRAFT' && bid.status !== 'WITHDRAWN').length,
            lots: bidOpeningAllowed
              ? bids
                  .filter((bid) => bid.status !== 'DRAFT' && bid.status !== 'WITHDRAWN')
                  .map((bid) => ({
                    bidder: bid.organizations?.name || 'Registered contractor',
                    quotedAmountCr: Number(bid.bid_amount) || 0,
                    technicalScore: Number(bid.technical_score) || 0,
                    financialScore: Number(bid.financial_score) || 0,
                    bidValidityDays: 120,
                    bidStatus:
                      bid.status === 'SELECTED'
                        ? 'accepted'
                        : bid.status === 'REJECTED' || bid.status === 'DISQUALIFIED'
                        ? 'rejected'
                        : 'under_review',
                  }))
              : undefined,
            category: t.projects?.sector || 'Infrastructure',
            mode: 'e-Tender' as const,
            projectId: t.projects?.nirikshak_project_id || t.project_id,
          };
        });
      }
    } catch (err) {
      console.error('[procurementService] Error fetching tenders:', err);
      throw err;
    }
    return [];
  },

  async list(q?: ListQuery): Promise<Paginated<Tender>> {
    const all = await this.all();
    return paginate(matchesQuery(all, q), q);
  },

  async create(tender: {
    projectId: string;
    title: string;
    estimatedCostCr: number;
    mode?: string;
    scopeSummary?: string;
  }): Promise<Tender> {
    if (!env.API_BASE_URL) {
      throw new Error('Tender publication service is temporarily unavailable.');
    }

    const data = await apiClient.post<any>('/api/tenders', {
      project_id: tender.projectId,
      title: tender.title,
      estimated_value_inr_crore: tender.estimatedCostCr,
      mode: tender.mode || 'e-Tender',
      description: tender.scopeSummary || undefined,
    });
    return {
      id: data.tender_number || data.id,
      title: data.title,
      department: 'Public Works Department',
      district: 'Pune',
      status: 'published',
      estimatedCostCr: Number(data.estimated_value_inr_crore) || tender.estimatedCostCr,
      publishedOn: data.publication_date || new Date().toISOString().slice(0, 10),
      submissionDeadline: data.bid_due_date || '',
      openingDate: '',
      bidsReceived: 0,
      category: 'Infrastructure',
      mode: (tender.mode as any) || 'e-Tender',
      projectId: data.nirikshak_project_id || tender.projectId,
    };
  },
};
