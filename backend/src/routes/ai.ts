import { Router, Response } from 'express';
import { getLLMProvider } from '../ai/provider.js';
import { supabaseAdmin } from '../services/supabase.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { rateLimit } from '../middleware/security.js';

export const aiRouter = Router();

// POST /api/ai/analyze/:projectId - Trigger AI infrastructure project risk audit
// Rules 57-64: Backend only, authenticated, rate limited, PII sanitized, advisory only.
aiRouter.post(
  '/analyze/:projectId',
  rateLimit({ windowMs: 60 * 1000, max: 10 }),
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { projectId } = req.params;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);

      // Verify caller is government officer or assigned contractor
      const isGovernment = [
        'government_admin',
        'chief_engineer',
        'project_officer',
        'government_engineer',
        'auditor',
      ].includes(req.role || '');
      const isContractor = [
        'contractor_admin',
        'contractor_manager',
        'contractor_engineer',
        'contractor_site_engineer',
      ].includes(req.role || '');

      if (!isGovernment && !isContractor) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'AI project analysis is available only to authorized project organizations.' },
        });
      }

      let projectQuery = req.supabase!
        .from('projects')
        .select('id, nirikshak_project_id, project_name, description, sector, subsector, project_authority, state, city, total_cost_inr_crore, planned_start_date, original_completion_date, normalized_status, physical_progress_percent, current_status_verified, government_organization_id, project_milestones(id, milestone_name, verified_progress, status), delay_events(*)');

      if (isUuid) {
        projectQuery = projectQuery.eq('id', projectId);
      } else {
        projectQuery = projectQuery.eq('nirikshak_project_id', projectId);
      }

      const { data: project, error: pErr } = await projectQuery.single();

      if (pErr || !project) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Project not found or access denied by authorization policy' },
        });
      }

      // Check government org isolation (Rule 8)
      if (isGovernment && req.organizationId && project.government_organization_id && project.government_organization_id !== req.organizationId) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Project belongs to a different government authority' },
        });
      }

      if (isContractor) {
        if (!req.organizationId) {
          return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'An active contractor organization is required.' } });
        }
        const [{ data: contracts }, { data: assignments }] = await Promise.all([
          supabaseAdmin.from('contracts').select('id').eq('project_id', project.id).eq('contractor_organization_id', req.organizationId).limit(1),
          supabaseAdmin.from('project_organizations').select('id').eq('project_id', project.id).eq('organization_id', req.organizationId).limit(1),
        ]);
        if ((!contracts || contracts.length === 0) && (!assignments || assignments.length === 0)) {
          return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Your contractor organization is not assigned to this project.' } });
        }
      }

      const provider = getLLMProvider();
      const prompt = `Conduct an exhaustive multidimensional infrastructure audit for ${project.project_name}. Identify schedule slippage, financial variances, and risk indicators.`;

      const analysis = await provider.analyzeProject(prompt, project as any);

      // Save insight to database using service role for persistence
      const { data: insight } = await supabaseAdmin
        .from('ai_insights')
        .insert({
          project_id: project.id,
          insight_type: 'schedule_risk',
          title: `${analysis.risk_level} Risk: ${project.project_name}`,
          summary: analysis.summary,
          severity: analysis.risk_level,
          confidence: 0.92,
          evidence: analysis.evidence,
          recommended_actions: analysis.recommended_actions,
          status: 'ACTIVE',
        })
        .select()
        .single();

      // Record audit log
      await supabaseAdmin.from('audit_logs').insert({
        actor_id: req.user!.id,
        action: 'AI_AUDIT_RUN',
        entity_type: 'projects',
        entity_id: project.id,
        new_value: {
          risk_level: analysis.risk_level,
          risk_score: analysis.risk_score,
          insight_id: insight?.id,
        },
      });

      res.json({
        success: true,
        data: {
          provider: provider.name,
          analysis,
          saved_insight: insight,
        },
      });
    } catch (err: any) {
      const isUnavailable = err.message?.includes('AI_ANALYSIS_UNAVAILABLE') || err.message?.includes('OPENROUTER_API_KEY');
      const statusCode = isUnavailable ? 503 : 500;
      res.status(statusCode).json({
        success: false,
        error: {
          code: isUnavailable ? 'AI_UNAVAILABLE' : 'AI_ERROR',
          message: err.message || 'AI risk analysis processing failed',
        },
      });
    }
  }
);
