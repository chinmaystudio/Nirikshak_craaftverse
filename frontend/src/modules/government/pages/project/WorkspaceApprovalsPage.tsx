import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { useProjectWorkspace } from '@/context/ProjectWorkspaceContext'
import { useToast } from '@/context/ToastContext'
import { approvalsApi } from '@/api'
import { Panel, Card } from '@/components/ui/Card'
import { DataTable } from '@/components/tables/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageHeader, KpiRow, ConfirmDialog, KpiCard } from '@/components/blocks/Page'
import { formatCr, formatDate, formatSlaCountdown } from '@/utils/format'
import { APPROVAL_STATUS, PRIORITY } from '@/utils/status'
import type { ApprovalItem } from '@/types'

const WORKFLOW_LEVELS = [
  { label: 'Submitting Officer', detail: 'Executive Engineer — initiates and certifies measurements', icon: 'badge' },
  { label: 'Technical Level', detail: 'Superintending Engineer — technical scrutiny vs SSR', icon: 'rule' },
  { label: 'Finance Concurrence', detail: 'Controller of Accounts — funds & UC position', icon: 'account_balance' },
  { label: 'Competent Authority', detail: 'Secretary / Chief Engineer — final decision', icon: 'workspace_premium' },
]

/** Project workspace — Approval & Workflow Management: the workflow system for
 * this project's requests, with the full trail one click away in each
 * approval workspace. */
export function WorkspaceApprovalsPage() {
  const { t } = useI18n()
  const { showToast } = useToast()
  const { approvals } = useProjectWorkspace()
  const [state, setState] = useState<ApprovalItem[]>(approvals)
  const [confirm, setConfirm] = useState<{ title: string; message: string; run: () => void } | null>(null)

  const rows = useMemo(() => state, [state])
  const pending = state.filter((a) => a.status === 'pending')
  const overdue = pending.filter((a) => new Date(a.slaDueDate) < new Date('2026-02-10'))
  const urgent = state.filter((a) => a.priority === 'urgent' || a.priority === 'high')

  const act = (a: ApprovalItem, action: 'approve' | 'reject' | 'return' | 'clarify' | 'forward') => {
    if (action === 'approve') {
      void approvalsApi.approve(a.id, 'Approved by competent authority in project workspace.')
    } else if (action === 'reject') {
      void approvalsApi.reject(a.id, 'Rejected after review by competent authority.')
    }

    setState((list) =>
      list.map((x) => {
        if (x.id !== a.id) return x
        if (action === 'approve') return { ...x, status: 'approved', auditTrail: [...x.auditTrail, { timestamp: new Date().toISOString(), actor: 'Er. S. D. Kulkarni', role: 'Executive Engineer', action: 'Approved', remarks: 'Approved after verification and audit concurrence.' }] }
        if (action === 'reject') return { ...x, status: 'rejected', auditTrail: [...x.auditTrail, { timestamp: new Date().toISOString(), actor: 'Er. S. D. Kulkarni', role: 'Executive Engineer', action: 'Rejected', remarks: 'Rejected due to non-conformance with specifications.' }] }
        if (action === 'return') return { ...x, status: 'returned', auditTrail: [...x.auditTrail, { timestamp: new Date().toISOString(), actor: 'Er. S. D. Kulkarni', role: 'Executive Engineer', action: 'Returned', remarks: 'Returned for necessary correction.' }] }
        if (action === 'clarify') return { ...x, status: 'clarification', auditTrail: [...x.auditTrail, { timestamp: new Date().toISOString(), actor: 'Er. S. D. Kulkarni', role: 'Executive Engineer', action: 'Clarification Sought', remarks: 'Clarification requested from submitting authority.' }] }
        return { ...x, auditTrail: [...x.auditTrail, { timestamp: new Date().toISOString(), actor: 'Er. S. D. Kulkarni', role: 'Executive Engineer', action: 'Forwarded', remarks: 'Forwarded to next level authority.' }] }
      }),
    )
    const messages: Record<typeof action, string> = {
      approve: `${a.id} approved successfully — recorded in official audit trail.`,
      reject: `${a.id} rejected — official remarks recorded.`,
      return: `${a.id} returned to the submitting officer for correction.`,
      clarify: `Clarification requested on ${a.id}.`,
      forward: `${a.id} forwarded to the next level authority.`,
    }
    showToast(messages[action], action === 'reject' || action === 'return' ? 'warning' : 'success')
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Approval & Workflow Management"
        description="Multi-level workflow for this project's requests — approve, reject, return, seek clarification or forward, with a full audit trail on every action."
        actions={
          <Link to="/government/approvals" className="text-body-small text-primary-strong hover:underline">
            Open the global approval register →
          </Link>
        }
      />

      <KpiRow>
        <KpiCard label="Pending Decisions" value={pending.length} icon="approval" iconTone={pending.length ? 'warning' : 'neutral'} />
        <KpiCard label="Urgent / High Priority" value={urgent.length} icon="priority_high" iconTone={urgent.length ? 'danger' : 'neutral'} />
        <KpiCard label="Overdue (SLA crossed)" value={overdue.length} icon="timer_off" iconTone={overdue.length ? 'danger' : 'neutral'} />
        <KpiCard
          label="Decided"
          value={`${state.filter((a) => a.status === 'approved').length} ✓ / ${state.filter((a) => a.status === 'rejected').length} ✕`}
          icon="task_alt"
          iconTone="success"
        />
      </KpiRow>

      <Panel title="Multi-Level Approval Workflow" icon="account_tree" subtitle="Standard delegation followed by every request on this project.">
        <ol className="flex flex-col gap-2">
          {WORKFLOW_LEVELS.map((l, i) => (
            <li key={l.label}>
              <Card className="flex items-start gap-3 p-3">
                <span className="material-symbols-outlined rounded-control bg-primary-soft p-1.5 text-[20px] text-primary-strong" aria-hidden="true">
                  {l.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-label text-fg">
                    Level {i + 1} — {l.label}
                  </p>
                  <p className="text-caption text-fg-muted">{l.detail}</p>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel title={`Requests (${rows.length})`} icon="rule" bodyClassName="p-0">
        <DataTable
          minWidth={1040}
          rows={rows}
          rowKey={(a) => a.id}
          initialSort={{ key: 'sla', dir: 'asc' }}
          columns={[
            { key: 'id', header: 'Ref', isRowHeader: true, render: (a) => (
              <Link to={`/government/approvals/${encodeURIComponent(a.id)}`} className="nk-mono-id text-primary-strong hover:underline">
                {a.id}
              </Link>
            ) },
            { key: 'type', header: 'Request', render: (a) => <span className="block max-w-56 truncate" title={a.type}>{a.type}</span> },
            { key: 'stage', header: 'Current Stage', render: (a) => <span className="text-caption">{a.assignedTo}</span> },
            { key: 'sla', header: 'SLA', cellClassName: 'tabular-nums', sortable: true, sortValue: (a) => a.slaDueDate, render: (a) => <span className="text-caption tabular-nums">{formatSlaCountdown(a.slaDueDate)}</span> },
            { key: 'priority', header: t('common.priority'), render: (a) => <StatusBadge descriptor={PRIORITY[a.priority]} size="sm" /> },
            { key: 'status', header: t('common.status'), render: (a) => <StatusBadge descriptor={APPROVAL_STATUS[a.status]} size="sm" /> },
            { key: 'amount', header: t('common.amount'), cellClassName: 'tabular-nums', render: (a) => (a.amountCr != null ? formatCr(a.amountCr) : '—') },
          ]}
          rowActions={(a) => (
            <Link to={`/government/approvals/${encodeURIComponent(a.id)}`} className="text-caption text-primary-strong hover:underline">
              Open workspace
            </Link>
          )}
          emptyState={
            <div className="p-8 text-center text-body-small text-fg-muted">
              No approval requests are pending for this project — decisions appear here as soon as the register updates.
            </div>
          }
        />
        <p className="border-t border-border p-3 text-caption text-fg-subtle">
          Approve / reject / return / clarify / forward actions run from each request's workspace with confirmation; the trail
          is append-only.
        </p>
      </Panel>

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        onConfirm={() => confirm?.run()}
        danger
      />
    </div>
  )
}
