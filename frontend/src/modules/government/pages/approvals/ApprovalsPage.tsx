import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { Panel } from '@/components/ui/Card'
import { Select, TextField } from '@/components/ui/Fields'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable } from '@/components/tables/DataTable'
import { formatCr, formatDate, formatSlaCountdown } from '@/utils/format'
import { APPROVAL_STATUS, PRIORITY } from '@/utils/status'
import type { ApprovalItem } from '@/types'
import { approvalsApi } from '@/api'
import { useApiData, useDebounced } from '@/hooks/useApiData'

/**
 * ApprovalsPage — global approval register. Selecting an item opens its
 * dedicated approval workspace (/government/approvals/:id) where all
 * request-specific modules live.
 */
export function ApprovalsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { data: approvals, loading } = useApiData(() => approvalsApi.all(), [])
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search)

  const rows = useMemo(
    () =>
      (approvals ?? []).filter((a) => {
        if (status && a.status !== status) return false
        if (priority && a.priority !== priority) return false
        if (
          debounced &&
          !`${a.id || ''} ${a.type || ''} ${a.projectId || ''} ${a.projectName || ''}`.toLowerCase().includes(debounced.toLowerCase())
        )
          return false
        return true
      }),
    [approvals, status, priority, debounced],
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-heading-1 text-fg">{t('nav.approvals')}</h1>
        <p className="mt-1 text-body-small text-fg-muted">
          Pending approvals with SLA due dates and a full audit trail on every action (mock data).
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
              ...Object.entries(APPROVAL_STATUS).map(([k, d]) => ({ value: k, label: t(d.key) })),
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

      <Panel title={`Approval Queue (${rows.length})`} icon="approval" bodyClassName="p-0">
        {loading ? <div className="p-8 text-center text-body-small text-fg-muted">{t('common.loading')}</div> : (
          <DataTable<ApprovalItem>
            minWidth={1100}
            rows={rows}
            rowKey={(a) => a.id}
            columns={[
              { key: 'id', header: 'Approval ID', isRowHeader: true, render: (a) => <span className="nk-mono-id text-fg-muted">{a.id}</span> },
              { key: 'type', header: 'Type', render: (a) => <span className="block max-w-44 truncate" title={a.type}>{a.type}</span> },
              { key: 'project', header: t('common.project'), render: (a) => (
                <Link to={`/government/projects/${encodeURIComponent(a.projectId)}`} className="text-primary-strong hover:underline">
                  <span className="nk-mono-id">{a.projectId}</span>
                </Link>
              ) },
              { key: 'status', header: t('common.status'), render: (a) => <StatusBadge descriptor={APPROVAL_STATUS[a.status]} size="sm" /> },
              { key: 'amount', header: t('common.amount'), cellClassName: 'tabular-nums', render: (a) => (a.amountCr != null ? formatCr(a.amountCr) : '—') },
              { key: 'sla', header: 'SLA', render: (a) => <span className="text-caption tabular-nums">{formatSlaCountdown(a.slaDueDate)}</span> },
              { key: 'priority', header: t('common.priority'), render: (a) => <StatusBadge descriptor={PRIORITY[a.priority]} size="sm" /> },
              { key: 'assigned', header: t('common.assignedTo'), render: (a) => <span className="text-caption">{a.assignedTo}</span> },
            ]}
            rowActions={(a) => (
              <Button variant="outline" size="sm" onClick={() => navigate(`/government/approvals/${a.id}`)}>
                {t('common.details')}
              </Button>
            )}
          />
        )}
      </Panel>
    </div>
  )
}
