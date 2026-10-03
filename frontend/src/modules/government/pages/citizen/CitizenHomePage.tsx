import { Link } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { KpiCard } from '@/components/charts/KpiCard'
import { formatCr } from '@/utils/format'
import { PROJECT_STATUS } from '@/utils/status'
import { citizenApi } from '@/api'
import { useApiData } from '@/hooks/useApiData'

/**
 * CitizenHomePage — public landing page for the transparency portal.
 * Hero + counts + featured projects; no login required anywhere.
 */
export function CitizenHomePage() {
  const { t } = useI18n()
  const { data: projects } = useApiData(() => citizenApi.all(), [])

  const all = projects ?? []
  const totalOutlay = all.reduce((s, p) => s + p.sanctionedAmountCr, 0)
  const avgProgress = all.length ? all.reduce((s, p) => s + p.physicalProgressPct, 0) / all.length : 0
  const inExecution = all.filter((p) => p.status === 'in_execution').length
  const featured = all.slice(0, 3)

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <Card className="overflow-hidden p-6 md:p-10">
        <div className="max-w-2xl">
          <p className="nk-label text-primary-strong">{t('citizen.portalTitle')}</p>
          <h1 className="mt-2 text-[1.9rem] font-bold leading-tight text-fg md:text-[2.4rem]">
            {t('citizen.heroTitle')}
          </h1>
          <p className="mt-3 text-body-lg text-fg-muted">{t('citizen.heroBody')}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/citizen/projects">
              <span className="inline-flex min-h-12 items-center gap-2 rounded-control border border-primary-border bg-primary px-5 text-button text-primary-on transition-colors duration-fast hover:bg-primary-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">list_alt</span>
                {t('citizen.browseProjects')}
              </span>
            </Link>
            <Link to="/citizen/nearby">
              <span className="inline-flex min-h-12 items-center gap-2 rounded-control border border-border-strong bg-surface px-5 text-button text-fg transition-colors duration-fast hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">near_me</span>
                {t('citizen.nearby')}
              </span>
            </Link>
            <Link to="/citizen/grievance">
              <span className="inline-flex min-h-12 items-center gap-2 rounded-control border border-border-strong bg-surface px-5 text-button text-fg transition-colors duration-fast hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">campaign</span>
                {t('citizen.fileGrievance')}
              </span>
            </Link>
          </div>
        </div>
      </Card>

      {/* Open data counts */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Published projects" value={all.length} icon="apps" />
        <KpiCard label="Sanctioned outlay" value={formatCr(totalOutlay)} icon="account_balance" />
        <KpiCard label="In execution" value={inExecution} icon="progress_activity" iconTone="primary" />
        <KpiCard label="Avg. physical progress" value={`${avgProgress.toFixed(1)}%`} icon="stacked_line_chart" iconTone="success" />      </div>

      {/* Featured projects */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-heading-2 text-fg">{t('citizen.projectsTitle')}</h2>
          <Link to="/citizen/projects" className="text-body-small text-primary-strong hover:underline">
            {t('common.viewAll')} →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {featured.map((p) => (
            <Card key={p.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-center gap-2">
                <span className="nk-mono-id text-fg-muted">{p.id}</span>
                <StatusBadge descriptor={PROJECT_STATUS[p.status]} size="sm" />
              </div>
              <h3 className="text-heading-3 text-fg">{p.name}</h3>
              <Progress value={p.physicalProgressPct} label={`${p.name} progress`} size="sm" />
              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral" icon="account_balance">{formatCr(p.sanctionedAmountCr)}</Badge>
                <Badge tone="neutral" icon="location_on">{p.district}</Badge>
              </div>
              <Link to={`/citizen/projects/${encodeURIComponent(p.id)}`} className="mt-auto">
                <span className="flex min-h-8 w-full items-center justify-center gap-1 rounded-control border border-border-strong bg-surface px-3 text-body-small text-fg transition-colors duration-fast hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  {t('common.viewProject')}
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
                </span>
              </Link>
            </Card>
          ))}
        </div>
      </div>

      {/* How it works */}
      <Card className="p-5">
        <h2 className="text-heading-2 text-fg">Open by design</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <p className="nk-label">Published data</p>
            <p className="mt-1 text-body-small text-fg-muted">
              Sanctioned scope, cost, contractor and verified progress — the same record officers work from.
            </p>
          </div>
          <div>
            <p className="nk-label">No account needed</p>
            <p className="mt-1 text-body-small text-fg-muted">
              Browse and track without signing in. Personal details are never required to view public projects.
            </p>
          </div>
          <div>
            <p className="nk-label">Grievances with SLA</p>
            <p className="mt-1 text-body-small text-fg-muted">
              Every grievance gets a reference number and a time-bound redressal path you can follow publicly.
            </p>
          </div>
        </div>
      </Card>

      <p className="text-caption text-fg-subtle">{t('common.mockDataNote')}</p>
    </div>
  )
}
