import type {
  StatusDescriptor,
  ProjectStatus,
  MilestoneStatus,
  ApprovalStatus,
  TenderStatus,
  GrievanceStatus,
  LitigationStatus,
  AuditSeverity,
  AlertSeverity,
  StatusTone,
} from '@/types'

/**
 * Status descriptor map — the spec's core accessibility rule: status is NEVER
 * conveyed by color alone. Every status resolves to a text key + tone (tint)
 * + a distinct Material Symbols icon. Components must render all three.
 */

const BASE_PROJECT_STATUS: Record<ProjectStatus, StatusDescriptor> = {
  sanctioned: { key: 'status.sanctioned', tone: 'info', icon: 'verified' },
  in_execution: { key: 'status.inExecution', tone: 'info', icon: 'progress_activity' },
  delayed: { key: 'status.delayed', tone: 'danger', icon: 'timer_off' },
  at_risk: { key: 'status.atRisk', tone: 'warning', icon: 'warning' },
  completed: { key: 'status.completed', tone: 'success', icon: 'check_circle' },
  on_hold: { key: 'status.onHold', tone: 'neutral', icon: 'pause_circle' },
}

export function getSafeStatusDescriptor(status?: string): StatusDescriptor {
  if (!status) return BASE_PROJECT_STATUS.in_execution
  const s = String(status).toLowerCase().replace(/[-\s]/g, '_')
  if (s in BASE_PROJECT_STATUS) return BASE_PROJECT_STATUS[s as ProjectStatus]
  if (s.includes('complete')) return BASE_PROJECT_STATUS.completed
  if (s.includes('delay')) return BASE_PROJECT_STATUS.delayed
  if (s.includes('risk') || s.includes('stall') || s.includes('suspend')) return BASE_PROJECT_STATUS.at_risk
  if (s.includes('sanction') || s.includes('approv') || s.includes('propos')) return BASE_PROJECT_STATUS.sanctioned
  if (s.includes('hold')) return BASE_PROJECT_STATUS.on_hold
  return BASE_PROJECT_STATUS.in_execution
}

/* ---------- Projects ---------- */
export const PROJECT_STATUS: Record<string, StatusDescriptor> = new Proxy(BASE_PROJECT_STATUS, {
  get(target, prop: string) {
    if (typeof prop === 'string' && prop in target) {
      return (target as any)[prop]
    }
    return getSafeStatusDescriptor(String(prop))
  },
})

/* ---------- Milestones ---------- */
export const MILESTONE_STATUS: Record<MilestoneStatus, StatusDescriptor> = {
  upcoming: { key: 'status.upcoming', tone: 'neutral', icon: 'schedule' },
  in_progress: { key: 'status.inProgress', tone: 'info', icon: 'progress_activity' },
  completed: { key: 'status.completed', tone: 'success', icon: 'check_circle' },
  delayed: { key: 'status.delayed', tone: 'danger', icon: 'timer_off' },
  blocked: { key: 'status.blocked', tone: 'danger', icon: 'block' },
}

/* ---------- Approvals ---------- */
export const APPROVAL_STATUS: Record<ApprovalStatus, StatusDescriptor> = {
  pending: { key: 'status.pending', tone: 'warning', icon: 'hourglass_top' },
  approved: { key: 'status.approved', tone: 'success', icon: 'check_circle' },
  rejected: { key: 'status.rejected', tone: 'danger', icon: 'cancel' },
  returned: { key: 'status.returned', tone: 'warning', icon: 'undo' },
  clarification: { key: 'status.clarification', tone: 'info', icon: 'help' },
}

/* ---------- Tenders ---------- */
export const TENDER_STATUS: Record<TenderStatus, StatusDescriptor> = {
  draft: { key: 'status.draft', tone: 'neutral', icon: 'edit_note' },
  published: { key: 'status.published', tone: 'info', icon: 'campaign' },
  bid_open: { key: 'status.bidOpen', tone: 'info', icon: 'lock_open' },
  under_evaluation: { key: 'status.underEvaluation', tone: 'warning', icon: 'rate_review' },
  awarded: { key: 'status.awarded', tone: 'success', icon: 'emoji_events' },
  cancelled: { key: 'status.cancelled', tone: 'danger', icon: 'cancel' },
}

/* ---------- Grievances ---------- */
export const GRIEVANCE_STATUS: Record<GrievanceStatus, StatusDescriptor> = {
  submitted: { key: 'status.submitted', tone: 'neutral', icon: 'outbox' },
  acknowledged: { key: 'status.acknowledged', tone: 'info', icon: 'mark_email_read' },
  in_review: { key: 'status.inReview', tone: 'info', icon: 'plagiarism' },
  action_taken: { key: 'status.actionTaken', tone: 'warning', icon: 'build' },
  resolved: { key: 'status.resolved', tone: 'success', icon: 'check_circle' },
  closed: { key: 'status.closed', tone: 'neutral', icon: 'lock' },
  rejected: { key: 'status.rejected', tone: 'danger', icon: 'cancel' },
}

/* ---------- Litigation ---------- */
export const LITIGATION_STATUS: Record<LitigationStatus, StatusDescriptor> = {
  open: { key: 'status.open', tone: 'warning', icon: 'gavel' },
  under_review: { key: 'status.underReview', tone: 'info', icon: 'plagiarism' },
  hearing_scheduled: { key: 'status.hearingScheduled', tone: 'info', icon: 'event' },
  resolved: { key: 'status.resolved', tone: 'success', icon: 'check_circle' },
  closed: { key: 'status.closed', tone: 'neutral', icon: 'lock' },
}

/* ---------- Severities ---------- */
export const AUDIT_SEVERITY: Record<AuditSeverity, StatusDescriptor> = {
  low: { key: 'severity.low', tone: 'neutral', icon: 'info' },
  medium: { key: 'severity.medium', tone: 'warning', icon: 'warning' },
  high: { key: 'severity.high', tone: 'danger', icon: 'error' },
  critical: { key: 'severity.critical', tone: 'danger', icon: 'crisis_alert' },
}

export const ALERT_SEVERITY: Record<AlertSeverity, StatusDescriptor> = {
  info: { key: 'severity.info', tone: 'info', icon: 'info' },
  warning: { key: 'severity.warning', tone: 'warning', icon: 'warning' },
  critical: { key: 'severity.critical', tone: 'danger', icon: 'crisis_alert' },
}

/* ---------- Work orders ---------- */
export const WORK_ORDER_STATUS: Record<
  'issued' | 'accepted' | 'in_execution' | 'suspended' | 'closed',
  StatusDescriptor
> = {
  issued: { key: 'status.woIssued', tone: 'info', icon: 'outgoing_mail' },
  accepted: { key: 'status.woAccepted', tone: 'success', icon: 'task_alt' },
  in_execution: { key: 'status.woInExecution', tone: 'info', icon: 'progress_activity' },
  suspended: { key: 'status.woSuspended', tone: 'danger', icon: 'pause_circle' },
  closed: { key: 'status.closed', tone: 'neutral', icon: 'lock' },
}

/* ---------- Inspection outcomes ---------- */
export const INSPECTION_OUTCOME: Record<
  'satisfactory' | 'observations' | 'non_compliance',
  StatusDescriptor
> = {
  satisfactory: { key: 'inspection.satisfactory', tone: 'success', icon: 'check_circle' },
  observations: { key: 'inspection.outcome.observations', tone: 'warning', icon: 'visibility' },
  non_compliance: { key: 'inspection.outcome.non_compliance', tone: 'danger', icon: 'report' },
}

/* ---------- Funding / fund flow ---------- */
export const FUND_FLOW_STATUS: Record<'allocated' | 'released' | 'pending', StatusDescriptor> = {
  allocated: { key: 'status.allocated', tone: 'info', icon: 'account_balance_wallet' },
  released: { key: 'status.released', tone: 'success', icon: 'check_circle' },
  pending: { key: 'status.pending', tone: 'warning', icon: 'hourglass_top' },
}

/* ---------- Bills & payments (Payment & Bill Management) ---------- */
export const BILL_STATUS: Record<
  'submitted' | 'verified' | 'approved' | 'paid' | 'returned',
  StatusDescriptor
> = {
  submitted: { key: 'bill.status.submitted', tone: 'info', icon: 'schedule_send' },
  verified: { key: 'bill.status.verified', tone: 'neutral', icon: 'fact_check' },
  approved: { key: 'bill.status.approved', tone: 'warning', icon: 'task_alt' },
  paid: { key: 'bill.status.paid', tone: 'success', icon: 'payments' },
  returned: { key: 'bill.status.returned', tone: 'danger', icon: 'keyboard_return' },
}

export const BILL_FLAG: Record<'duplicate' | 'abnormal', StatusDescriptor> = {
  duplicate: { key: 'bill.flag.duplicate', tone: 'danger', icon: 'content_copy' },
  abnormal: { key: 'bill.flag.abnormal', tone: 'warning', icon: 'warning' },
}

/* ---------- Document access levels ---------- */
export const ACCESS_LEVEL: Record<'Public' | 'Internal' | 'Restricted', StatusDescriptor> = {
  Public: { key: 'access.public', tone: 'success', icon: 'public' },
  Internal: { key: 'access.internal', tone: 'info', icon: 'lock_open' },
  Restricted: { key: 'access.restricted', tone: 'danger', icon: 'lock' },
}

/* ---------- AI confidence bands ---------- */
export const AI_CONFIDENCE: Record<'low' | 'medium' | 'high', StatusDescriptor> = {
  low: { key: 'ai.confidence.low', tone: 'warning', icon: 'help' },
  medium: { key: 'ai.confidence.medium', tone: 'info', icon: 'insights' },
  high: { key: 'ai.confidence.high', tone: 'success', icon: 'verified' },
}

/* ---------- AI classification labels (Insight / Verified / Officer decision) ---------- */
export const AI_CLASSIFICATION: Record<
  'ai_insight' | 'verified_data' | 'officer_decision',
  StatusDescriptor
> = {
  ai_insight: { key: 'ai.classification.ai_insight', tone: 'info', icon: 'auto_awesome' },
  verified_data: { key: 'ai.classification.verified_data', tone: 'success', icon: 'fact_check' },
  officer_decision: { key: 'ai.classification.officer_decision', tone: 'neutral', icon: 'badge' },
}

/* ---------- Contractor score band ---------- */
export const SCORE_BAND: Record<'excellent' | 'good' | 'average' | 'poor', StatusDescriptor> = {
  excellent: { key: 'contractor.band.excellent', tone: 'success', icon: 'trending_up' },
  good: { key: 'contractor.band.good', tone: 'info', icon: 'trending_up' },
  average: { key: 'contractor.band.average', tone: 'warning', icon: 'trending_flat' },
  poor: { key: 'contractor.band.poor', tone: 'danger', icon: 'trending_down' },
}

/* ---------- Approval priority ---------- */
export const PRIORITY: Record<'low' | 'medium' | 'high' | 'urgent', StatusDescriptor> = {
  low: { key: 'priority.low', tone: 'neutral', icon: 'remove' },
  medium: { key: 'priority.medium', tone: 'info', icon: 'drag_handle' },
  high: { key: 'priority.high', tone: 'warning', icon: 'priority_high' },
  urgent: { key: 'priority.urgent', tone: 'danger', icon: 'priority_high' },
}

/** Tone → the semantic CSS class stem used by StatusBadge. */
export const TONE_CLASS: Record<StatusTone, { bg: string; text: string; border: string }> = {
  success: { bg: 'bg-success-tint', text: 'text-success-strong', border: 'border-success-border' },
  warning: { bg: 'bg-warning-tint', text: 'text-warning-strong', border: 'border-warning-border' },
  danger: { bg: 'bg-danger-tint', text: 'text-danger-strong', border: 'border-danger-border' },
  info: { bg: 'bg-info-tint', text: 'text-info-strong', border: 'border-info-border' },
  neutral: { bg: 'bg-surface-2', text: 'text-fg-muted', border: 'border-border' },
}
