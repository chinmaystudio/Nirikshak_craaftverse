import { supabaseAdmin, createAuthenticatedClient } from '../../core/database/supabase.js';
import {
  CreateLitigationInput,
  AddLitigationEventInput,
  ProposeSettlementInput,
  ReviewSettlementInput,
} from './legal.types.js';
import { UserContext } from '../../core/auth/userContext.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../../core/http/errors.js';

export class LegalService {
  async createLitigation(
    input: CreateLitigationInput,
    userContext: UserContext,
    token: string
  ): Promise<any> {
    const isGovernment = [
      'government_admin',
      'chief_engineer',
      'project_officer',
    ].includes(userContext.role);

    if (!isGovernment) {
      throw new AuthorizationError('Only authorized Government officers can record litigation entries.');
    }

    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('litigations')
      .insert({
        project_id: input.project_id,
        case_number: input.case_number,
        court_forum: input.court_forum,
        case_type: input.case_type,
        filing_date: input.filing_date,
        dispute_amount_inr: input.dispute_amount_inr || null,
        title: input.title,
        description: input.description,
        internal_notes: input.internal_notes || null,
        status: 'FILED',
      })
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Failed to create litigation: ${error?.message}`);
    }

    return data;
  }

  async listProjectLitigations(
    projectId: string,
    userContext: UserContext,
    token: string
  ): Promise<any[]> {
    const isGovernment = [
      'government_admin',
      'chief_engineer',
      'project_officer',
      'government_engineer',
      'auditor',
    ].includes(userContext.role);

    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('litigations')
      .select('*')
      .eq('project_id', projectId)
      .order('filing_date', { ascending: false });

    if (error) {
      throw new ValidationError(`Failed to list litigations: ${error.message}`);
    }

    // Sanitize internal_notes for non-government callers
    if (!isGovernment) {
      return (data || []).map((l) => ({
        ...l,
        internal_notes: null,
      }));
    }

    return data || [];
  }

  async addLitigationEvent(
    litigationId: string,
    input: AddLitigationEventInput,
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
      throw new AuthorizationError('Only authorized Government officers can update litigation events.');
    }

    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('litigation_events')
      .insert({
        litigation_id: litigationId,
        event_type: input.event_type,
        event_date: input.event_date,
        summary: input.summary,
        next_date: input.next_date || null,
      })
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Failed to add litigation event: ${error?.message}`);
    }

    return data;
  }

  async proposeSettlement(
    input: ProposeSettlementInput,
    userContext: UserContext,
    token: string
  ): Promise<any> {
    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('settlements')
      .insert({
        litigation_id: input.litigation_id,
        project_id: input.project_id,
        proposed_by_organization_id: userContext.organizationId || null,
        settlement_amount_inr: input.settlement_amount_inr,
        terms: input.terms,
        status: 'PROPOSED',
      })
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Failed to propose settlement: ${error?.message}`);
    }

    return data;
  }

  async reviewSettlement(
    settlementId: string,
    input: ReviewSettlementInput,
    userContext: UserContext,
    token: string
  ): Promise<any> {
    const isGovernment = [
      'government_admin',
      'chief_engineer',
      'project_officer',
    ].includes(userContext.role);

    if (!isGovernment) {
      throw new AuthorizationError('Only authorized Government officers can approve or reject legal settlements.');
    }

    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('settlements')
      .update({
        status: input.decision,
        approved_by_government_user_id: input.decision === 'APPROVED' ? userContext.userId : null,
      })
      .eq('id', settlementId)
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Failed to review settlement: ${error?.message}`);
    }

    return data;
  }
}

export const legalService = new LegalService();
