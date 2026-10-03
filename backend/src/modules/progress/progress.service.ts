import { createAuthenticatedClient } from '../../core/database/supabase.js';
import { SubmitProgressInput, ReviewProgressInput } from './progress.validation.js';
import { ValidationError } from '../../core/http/errors.js';

export class ProgressService {
  async submitProgress(input: SubmitProgressInput, token: string): Promise<any> {
    const scopedClient = await createAuthenticatedClient(token);
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
    const { data, error } = await scopedClient.rpc('approve_progress_update', {
      p_update_id: input.progress_update_id,
      p_decision: input.decision,
      p_verified_progress: input.verified_progress ?? null,
      p_review_notes: input.review_notes,
    });

    if (error) {
      throw new ValidationError(`Progress review failed: ${error.message}`);
    }

    return data;
  }
}

export const progressService = new ProgressService();
