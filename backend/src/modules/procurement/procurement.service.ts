import { supabaseAdmin, createAuthenticatedClient } from '../../core/database/supabase.js';
import { CreateTenderInput } from './procurement.validation.js';
import { PublishedTenderResult } from './procurement.types.js';
import { UserContext } from '../../core/auth/userContext.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../../core/http/errors.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ProcurementService {
  async saveTenderBid(input: { tender_id: string; bid_amount: number; technical_proposal: string; status: 'DRAFT' | 'SUBMITTED' }, token: string): Promise<any> {
    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient.rpc('save_tender_bid', {
      p_tender_id: input.tender_id,
      p_bid_amount: input.bid_amount,
      p_technical_proposal: input.technical_proposal,
      p_status: input.status,
    });
    if (error || !data) {
      // A retry after a successful submission is safe and idempotent. The RPC
      // intentionally refuses to mutate submitted bids; return the existing
      // submitted record so the UI can show its confirmation instead.
      if (error?.message?.toLowerCase().includes('only draft bids can be changed')) {
        const existing = await scopedClient
          .from('tender_bids')
          .select('*')
          .eq('tender_id', input.tender_id)
          .eq('status', 'SUBMITTED')
          .maybeSingle();
        if (existing.data) return existing.data;
      }
      throw new ValidationError(`Bid submission failed: ${error?.message || 'No bid was returned.'}`);
    }
    return Array.isArray(data) ? data[0] : data;
  }

  async publishTender(
    input: CreateTenderInput,
    userContext: UserContext,
    token: string
  ): Promise<PublishedTenderResult> {
    if (!userContext.organizationId) {
      throw new AuthorizationError('An active Government organization is required to publish tenders.');
    }

    let projectQuery = supabaseAdmin
      .from('projects')
      .select('id, nirikshak_project_id, government_organization_id')
      .is('deleted_at', null);

    projectQuery = UUID_PATTERN.test(input.project_id)
      ? projectQuery.eq('id', input.project_id)
      : projectQuery.eq('nirikshak_project_id', input.project_id);

    const { data: project, error: projectError } = await projectQuery.maybeSingle();
    if (projectError || !project) {
      throw new NotFoundError('The selected project could not be found.');
    }

    if (project.government_organization_id !== userContext.organizationId) {
      throw new AuthorizationError('This project belongs to a different Government authority.');
    }

    const tenderNumber = `TND-MH-${Date.now().toString().slice(-8)}`;
    const publicationDate = new Date();
    const bidDueDate = new Date(publicationDate.getTime() + 30 * 86_400_000);

    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('tenders')
      .insert({
        project_id: project.id,
        tender_number: tenderNumber,
        title: input.title,
        description: input.description || null,
        issuing_organization_id: userContext.organizationId,
        estimated_value_inr_crore: input.estimated_value_inr_crore,
        status: 'PUBLISHED',
        is_public: true,
        created_by: userContext.userId,
        publication_date: publicationDate.toISOString().slice(0, 10),
        bid_due_date: bidDueDate.toISOString().slice(0, 10),
      })
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Tender publication failed: ${error?.message}`);
    }

    await supabaseAdmin.from('audit_logs').insert({
      actor_id: userContext.userId,
      actor_organization_id: userContext.organizationId,
      action: 'TENDER_CREATE',
      entity_type: 'tenders',
      entity_id: data.id,
      new_value: {
        tender_number: data.tender_number,
        project_id: project.id,
        estimated_value_inr_crore: data.estimated_value_inr_crore,
      },
    });

    return {
      id: data.id,
      tender_number: data.tender_number,
      project_id: data.project_id,
      title: data.title,
      estimated_value_inr_crore: Number(data.estimated_value_inr_crore),
      status: data.status,
      nirikshak_project_id: project.nirikshak_project_id,
      mode: input.mode,
    };
  }
}

export const procurementService = new ProcurementService();
