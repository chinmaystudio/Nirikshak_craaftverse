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
import { Select } from '@/components/ui/Fields'
import { PageHeader, KpiRow, FilterBar, DetailField, KpiCard } from '@/components/blocks/Page'
import { formatDate } from '@/utils/format'
import { ALERT_SEVERITY } from '@/utils/status'
import type { AlertItem } from '@/types'

const SEVERITY_TONE = {
  critical: { key: 'severity.critical', tone: 'danger', icon: 'error' },
  warning: { key: 'severity.warning', tone: 'warning', icon: 'warning' },
  info: { key: 'severity.info', tone: 'info', icon: 'info' },
} as const

/** Project workspace — Alerts & Notifications: severity triage with
 * acknowledge / assign / resolve / escalate actions. */
export function WorkspaceAlertsPage() {
  const { t } = useI18n()
  const { showToast } = useToast()
  const { alerts } = useProjectWorkspace()
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({})
  const [detail, setDetail] = useState<AlertItem | null>(null)
  const [assignOpen, setAssignOpen] = useState<AlertItem | null>(null)

  const categories = useMemo(() => [...new Set(alerts.map((a) => a.category))], [alerts])

  const rows = useMemo(
    () =>
      alerts.filter(
        (a) =>
          (!severityFilter || a.severity === severityFilter) &&
          (!categoryFilter || a.category === categoryFilter) &&
          (!search || `${a.title} ${a.body} ${a.sourceModule}`.toLowerCase().includes(search.toLowerCase())),
      ),
    [alerts, severityFilter, categoryFilter, search],
  )

  const counts = {
    critical: alerts.filter((a) => a.severity === 'critical').length,
    warning: alerts.filter((a) => a.severity === 'warning').length,
    info: alerts.filter((a) => a.severity === 'info').length,
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Alerts & Notifications"
        description="Delay, budget, milestone, payment, quality and AI-generated alerts on this project — triage, acknowledge and track to closure."
        actions={
          <Button variant="outline" size="sm" icon="done_all" onClick={() => showToast('All visible alerts acknowledged (demo).', 'info')}>
            Acknowledge All
          </Button>
        }
      />

      <KpiRow>
        <KpiCard label="Critical" value={counts.critical} icon="error" iconTone={counts.critical ? 'danger' : 'neutral'} />
        <KpiCard label="Warning" value={counts.warning} icon="notification_important" iconTone="warning" />
        <KpiCard label="Information" value={counts.info} icon="info" iconTone="neutral" />
        <KpiCard label="Open" value={alerts.filter((a) => !acknowledged[a.id]).length} icon="pending_actions" iconTone="warning" />
      </KpiRow>

      <FilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search alerts…"
        selects={[
          {
            label: 'Severity',
            value: severityFilter,
            onChange: setSeverityFilter,
            options: [{ value: '', label: t('common.all') }, ...Object.keys(SEVERITY_TONE).map((s) => ({ value: s, label: t(SEVERITY_TONE[s as keyof typeof SEVERITY_TONE].key) }))],
          },
          {
            label: 'Category',
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [{ value: '', label: t('common.all') }, ...categories.map((c) => ({ value: c, label: c }))],
          },
        ]}
        onClear={() => {
          setSearch('')
          setSeverityFilter('')
          setCategoryFilter('')
        }}
      />

      <Panel title={`Alert Queue (${rows.length})`} icon="crisis_alert" bodyClassName="p-0">
        <DataTable
          minWidth={940}
          rows={rows}
          rowKey={(a) => a.id}
          initialSort={{ key: 'date', dir: 'desc' }}
          columns={[
            { key: 'severity', header: 'Severity', render: (a) => <StatusBadge descriptor={SEVERITY_TONE[a.severity as keyof typeof SEVERITY_TONE]} size="sm" /> },
            { key: 'title', header: 'Alert', isRowHeader: true, render: (a) => <span className="block max-w-72 truncate" title={a.title}>{a.title}</span> },
            { key: 'category', header: 'Category', render: (a) => <Badge tone="neutral">{a.category}</Badge> },
            { key: 'module', header: 'Source', render: (a) => <span className="text-caption text-fg-muted">{a.sourceModule}</span> },
            { key: 'date', header: 'Detected', cellClassName: 'tabular-nums', sortable: true, sortValue: (a) => a.timestamp, render: (a) => formatDate(a.timestamp) },
            {
              key: 'status',
              header: t('common.status'),
              render: (a) => (
                <Badge tone={acknowledged[a.id] ? 'success' : 'warning'} icon={acknowledged[a.id] ? 'task_alt' : 'hourglass_top'}>
                  {acknowledged[a.id] ? 'Acknowledged' : 'Open'}
                </Badge>
              ),
            },
          ]}
          rowActions={(a) => (
            <Button variant="outline" size="sm" className="!min-h-7 !px-2.5" onClick={() => setDetail(a)}>
              {t('common.view')}
            </Button>
          )}
          emptyState={
            <div className="p-8 text-center">
              <p className="text-body-small text-fg-muted">No active alerts on this project.</p>
              <p className="mt-1 text-caption text-fg-subtle">New alerts appear here the moment monitoring rules or SLA checks trigger.</p>
            </div>
          }
        />
      </Panel>

      <Card className="p-3 text-caption text-fg-subtle">{t('common.mockDataNote')}</Card>

      <Drawer open={detail !== null} onClose={() => setDetail(null)} title={detail ? 'Alert Detail' : ''} titleIcon="crisis_alert" width="max-w-md">
        {detail && (
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge descriptor={SEVERITY_TONE[detail.severity as keyof typeof SEVERITY_TONE]} />
              <Badge tone="neutral" icon="category">{detail.category}</Badge>
              <Badge tone="neutral" icon="schedule">{formatDate(detail.timestamp)}</Badge>
            </div>
            <Panel title="Description" icon="info">
              <p className="text-label text-fg">{detail.title}</p>
              <p className="mt-1 text-body-small text-fg-muted">{detail.body}</p>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-body-small">
                <DetailField label="Source module" value={detail.sourceModule} />
                <DetailField label="Project" value={<span className="nk-mono-id">{detail.projectId ?? '—'}</span>} />
                <DetailField label="Detected" value={formatDate(detail.timestamp)} />
                <DetailField label="Assigned officer" value="Er. S. D. Kulkarni" />
              </dl>
            </Panel>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="sm"
                icon="task_alt"
                onClick={() => {
                  setAcknowledged((m) => ({ ...m, [detail.id]: true }))
                  showToast(`Alert ${detail.id} acknowledged (demo).`, 'success')
                  setDetail(null)
                }}
              >
                {t('common.acknowledge')}
              </Button>
              <Button variant="outline" size="sm" icon="person_add" onClick={() => setAssignOpen(detail)}>
                {t('common.assign')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon="task_alt"
                onClick={() => {
                  showToast(`Alert ${detail.id} marked resolved (demo).`, 'success')
                  setDetail(null)
                }}
              >
                {t('common.resolve')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon="north_east"
                onClick={() => showToast(`Alert ${detail.id} escalated to SE (demo).`, 'warning')}
              >
                {t('common.escalate')}
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={assignOpen !== null}
        onClose={() => setAssignOpen(null)}
        title="Assign Alert"
        titleIcon="person_add"
        size="sm"
        footer={<Button variant="outline" onClick={() => setAssignOpen(null)}>{t('common.close')}</Button>}
      >
        <div className="flex flex-col gap-3">
          <Select
            label="Assign to"
            value="dy"
            onChange={() => undefined}
            options={[
              { value: 'dy', label: 'Er. A. S. Shaikh — Dy. Engineer' },
              { value: 'ee', label: 'Er. S. D. Kulkarni — Executive Engineer' },
              { value: 'con', label: 'Contractor (ABC Infrastructure) — corrective action' },
            ]}
          />
          <Button
            variant="primary"
            onClick={() => {
              showToast(`Alert assigned — SLA tracking continues (demo).`, 'success')
              setAssignOpen(null)
            }}
          >
            {t('common.confirm')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
