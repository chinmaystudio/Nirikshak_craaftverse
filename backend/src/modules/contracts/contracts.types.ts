export interface AwardContractInput {
  tender_id: string;
  bid_id: string;
  award_notes?: string;
}

export interface ContractDetail {
  id: string;
  project_id: string;
  tender_id: string;
  contractor_organization_id: string;
  contract_number: string;
  title: string;
  description: string | null;
  contract_value: number;
  scheduled_start_date: string;
  scheduled_end_date: string;
  status: string;
  created_at: string;
}
