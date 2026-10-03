import { useI18n } from '@/context/I18nContext'
import { useApprovalWorkspace } from '@/context/ApprovalWorkspaceContext'
import { Panel, Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate, formatSlaCountdown } from '@/utils/format'
import { APPROVAL_STATUS } from '@/utils/status'

/**
 * Approval workspace — Multi-level workflow for this request: recorded stages,
 * the pending decision level, and digital-signature status per action.
 */
export function ApprovalWorkflowPage() {
  const { t } = useI18n()
  const { approval } = useApprovalWorkspace()
  if (!approval) return null

  const decided = approval.status === 'approved' || approval.status === 'rejected' || approval.status === 'returned'

  return (
    <div className="flex flex-col gap-4">
      <section id="workflow" className="scroll-mt-24">
        <Panel title="Multi-Level Approval Workflow" icon="account_tree" subtitle="Recorded levels for this request only. AI does not decide — the decision remains with the authorized officer.">
          <ol className="flex flex-col gap-3">
            {approval.auditTrail.map((stage, i) => (
              <li key={i}>
                <Card className="p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-label text-fg">
                      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-badge bg-primary-soft text-caption text-primary-strong">{i + 1}</span>
                      {stage.action}
                    </p>
                    <span className="tabular-nums text-caption text-fg-subtle">{formatDate(stage.timestamp)}</span>
                  </div>
                  <p className="mt-1 text-body-small text-fg-muted">
                    {stage.actor} <span className="text-fg-subtle">({stage.role})</span>
                  </p>
                  <p className="mt-1 text-caption text-fg-subtle">{stage.remarks}</p>
                  <p className="mt-2 flex items-center gap-1 text-caption text-success-strong">
                    <span className="material-symbols-outlined text-[14px]" aria-hidden="true">verified</span>
                    Digitally signed — e-Sign on record (demo)
                  </p>
                </Card>
              </li>
            ))}
          </ol>

          {/* Pending decision level */}
          <Card className="mt-3 border-dashed p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-label text-fg">
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-badge border border-primary-border bg-surface text-caption text-fg-muted">
                  {approval.auditTrail.length + 1}
                </span>
                {decided ? 'Decision recorded' : 'Pending decision'}
              </p>
              <span className="text-caption tabular-nums text-fg-muted">SLA {formatSlaCountdown(approval.slaDueDate)}</span>
            </div>
            <p className="mt-1 text-body-small text-fg-muted">
              {decided
                ? `Final action recorded on this request (${APPROVAL_STATUS[approval.status].key}).`
                : `Awaiting action by ${approval.assignedTo} (Level ${approval.auditTrail.length + 1} authority).`}
            </p>
          </Card>
        </Panel>
      </section>

      <section id="signatures" className="scroll-mt-24">
        <Panel title="Digital Signatures" icon="draw" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {approval.auditTrail.map((e, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <p className="text-body-small text-fg">
                  {e.action} — {e.actor} <span className="text-fg-subtle">({e.role})</span>
                </p>
                <span className="flex items-center gap-1 text-caption text-success-strong">
                  <span className="material-symbols-outlined text-[14px]" aria-hidden="true">verified</span>
                  e-Signed • {formatDate(e.timestamp)}
                </span>
              </li>
            ))}
            {approval.auditTrail.length === 0 && (
              <li className="p-4 text-body-small text-fg-muted">No signed actions recorded yet.</li>
            )}
          </ul>
        </Panel>
      </section>

      <Card className="p-3 text-caption text-warning-strong">
        <span className="material-symbols-outlined mr-1 align-middle text-[16px]" aria-hidden="true">badge</span>
        Final decision remains with the authorized officer. {t(APPROVAL_STATUS[approval.status].key)} status shown is the recorded officer decision, not an automated outcome.
      </Card>
    </div>
  )
}
