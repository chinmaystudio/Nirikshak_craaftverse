import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { useApprovalWorkspace } from '@/context/ApprovalWorkspaceContext'
import { useToast } from '@/context/ToastContext'
import { approvalsApi } from '@/api'
import { Panel, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCr, formatDate, formatSlaCountdown } from '@/utils/format'

/** Approval workspace — Overview. Every figure is scoped to the open request. */
export function ApprovalOverviewPage() {
  const { t } = useI18n()
  const { approvalId, approval } = useApprovalWorkspace()
  const { showToast } = useToast()
  const [decisionNotes, setDecisionNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)

  if (!approval) return null

  const effectiveStatus = currentStatus ?? approval.status

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    setSubmitting(true)
    try {
      const note = decisionNotes.trim() || (decision === 'APPROVED' ? 'Sanction approved after technical audit.' : 'Rejected due to discrepancies in reported metrics.')
      if (decision === 'APPROVED') {
        await approvalsApi.approve(approval.id, note)
        showToast('Technical sanction approved successfully.', 'success')
        setCurrentStatus('approved')
      } else {
        await approvalsApi.reject(approval.id, note)
        showToast('Approval request rejected and returned for revision.', 'warning')
        setCurrentStatus('rejected')
      }
      setDecisionNotes('')
    } catch (err: any) {
      console.error('Failed to process approval decision:', err)
      showToast(err?.message || 'Failed to submit approval decision.', 'danger')
    } finally {
      setSubmitting(false)
    }
  }

  const modules = [
    { labelKey: 'nav.workflow', icon: 'account_tree', to: `/government/approvals/${approvalId}/workflow`, value: `${approval.auditTrail.length}`, note: 'recorded actions' },
    { labelKey: 'nav.approvalHistory', icon: 'history', to: `/government/approvals/${approvalId}/history`, value: effectiveStatus.replace('_', ' '), note: 'current status' },
    { labelKey: 'nav.linkedProject', icon: 'map', to: `/government/approvals/${approvalId}/project`, value: approval.projectId, note: approval.projectName },
  ]

  return (
    <div className="flex flex-col gap-4">
      <section id="overview" className="scroll-mt-24">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {modules.map((m) => (
            <Link
              key={m.labelKey}
              to={m.to}
              className="nk-card flex flex-col gap-1 p-3 transition-colors duration-fast hover:border-primary-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="flex items-center gap-2 text-caption text-fg-muted">
                <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">{m.icon}</span>
                {t(m.labelKey)}
              </span>
              <span className="nk-mono-id text-heading-2 text-fg">{m.value}</span>
              <span className="text-caption text-fg-subtle">{m.note}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Decision Action Panel */}
      <Panel title="Official Decision & Sanction" icon="gavel">
        {effectiveStatus === 'pending' ? (
          <div className="flex flex-col gap-3">
            <p className="text-body-small text-fg-muted">
              As the designated verification officer, review the request details below and record your formal decision.
            </p>
            <div>
              <label htmlFor="decisionNotes" className="text-caption font-medium text-fg">
                Verification Remarks / Justification
              </label>
              <textarea
                id="decisionNotes"
                rows={3}
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Enter technical verification notes, site audit remarks, or conditions for sanction..."
                className="mt-1 w-full rounded border border-border bg-surface p-2.5 text-body-small text-fg placeholder:text-fg-subtle focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <Button
                variant="danger"
                icon="cancel"
                disabled={submitting}
                onClick={() => handleDecision('REJECTED')}
              >
                Reject / Return
              </Button>
              <Button
                variant="primary"
                icon="check_circle"
                disabled={submitting}
                onClick={() => handleDecision('APPROVED')}
              >
                {submitting ? 'Recording...' : 'Approve Sanction'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 p-4">
            <span className="material-symbols-outlined text-[24px] text-success-strong">
              {effectiveStatus === 'approved' ? 'task_alt' : 'cancel'}
            </span>
            <div>
              <p className="text-label font-medium text-fg capitalize">
                Decision Recorded: {effectiveStatus}
              </p>
              <p className="text-caption text-fg-muted">
                This technical sanction record has been finalized and locked into the official audit trail.
              </p>
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Request Facts" icon="approval">
        <dl className="grid grid-cols-2 gap-3 text-body-small md:grid-cols-3">
          <div><dt className="text-fg-subtle">Approval type</dt><dd className="text-fg">{approval.type}</dd></div>
          <div><dt className="text-fg-subtle">Category</dt><dd className="text-fg">{approval.type.split(' ')[0]}</dd></div>
          <div><dt className="text-fg-subtle">SLA</dt><dd className="tabular-nums text-fg">{formatSlaCountdown(approval.slaDueDate)}</dd></div>
          <div><dt className="text-fg-subtle">Submitted by</dt><dd className="text-fg">{approval.submittedBy}</dd></div>
          <div><dt className="text-fg-subtle">Submitted on</dt><dd className="tabular-nums text-fg">{formatDate(approval.submittedOn)}</dd></div>
          <div><dt className="text-fg-subtle">Financial implication</dt><dd className="tabular-nums text-fg">{approval.amountCr != null ? formatCr(approval.amountCr) : '—'}</dd></div>
          <div><dt className="text-fg-subtle">Assigned officer</dt><dd className="text-fg">{approval.assignedTo}</dd></div>
          <div><dt className="text-fg-subtle">SLA due date</dt><dd className="tabular-nums text-fg">{formatDate(approval.slaDueDate)}</dd></div>
          <div><dt className="text-fg-subtle">Linked project</dt><dd className="nk-mono-id text-fg">{approval.projectId}</dd></div>
        </dl>
      </Panel>

      <Card className="p-3 text-caption text-fg-subtle">{t('common.mockDataNote')}</Card>
    </div>
  )
}

