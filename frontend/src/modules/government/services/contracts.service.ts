import { apiClient } from '@/lib/api/apiClient';

export interface ProjectContract {
  id: string;
  project_id: string;
  contract_number: string;
  contract_title: string;
  contractor_organization_id: string;
  award_amount_inr_crore: number;
  contract_start_date: string;
  scheduled_end_date: string;
  actual_end_date: string | null;
  status: string;
  contract_type: string;
  created_at: string;
  updated_at: string;
  contractor_name?: string;
  organizations?: { id?: string; name?: string; registration_number?: string; created_at?: string };
}

export const contractsService = {
  async award(tenderId: string, bidId: string, notes?: string): Promise<any> {
    return apiClient.post('/api/contracts/award', { tender_id: tenderId, bid_id: bidId, award_notes: notes });
  },
  async getProjectContracts(projectId: string): Promise<ProjectContract[]> {
    return apiClient.get<ProjectContract[]>(`/api/contracts/project/${projectId}`);
  },

  async getContractById(contractId: string): Promise<ProjectContract> {
    return apiClient.get<ProjectContract>(`/api/contracts/${contractId}`);
  },
};
