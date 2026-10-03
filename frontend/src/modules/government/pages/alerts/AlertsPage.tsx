import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { Panel } from '@/components/ui/Card'
import { Select, TextField } from '@/components/ui/Fields'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/feedback/Feedback'
import { formatDate, formatRelative } from '@/utils/format'
import { ALERT_SEVERITY } from '@/utils/status'
import type { AlertItem } from '@/types'
import { alertsApi } from '@/api'
import { useApiData, useDebounced } from '@/hooks/useApiData'
import { ALERT_CATEGORIES } from '@/constants'
import { cn } from '@/utils/cn'

/**
 * AlertsPage — the spec's 8 alert categories (SLA breach, quality flag, fund
 * disbursal, tender activity, geo-inspection, grievance escalation,
 * litigation update, system & sync).
 */
export function AlertsPage() {
  const { t } = useI18n()
  const { data: alerts, loading } = useApiData(() => alertsApi.list(), [])
  const [severity, setSeverity] = useState('')
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search)

  const rows = useMemo(
    () =>
      (alerts ?? []).filter((a) => {
        if (severity && a.severity !== severity) return false
        if (category && a.category !== category) return false
        if (debounced && !`${a.id} ${a.title} ${a.body}`.toLowerCase().includes(debounced.toLowerCase())) return false
        return true
      }),
    [alerts, severity, category, debounced],
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-heading-1 text-fg">{t('nav.alerts')}</h1>
        <p className="mt-1 text-body-small text-fg-muted">
          Rule-based alerts across {ALERT_CATEGORIES.length} categories (mock data).
        </p>
      </div>

      <Panel title={t('common.filters')} icon="filter_list" bodyClassName="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TextField label={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} startIcon="search" />
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[{ value: '', label: t('common.all') }, ...ALERT_CATEGORIES.map((c) => ({ value: c, label: c }))]}
          />
          <Select
            label="Severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            options={[
              { value: '', label: t('common.all') },
              ...Object.entries(ALERT_SEVERITY).map(([k, d]) => ({ value: k, label: t(d.key) })),
            ]}
          />
        </div>
      </Panel>

      <Panel title={`Alerts (${rows.length})`} icon="notifications_active" bodyClassName="p-0">
        {loading ? (
          <div className="p-8 text-center text-body-small text-fg-muted">{t('common.loading')}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon="notifications_off" titleKey="common.noResults" />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((a) => (
              <li key={a.id} className={cn('flex flex-col gap-1.5 p-4', !a.read && 'bg-primary-soft/40')}>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge descriptor={ALERT_SEVERITY[a.severity]} size="sm" />
                  <Badge tone="neutral" icon="category">{a.category}</Badge>
                  <Badge tone="neutral" icon="widgets">{a.sourceModule}</Badge>
                  <span className="ml-auto text-caption text-fg-subtle" title={formatDate(a.timestamp)}>
                    {formatRelative(a.timestamp)}
                  </span>
                </div>
                <p className="text-label text-fg">{a.title}</p>
                <p className="text-body-small text-fg-muted">{a.body}</p>
                {a.projectId && (
                  <Link to={`/government/projects/${encodeURIComponent(a.projectId)}`} className="nk-mono-id text-caption text-primary-strong hover:underline">
                    {a.projectId}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <p className="text-caption text-fg-subtle">{t('common.mockDataNote')}</p>
    </div>
  )
}
