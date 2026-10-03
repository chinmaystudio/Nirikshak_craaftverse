export interface CreateLitigationInput {
  project_id: string;
  case_number: string;
  court_forum: string;
  case_type: string;
  filing_date: string;
  dispute_amount_inr?: number;
  title: string;
  description: string;
  internal_notes?: string;
}

export interface AddLitigationEventInput {
  event_type: string;
  event_date: string;
  summary: string;
  next_date?: string;
}

export interface ProposeSettlementInput {
  litigation_id: string;
  project_id: string;
  settlement_amount_inr: number;
  terms: string;
}

export interface ReviewSettlementInput {
  decision: 'APPROVED' | 'REJECTED';
  review_notes?: string;
}
