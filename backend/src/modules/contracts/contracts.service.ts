import { supabaseAdmin, createAuthenticatedClient } from '../../core/database/supabase.js';
import { AwardContractInput, ContractDetail } from './contracts.types.js';
import { UserContext } from '../../core/auth/userContext.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../../core/http/errors.js';

export class ContractsService {
  async awardContract(
    input: AwardContractInput,
    userContext: UserContext,
    token: string
  ): Promise<any> {
    const isGovernment = [
      'government_admin',
      'chief_engineer',
      'project_officer',
    ].includes(userContext.role);

    if (!isGovernment) {
      throw new AuthorizationError('Only authorized Government officers can award contracts.');
    }

    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient.rpc('award_contract', {
      p_tender_id: input.tender_id,
      p_bid_id: input.bid_id,
      p_award_notes: input.award_notes || undefined,
    });

    if (error) {
      throw new ValidationError(`Contract award failed: ${error.message}`);
    }

    return data;
  }

  async getContractById(
    contractId: string,
    userContext: UserContext,
    token: string
  ): Promise<ContractDetail> {
    const scopedClient = await createAuthenticatedClient(token);
    const { data: contract, error } = await scopedClient
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (error || !contract) {
      throw new NotFoundError('Contract not found or access denied.');
    }

    // Role-specific check
    const isGovernment = [
      'government_admin',
      'chief_engineer',
      'project_officer',
      'government_engineer',
      'auditor',
    ].includes(userContext.role);

    if (!isGovernment) {
      if (contract.contractor_organization_id !== userContext.organizationId) {
        throw new AuthorizationError('You can only view contracts awarded to your organization.');
      }
    }

    return contract as ContractDetail;
  }

  async listProjectContracts(
    projectId: string,
    userContext: UserContext,
    token: string
  ): Promise<ContractDetail[]> {
    const scopedClient = await createAuthenticatedClient(token);
    let query = scopedClient
      .from('contracts')
      .select('*')
      .eq('project_id', projectId);

    const isGovernment = [
      'government_admin',
      'chief_engineer',
      'project_officer',
      'government_engineer',
      'auditor',
    ].includes(userContext.role);

    if (!isGovernment) {
      if (userContext.organizationId) {
        query = query.eq('contractor_organization_id', userContext.organizationId);
      } else {
        throw new AuthorizationError('Organization context required to view contracts.');
      }
    }

    const { data, error } = await query;
    if (error) {
      throw new ValidationError(`Failed to fetch contracts: ${error.message}`);
    }

    return (data || []) as ContractDetail[];
  }
}

export const contractsService = new ContractsService();
