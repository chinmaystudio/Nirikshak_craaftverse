import { supabaseAdmin, createAuthenticatedClient } from '../../core/database/supabase.js';
import {
  SubmitPaymentClaimInput,
  ReviewPaymentClaimInput,
  RecordPaymentInput,
  FinancialUpdateInput,
} from './finance.types.js';
import { UserContext } from '../../core/auth/userContext.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../../core/http/errors.js';

export class FinanceService {
  async submitClaim(
    input: SubmitPaymentClaimInput,
    userContext: UserContext,
    token: string
  ): Promise<any> {
    const isContractor = [
      'contractor_admin',
      'contractor_manager',
      'contractor_engineer',
      'contractor_site_engineer',
    ].includes(userContext.role);

    if (!isContractor) {
      throw new AuthorizationError('Only assigned contractors can submit payment claims.');
    }

    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient.rpc('submit_payment_claim', {
      p_project_id: input.project_id,
      p_claimed_amount: input.claimed_amount,
      p_milestone_id: input.milestone_id || undefined,
      p_claim_type: input.claim_type || 'PROGRESS_INTERIM',
      p_description: input.description || undefined,
    });

    if (error) {
      throw new ValidationError(`Payment claim submission failed: ${error.message}`);
    }

    return data;
  }

  async reviewClaim(
    input: ReviewPaymentClaimInput,
    userContext: UserContext,
    token: string
  ): Promise<any> {
    const isGovernment = [
      'government_admin',
      'chief_engineer',
      'project_officer',
      'government_engineer',
    ].includes(userContext.role);

    if (!isGovernment) {
      throw new AuthorizationError('Only authorized Government officers can review payment claims.');
    }

    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient.rpc('review_payment_claim', {
      p_claim_id: input.claim_id,
      p_decision: input.decision,
      p_approved_amount: input.approved_amount || undefined,
      p_verified_amount: input.verified_amount || undefined,
      p_review_notes: input.review_notes || undefined,
    });

    if (error) {
      throw new ValidationError(`Payment claim review failed: ${error.message}`);
    }

    return data;
  }

  async recordPayment(
    input: RecordPaymentInput,
    userContext: UserContext,
    token: string
  ): Promise<any> {
    const isGovernment = [
      'government_admin',
      'chief_engineer',
      'project_officer',
    ].includes(userContext.role);

    if (!isGovernment) {
      throw new AuthorizationError('Only authorized Government finance officers can record payments.');
    }

    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient.rpc('record_payment', {
      p_claim_id: input.claim_id,
      p_amount_paid: input.amount_paid,
      p_payment_reference: input.payment_reference,
      p_payment_method: input.payment_method || 'BANK_TRANSFER_RTGS',
    });

    if (error) {
      throw new ValidationError(`Payment recording failed: ${error.message}`);
    }

    return data;
  }

  async recordFinancialUpdate(
    input: FinancialUpdateInput,
    userContext: UserContext,
    token: string
  ): Promise<any> {
    const isGovernment = [
      'government_admin',
      'chief_engineer',
      'project_officer',
      'government_engineer',
    ].includes(userContext.role);

    if (!isGovernment) {
      throw new AuthorizationError('Only authorized Government officers can record financial updates.');
    }

    let costVariance = input.cost_variance_percent;
    if (costVariance === undefined && input.planned_expenditure_inr_crore > 0) {
      costVariance =
        ((input.actual_expenditure_inr_crore - input.planned_expenditure_inr_crore) /
          input.planned_expenditure_inr_crore) *
        100;
    }

    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('financial_updates')
      .insert({
        project_id: input.project_id,
        observation_date: input.observation_date,
        planned_expenditure_inr_crore: input.planned_expenditure_inr_crore,
        actual_expenditure_inr_crore: input.actual_expenditure_inr_crore,
        cost_variance_percent: costVariance,
        notes: input.notes || null,
        verification_status: 'VERIFIED',
      })
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Failed to record financial update: ${error?.message}`);
    }

    return data;
  }

  async getFinanceSummary(
    projectId: string,
    userContext: UserContext,
    token: string
  ): Promise<any> {
    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('project_finance_summary_view')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    if (error) {
      throw new ValidationError(`Failed to fetch finance summary: ${error.message}`);
    }

    return data;
  }

  async listClaims(
    projectId: string,
    userContext: UserContext,
    token: string
  ): Promise<any[]> {
    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('payment_claims')
      .select('*')
      .eq('project_id', projectId)
      .order('submitted_at', { ascending: false });

    if (error) {
      throw new ValidationError(`Failed to fetch payment claims: ${error.message}`);
    }

    return data || [];
  }

  async listPayments(
    projectId: string,
    userContext: UserContext,
    token: string
  ): Promise<any[]> {
    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('payments')
      .select('*')
      .eq('project_id', projectId)
      .order('payment_date', { ascending: false });

    if (error) {
      throw new ValidationError(`Failed to fetch payments: ${error.message}`);
    }

    return data || [];
  }
}

export const financeService = new FinanceService();
