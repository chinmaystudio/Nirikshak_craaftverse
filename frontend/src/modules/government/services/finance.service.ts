import { supabase } from '@/core/supabase/client';
import { apiClient } from '@/lib/api/apiClient';
import type { FundFlow, BillItem } from '@/modules/government/types';

export interface PaymentClaim {
  id: string;
  project_id: string;
  contract_id: string;
  claim_number: string;
  contractor_organization_id: string;
  claim_amount_inr_crore: number;
  approved_amount_inr_crore: number | null;
  status: string;
  submission_date: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  contractor_name?: string;
  payments?: {
    id: string;
    amount_paid: number;
    payment_date: string;
    payment_reference: string;
    payment_mode: string;
  }[];
}

export interface ProjectFinanceSummary {
  project_id: string;
  total_budget_inr_crore: number;
  total_claims_count: number;
  total_claimed_inr_crore: number;
  total_approved_inr_crore: number;
  total_paid_inr_crore: number;
  latest_financial_update?: {
    planned_expenditure_inr_crore: number | null;
    actual_expenditure_inr_crore: number | null;
    cost_variance_percent: number | null;
    as_of_date: string;
  } | null;
}

export const financeService = {
  async fundFlows(): Promise<FundFlow[]> {
    try {
      const { data, error } = await supabase
        .from('financial_updates')
        .select('*, projects(project_name, nirikshak_project_id)')
        .order('observation_date', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((f: any, idx: number) => {
          const budget = Number(f.budget_allocation_inr_crore) || Number(f.reported_cost_inr_crore) || 100;
          const spent = Number(f.amount_spent_inr_crore) || budget * 0.4;
          return {
            id: `FF-MH-2026-${(idx + 1).toString().padStart(4, '0')}`,
            fy: '2025-26',
            demandNo: 42,
            head: f.projects?.project_name
              ? `${f.projects.project_name} Execution Head`
              : '5054-Capital Outlay on Roads & Bridges',
            budgetEstimateCr: budget,
            revisedEstimateCr: Number(f.revised_cost_inr_crore) || budget,
            allocationCr: budget,
            releasedCr: budget * 0.8,
            utilizedCr: spent,
            status: budget > 0 ? 'released' : 'allocated',
          };
        });
      }
    } catch (err) {
      console.warn('[financeService] Error fetching financial updates:', err);
    }
    return [];
  },

  async bills(): Promise<BillItem[]> {
    try {
      const data = await apiClient.get<any[]>('/api/finance/claims');

      if (data && data.length > 0) {
        return data.map((c: any) => ({
          id: c.id,
          projectId: c.project_id,
          contractor: c.organizations?.name || 'Assigned Contractor',
          billNo: c.claim_number,
          type: 'RA Bill',
          amountCr: Number(c.claimed_amount) || 0,
          submittedOn: c.submitted_at || c.created_at?.slice(0, 10),
          mbEntry: `e-MB-${c.claim_number}`,
          status: c.status === 'PAID' ? 'paid' : c.status === 'APPROVED' ? 'approved' : c.status === 'REJECTED' ? 'returned' : 'submitted',
          approvedBy: c.approved_by || c.reviewed_by || undefined,
        }));
      }
    } catch (err) {
      console.warn('[financeService] Error fetching bills from payment_claims:', err);
    }
    return [];
  },

  async createAllocation(projectId: string, amountCr: number, head: string, notes?: string): Promise<void> {
    try {
      const { error } = await supabase.from('financial_updates').insert({
        project_id: projectId,
        observation_date: new Date().toISOString().slice(0, 10),
        budget_allocation_inr_crore: amountCr,
        notes: `${head}${notes ? ` — ${notes}` : ''}`,
      });
      if (error) {
        console.warn('[financeService] Failed to insert financial allocation:', error.message);
      }
    } catch (err) {
      console.warn('[financeService] Financial allocation error:', err);
    }
  },

  /* ---------- Database V2 Runtime Finance & Payment Services ---------- */

  async getPaymentClaims(projectId: string): Promise<PaymentClaim[]> {
    return apiClient.get<PaymentClaim[]>(`/api/finance/project/${projectId}/claims`);
  },

  async reviewPaymentClaim(
    claimId: string,
    payload: { approved_amount_inr_crore: number; status: 'APPROVED' | 'REJECTED'; remarks?: string }
  ): Promise<PaymentClaim> {
    return apiClient.post<PaymentClaim>(`/api/finance/claims/${claimId}/review`, {
      decision: payload.status,
      approved_amount: payload.approved_amount_inr_crore,
      review_notes: payload.remarks,
    });
  },

  async recordPayment(
    claimId: string,
    payload: { amount_paid_inr_crore: number; payment_reference: string; payment_mode?: string }
  ): Promise<any> {
    return apiClient.post(`/api/finance/claims/${claimId}/pay`, {
      amount_paid: payload.amount_paid_inr_crore,
      payment_reference: payload.payment_reference,
      payment_method: payload.payment_mode || 'PFMS_RTGS',
    });
  },

  async getFinanceSummary(projectId: string): Promise<ProjectFinanceSummary> {
    return apiClient.get<ProjectFinanceSummary>(`/api/finance/project/${projectId}/summary`);
  },
};
