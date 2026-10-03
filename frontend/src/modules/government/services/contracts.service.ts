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
}

export const contractsService = {
  async getProjectContracts(projectId: string): Promise<ProjectContract[]> {
    return apiClient.get<ProjectContract[]>(`/api/contracts/project/${projectId}`);
  },

  async getContractById(contractId: string): Promise<ProjectContract> {
    return apiClient.get<ProjectContract>(`/api/contracts/${contractId}`);
  },
};
