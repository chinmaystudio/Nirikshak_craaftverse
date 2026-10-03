import { supabaseAdmin, createAuthenticatedClient } from '../../core/database/supabase.js';
import { SubmitResourceUsageInput, VerifyResourceUsageInput, ResourceUsageRecord } from './resources.types.js';
import { UserContext } from '../../core/auth/userContext.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../../core/http/errors.js';

export class ResourcesService {
  async submitUsage(
    input: SubmitResourceUsageInput,
    userContext: UserContext,
    token: string
  ): Promise<ResourceUsageRecord> {
    const isContractor = [
      'contractor_admin',
      'contractor_manager',
      'contractor_engineer',
      'contractor_site_engineer',
    ].includes(userContext.role);

    if (!isContractor) {
      throw new AuthorizationError('Only assigned contractors can submit resource usage reports.');
    }

    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('resource_usage_updates')
      .insert({
        project_id: input.project_id,
        allocation_id: input.allocation_id || null,
        reporting_date: input.reporting_date,
        quantity_used: input.quantity_used,
        quantity_available: input.quantity_available,
        shortage_ratio: input.shortage_ratio,
        verification_status: 'PENDING',
        notes: input.notes || null,
      })
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Failed to submit resource usage: ${error?.message}`);
    }

    return data as ResourceUsageRecord;
  }

  async verifyUsage(
    usageId: string,
    input: VerifyResourceUsageInput,
    userContext: UserContext,
    token: string
  ): Promise<ResourceUsageRecord> {
    const isGovernment = [
      'government_admin',
      'chief_engineer',
      'project_officer',
      'government_engineer',
    ].includes(userContext.role);

    if (!isGovernment) {
      throw new AuthorizationError('Only authorized Government officers can verify resource usage.');
    }

    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('resource_usage_updates')
      .update({
        verification_status: input.verification_status,
        verified_by: userContext.userId,
        verified_at: new Date().toISOString(),
        notes: input.notes || null,
      })
      .eq('id', usageId)
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Failed to verify resource usage: ${error?.message}`);
    }

    return data as ResourceUsageRecord;
  }

  async getLatestVerifiedShortage(
    projectId: string
  ): Promise<{ shortage_ratio: number | null; reporting_date?: string }> {
    const { data } = await supabaseAdmin
      .from('resource_usage_updates')
      .select('shortage_ratio, reporting_date')
      .eq('project_id', projectId)
      .eq('verification_status', 'VERIFIED')
      .order('reporting_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      shortage_ratio: data ? Number(data.shortage_ratio) : null,
      reporting_date: data?.reporting_date,
    };
  }

  async listProjectUsage(
    projectId: string,
    userContext: UserContext,
    token: string
  ): Promise<ResourceUsageRecord[]> {
    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('resource_usage_updates')
      .select('*')
      .eq('project_id', projectId)
      .order('reporting_date', { ascending: false });

    if (error) {
      throw new ValidationError(`Failed to list resource usage: ${error.message}`);
    }

    return (data || []) as ResourceUsageRecord[];
  }
}

export const resourcesService = new ResourcesService();
