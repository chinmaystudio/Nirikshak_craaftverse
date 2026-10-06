import { supabase } from '@/core/supabase/client'
import type { ProgressUpdate } from '@/demo/government/workspace'

export const progressService = {
  async forProject(projectId: string): Promise<ProgressUpdate[]> {
    const { data, error } = await supabase
      .from('progress_updates')
      .select('id, project_id, observation_date, submitted_at, reported_progress, verification_status, review_notes, description, work_completed')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('submitted_at', { ascending: false })

    if (error) throw error

    return (data ?? []).map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      date: row.observation_date || row.submitted_at || '',
      location: 'Project site',
      activity: row.work_completed || row.description || 'Progress update',
      progressPct: Number(row.reported_progress) || 0,
      officer: 'Pending government review',
      contractor: 'Awarded contractor',
      geoTag: { lat: 0, lng: 0 },
      photos: 0,
      status: row.verification_status === 'APPROVED'
        ? 'verified'
        : row.verification_status === 'REJECTED'
        ? 'rejected'
        : 'pending',
      verificationNote: row.review_notes || undefined,
    }))
  },
}
