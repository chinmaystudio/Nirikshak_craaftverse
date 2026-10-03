import crypto from 'node:crypto';
import { supabaseAdmin, createAuthenticatedClient } from '../../core/database/supabase.js';
import { aiClient, AiClientAnalysisResult } from './ai.client.js';
import { buildProjectSnapshot } from './ai.context.js';
import { UserContext } from '../../core/auth/userContext.js';
import { AuthorizationError, NotFoundError, BadRequestError } from '../../core/http/errors.js';

export interface AiProjectAnalysisResponse {
  analysis_id: string;
  project_id: string;
  model_version: string;
  versions?: AiClientAnalysisResult['versions'];
  input_quality?: AiClientAnalysisResult['input_quality'];
  historical_analysis: AiClientAnalysisResult['historical_analysis'];
  operational_drift: AiClientAnalysisResult['operational_drift'];
  recommended_actions: AiClientAnalysisResult['recommended_actions'];
  llm: AiClientAnalysisResult['llm'];
  saved_insight_id?: string;
  analysis_run_id?: string;
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

    // 5. Database V2 Runtime Persistence
    const contextHash = crypto.createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
    let analysisRunId: string | undefined;

    try {
      // 5a. Persist ai_analysis_runs
      const { data: run, error: runErr } = await supabaseAdmin
        .from('ai_analysis_runs')
        .insert({
          analysis_id: result.analysis_id,
          project_id: project.id,
          requested_by: userContext.userId,
          requested_by_organization_id: userContext.organizationId || null,
          service_version: result.versions?.service || '1.0.0',
          historical_model_version: result.versions?.historical_model || 'nirikshak-historical-v1.0.0',
          online_model_version: result.versions?.online_model || 'nirikshak-online-v1.0.0',
          rl_policy_version: result.versions?.rl_policy || 'linucb-v1.0.0',
          llm_model: result.versions?.llm_model || 'nvidia/nemotron-4-340b-instruct',
          context_hash: contextHash,
          input_completeness_score: result.input_quality?.completeness_score ?? null,
          status: 'COMPLETED',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (!runErr && run) {
        analysisRunId = run.id;

        // 5b. Persist sanitized ai_context_snapshots
        await supabaseAdmin.from('ai_context_snapshots').insert({
          analysis_run_id: run.id,
          project_id: project.id,
          snapshot: snapshot,
          snapshot_hash: contextHash,
          provenance: result.provenance || {},
        });

        // 5c. Persist ai_recommended_actions
        if (result.recommended_actions && result.recommended_actions.length > 0) {
          const actionRows = result.recommended_actions.map((act, index) => ({
            analysis_run_id: run.id,
            project_id: project.id,
            action_code: act.action,
            rank: index + 1,
            policy_score: act.score,
            learned_mean_reward: act.learned_mean_reward,
            uncertainty_bonus: act.uncertainty_bonus,
            explanation: act.reason || null,
            status: 'PROPOSED',
          }));
          await supabaseAdmin.from('ai_recommended_actions').insert(actionRows);
        }
      }
    } catch (persistErr) {
      console.warn('[AI SERVICE] Error persisting AI lifecycle run to Database V2:', persistErr);
    }

    // 5d. Persist advisory insight in database
    let savedInsightId: string | undefined;
    try {
      const { data: insight } = await supabaseAdmin
        .from('ai_insights')
        .insert({
          analysis_run_id: analysisRunId || null,
          project_id: project.id,
          insight_type: 'PROJECT_REVIEW_PRIORITY',
          title: `${result.historical_analysis.review_band} Review Priority: ${project.project_name}`,
          summary: result.llm?.summary || result.historical_analysis.signals.join('; '),
          severity: result.historical_analysis.review_band === 'VERY_UNUSUAL' ? 'CRITICAL' : result.historical_analysis.review_band === 'UNUSUAL' ? 'HIGH' : 'LOW',
          confidence: null,
          evidence: result.historical_analysis.signals,
          recommended_actions: result.recommended_actions.map((a) => a.action),
          review_priority_score: result.historical_analysis.review_priority_score,
          review_priority_band: result.historical_analysis.review_band,
          structural_anomaly_score: result.historical_analysis.structural_anomaly_score,
          cost_anomaly_score: result.historical_analysis.cost_anomaly_score,
          drift_percentile: result.operational_drift?.drift_percentile ?? null,
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
          analysis_run_id: analysisRunId,
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
      versions: result.versions,
      input_quality: result.input_quality,
      historical_analysis: result.historical_analysis,
      operational_drift: result.operational_drift,
      recommended_actions: result.recommended_actions,
      llm: result.llm,
      saved_insight_id: savedInsightId,
      analysis_run_id: analysisRunId,
      decision_guardrail: result.decision_guardrail,
    };
  }

  async submitRecommendationFeedback(
    payload: {
      analysis_id: string;
      action: string;
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

    // Look up analysis run in DB
    const { data: run, error: runErr } = await supabaseAdmin
      .from('ai_analysis_runs')
      .select('id, project_id, requested_by_organization_id')
      .eq('analysis_id', payload.analysis_id)
      .single();

    if (runErr || !run) {
      throw new NotFoundError(`AI Analysis run ${payload.analysis_id} not found.`);
    }

    // Verify project access
    if (userContext.role !== 'government_admin' && userContext.role !== 'auditor') {
      const { data: proj } = await supabaseAdmin
        .from('projects')
        .select('government_organization_id')
        .eq('id', run.project_id)
        .single();
      if (proj && userContext.organizationId && proj.government_organization_id !== userContext.organizationId) {
        throw new AuthorizationError('Access denied: Project belongs to a different government organization.');
      }
    }

    // Look up recommended action
    const { data: recAction } = await supabaseAdmin
      .from('ai_recommended_actions')
      .select('id')
      .eq('analysis_run_id', run.id)
      .eq('action_code', payload.action)
      .single();

    // Call Python /feedback (ONLY stores feedback, returns policy_updated: false)
    const res = await aiClient.submitFeedback(payload);

    // Persist to ai_recommendation_feedback in Supabase V2
    const feedbackUpper = payload.government_feedback.toUpperCase() as 'USEFUL' | 'ACCEPTED' | 'NEUTRAL' | 'REJECTED' | 'HARMFUL';
    try {
      await supabaseAdmin.from('ai_recommendation_feedback').insert({
        analysis_run_id: run.id,
        recommended_action_id: recAction?.id || null,
        project_id: run.project_id,
        action: payload.action,
        reviewed_by: userContext.userId,
        feedback: feedbackUpper,
        note: payload.note || null,
      });

      // Update recommended action status based on feedback
      const newStatus = (feedbackUpper === 'ACCEPTED')
        ? 'ACCEPTED'
        : (feedbackUpper === 'REJECTED' || feedbackUpper === 'HARMFUL')
        ? 'REJECTED'
        : 'REVIEWED';

      if (recAction?.id) {
        await supabaseAdmin
          .from('ai_recommended_actions')
          .update({ status: newStatus })
          .eq('id', recAction.id);
      }
    } catch (dbErr) {
      console.warn('[AI SERVICE] Could not persist feedback to DB table:', dbErr);
    }

    try {
      await supabaseAdmin.from('audit_logs').insert({
        actor_id: userContext.userId,
        actor_organization_id: userContext.organizationId,
        action: 'AI_RECOMMENDATION_FEEDBACK',
        entity_type: 'ai_analysis',
        entity_id: payload.analysis_id,
        new_value: {
          feedback: payload.government_feedback,
          action: payload.action,
          policy_updated: false,
        },
      });
    } catch {
      /* ignore */
    }

    return res;
  }

  async recordVerifiedOutcome(
    payload: {
      analysis_id: string;
      action: string;
      government_feedback?: 'accepted' | 'useful' | 'neutral' | 'rejected' | 'harmful';
      current_snapshot_verified: boolean;
    },
    userContext: UserContext,
    token: string
  ) {
    const isGovernment = [
      'government_admin',
      'chief_engineer',
      'project_officer',
      'government_engineer',
      'auditor',
    ].includes(userContext.role);

    if (!isGovernment) {
      throw new AuthorizationError('Only authorized government officials can record verified AI outcomes.');
    }

    if (!payload.current_snapshot_verified) {
      throw new BadRequestError('current_snapshot_verified must be true to record verified outcomes.');
    }

    // Look up analysis run in DB
    const { data: run, error: runErr } = await supabaseAdmin
      .from('ai_analysis_runs')
      .select('id, project_id')
      .eq('analysis_id', payload.analysis_id)
      .single();

    if (runErr || !run) {
      throw new NotFoundError(`AI Analysis run ${payload.analysis_id} not found.`);
    }

    // Verify project access
    if (userContext.role !== 'government_admin' && userContext.role !== 'auditor') {
      const { data: proj } = await supabaseAdmin
        .from('projects')
        .select('government_organization_id')
        .eq('id', run.project_id)
        .single();
      if (proj && userContext.organizationId && proj.government_organization_id !== userContext.organizationId) {
        throw new AuthorizationError('Access denied: Project belongs to a different government organization.');
      }
    }

    // Look up recommended action and baseline snapshot
    const [{ data: recAction }, { data: baselineSnap }] = await Promise.all([
      supabaseAdmin
        .from('ai_recommended_actions')
        .select('id')
        .eq('analysis_run_id', run.id)
        .eq('action_code', payload.action)
        .single(),
      supabaseAdmin
        .from('ai_context_snapshots')
        .select('snapshot')
        .eq('analysis_run_id', run.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
    ]);

    // Build fresh verified current snapshot
    const scopedClient = await createAuthenticatedClient(token);
    const currentSnapshot = await buildProjectSnapshot(run.project_id, scopedClient, {
      isContractor: false,
    });

    // Call Python /learn/outcome
    const outcomeResult = await aiClient.learnOutcome({
      analysis_id: payload.analysis_id,
      action: payload.action,
      current_snapshot: currentSnapshot,
      government_feedback: payload.government_feedback,
      current_snapshot_verified: true,
    });

    // Persist to ai_action_outcomes in Supabase V2
    try {
      await supabaseAdmin.from('ai_action_outcomes').insert({
        analysis_run_id: run.id,
        recommended_action_id: recAction?.id || null,
        project_id: run.project_id,
        action: payload.action,
        baseline_snapshot: baselineSnap?.snapshot || {},
        verified_outcome_snapshot: currentSnapshot,
        reward: outcomeResult.reward ?? 0,
        reward_components: outcomeResult.reward_components || {},
        verified_by: userContext.userId,
        verified_at: new Date().toISOString(),
      });

      // Update recommended action status to COMPLETED
      if (recAction?.id) {
        await supabaseAdmin
          .from('ai_recommended_actions')
          .update({ status: 'COMPLETED' })
          .eq('id', recAction.id);
      }
    } catch (dbErr) {
      console.warn('[AI SERVICE] Could not persist outcome to DB table:', dbErr);
    }

    try {
      await supabaseAdmin.from('audit_logs').insert({
        actor_id: userContext.userId,
        actor_organization_id: userContext.organizationId,
        action: 'AI_OUTCOME_RECORDED',
        entity_type: 'ai_analysis',
        entity_id: payload.analysis_id,
        new_value: {
          action: payload.action,
          reward: outcomeResult.reward,
          policy_updated: outcomeResult.updated,
        },
      });
    } catch {
      /* ignore */
    }

    return outcomeResult;
  }

  async getHealth() {
    return await aiClient.healthCheck();
  }
}

export const aiService = new AiService();

