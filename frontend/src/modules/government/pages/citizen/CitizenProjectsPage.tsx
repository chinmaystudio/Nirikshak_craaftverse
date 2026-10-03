import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { Panel, Card } from '@/components/ui/Card'
import { TextField, Select } from '@/components/ui/Fields'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { formatCr } from '@/utils/format'
import { PROJECT_STATUS } from '@/utils/status'
import type { CitizenProjectSummary } from '@/types'
import { citizenApi } from '@/api'
import { useApiData, useDebounced } from '@/hooks/useApiData'

/**
 * CitizenProjectsPage — public project directory (no login). Shows only the
 * public-safe projection: no officer remarks, internal files or personal data.
 */
export function CitizenProjectsPage() {
  const { t } = useI18n()
  const { data: projects, loading } = useApiData(() => citizenApi.all(), [])
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search)
  const [district, setDistrict] = useState('')

  const districts = useMemo(
    () => Array.from(new Set((projects ?? []).map((p) => p.district))).sort(),
    [projects],
  )

  const rows = (projects ?? []).filter((p) => {
    if (district && p.district !== district) return false
    if (debounced && !`${p.id} ${p.name} ${p.department}`.toLowerCase().includes(debounced.toLowerCase())) return false
    return true
  })

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-heading-1 text-fg">{t('citizen.projectsTitle')}</h1>
        <p className="mt-1 text-body-small text-fg-muted">{t('citizen.noLoginNote')} {t('common.mockDataNote')}</p>
      </div>

      <Panel title={t('common.filters')} icon="filter_list" bodyClassName="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField label={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} startIcon="search" />
          <Select
            label={t('common.district')}
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            options={[{ value: '', label: t('common.all') }, ...districts.map((d) => ({ value: d, label: d }))]}
          />
        </div>
      </Panel>

      {loading ? <div className="p-8 text-center text-body-small text-fg-muted">{t('common.loading')}</div> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {rows.map((p) => (
          <CitizenProjectCard key={p.id} project={p} />
        ))}
      </div>
    </div>
  )
}

export function CitizenProjectCard({ project }: { project: CitizenProjectSummary }) {
  const { t } = useI18n()
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="nk-mono-id text-fg-muted">{project.id}</span>
        <StatusBadge descriptor={PROJECT_STATUS[project.status]} size="sm" />
      </div>
      <h2 className="text-heading-3 text-fg">
        <Link to={`/citizen/projects/${encodeURIComponent(project.id)}`} className="hover:underline">
          {project.name}
        </Link>
      </h2>
      <p className="text-body-small text-fg-muted">{project.scope}</p>
      <Progress value={project.physicalProgressPct} label={`${project.name} progress`} />
      <div className="flex flex-wrap gap-2">
        <Badge tone="neutral" icon="account_balance">{formatCr(project.sanctionedAmountCr)}</Badge>
        <Badge tone="neutral" icon="location_on">{project.district}</Badge>
        <Badge tone="neutral" icon="event">{t('citizen.expectedCompletion')}: {project.expectedCompletion}</Badge>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-2">
        <span className="text-caption text-fg-subtle">{t('citizen.executingContractor')}: {project.contractor}</span>
        <Link
          to={`/citizen/projects/${encodeURIComponent(project.id)}`}
          className="inline-flex min-h-8 items-center gap-1 rounded-control border border-border-strong bg-surface px-3 text-body-small text-fg transition-colors duration-fast hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {t('common.view')}
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
        </Link>
      </div>
    </Card>
  )
}
