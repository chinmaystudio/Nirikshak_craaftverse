import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { Panel, Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Fields'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/tables/DataTable'
import { formatDate, formatCr } from '@/utils/format'
import { AUDIT_SEVERITY } from '@/utils/status'
import type { AuditFinding } from '@/types'
import { auditApi } from '@/api'
import { useApiData } from '@/hooks/useApiData'

const FINDING_STATUS: Record<AuditFinding['status'], { label: string; tone: 'warning' | 'info' | 'success' | 'neutral' }> = {
  open: { label: 'Open', tone: 'warning' },
  response_received: { label: 'Response Received', tone: 'info' },
  corrective_action: { label: 'Corrective Action', tone: 'info' },
  closed: { label: 'Closed', tone: 'success' },
}

/**
 * AuditPage — Audit Management: internal audit observations with severity,
 * accountable officers, irregularity amounts and due dates.
 */
export function AuditPage() {
  const { t } = useI18n()
  const { data: findings, loading } = useApiData(() => auditApi.findings(), [])
  const [severity, setSeverity] = useState('')

  const rows = useMemo(() => (findings ?? []).filter((f) => (severity ? f.severity === severity : true)), [findings, severity])
  const irregularTotal = rows.reduce((s, f) => s + (f.irregularityAmountCr ?? 0), 0)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-heading-1 text-fg">{t('nav.audit')}</h1>
        <p className="mt-1 text-body-small text-fg-muted">
          Audit paras and observations with accountable officers and corrective status (mock data).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-caption uppercase tracking-[0.05em] text-fg-subtle">Findings listed</p>
          <p className="mt-1 text-display tabular-nums text-fg">{rows.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-caption uppercase tracking-[0.05em] text-fg-subtle">Open / critical</p>
          <p className="mt-1 text-display tabular-nums text-fg">
            {rows.filter((f) => f.status !== 'closed').length}
            <span className="text-body-small text-fg-subtle"> / {rows.filter((f) => f.severity === 'critical').length}</span>
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-caption uppercase tracking-[0.05em] text-fg-subtle">Irregularity flagged</p>
          <p className="mt-1 text-display tabular-nums text-fg">{formatCr(irregularTotal)}</p>
        </Card>
      </div>

      <Panel title={t('common.filters')} icon="filter_list" bodyClassName="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select
            label="Severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            options={[
              { value: '', label: t('common.all') },
              ...Object.entries(AUDIT_SEVERITY).map(([k, d]) => ({ value: k, label: t(d.key) })),
            ]}
          />
        </div>
      </Panel>

      <Panel title={`Audit Findings (${rows.length})`} icon="policy" bodyClassName="p-0">
        {loading ? <div className="p-8 text-center text-body-small text-fg-muted">{t('common.loading')}</div> : (
          <DataTable<AuditFinding>
            minWidth={1100}
            rows={rows}
            rowKey={(f) => f.id}
            columns={[
              { key: 'id', header: 'Finding ID', isRowHeader: true, render: (f) => <span className="nk-mono-id text-fg-muted">{f.id}</span> },
              { key: 'audit', header: 'Audit', render: (f) => <span className="block max-w-56 truncate" title={f.auditTitle}>{f.auditTitle}</span> },
              { key: 'severity', header: 'Severity', render: (f) => <StatusBadge descriptor={AUDIT_SEVERITY[f.severity]} size="sm" /> },
              { key: 'category', header: 'Category', render: (f) => <Badge tone="neutral">{f.category}</Badge> },
              { key: 'project', header: t('common.project'), render: (f) => f.projectId
                ? <Link to={`/government/projects/${encodeURIComponent(f.projectId)}`} className="nk-mono-id text-primary-strong hover:underline">{f.projectId}</Link>
                : '—' },
              { key: 'amount', header: 'Irregularity', cellClassName: 'tabular-nums', render: (f) => (f.irregularityAmountCr != null ? formatCr(f.irregularityAmountCr) : '—') },
              { key: 'status', header: t('common.status'), render: (f) => <Badge tone={FINDING_STATUS[f.status].tone} icon={f.status === 'closed' ? 'check_circle' : 'hourglass_top'}>{FINDING_STATUS[f.status].label}</Badge> },
              { key: 'due', header: 'Due', cellClassName: 'tabular-nums', render: (f) => formatDate(f.dueDate) },
              { key: 'officer', header: 'Accountable', render: (f) => <span className="text-caption">{f.accountableOfficer}</span> },
            ]}
          />
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {rows
          .filter((f) => f.severity === 'critical' || f.severity === 'high')
          .map((f) => (
            <Card key={f.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="nk-mono-id text-fg-muted">{f.id}</p>
                <StatusBadge descriptor={AUDIT_SEVERITY[f.severity]} size="sm" />
              </div>
              <h3 className="mt-0.5 text-heading-3 text-fg">{f.auditTitle}</h3>
              <p className="mt-2 text-body-small text-fg-muted">{f.observation}</p>
            </Card>
          ))}
      </div>
      <p className="text-caption text-fg-subtle">{t('common.mockDataNote')}</p>
    </div>
  )
}
