export interface SubmitPaymentClaimInput {
  project_id: string;
  claimed_amount: number;
  milestone_id?: string;
  claim_type?: string;
  description?: string;
}

export interface ReviewPaymentClaimInput {
  claim_id: string;
  decision: 'APPROVED' | 'REJECTED';
  approved_amount?: number;
  verified_amount?: number;
  review_notes?: string;
}

export interface RecordPaymentInput {
  claim_id: string;
  amount_paid: number;
  payment_reference: string;
  payment_method?: string;
}

export interface FinancialUpdateInput {
  project_id: string;
  observation_date: string;
  planned_expenditure_inr_crore: number;
  actual_expenditure_inr_crore: number;
  cost_variance_percent?: number;
  notes?: string;
}
