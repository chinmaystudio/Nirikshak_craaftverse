import { Router, Response } from 'express';
import { supabaseAdmin } from '../services/supabase.js';
import { requireAuth, requireGovernment, AuthenticatedRequest } from '../middleware/auth.js';
import { CreateTenderSchema } from '../validation/schemas.js';

export const tendersRouter = Router();

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/tenders - Publish a tender for a project owned by the caller's Government organization.
tendersRouter.post('/', requireAuth, requireGovernment, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = CreateTenderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_TENDER', message: parsed.error.issues[0]?.message || 'Please check the tender details.' },
    });
  }

  if (!req.organizationId) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'An active Government organization is required.' },
    });
  }

  try {
    const input = parsed.data;
    let projectQuery = supabaseAdmin
      .from('projects')
      .select('id, nirikshak_project_id, government_organization_id')
      .is('deleted_at', null);

    projectQuery = UUID_PATTERN.test(input.project_id)
      ? projectQuery.eq('id', input.project_id)
      : projectQuery.eq('nirikshak_project_id', input.project_id);

    const { data: project, error: projectError } = await projectQuery.maybeSingle();
    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'The selected project could not be found.' },
      });
    }

    if (project.government_organization_id !== req.organizationId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'This project belongs to a different Government authority.' },
      });
    }

    const tenderNumber = `TND-MH-${Date.now().toString().slice(-8)}`;
    const publicationDate = new Date();
    const bidDueDate = new Date(publicationDate.getTime() + 30 * 86_400_000);

    const { data, error } = await req.supabase!
      .from('tenders')
      .insert({
        project_id: project.id,
        tender_number: tenderNumber,
        title: input.title,
        description: input.description || null,
        issuing_organization_id: req.organizationId,
        estimated_value_inr_crore: input.estimated_value_inr_crore,
        status: 'PUBLISHED',
        is_public: true,
        created_by: req.user!.id,
        publication_date: publicationDate.toISOString().slice(0, 10),
        bid_due_date: bidDueDate.toISOString().slice(0, 10),
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Tender creation failed', { code: error?.code, message: error?.message });
      return res.status(400).json({
        success: false,
        error: { code: 'TENDER_CREATE_FAILED', message: 'The tender could not be published.' },
      });
    }

    await supabaseAdmin.from('audit_logs').insert({
      actor_id: req.user!.id,
      actor_organization_id: req.organizationId,
      action: 'TENDER_CREATE',
      entity_type: 'tenders',
      entity_id: data.id,
      new_value: {
        tender_number: data.tender_number,
        project_id: project.id,
        estimated_value_inr_crore: data.estimated_value_inr_crore,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        ...data,
        nirikshak_project_id: project.nirikshak_project_id,
        mode: input.mode,
      },
    });
  } catch (error) {
    console.error('Unexpected tender creation error', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'The tender could not be published.' },
    });
  }
});
