import { useEffect, useMemo } from 'react'
import { Link, Outlet, useLocation, useParams } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { ProjectWorkspaceProvider, useProjectWorkspace } from '@/context/ProjectWorkspaceContext'
import { buildWorkspaceNav } from '@/constants'
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { LoadingBlock } from '@/components/feedback/Feedback'
import { formatDate } from '@/utils/format'
import { PROJECT_STATUS } from '@/utils/status'

/**
 * ProjectWorkspaceLayout — the shell every project module renders inside.
 * Establishes the project context (identity header + scoped datasets) and
 * keeps the selected project in the URL: /government/projects/:id/<module>.
 */
export function ProjectWorkspaceLayout() {
  const { id = '' } = useParams()
  return (
    <ProjectWorkspaceProvider projectId={id}>
      <WorkspaceShell />
    </ProjectWorkspaceProvider>
  )
}

function WorkspaceShell() {
  const { t } = useI18n()
  const location = useLocation()
  const { pathname } = location
  const { id = '' } = useParams()
  const { project } = useProjectWorkspace()

  // Breadcrumb label for the active module (direct child of the workspace tree).
  const moduleLabel = useMemo(() => {
    const hit = buildWorkspaceNav(id).find(
      (n) => n.to && n.to.split(/[?#]/)[0] === pathname,
    )
    if (!hit) return null
    return hit.labelKey ? t(hit.labelKey) : (hit.label ?? null)
  }, [id, pathname, t])

  // Scroll to module section anchors (e.g. /budget#payments) on navigation.
  useEffect(() => {
    if (!location.hash) return
    const el = document.getElementById(location.hash.slice(1))
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location])

  if (project === undefined) return <LoadingBlock />
  if (!project) {
    return (
      <div className="nk-card p-10 text-center">
        <p className="text-heading-2 text-fg">{t('err.projectNotFound')}</p>
        <p className="nk-mono-id mt-2 text-fg-muted">{id}</p>
        <Link to="/government/projects" className="mt-4 inline-block text-body-small text-primary-strong hover:underline">
          {t('common.back')} — {t('nav.allProjects')}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: t('nav.dashboard'), to: '/government/dashboard' },
          { label: t('nav.allProjects'), to: '/government/projects' },
          { label: project.id, to: `/government/projects/${project.id}` },
          ...(moduleLabel ? [{ label: moduleLabel }] : []),
        ]}
      />

      {/* Compact project context — always visible, never repeated per module */}
      <div className="nk-card p-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <span className="nk-mono-id text-fg-muted">{project.id}</span>
            <h1 className="truncate text-heading-3 text-fg">{project.name}</h1>
            <StatusBadge descriptor={PROJECT_STATUS[project.status]} size="sm" />
            <Badge tone="neutral" icon="schedule" >
              {project.delayDays > 0 ? `${project.delayDays} ${t('common.days')} delay` : 'On schedule'}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-caption text-fg-muted">
            <span className="flex items-center gap-1.5">
              Physical <span className="tabular-nums font-semibold text-fg">{project.physicalProgressPct}%</span>
              <span className="inline-block h-1.5 w-16 overflow-hidden rounded-badge bg-surface-3" aria-hidden="true">
                <span className="block h-full bg-primary" style={{ width: `${project.physicalProgressPct}%` }} />
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              Financial <span className="tabular-nums font-semibold text-fg">{project.financialProgressPct}%</span>
              <span className="inline-block h-1.5 w-16 overflow-hidden rounded-badge bg-surface-3" aria-hidden="true">
                <span className="block h-full bg-success" style={{ width: `${project.financialProgressPct}%` }} />
              </span>
            </span>
            <span>
              Completion <span className="tabular-nums font-semibold text-fg">{formatDate(project.expectedCompletion)}</span>
            </span>
          </div>
        </div>
      </div>

      <Outlet />
    </div>
  )
}
