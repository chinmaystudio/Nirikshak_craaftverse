import { Link, useNavigate } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { useApprovalWorkspace } from '@/context/ApprovalWorkspaceContext'
import { Panel } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCr, formatDate } from '@/utils/format'
import { APPROVAL_STATUS, PROJECT_STATUS } from '@/utils/status'

/** Approval workspace — Linked Project: context of the project this request belongs to. */
export function ApprovalProjectPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { approval, project, relatedApprovals } = useApprovalWorkspace()
  if (!approval) return null

  if (!project) {
    return (
      <section id="project" className="scroll-mt-24">
        <Panel title="Linked Project" icon="map">
          <p className="text-body-small text-fg-muted">No project record is linked to this approval request.</p>
        </Panel>
      </section>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <section id="project" className="scroll-mt-24">
        <Panel title="Linked Project" icon="map" subtitle="The project this approval request belongs to.">
          <p className="nk-mono-id text-fg-muted">{project.id}</p>
          <h2 className="mt-1 text-heading-2 text-fg">{project.name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge descriptor={PROJECT_STATUS[project.status]} size="sm" />
            <span className="text-caption text-fg-muted">
              {project.department} • {project.district}
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-body-small md:grid-cols-4">
            <div><dt className="text-fg-subtle">Sanctioned</dt><dd className="tabular-nums text-fg">{formatCr(project.sanctionedAmountCr)}</dd></div>
            <div><dt className="text-fg-subtle">Utilized</dt><dd className="tabular-nums text-fg">{formatCr(project.utilizedAmountCr)}</dd></div>
            <div><dt className="text-fg-subtle">Physical progress</dt><dd className="tabular-nums text-fg">{project.physicalProgressPct}%</dd></div>
            <div><dt className="text-fg-subtle">Expected completion</dt><dd className="tabular-nums text-fg">{formatDate(project.expectedCompletion)}</dd></div>
          </dl>
          <div className="mt-4">
            <Button
              variant="primary"
              icon="arrow_forward"
              onClick={() => navigate(`/government/projects/${encodeURIComponent(project.id)}`)}
            >
              Open Project Workspace
            </Button>
          </div>
        </Panel>
      </section>

      <Panel title="All Approval Requests on This Project" icon="layers" bodyClassName="p-0">
        <ul className="divide-y divide-border">
          {[approval, ...relatedApprovals].map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div className="min-w-0">
                <Link
                  to={`/government/approvals/${encodeURIComponent(a.id)}`}
                  className="nk-mono-id text-primary-strong hover:underline"
                >
                  {a.id}
                </Link>
                <p className="mt-0.5 truncate text-body-small text-fg">{a.type}</p>
              </div>
              <div className="flex items-center gap-2">
                {a.id === approval.id && (
                  <span className="text-caption text-fg-subtle">this request</span>
                )}
                <StatusBadge descriptor={APPROVAL_STATUS[a.status]} size="sm" />
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
