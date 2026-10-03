import { supabaseAdmin, createAuthenticatedClient } from '../../core/database/supabase.js';
import { getLLMProvider } from './ai.provider.js';
import { AiAuditResult } from './ai.types.js';
import { UserContext } from '../../core/auth/userContext.js';
import { AuthorizationError, NotFoundError } from '../../core/http/errors.js';

export class AiService {
  async analyzeProject(
    projectId: string,
    userContext: UserContext,
    token: string
  ): Promise<AiAuditResult> {
    const isGovernment = [
      'government_admin',
      'chief_engineer',
      'project_officer',
      'government_engineer',
      'auditor',
    ].includes(userContext.role);

    const isContractor = [
      'contractor_admin',
      'contractor_manager',
      'contractor_engineer',
      'contractor_site_engineer',
    ].includes(userContext.role);

    if (!isGovernment && !isContractor) {
      throw new AuthorizationError('AI project analysis is available only to authorized project organizations.');
    }

    const scopedClient = await createAuthenticatedClient(token);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);

    let projectQuery = scopedClient
      .from('projects')
      .select('id, nirikshak_project_id, project_name, description, sector, subsector, project_authority, state, city, total_cost_inr_crore, planned_start_date, original_completion_date, normalized_status, physical_progress_percent, current_status_verified, government_organization_id, project_milestones(id, milestone_name, verified_progress, status), delay_events(*)');

    projectQuery = isUuid ? projectQuery.eq('id', projectId) : projectQuery.eq('nirikshak_project_id', projectId);

    const { data: project, error: pErr } = await projectQuery.single();
    if (pErr || !project) {
      throw new NotFoundError('Project not found or access denied by authorization policy');
    }

    // Verify government org tenancy
    if (isGovernment && userContext.organizationId && project.government_organization_id && project.government_organization_id !== userContext.organizationId) {
      throw new AuthorizationError('Project belongs to a different government authority');
    }

    // Verify contractor org assignment
    if (isContractor) {
      if (!userContext.organizationId) {
        throw new AuthorizationError('An active contractor organization is required.');
      }
      const [{ data: contracts }, { data: assignments }] = await Promise.all([
        supabaseAdmin.from('contracts').select('id').eq('project_id', project.id).eq('contractor_organization_id', userContext.organizationId).limit(1),
        supabaseAdmin.from('project_organizations').select('id').eq('project_id', project.id).eq('organization_id', userContext.organizationId).limit(1),
      ]);
      if ((!contracts || contracts.length === 0) && (!assignments || assignments.length === 0)) {
        throw new AuthorizationError('Your contractor organization is not assigned to this project.');
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
      actor_id: userContext.userId,
      actor_organization_id: userContext.organizationId,
      action: 'AI_AUDIT_RUN',
      entity_type: 'projects',
      entity_id: project.id,
      new_value: {
        risk_level: analysis.risk_level,
        risk_score: analysis.risk_score,
        insight_id: insight?.id,
      },
    });

    return {
      provider: provider.name,
      analysis,
      saved_insight: insight,
    };
  }
}

export const aiService = new AiService();
