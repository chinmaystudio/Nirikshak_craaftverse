import { Link, useParams } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { Panel, Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { LoadingBlock } from '@/components/feedback/Feedback'
import { formatCr, formatDate } from '@/utils/format'
import { MILESTONE_STATUS, PROJECT_STATUS } from '@/utils/status'
import { citizenApi } from '@/api'
import { useApiData } from '@/hooks/useApiData'

/**
 * CitizenProjectDetailPage — public project detail. Renders ONLY the
 * public-safe projection (no officer remarks, internal documents, litigation
 * strategy, contractor scoring or personal data).
 */
export function CitizenProjectDetailPage() {
  const { id = '' } = useParams()
  const { t } = useI18n()
  const { data: projects, loading } = useApiData(() => citizenApi.all(), [])
  const project = (projects ?? []).find((p) => p.id === decodeURIComponent(id))

  if (loading) return <LoadingBlock />
  if (!project) {
    return (
      <div className="nk-card p-10 text-center">
        <p className="text-heading-2 text-fg">Project not found</p>
        <p className="nk-mono-id mt-2 text-fg-muted">{id}</p>
        <Link to="/citizen/projects" className="mt-4 inline-block text-body-small text-primary-strong hover:underline">
          {t('citizen.projectsTitle')}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Breadcrumb" className="text-caption text-fg-muted">
        <Link to="/citizen" className="hover:underline">{t('citizen.portalTitle')}</Link>
        <span className="mx-1" aria-hidden="true">›</span>
        <Link to="/citizen/projects" className="hover:underline">{t('citizen.projectsTitle')}</Link>
        <span className="mx-1" aria-hidden="true">›</span>
        <span className="nk-mono-id">{project.id}</span>
      </nav>

      <Card className="p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="nk-mono-id text-fg-muted">{project.id}</span>
          <StatusBadge descriptor={PROJECT_STATUS[project.status]} />
        </div>
        <h1 className="mt-1 text-heading-1 text-fg">{project.name}</h1>
        <p className="mt-2 max-w-3xl text-body text-fg-muted">{project.scope}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="neutral" icon="account_balance">{t('citizen.sanctionedCost')}: {formatCr(project.sanctionedAmountCr)}</Badge>
          <Badge tone="neutral" icon="apartment">{project.department}</Badge>
          <Badge tone="neutral" icon="location_on">{project.district}</Badge>
          <Badge tone="neutral" icon="event">{t('citizen.expectedCompletion')}: {formatDate(project.expectedCompletion)}</Badge>
        </div>
      </Card>

      <Panel title={t('citizen.progressLabel')} icon="progress_activity">
        <Progress value={project.physicalProgressPct} label={`${project.name} physical progress`} size="md" />
        <p className="mt-2 text-caption text-fg-subtle">
          Physical progress as reported in the latest verified inspection. Financial figures are provisional until audited.
        </p>
      </Panel>

      <Panel title={t('citizen.publicMilestones')} icon="flag" subtitle="Published milestones only — internal notes are withheld.">
        <ol className="flex flex-col gap-3">
          {project.publicMilestones.map((m, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2 border-b border-border pb-3 last:border-0 last:pb-0">
              <StatusBadge descriptor={MILESTONE_STATUS[m.status]} size="sm" />
              <span className="text-body-small text-fg">{m.title}</span>
              <span className="ml-auto text-caption tabular-nums text-fg-subtle">{formatDate(m.plannedEnd)}</span>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel title={t('citizen.executingContractor')} icon="engineering">
        <p className="text-body-small text-fg">{project.contractor}</p>
        <p className="mt-1 text-caption text-fg-subtle">
          Contractor evaluation scores and internal correspondence are not published.
        </p>
      </Panel>

      <p className="text-caption text-fg-subtle">{t('common.mockDataNote')}</p>
    </div>
  )
}
