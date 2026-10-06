import { apiClient } from '@/lib/api/apiClient'
import type { ProgressUpdate } from '@/demo/government/workspace'

export const progressService = {
  async forProject(projectId: string): Promise<ProgressUpdate[]> {
    const data = await apiClient.get<any[]>(`/api/progress/project/${encodeURIComponent(projectId)}`)

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
