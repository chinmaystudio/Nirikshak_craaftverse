import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { Panel, Card } from '@/components/ui/Card'
import { TextField } from '@/components/ui/Fields'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { EmptyState } from '@/components/feedback/Feedback'
import { formatCr, formatDate } from '@/utils/format'
import { GRIEVANCE_STATUS, PROJECT_STATUS, MILESTONE_STATUS } from '@/utils/status'
import { citizenApi, projectsApi } from '@/api'
import { useApiData, useDebounced } from '@/hooks/useApiData'

/**
 * CitizenTrackPage — track a grievance by reference number (no login), and
 * see its redressal timeline. Case-insensitive lookup over demo data.
 */
export function CitizenTrackPage() {
  const { t } = useI18n()
  const [params] = useSearchParams()
  const [ref, setRef] = useState(params.get('ref') ?? '')
  const debounced = useDebounced(ref)
  const [search, setSearch] = useState('')
  const debouncedProject = useDebounced(search)

  const { data: grievance, loading } = useApiData(
    () => (debounced.trim() ? citizenApi.trackGrievance(debounced.trim()) : Promise.resolve(undefined)),
    [debounced],
  )

  const { data: projects } = useApiData(() => projectsApi.all(), [])
  const filteredProjects = useMemo(
    () =>
      (projects ?? []).filter((p) =>
        debouncedProject ? `${p.id} ${p.name} ${p.district}`.toLowerCase().includes(debouncedProject.toLowerCase()) : true,
      ),
    [projects, debouncedProject],
  )

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-heading-1 text-fg">{t('citizen.trackTitle')}</h1>
        <p className="mt-1 text-body-small text-fg-muted">{t('citizen.noLoginNote')} {t('common.mockDataNote')}</p>
      </div>

      <Card className="p-4">
        <TextField
          label="Reference number"
          block
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder={t('citizen.trackPlaceholder')}
          startIcon="confirmation_number"
          helper="Demo references: GRV-MH-9942, GRV-MH-9943, GRV-MH-9944, GRV-MH-9945"
        />
      </Card>

      {loading && <div className="p-4 text-center text-body-small text-fg-muted">{t('common.loading')}</div>}

      {ref.trim() && !loading && !grievance && (
        <p className="rounded-control border border-warning-border bg-warning-tint p-3 text-body-small text-warning-strong">
          {t('citizen.trackNotFound')}
        </p>
      )}

      {grievance && (
        <Panel title={`GRV ${grievance.id}`} icon="confirmation_number" subtitle={grievance.subject}>
          <div className="flex flex-wrap gap-2">
            <StatusBadge descriptor={GRIEVANCE_STATUS[grievance.status]} />
            <Badge tone="neutral" icon="category">{grievance.category}</Badge>
            <Badge tone="neutral" icon="location_on">{grievance.district}</Badge>
          </div>
          <h3 className="mt-3 text-heading-3 text-fg">{t('citizen.timeline')}</h3>
          <ol className="mt-2 flex flex-col gap-2 border-l border-border pl-4">
            {grievance.timeline.map((e, i) => (
              <li key={i} className="relative text-body-small">
                <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                <p className="text-fg">{e.action}</p>
                <p className="text-caption text-fg-subtle">{formatDate(e.timestamp)} • {e.note}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-caption text-fg-subtle">{t('citizen.privacyNote')}</p>
        </Panel>
      )}

      <Panel title={t('citizen.projectsTitle')} icon="search" bodyClassName="p-0">
        <div className="p-4 pb-0">
          <TextField label={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} startIcon="search" block />
        </div>
        {filteredProjects.length === 0 ? (
          <EmptyState icon="search_off" titleKey="common.noResults" />
        ) : (
          <ul className="divide-y divide-border">
            {filteredProjects.slice(0, 8).map((p) => (
              <li key={p.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/citizen/projects/${encodeURIComponent(p.id)}`} className="nk-mono-id text-primary-strong hover:underline">
                    {p.id}
                  </Link>
                  <StatusBadge descriptor={PROJECT_STATUS[p.status]} size="sm" />
                  <Badge tone="neutral" icon="account_balance">{formatCr(p.sanctionedAmountCr)}</Badge>
                  <span className="ml-auto text-caption text-fg-subtle">{p.district}</span>
                </div>
                <Link to={`/citizen/projects/${encodeURIComponent(p.id)}`} className="mt-1 block text-label text-fg hover:underline">
                  {p.name}
                </Link>
                <Progress value={p.physicalProgressPct} label={`${p.name} progress`} size="sm" className="mt-2" />
                {p.milestones[0] && (
                  <p className="mt-1 flex items-center gap-1.5 text-caption text-fg-subtle">
                    <span className="material-symbols-outlined text-[14px]" aria-hidden="true">flag</span>
                    {p.milestones[0].title} — {t(MILESTONE_STATUS[p.milestones[0].status].key)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
