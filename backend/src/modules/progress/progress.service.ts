import { createAuthenticatedClient } from '../../core/database/supabase.js';
import { SubmitProgressInput, ReviewProgressInput } from './progress.validation.js';
import { ValidationError } from '../../core/http/errors.js';
import { aiClient } from '../ai/ai.client.js';
import { buildProjectSnapshot } from '../ai/ai.context.js';

export class ProgressService {
  async listProjectProgress(projectId: string, token: string): Promise<any[]> {
    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('progress_updates')
      .select('id, project_id, observation_date, submitted_at, reported_progress, verification_status, review_notes, description, work_completed, created_at')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('submitted_at', { ascending: false });

    if (error) {
      throw new ValidationError(`Failed to load project progress: ${error.message}`);
    }
    return data || [];
  }

  async submitProgress(input: SubmitProgressInput, token: string): Promise<any> {
    const scopedClient = await createAuthenticatedClient(token);
    // Unverified contractor submission - Authoritative RPC execution
    // Unverified contractor data does NOT train the online model.
    const { data: updateData, error: updateErr } = await scopedClient.rpc('submit_progress_update', {
      p_project_id: input.project_id,
      p_reported_progress: input.reported_progress,
      p_description: input.description,
      p_milestone_id: input.milestone_id || null,
    });

    if (updateErr) {
      throw new ValidationError(`Progress submission rejected: ${updateErr.message}`);
    }

    if (input.evidence && input.evidence.length > 0 && updateData?.id) {
      const evidenceRows = input.evidence.map((ev) => ({
        progress_update_id: updateData.id,
        evidence_type: ev.evidence_type,
        storage_path: ev.storage_path,
        latitude: ev.latitude || null,
        longitude: ev.longitude || null,
        metadata: ev.metadata || {},
      }));
      await scopedClient.from('progress_evidence').insert(evidenceRows);
    }

    return updateData;
  }

  async reviewProgress(input: ReviewProgressInput, token: string): Promise<any> {
    const scopedClient = await createAuthenticatedClient(token);
    
    // 1. Authoritative PostgreSQL RPC execution happens FIRST
    const { data, error } = await scopedClient.rpc('approve_progress_update', {
      p_update_id: input.progress_update_id,
      p_decision: input.decision,
      p_verified_progress: input.verified_progress ?? null,
      p_review_notes: input.review_notes,
    });

    if (error) {
      throw new ValidationError(`Progress review failed: ${error.message}`);
    }

    // 2. Continuous Online Drift Learning for verified milestones
    // AI learning failure MUST NOT roll back a valid Government approval.
    if (input.decision === 'APPROVED') {
      (async () => {
        try {
          const { data: updateRecord } = await scopedClient
            .from('progress_updates')
            .select('project_id, verified_progress')
            .eq('id', input.progress_update_id)
            .single();

          if (updateRecord?.project_id) {
            const snapshot = await buildProjectSnapshot(updateRecord.project_id, scopedClient, {
              isContractor: false,
            });
            await aiClient.learnVerifiedSnapshot(snapshot);
          }
        } catch (aiErr: any) {
          console.warn('[AI LEARNING WARNING] Continuous learning update skipped:', aiErr.message || aiErr);
        }
      })();
    }

    return data;
  }
}

export const progressService = new ProgressService();
