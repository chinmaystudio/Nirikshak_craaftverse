import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { Panel, Card } from '@/components/ui/Card'
import { Select, TextField } from '@/components/ui/Fields'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/tables/DataTable'
import { Modal } from '@/components/modals/Modal'
import { formatDate, formatSlaCountdown } from '@/utils/format'
import { GRIEVANCE_STATUS, PRIORITY } from '@/utils/status'
import type { Grievance } from '@/types'
import { grievancesApi } from '@/api'
import { useApiData, useDebounced } from '@/hooks/useApiData'

/**
 * GrievancesPage — Grievances & Complaints register with the spec's mandatory
 * SLA countdown. Submitter identities stay masked (privacy rule).
 */
export function GrievancesPage() {
  const { t } = useI18n()
  const { data: grievances, loading } = useApiData(() => grievancesApi.all(), [])
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search)
  const [selected, setSelected] = useState<Grievance | null>(null)

  const rows = useMemo(
    () =>
      (grievances ?? []).filter((g) => {
        if (status && g.status !== status) return false
        if (priority && g.priority !== priority) return false
        if (debounced && !`${g.id || ''} ${g.subject || ''} ${g.category || ''}`.toLowerCase().includes(debounced.toLowerCase()))
          return false
        return true
      }),
    [grievances, status, priority, debounced],
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-heading-1 text-fg">{t('nav.grievances')}</h1>
        <p className="mt-1 text-body-small text-fg-muted">
          Public grievance redressal register with SLA countdowns. Submitter identities are masked by design.
        </p>
      </div>

      <Panel title={t('common.filters')} icon="filter_list" bodyClassName="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TextField label={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} startIcon="search" />
          <Select
            label={t('common.status')}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: '', label: t('common.all') },
              ...Object.entries(GRIEVANCE_STATUS).map(([k, d]) => ({ value: k, label: t(d.key) })),
            ]}
          />
          <Select
            label={t('common.priority')}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={[
              { value: '', label: t('common.all') },
              ...Object.entries(PRIORITY).map(([k, d]) => ({ value: k, label: t(d.key) })),
            ]}
          />
        </div>
      </Panel>

      <Panel title={`Grievances (${rows.length})`} icon="contact_support" bodyClassName="p-0">
        {loading ? <div className="p-8 text-center text-body-small text-fg-muted">{t('common.loading')}</div> : (
          <DataTable<Grievance>
            minWidth={1080}
            rows={rows}
            rowKey={(g) => g.id}
            columns={[
              { key: 'id', header: 'Grievance ID', isRowHeader: true, render: (g) => <span className="nk-mono-id text-fg-muted">{g.id}</span> },
              { key: 'subject', header: 'Subject', render: (g) => <span className="block max-w-56 truncate" title={g.subject}>{g.subject}</span> },
              { key: 'category', header: 'Category', render: (g) => <Badge tone="neutral">{g.category}</Badge> },
              { key: 'project', header: t('common.project'), render: (g) => g.projectId
                ? <Link to={`/government/projects/${encodeURIComponent(g.projectId)}`} className="nk-mono-id text-primary-strong hover:underline">{g.projectId}</Link>
                : '—' },
              { key: 'status', header: t('common.status'), render: (g) => <StatusBadge descriptor={GRIEVANCE_STATUS[g.status]} size="sm" /> },
              { key: 'sla', header: 'SLA', render: (g) => <span className="text-caption tabular-nums">{formatSlaCountdown(g.slaDeadline)}</span> },
              { key: 'priority', header: t('common.priority'), render: (g) => <StatusBadge descriptor={PRIORITY[g.priority]} size="sm" /> },
              { key: 'assigned', header: t('common.assignedTo'), render: (g) => <span className="text-caption">{g.assignedTo}</span> },
            ]}
            rowActions={(g) => (
              <Button variant="outline" size="sm" onClick={() => setSelected(g)}>
                {t('common.details')}
              </Button>
            )}
          />
        )}
      </Panel>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={`Grievance ${selected?.id ?? ''}`}
        titleIcon="contact_support"
        size="lg"
        footer={
          <Button variant="primary" onClick={() => setSelected(null)}>
            {t('common.close')}
          </Button>
        }
      >
        {selected && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge descriptor={GRIEVANCE_STATUS[selected.status]} />
              <StatusBadge descriptor={PRIORITY[selected.priority]} size="sm" />
              <Badge tone="neutral" icon="schedule">{formatSlaCountdown(selected.slaDeadline)}</Badge>
              <Badge tone="neutral" icon="category">{selected.category}</Badge>
            </div>
            <dl className="grid grid-cols-1 gap-2 text-body-small sm:grid-cols-2">
              <div><dt className="text-fg-subtle">Subject</dt><dd className="text-fg">{selected.subject}</dd></div>
              <div><dt className="text-fg-subtle">{t('common.district')}</dt><dd className="text-fg">{selected.district}</dd></div>
              <div><dt className="text-fg-subtle">Submitted on</dt><dd className="tabular-nums text-fg">{formatDate(selected.submittedOn)}</dd></div>
              <div><dt className="text-fg-subtle">SLA due</dt><dd className="tabular-nums text-fg">{formatDate(selected.slaDeadline)}</dd></div>
            </dl>
            <Card className="p-3">
              <p className="nk-label">Description</p>
              <p className="mt-1 text-body-small text-fg">{selected.description}</p>
            </Card>
            <div>
              <p className="nk-label">Redressal Timeline</p>
              <ol className="mt-2 flex flex-col gap-2 border-l border-border pl-4">
                {selected.timeline.map((e, i) => (
                  <li key={i} className="relative text-body-small">
                    <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                    <p className="text-fg">{e.action} — <span className="text-fg-muted">{e.actor}</span></p>
                    <p className="text-caption text-fg-subtle">{formatDate(e.timestamp)} • {e.note}</p>
                  </li>
                ))}
              </ol>
            </div>
            <p className="text-caption text-fg-subtle">
              Submitter: {selected.submittedBy} — personal details are masked per the privacy policy.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
