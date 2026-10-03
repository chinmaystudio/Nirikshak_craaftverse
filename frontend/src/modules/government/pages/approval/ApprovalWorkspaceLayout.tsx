import { useEffect } from 'react'
import { Link, Outlet, useLocation, useParams } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { ApprovalWorkspaceProvider, useApprovalWorkspace } from '@/context/ApprovalWorkspaceContext'
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { LoadingBlock } from '@/components/feedback/Feedback'
import { formatCr, formatDate, formatSlaCountdown } from '@/utils/format'
import { APPROVAL_STATUS, PRIORITY } from '@/utils/status'

/**
 * ApprovalWorkspaceLayout — the shell every approval module renders inside.
 * Establishes the approval context (identity header + scoped records) and
 * keeps the selected approval in the URL: /government/approvals/:id/<module>.
 */
export function ApprovalWorkspaceLayout() {
  const { id = '' } = useParams()
  return (
    <ApprovalWorkspaceProvider approvalId={id}>
      <ApprovalShell />
    </ApprovalWorkspaceProvider>
  )
}

function ApprovalShell() {
  const { t } = useI18n()
  const location = useLocation()
  const { id = '' } = useParams()
  const { approval } = useApprovalWorkspace()

  // Scroll to module section anchors on navigation.
  useEffect(() => {
    if (!location.hash) return
    const el = document.getElementById(location.hash.slice(1))
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location])

  if (approval === undefined) return <LoadingBlock />
  if (!approval) {
    return (
      <div className="nk-card p-10 text-center">
        <p className="text-heading-2 text-fg">Approval not found</p>
        <p className="nk-mono-id mt-2 text-fg-muted">{id}</p>
        <Link to="/government/approvals" className="mt-4 inline-block text-body-small text-primary-strong hover:underline">
          {t('common.back')} — {t('nav.allApprovals')}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumbs
        items={[
          { label: t('nav.dashboard'), to: '/government/dashboard' },
          { label: t('nav.allApprovals'), to: '/government/approvals' },
          { label: approval.id },
        ]}
      />

      {/* Identity header */}
      <div className="nk-card p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="nk-mono-id text-fg-muted">{approval.id}</p>
            <h1 className="mt-1 text-heading-1 text-fg">{approval.type}</h1>
            <p className="mt-1 text-body-small text-fg-muted">
              <Link
                to={`/government/projects/${encodeURIComponent(approval.projectId)}`}
                className="text-primary-strong hover:underline"
              >
                <span className="nk-mono-id">{approval.projectId}</span>
              </Link>
              {' • '}
              {approval.projectName}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge descriptor={APPROVAL_STATUS[approval.status]} />
            <Badge tone="neutral" icon="schedule">
              SLA {formatSlaCountdown(approval.slaDueDate)}
            </Badge>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div><p className="nk-label">Submitted By</p><p className="text-label text-fg">{approval.submittedBy}</p></div>
          <div><p className="nk-label">Submitted On</p><p className="tabular-nums text-label text-fg">{formatDate(approval.submittedOn)}</p></div>
          <div><p className="nk-label">Assigned To</p><p className="text-label text-fg">{approval.assignedTo}</p></div>
          <div><p className="nk-label">Financial Implication</p><p className="tabular-nums text-label text-fg">{approval.amountCr != null ? formatCr(approval.amountCr) : '—'}</p></div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge descriptor={PRIORITY[approval.priority]} size="sm" />
          <Badge tone="neutral" icon="event">SLA due {formatDate(approval.slaDueDate)}</Badge>
        </div>
      </div>

      <Outlet />
    </div>
  )
}
