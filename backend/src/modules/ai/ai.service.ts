import { supabaseAdmin, createAuthenticatedClient } from '../../core/database/supabase.js';
import { aiClient, AiClientAnalysisResult } from './ai.client.js';
import { buildProjectSnapshot } from './ai.context.js';
import { UserContext } from '../../core/auth/userContext.js';
import { AuthorizationError, NotFoundError } from '../../core/http/errors.js';

export interface AiProjectAnalysisResponse {
  analysis_id: string;
  project_id: string;
  model_version: string;
  historical_analysis: AiClientAnalysisResult['historical_analysis'];
  operational_drift: AiClientAnalysisResult['operational_drift'];
  recommended_actions: AiClientAnalysisResult['recommended_actions'];
  llm: AiClientAnalysisResult['llm'];
  saved_insight_id?: string;
  decision_guardrail: string;
}

export class AiService {
  async analyzeProject(
    projectId: string,
    userContext: UserContext,
    token: string
  ): Promise<AiProjectAnalysisResponse> {
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
      throw new AuthorizationError('AI project analysis is available only to authorized government and contractor organizations.');
    }

    const scopedClient = await createAuthenticatedClient(token);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);

    let projectQuery = scopedClient
      .from('projects')
      .select('id, nirikshak_project_id, project_name, government_organization_id');

    projectQuery = isUuid ? projectQuery.eq('id', projectId) : projectQuery.eq('nirikshak_project_id', projectId);

    const { data: project, error: pErr } = await projectQuery.single();
    if (pErr || !project) {
      throw new NotFoundError('Project not found or access denied by authorization policy');
    }

    // 1. Verify government organization multi-tenancy
    if (isGovernment && userContext.organizationId && project.government_organization_id) {
      if (userContext.role !== 'government_admin' && userContext.role !== 'auditor') {
        if (project.government_organization_id !== userContext.organizationId) {
          throw new AuthorizationError('Project belongs to a different government authority.');
        }
      }
    }

    // 2. Verify contractor organization assignment
    if (isContractor) {
      if (!userContext.organizationId) {
        throw new AuthorizationError('An active contractor organization is required.');
      }
      const [{ data: contracts }, { data: assignments }] = await Promise.all([
        supabaseAdmin
          .from('contracts')
          .select('id')
          .eq('project_id', project.id)
          .eq('contractor_organization_id', userContext.organizationId)
          .limit(1),
        supabaseAdmin
          .from('project_organizations')
          .select('id')
          .eq('project_id', project.id)
          .eq('organization_id', userContext.organizationId)
          .limit(1),
      ]);
      if ((!contracts || contracts.length === 0) && (!assignments || assignments.length === 0)) {
        throw new AuthorizationError('Your contractor organization is not assigned to this project.');
      }
    }

    // 3. Assemble authorized project snapshot
    const snapshot = await buildProjectSnapshot(project.id, scopedClient, {
      isContractor,
      contractorOrganizationId: userContext.organizationId,
    });

    // 4. Dispatch to Python AI Microservice
    const result = await aiClient.analyzeProject(snapshot, 3, true);

    // 5. Persist advisory insight in database
    let savedInsightId: string | undefined;
    try {
      const { data: insight } = await supabaseAdmin
        .from('ai_insights')
        .insert({
          project_id: project.id,
          insight_type: 'schedule_risk',
          title: `${result.historical_analysis.review_band} Review Priority: ${project.project_name}`,
          summary: result.llm?.summary || result.historical_analysis.signals.join('; '),
          severity: result.historical_analysis.review_band === 'VERY_UNUSUAL' ? 'CRITICAL' : result.historical_analysis.review_band === 'UNUSUAL' ? 'HIGH' : 'LOW',
          confidence: 0.92,
          evidence: result.historical_analysis.signals,
          recommended_actions: result.recommended_actions.map((a) => a.action),
          status: 'ACTIVE',
        })
        .select('id')
        .single();
      savedInsightId = insight?.id;
    } catch (saveErr) {
      console.warn('[AI SERVICE] Could not save insight to database table:', saveErr);
    }

    // 6. Record audit log
    try {
      await supabaseAdmin.from('audit_logs').insert({
        actor_id: userContext.userId,
        actor_organization_id: userContext.organizationId,
        action: 'AI_PROJECT_ANALYZED',
        entity_type: 'projects',
        entity_id: project.id,
        new_value: {
          analysis_id: result.analysis_id,
          model_version: result.model_version,
          review_priority_score: result.historical_analysis.review_priority_score,
          review_band: result.historical_analysis.review_band,
          insight_id: savedInsightId,
        },
      });
    } catch (auditErr) {
      console.warn('[AI SERVICE] Could not write audit log:', auditErr);
    }

    return {
      analysis_id: result.analysis_id,
      project_id: project.id,
      model_version: result.model_version,
      historical_analysis: result.historical_analysis,
      operational_drift: result.operational_drift,
      recommended_actions: result.recommended_actions,
      llm: result.llm,
      saved_insight_id: savedInsightId,
      decision_guardrail: result.decision_guardrail,
    };
  }

  async submitRecommendationFeedback(
    payload: {
      analysis_id: string;
      government_feedback: 'accepted' | 'useful' | 'neutral' | 'rejected' | 'harmful';
      note?: string;
    },
    userContext: UserContext
  ) {
    const isGovernment = [
      'government_admin',
      'chief_engineer',
      'project_officer',
      'government_engineer',
      'auditor',
    ].includes(userContext.role);

    if (!isGovernment) {
      throw new AuthorizationError('Only government officials can submit recommendation feedback.');
    }

    const res = await aiClient.submitFeedback(payload);

    try {
      await supabaseAdmin.from('audit_logs').insert({
        actor_id: userContext.userId,
        actor_organization_id: userContext.organizationId,
        action: 'AI_RECOMMENDATION_FEEDBACK',
        entity_type: 'ai_analysis',
        entity_id: payload.analysis_id,
        new_value: {
          feedback: payload.government_feedback,
          reward: res.reward,
          action: res.action,
        },
      });
    } catch {
      /* ignore */
    }

    return res;
  }

  async getHealth() {
    return await aiClient.healthCheck();
  }
}

export const aiService = new AiService();
