import { Link } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { useApprovalWorkspace } from '@/context/ApprovalWorkspaceContext'
import { Panel, Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate, formatSlaCountdown } from '@/utils/format'
import { APPROVAL_STATUS } from '@/utils/status'

/** Approval workspace — Approval History: full action log + same-project history. */
export function ApprovalHistoryPage() {
  const { t } = useI18n()
  const { approval, relatedApprovals } = useApprovalWorkspace()
  if (!approval) return null

  return (
    <div className="flex flex-col gap-4">
      <section id="history" className="scroll-mt-24">
        <Panel title="Approval History — Complete Action Log" icon="history" subtitle="Every action on this request, with actor, role, timestamp and remarks." bodyClassName="p-0">
          <ol className="flex flex-col gap-0 divide-y divide-border">
            {approval.auditTrail.map((e, i) => (
              <li key={i} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-label text-fg">{e.action}</p>
                  <span className="tabular-nums text-caption text-fg-subtle">{formatDate(e.timestamp)}</span>
                </div>
                <p className="mt-1 text-body-small text-fg">
                  {e.actor} <span className="text-fg-subtle">({e.role})</span>
                </p>
                <p className="mt-1 text-caption text-fg-muted">{e.remarks}</p>
              </li>
            ))}
            {approval.auditTrail.length === 0 && (
              <li className="p-8 text-center text-body-small text-fg-muted">No actions recorded on this request yet.</li>
            )}
          </ol>
          <p className="border-t border-border p-3 text-caption text-fg-subtle">
            The trail is append-only and tamper-resistant: entries cannot be edited or removed, only superseded by new actions.
          </p>
        </Panel>
      </section>

      {relatedApprovals.length > 0 && (
        <section id="related" className="scroll-mt-24">
          <Panel title="Other Approvals on This Project" icon="layers" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {relatedApprovals.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div className="min-w-0">
                    <Link
                      to={`/government/approvals/${encodeURIComponent(a.id)}`}
                      className="nk-mono-id text-primary-strong hover:underline"
                    >
                      {a.id}
                    </Link>
                    <p className="mt-0.5 truncate text-body-small text-fg">{a.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge descriptor={APPROVAL_STATUS[a.status]} size="sm" />
                    <span className="text-caption tabular-nums text-fg-muted">SLA {formatSlaCountdown(a.slaDueDate)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      )}

      <Card className="p-3 text-caption text-fg-subtle">{t('common.mockDataNote')}</Card>
    </div>
  )
}
