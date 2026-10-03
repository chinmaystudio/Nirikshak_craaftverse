import { Link } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { useProjectWorkspace } from '@/context/ProjectWorkspaceContext'
import { Panel, Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCr, formatDate } from '@/utils/format'
import { MILESTONE_STATUS } from '@/utils/status'

/** Project workspace — Overview. Every figure is scoped to the open project. */
export function WorkspaceOverviewPage() {
  const { t } = useI18n()
  const { projectId, project, tenders, grievances, inspections, documents, approvals, litigation, findings, bills, insights } =
    useProjectWorkspace()
  if (!project) return null

  const openComplaints = grievances.filter(
    (g) => !['resolved', 'closed', 'rejected'].includes(g.status),
  ).length

  const modules = [
    { labelKey: 'nav.finance', icon: 'account_balance', to: `/government/projects/${projectId}/budget`, value: formatCr(project.utilizedAmountCr), note: `${t('common.progress')} ${project.financialProgressPct}%` },
    { labelKey: 'nav.tenderManagement', icon: 'gavel', to: `/government/projects/${projectId}/tenders`, value: String(tenders.length), note: 'on this record' },
    { labelKey: 'nav.milestoneManagement', icon: 'fact_check', to: `/government/projects/${projectId}/milestones`, value: String((project.milestones ?? []).length), note: 'milestones' },
    { labelKey: 'nav.complaintsTracking', icon: 'report_problem', to: `/government/projects/${projectId}/complaints`, value: String(grievances.length), note: 'linked complaints' },
    { labelKey: 'nav.approvalWorkflow', icon: 'rule', to: `/government/projects/${projectId}/approvals`, value: String(approvals.length), note: 'approval actions' },
    { labelKey: 'nav.documents', icon: 'folder_shared', to: `/government/projects/${projectId}/documents`, value: String(documents.length), note: 'on this record' },
    { labelKey: 'nav.litigationManagement', icon: 'policy', to: `/government/projects/${projectId}/execution#litigation`, value: String(litigation.length), note: 'legal cases' },
    { labelKey: 'nav.aiInsights', icon: 'auto_awesome', to: `/government/projects/${projectId}/ai-insights`, value: String(insights.length), note: 'AI insights' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <section id="overview" className="scroll-mt-24">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {modules.map((m) => (
            <Link
              key={m.labelKey}
              to={m.to}
              className="nk-card flex flex-col gap-1 p-3 transition-colors duration-fast hover:border-primary-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="flex items-center gap-2 text-caption text-fg-muted">
                <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">{m.icon}</span>
                {t(m.labelKey)}
              </span>
              <span className="tabular-nums text-heading-2 text-fg">{m.value}</span>
              <span className="text-caption text-fg-subtle">{m.note}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Key Dates & Registers" icon="event">
          <dl className="grid grid-cols-2 gap-3 text-body-small">
            <div><dt className="text-fg-subtle">Admin Approval</dt><dd className="text-fg">{formatDate(project.adminApprovalDate)}</dd></div>
            <div><dt className="text-fg-subtle">Technical Approval</dt><dd className="text-fg">{formatDate(project.technicalApprovalDate)}</dd></div>
            <div><dt className="text-fg-subtle">Inspections</dt><dd className="tabular-nums text-fg">{inspections.length || project.inspectionsCount}</dd></div>
            <div><dt className="text-fg-subtle">Open Complaints</dt><dd className="tabular-nums text-fg">{openComplaints}</dd></div>
            <div><dt className="text-fg-subtle">Bills on Record</dt><dd className="tabular-nums text-fg">{bills.length}</dd></div>
            <div><dt className="text-fg-subtle">Audit Findings</dt><dd className="tabular-nums text-fg">{findings.length}</dd></div>
          </dl>
        </Panel>
        <Panel title="Milestone Timeline" icon="timeline">
          <ol className="relative ml-3 border-l-2 border-border">
            {(project.milestones ?? []).slice(0, 5).map((m) => (
              <li key={m.id} className="mb-4 ml-4 last:mb-0">
                <span className="absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full border-2 border-surface bg-primary" aria-hidden="true" />
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-body-small font-medium text-fg">{m.title}</p>
                  <StatusBadge descriptor={MILESTONE_STATUS[m.status]} size="sm" />
                </div>
                <p className="mt-0.5 text-caption text-fg-subtle">
                  {formatDate(m.plannedStart)} → {formatDate(m.plannedEnd)}
                  {m.delayDays ? ` • +${m.delayDays} ${t('common.days')}` : ''}
                </p>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <Card className="p-3 text-caption text-fg-subtle">{t('common.mockDataNote')}</Card>
    </div>
  )
}
