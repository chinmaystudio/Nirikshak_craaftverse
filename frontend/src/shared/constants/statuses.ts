export type ProjectStatus =
  | 'PROPOSED'
  | 'SANCTIONED'
  | 'TENDERED'
  | 'AWARDED'
  | 'IN_PROGRESS'
  | 'DELAYED'
  | 'AT_RISK'
  | 'COMPLETED'
  | 'SUSPENDED';

export type TenderStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'BID_OPEN'
  | 'UNDER_EVALUATION'
  | 'AWARDED'
  | 'CANCELLED';

export type ProgressStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CLARIFICATION_REQUIRED';

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'ACKNOWLEDGED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED';

export function normalizeProjectStatus(raw?: string | null): ProjectStatus {
  if (!raw) return 'PROPOSED';
  const s = raw.toUpperCase().replace(/\s+/g, '_');
  if (['ACTIVE', 'IN_PROGRESS', 'ON_TRACK'].includes(s)) return 'IN_PROGRESS';
  if (['DELAYED', 'BEHIND_SCHEDULE'].includes(s)) return 'DELAYED';
  if (['AT_RISK', 'CRITICAL'].includes(s)) return 'AT_RISK';
  if (['COMPLETED', 'FINISHED'].includes(s)) return 'COMPLETED';
  if (['TENDERED', 'TENDERING'].includes(s)) return 'TENDERED';
  if (['AWARDED'].includes(s)) return 'AWARDED';
  if (['SUSPENDED', 'STALLED', 'ON_HOLD'].includes(s)) return 'SUSPENDED';
  return 'PROPOSED';
}
