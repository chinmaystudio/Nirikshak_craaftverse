import { useMemo, useState } from 'react'
import { useI18n } from '@/context/I18nContext'
import { useProjectWorkspace } from '@/context/ProjectWorkspaceContext'
import { useToast } from '@/context/ToastContext'
import { Panel, Card } from '@/components/ui/Card'
import { DataTable } from '@/components/tables/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Drawer, Modal } from '@/components/modals/Modal'
import { PageHeader, KpiRow, FilterBar, DetailField, KpiCard } from '@/components/blocks/Page'
import { formatCr, formatDate } from '@/utils/format'
import { AUDIT_SEVERITY } from '@/utils/status'
import type { AuditFinding } from '@/types'

const FINDING_STATUS_LABEL: Record<AuditFinding['status'], string> = {
  open: 'Open',
  response_received: 'Response Received',
  corrective_action: 'Corrective Action',
  closed: 'Closed',
}

/** Project workspace — Audit Management: findings with corrective workflow and
 * the complete activity log (append-only / tamper-resistant). */
export function WorkspaceAuditPage() {
  const { t } = useI18n()
  const { showToast } = useToast()
  const { findings, approvals, bills, insights } = useProjectWorkspace()
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [detail, setDetail] = useState<AuditFinding | null>(null)
  const [closeTarget, setCloseTarget] = useState<AuditFinding | null>(null)

  const rows = useMemo(
    () =>
      findings.filter(
        (f) =>
          (!severityFilter || f.severity === severityFilter) &&
          (!statusFilter || f.status === statusFilter) &&
          (!search || `${f.id} ${f.auditTitle} ${f.observation} ${f.accountableOfficer}`.toLowerCase().includes(search.toLowerCase())),
      ),
    [findings, severityFilter, statusFilter, search],
  )

  const overdue = findings.filter((f) => f.status !== 'closed' && new Date(f.dueDate) < new Date('2026-02-10')).length
  const high = findings.filter((f) => f.severity === 'high' || f.severity === 'critical').length

  // Activity log assembled from every scoped source for the WHO/WHAT/WHEN view.
  const activity = useMemo(
    () => [
      ...approvals.flatMap((a) =>
        a.auditTrail.map((e, i) => ({
          id: `${a.id}-${i}`,
          when: e.timestamp,
          who: `${e.actor} (${e.role})`,
          what: `${e.action} — ${a.type}`,
          ref: a.id,
          module: 'Approvals',
        })),
      ),
      ...bills.map((b) => ({
        id: b.id,
        when: `${b.submittedOn}T10:00:00+05:30`,
        who: b.contractor,
        what: `Bill ${b.billNo} — ${BILL_LABEL[b.status] ?? b.status}`,
        ref: b.id,
        module: 'Bills',
      })),
      ...insights.map((i) => ({
        id: i.id,
        when: i.generatedOn,
        who: 'AI Monitoring (assisted)',
        what: i.title,
        ref: i.id,
        module: 'AI Insights',
      })),
    ].sort((a, b) => (a.when < b.when ? 1 : -1)),
    [approvals, bills, insights],
  )

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Audit Management"
        description="Financial, project, contractor, tender, payment and inspection audit history for this project — with corrective-action tracking and the append-only activity log."
        actions={
          <Button variant="outline" size="sm" icon="download" onClick={() => showToast('Audit compliance report exported (demo file).', 'info')}>
            {t('common.export')}
          </Button>
        }
      />

      <KpiRow>
        <KpiCard label="Audit Records" value={findings.length} icon="content_paste_search" />
        <KpiCard label="Open Findings" value={findings.filter((f) => f.status !== 'closed').length} icon="flag" iconTone="warning" />
        <KpiCard label="High Severity" value={high} icon="priority_high" iconTone={high ? 'danger' : 'neutral'} />
        <KpiCard label="Overdue Responses" value={overdue} icon="timer_off" iconTone={overdue ? 'danger' : 'neutral'} />
      </KpiRow>

      <FilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search audit id, title, observation, officer…"
        selects={[
          {
            label: 'Severity',
            value: severityFilter,
            onChange: setSeverityFilter,
            options: [{ value: '', label: t('common.all') }, ...Object.keys(AUDIT_SEVERITY).map((s) => ({ value: s, label: t(AUDIT_SEVERITY[s as keyof typeof AUDIT_SEVERITY].key) }))],
          },
          {
            label: t('common.status'),
            value: statusFilter,
            onChange: setStatusFilter,
            options: [{ value: '', label: t('common.all') }, ...Object.entries(FINDING_STATUS_LABEL).map(([k, v]) => ({ value: k, label: v }))],
          },
        ]}
        onClear={() => {
          setSearch('')
          setSeverityFilter('')
          setStatusFilter('')
        }}
      />

      <Panel title={`Audit Findings (${rows.length})`} icon="content_paste_search" bodyClassName="p-0">
        <DataTable
          minWidth={1040}
          rows={rows}
          rowKey={(f) => f.id}
          initialSort={{ key: 'due', dir: 'asc' }}
          columns={[
            { key: 'id', header: 'Ref', render: (f) => <span className="nk-mono-id text-fg-muted">{f.id}</span> },
            { key: 'title', header: 'Audit', isRowHeader: true, render: (f) => f.auditTitle },
            { key: 'severity', header: 'Severity', render: (f) => <StatusBadge descriptor={AUDIT_SEVERITY[f.severity]} size="sm" /> },
            { key: 'status', header: t('common.status'), render: (f) => <Badge tone={f.status === 'closed' ? 'success' : 'warning'} dot>{FINDING_STATUS_LABEL[f.status]}</Badge> },
            { key: 'amount', header: 'Amount', cellClassName: 'tabular-nums', sortable: true, sortValue: (f) => f.irregularityAmountCr ?? 0, render: (f) => (f.irregularityAmountCr ? formatCr(f.irregularityAmountCr) : '—') },
            { key: 'due', header: 'Due', cellClassName: 'tabular-nums', sortable: true, sortValue: (f) => f.dueDate, render: (f) => formatDate(f.dueDate) },
            { key: 'officer', header: 'Responsible', render: (f) => <span className="text-caption">{f.accountableOfficer}</span> },
          ]}
          rowActions={(f) => (
            <Button variant="outline" size="sm" className="!min-h-7 !px-2.5" onClick={() => setDetail(f)}>
              {t('common.view')}
            </Button>
          )}
          emptyState={
            <div className="p-8 text-center">
              <p className="text-body-small text-fg-muted">No audit findings against this project — the last inspection cycle closed clean.</p>
              <p className="mt-1 text-caption text-fg-subtle">Findings from AG/local-fund audits and inspection reviews appear here with their due dates.</p>
            </div>
          }
        />
      </Panel>

      <Panel title="Complete Activity Log" icon="receipt" subtitle="WHO • WHAT • WHEN — assembled from approvals, bills and AI monitoring for this project." bodyClassName="p-0">
        <DataTable
          minWidth={900}
          rows={activity}
          rowKey={(a) => a.id}
          paginated
          pageSize={10}
          columns={[
            { key: 'when', header: 'WHEN', cellClassName: 'tabular-nums', render: (a) => <span className="text-caption">{formatDate(a.when)}</span> },
            { key: 'who', header: 'WHO', isRowHeader: true, render: (a) => a.who },
            { key: 'what', header: 'WHAT', render: (a) => <span className="block max-w-72 truncate" title={a.what}>{a.what}</span> },
            { key: 'module', header: 'Module', render: (a) => <Badge tone="neutral">{a.module}</Badge> },
            { key: 'ref', header: 'Ref', render: (a) => <span className="nk-mono-id text-fg-muted">{a.ref}</span> },
          ]}
        />
        <p className="border-t border-border p-3 text-caption text-fg-subtle">
          The audit trail is append-only and tamper-resistant: entries cannot be edited or deleted, only superseded by new actions. Every record carries actor, role and timestamp.
        </p>
      </Panel>

      <Card className="p-3 text-caption text-fg-subtle">{t('common.mockDataNote')}</Card>

      {/* Finding drawer */}
      <Drawer open={detail !== null} onClose={() => setDetail(null)} title={detail ? `Audit ${detail.id}` : ''} titleIcon="content_paste_search" width="max-w-lg">
        {detail && (
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge descriptor={AUDIT_SEVERITY[detail.severity]} />
              <Badge tone={detail.status === 'closed' ? 'success' : 'warning'} dot>{FINDING_STATUS_LABEL[detail.status]}</Badge>
            </div>
            <Panel title="Finding" icon="report">
              <dl className="grid grid-cols-2 gap-3 text-body-small">
                <div className="col-span-2"><dt className="text-fg-subtle">Audit</dt><dd className="text-fg">{detail.auditTitle}</dd></div>
                <div className="col-span-2"><dt className="text-fg-subtle">Observation / evidence</dt><dd className="text-fg-muted">{detail.observation}</dd></div>
                <DetailField label="Financial impact" value={<span className="tabular-nums">{detail.irregularityAmountCr ? formatCr(detail.irregularityAmountCr) : '—'}</span>} />
                <DetailField label="Category" value={detail.category} />
                <DetailField label="Responsible officer" value={detail.accountableOfficer} />
                <DetailField label="Raised on" value={formatDate(detail.raisedOn)} />
                <DetailField label="Due date" value={formatDate(detail.dueDate)} />
                <DetailField label="Status" value={FINDING_STATUS_LABEL[detail.status]} />
              </dl>
            </Panel>
            <Panel title="Corrective Action" icon="build">
              {detail.status === 'closed' ? (
                <p className="rounded-control border border-success-border bg-success-tint p-2.5 text-body-small text-success-strong">
                  <span className="material-symbols-outlined mr-1 align-middle text-[16px]" aria-hidden="true">verified</span>
                  Corrective action completed and verified by the audit party. Finding closed.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-body-small text-fg-muted">
                    Corrective action plan is due with {detail.accountableOfficer} by {formatDate(detail.dueDate)}. Overdue responses
                    escalate automatically to the Superintending Engineer.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      icon="task_alt"
                      onClick={() => {
                        showToast(`Corrective action for ${detail.id} recorded as completed — verification pending (demo).`, 'success')
                        setDetail(null)
                      }}
                    >
                      Mark Corrective Action Done
                    </Button>
                    <Button variant="outline" size="sm" icon="schedule" onClick={() => showToast(`Due date extension request for ${detail.id} routed to the audit party (demo).`, 'info')}>
                      Request Extension
                    </Button>
                  </div>
                </div>
              )}
            </Panel>
          </div>
        )}
      </Drawer>
    </div>
  )
}

const BILL_LABEL: Record<string, string> = {
  submitted: 'submitted',
  verified: 'verified',
  approved: 'approved for payment',
  paid: 'paid',
  returned: 'returned to contractor',
}
