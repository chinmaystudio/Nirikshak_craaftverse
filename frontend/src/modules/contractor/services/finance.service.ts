import { apiClient } from '@/lib/api/apiClient';

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
}

export interface SubmitPaymentClaimPayload {
  claim_amount_inr_crore: number;
  remarks?: string;
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

export class ContractorFinanceService {
  static async getPaymentClaims(projectId: string): Promise<PaymentClaim[]> {
    return apiClient.get<PaymentClaim[]>(`/api/finance/project/${projectId}/claims`);
  }

  static async submitPaymentClaim(projectId: string, payload: SubmitPaymentClaimPayload): Promise<PaymentClaim> {
    return apiClient.post<PaymentClaim>(`/api/finance/project/${projectId}/claims`, payload);
  }

  static async getFinanceSummary(projectId: string): Promise<ProjectFinanceSummary> {
    return apiClient.get<ProjectFinanceSummary>(`/api/finance/project/${projectId}/summary`);
  }
}
