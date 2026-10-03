import { CreateTenderInput, SubmitBidInput, AwardContractInput } from './procurement.validation.js';

export interface PublishedTenderResult {
  id: string;
  tender_number: string;
  project_id: string;
  title: string;
  estimated_value_inr_crore: number;
  status: string;
  nirikshak_project_id?: string;
  mode?: string;
}
