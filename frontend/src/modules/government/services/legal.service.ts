import { supabase } from '@/core/supabase/client';
import { apiClient } from '@/lib/api/apiClient';
import type { LitigationCase } from '@/modules/government/types';

export interface LitigationRecord {
  id: string;
  project_id: string;
  case_number: string;
  court_or_tribunal: string;
  case_title: string;
  dispute_type: string;
  claim_amount_inr_crore: number | null;
  status: string;
  filed_date: string;
  next_hearing_date: string | null;
  internal_legal_notes?: string | null;
  events?: {
    id: string;
    event_type: string;
    event_date: string;
    summary: string;
  }[];
}

export interface SettlementProposal {
  id: string;
  project_id: string;
  litigation_id: string;
  proposed_by_organization_id: string;
  settlement_amount_inr_crore: number;
  terms_summary: string;
  status: 'PROPOSED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  review_notes?: string | null;
}

export const legalService = {
  async all(): Promise<LitigationCase[]> {
    try {
      const { data, error } = await supabase
        .from('litigations')
        .select('*, projects(project_name)')
        .order('filed_date', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((l: any) => ({
          id: l.id,
          title: l.case_title || 'Legal Dispute',
          court: l.court_or_tribunal || 'High Court',
          caseNo: l.case_number,
          status: l.status === 'CLOSED' ? 'closed' : l.status === 'RESOLVED' ? 'resolved' : 'open',
          filedOn: l.filed_date || '2025-01-01',
          nextHearing: l.next_hearing_date || undefined,
          projectId: l.project_id,
          claimAmountCr: Number(l.claim_amount_inr_crore) || 0,
          counsel: 'Government Pleader',
          summary: l.dispute_type || 'Contractual dispute',
        }));
      }
    } catch (err) {
      console.warn('[legalService] Error fetching litigations:', err);
    }
    return [];
  },

  async getLitigations(projectId: string): Promise<LitigationRecord[]> {
    return apiClient.get<LitigationRecord[]>(`/api/legal/project/${projectId}`);
  },

  async createLitigation(projectId: string, payload: Partial<LitigationRecord>): Promise<LitigationRecord> {
    return apiClient.post<LitigationRecord>(`/api/legal/project/${projectId}`, payload);
  },

  async recordEvent(
    litigationId: string,
    payload: { event_type: string; event_date: string; summary: string }
  ): Promise<any> {
    return apiClient.post(`/api/legal/${litigationId}/events`, payload);
  },

  async getSettlements(projectId: string): Promise<SettlementProposal[]> {
    return apiClient.get<SettlementProposal[]>(`/api/legal/project/${projectId}/settlements`);
  },

  async proposeSettlement(projectId: string, payload: Partial<SettlementProposal>): Promise<SettlementProposal> {
    return apiClient.post<SettlementProposal>(`/api/legal/project/${projectId}/settlements`, payload);
  },

  async reviewSettlement(
    settlementId: string,
    payload: { status: 'APPROVED' | 'REJECTED'; review_notes?: string }
  ): Promise<SettlementProposal> {
    return apiClient.post<SettlementProposal>(`/api/legal/settlements/${settlementId}/review`, payload);
  },
};
