import { useMemo, useState } from 'react'
import { useI18n } from '@/context/I18nContext'
import { useProjectWorkspace } from '@/context/ProjectWorkspaceContext'
import { useToast } from '@/context/ToastContext'
import { Panel, Card } from '@/components/ui/Card'
import { DataTable } from '@/components/tables/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Drawer, Modal } from '@/components/modals/Modal'
import { TextField, Select, TextArea } from '@/components/ui/Fields'
import { PageHeader, KpiRow, FilterBar, ConfirmDialog, DetailField, KpiCard } from '@/components/blocks/Page'
import { DualProgress } from '@/components/ui/Progress'
import { formatCr, formatDate } from '@/utils/format'
import { AI_CLASSIFICATION, AI_CONFIDENCE, INSPECTION_OUTCOME, LITIGATION_STATUS, WORK_ORDER_STATUS } from '@/utils/status'
import { HEARINGS, PROGRESS_UPDATES, MIGRATIONS, SETTLEMENTS, ACTIVITY_LOG, type ProgressUpdate } from '@/data/workspace'
import type { LitigationCase } from '@/types'

const CONTRACT_STAGES = [
  { label: 'Contract Award', icon: 'emoji_events', dateKey: 'adminApprovalDate' as const },
  { label: 'Work Order', icon: 'receipt_long', dateKey: 'technicalApprovalDate' as const },
  { label: 'Site Handover', icon: 'fence', dateKey: null as null },
  { label: 'Execution', icon: 'construction', dateKey: null as null },
  { label: 'Inspection & Verification', icon: 'fact_check', dateKey: null as null },
  { label: 'Completion', icon: 'flag', dateKey: 'expectedCompletion' as const },
]

/** Project workspace — Work & Contract Management: the contract-control center
 * with execution tracking, site updates, settlements, litigation and AI
 * monitoring — all scoped to the open project. */
export function WorkspaceExecutionPage() {
  const { t } = useI18n()
  const { showToast } = useToast()
  const { project, workOrder, inspections, litigation, insights, bills } = useProjectWorkspace()
  const [updates, setUpdates] = useState<ProgressUpdate[]>(() => PROGRESS_UPDATES.filter((u) => u.projectId === project?.id))
  const [updateSearch, setUpdateSearch] = useState('')
  const [updateFilter, setUpdateFilter] = useState('')
  const [caseDrawer, setCaseDrawer] = useState<LitigationCase | null>(null)
  const [addCaseOpen, setAddCaseOpen] = useState(false)
  const [newCase, setNewCase] = useState({ title: '', court: 'Bombay High Court', claim: '' })
  const [addUpdateOpen, setAddUpdateOpen] = useState(false)
  const [newUpdate, setNewUpdate] = useState({ location: '', activity: '', progress: '' })
  const [confirm, setConfirm] = useState<{ title: string; message: string; run: () => void } | null>(null)
  const [reportOpen, setReportOpen] = useState(false)

  const peopleBills = useMemo(() => bills.filter((b) => b.type === 'Labour Bill'), [bills])
  const projectUpdates = updates
  const projectMigrations = MIGRATIONS.filter((m) => m.projectId === project?.id)
  const projectSettlements = SETTLEMENTS.filter((s) => s.projectId === project?.id)
  const projectActivity = useMemo(() => ACTIVITY_LOG.filter((a) => a.projectId === project?.id), [project?.id])

  if (!project) return null

  const plannedNow = Math.min(100, project.physicalProgressPct + (project.delayDays > 0 ? 8 : 2))
  const scheduleVariance = project.physicalProgressPct - plannedNow
  const verifyUpdate = (id: string, verdict: 'verified' | 'rejected') => {
    setUpdates((list) =>
      list.map((u) =>
        u.id === id
          ? {
              ...u,
              status: verdict,
              verificationNote:
                verdict === 'verified'
                  ? 'Verified by Executive Engineer this session (demo).'
                  : 'Rejected — re-submission requested with corrected geo-tag (demo).',
            }
          : u,
      ),
    )
    showToast(
      verdict === 'verified'
        ? `Progress update ${id} verified and posted to the register.`
        : `Progress update ${id} rejected — contractor notified for correction.`,
      verdict === 'verified' ? 'success' : 'warning',
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Work & Contract Management"
        description="Contract control center — work order, execution tracking, site updates, settlements, litigation and AI-based monitoring for this project."
        actions={
          <>
            <Button variant="outline" size="sm" icon="description" onClick={() => setReportOpen(true)}>
              Generate Report
            </Button>
            <Button variant="primary" size="sm" icon="add" onClick={() => setAddUpdateOpen(true)}>
              Add Progress Update
            </Button>
          </>
        }
      />

      {/* Contract control */}
      <section id="contract" className="scroll-mt-24 flex flex-col gap-4">
        <KpiRow>
          <KpiCard label="Contract Value" value={workOrder ? formatCr(workOrder.valueCr) : '—'} icon="payments" />
          <KpiCard label="Work Order" value={workOrder?.id ?? project.workOrderNo ?? 'Pending'} icon="receipt_long" iconTone="neutral" />
          <KpiCard label="Defect Liability" value={workOrder ? `${workOrder.defectLiabilityMonths} mo` : '—'} icon="build_circle" iconTone="neutral" />
          <KpiCard label="Retention / Security" value={workOrder ? `${formatCr(Math.round(workOrder.valueCr * 0.05 * 10) / 10)} / ${formatCr(Math.round(workOrder.valueCr * 0.1 * 10) / 10)}` : '—'} icon="shield" iconTone="neutral" delta="5% retention • 10% performance" />
        </KpiRow>

        <Panel title="Contract Timeline" icon="timeline">
          <ol className="flex flex-wrap gap-2">
            {CONTRACT_STAGES.map((s, i) => {
              const date = s.dateKey ? formatDate(project[s.dateKey]) : i === 2 && workOrder ? formatDate(workOrder.issuedOn) : null
              const reached = i <= (project.physicalProgressPct > 0 ? 3 : 2) || (project.status === 'completed' && true)
              return (
                <li key={s.label} className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-badge border px-2.5 py-1 text-caption ${
                      reached ? 'border-primary-border bg-primary-soft text-primary-strong' : 'border-border bg-surface text-fg-subtle'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">{s.icon}</span>
                    {s.label}
                    {date && <span className="tabular-nums text-fg-subtle">• {date}</span>}
                  </span>
                  {i < CONTRACT_STAGES.length - 1 && (
                    <span className="material-symbols-outlined text-[16px] text-fg-subtle" aria-hidden="true">chevron_right</span>
                  )}
                </li>
              )
            })}
          </ol>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" icon="gavel" onClick={() => showToast('Amendment request drafted — routed to SE (Technical) for concurrence (demo).', 'info')}>
              Amend Contract
            </Button>
            <Button variant="outline" size="sm" icon="schedule" onClick={() => showToast('Extension of Time request initiated — attach delay analysis before submission (demo).', 'info')}>
              Request Extension
            </Button>
            <Button variant="outline" size="sm" icon="upload_file" onClick={() => showToast('Document upload opens in Document Management with contract tagging (demo).', 'info')}>
              Upload Document
            </Button>
          </div>
        </Panel>
      </section>

      {/* Project Execution */}
      <section id="execution" className="scroll-mt-24 flex flex-col gap-4">
        <KpiRow>
          <KpiCard label="Physical Progress" value={`${project.physicalProgressPct}%`} icon="construction" iconTone="primary" />
          <KpiCard label="Financial Progress" value={`${project.financialProgressPct}%`} icon="payments" iconTone="success" />
          <KpiCard label="Planned (this date)" value={`${plannedNow}%`} icon="event_available" iconTone="neutral" />
          <KpiCard
            label="Schedule Variance"
            value={`${scheduleVariance > 0 ? '+' : ''}${scheduleVariance} pts`}
            icon={scheduleVariance < 0 ? 'timer_off' : 'check_circle'}
            iconTone={scheduleVariance < 0 ? 'danger' : 'success'}
            delta={project.delayDays > 0 ? `${project.delayDays} days delayed` : 'On schedule'}
            deltaTone={project.delayDays > 0 ? 'danger' : 'success'}
          />
        </KpiRow>

        <Panel title="Planned vs Actual Progress" icon="speed">
          <DualProgress physical={project.physicalProgressPct} financial={project.financialProgressPct} />
          <p className="mt-3 text-caption text-fg-subtle">
            Execution runs {scheduleVariance < 0 ? `${Math.abs(scheduleVariance)} points behind` : 'ahead of'} the monthly plan curve; recovery
            options are tracked on the milestone register.
          </p>
        </Panel>

        <FilterBar
          search={updateSearch}
          onSearch={setUpdateSearch}
          searchPlaceholder="Search activity, chainage, officer…"
          selects={[
            {
              label: 'Verification',
              value: updateFilter,
              onChange: setUpdateFilter,
              options: [
                { value: '', label: t('common.all') },
                { value: 'verified', label: 'Verified' },
                { value: 'pending', label: 'Pending' },
                { value: 'rejected', label: 'Rejected' },
              ],
            },
          ]}
          onClear={() => {
            setUpdateSearch('')
            setUpdateFilter('')
          }}
        />

        <Panel title={`Site Progress Updates (${projectUpdates.length})`} icon="travel_explore" subtitle="Geo-tagged, time-stamped updates with photo evidence — verify or reject before they post to the register.">
          <ul className="flex flex-col gap-3 p-4">
            {projectUpdates
              .filter(
                (u) =>
                  (!updateFilter || u.status === updateFilter) &&
                  (!updateSearch || `${u.activity} ${u.location} ${u.officer}`.toLowerCase().includes(updateSearch.toLowerCase())),
              )
              .map((u) => (
                <li key={u.id}>
                  <Card className="p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-label text-fg">{u.activity}</p>
                        <p className="mt-0.5 text-caption text-fg-muted">
                          {u.location} • {formatDate(u.date)} • {u.officer} • {u.contractor}
                        </p>
                        <p className="mt-0.5 text-caption text-fg-subtle">
                          Geo-tag {u.geoTag.lat.toFixed(3)}, {u.geoTag.lng.toFixed(3)} • {u.photos} time-stamped photos
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone="neutral" icon="speed">{u.progressPct}%</Badge>
                        <StatusBadge
                          descriptor={
                            u.status === 'verified'
                              ? { key: 'status.approved', tone: 'success', icon: 'verified' }
                              : u.status === 'pending'
                                ? { key: 'status.pending', tone: 'warning', icon: 'hourglass_top' }
                                : { key: 'status.rejected', tone: 'danger', icon: 'cancel' }
                          }
                          size="sm"
                        />
                      </div>
                    </div>
                    {u.verificationNote && <p className="mt-1.5 text-caption text-fg-subtle">{u.verificationNote}</p>}
                    {u.status === 'pending' && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button variant="primary" size="sm" icon="verified" onClick={() => verifyUpdate(u.id, 'verified')}>
                          {t('common.verify')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          icon="u_turn_left"
                          onClick={() => setConfirm({ title: `Reject update ${u.id}?`, message: 'The contractor will be notified to re-submit with corrections. This action is recorded in the audit trail.', run: () => verifyUpdate(u.id, 'rejected') })}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon="edit"
                          onClick={() => showToast(`Correction request sent for ${u.id} (demo).`, 'info')}
                        >
                          Request Correction
                        </Button>
                      </div>
                    )}
                  </Card>
                </li>
              ))}
            {projectUpdates.filter((u) => (!updateFilter || u.status === updateFilter) && (!updateSearch || `${u.activity} ${u.location} ${u.officer}`.toLowerCase().includes(updateSearch.toLowerCase()))).length === 0 && (
              <li className="py-6 text-center text-body-small text-fg-muted">
                No progress updates match the current filters. Updates appear here as the field team submits from site.
              </li>
            )}
          </ul>
        </Panel>

        <Panel title="Before / After — Site Evidence" icon="photo_library" subtitle="Latest geo-tagged photographs per active front (placeholder tiles in demo build).">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {projectUpdates
              .filter((u) => u.status === 'verified' && u.photos > 0)
              .slice(0, 4)
              .map((u) => (
                <div key={u.id} className="nk-card flex aspect-[4/3] flex-col items-center justify-center gap-1 p-3 text-center">
                  <span className="material-symbols-outlined text-[28px] text-fg-subtle" aria-hidden="true">image</span>
                  <p className="text-caption text-fg-muted">{u.location}</p>
                  <p className="text-caption text-fg-subtle">{formatDate(u.date)} • {u.photos} photos</p>
                </div>
              ))}
            {projectUpdates.filter((u) => u.status === 'verified' && u.photos > 0).length === 0 && (
              <p className="col-span-full text-center text-body-small text-fg-muted">Verified photo evidence will appear as updates are verified.</p>
            )}
          </div>
        </Panel>

        <Panel title="Site Inspections" icon="fact_check" bodyClassName="p-0">
          <DataTable
            minWidth={900}
            rows={inspections}
            rowKey={(i) => i.id}
            paginated
            pageSize={6}
            columns={[
              { key: 'id', header: 'Ref', render: (i) => <span className="nk-mono-id text-fg-muted">{i.id}</span> },
              { key: 'date', header: 'Date', cellClassName: 'tabular-nums', sortable: true, sortValue: (i) => i.inspectedOn, render: (i) => formatDate(i.inspectedOn) },
              { key: 'type', header: 'Type', render: (i) => <Badge tone="neutral">{i.type}</Badge> },
              { key: 'inspector', header: 'Inspector', render: (i) => i.inspector },
              { key: 'outcome', header: 'Outcome', render: (i) => <StatusBadge descriptor={INSPECTION_OUTCOME[i.outcome]} size="sm" /> },
              { key: 'geo', header: 'Geo-Tag', cellClassName: 'tabular-nums', render: (i) => `${i.geoTag.lat.toFixed(3)}, ${i.geoTag.lng.toFixed(3)}` },
              { key: 'photos', header: 'Photos', cellClassName: 'tabular-nums', render: (i) => i.photosCount },
            ]}
            emptyState={<div className="p-8 text-center text-body-small text-fg-muted">No inspections recorded for this project yet.</div>}
          />
        </Panel>
      </section>

      {/* People / Migration Settlement */}
      <section id="people" className="scroll-mt-24 flex flex-col gap-4">
        <KpiRow>
          <KpiCard label="Affected Persons" value={projectSettlements.length} icon="groups" />
          <KpiCard label="Entitlement" value={formatCr(projectSettlements.reduce((s, x) => s + x.entitlementCr, 0))} icon="account_balance_wallet" />
          <KpiCard label="Paid" value={formatCr(projectSettlements.reduce((s, x) => s + x.paidCr, 0))} icon="task_alt" iconTone="success" />
          <KpiCard
            label="Disputed / Pending"
            value={projectSettlements.filter((s) => s.status === 'disputed' || s.status === 'pending').length}
            icon="report_problem"
            iconTone={projectSettlements.some((s) => s.status === 'disputed') ? 'danger' : 'warning'}
          />
        </KpiRow>

        <Panel title="People Settlement Register" icon="groups" subtitle="Land, structure and livelihood entitlements on this project." bodyClassName="p-0">
          <DataTable
            minWidth={980}
            rows={projectSettlements}
            rowKey={(s) => s.id}
            columns={[
              { key: 'id', header: 'Ref', render: (s) => <span className="nk-mono-id text-fg-muted">{s.id}</span> },
              { key: 'beneficiary', header: 'Beneficiary', isRowHeader: true, render: (s) => s.beneficiary },
              { key: 'category', header: 'Category', render: (s) => <Badge tone="neutral">{s.category}</Badge> },
              { key: 'location', header: t('common.location'), render: (s) => <span className="text-caption">{s.location}</span> },
              { key: 'entitlement', header: 'Entitlement', cellClassName: 'tabular-nums', render: (s) => formatCr(s.entitlementCr) },
              { key: 'paid', header: 'Paid', cellClassName: 'tabular-nums', render: (s) => formatCr(s.paidCr) },
              {
                key: 'status',
                header: t('common.status'),
                render: (s) => (
                  <StatusBadge
                    descriptor={
                      s.status === 'paid'
                        ? { key: 'status.paid', tone: 'success', icon: 'task_alt' }
                        : s.status === 'part_paid'
                          ? { key: 'status.pending', tone: 'warning', icon: 'pending_actions' }
                          : s.status === 'disputed'
                            ? { key: 'status.rejected', tone: 'danger', icon: 'gavel' }
                            : { key: 'status.pending', tone: 'info', icon: 'hourglass_top' }
                    }
                    size="sm"
                  />
                ),
              },
            ]}
            emptyState={
              <div className="p-8 text-center text-body-small text-fg-muted">
                No settlement records are linked to this project — the PAP register opens after social-impact survey approval.
              </div>
            }
          />
          {peopleBills.length > 0 && (
            <div className="border-t border-border p-4">
              <p className="nk-label">Wage / labour settlement bills</p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {peopleBills.map((b) => (
                  <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 text-body-small">
                    <span className="nk-mono-id text-fg">{b.billNo}</span>
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums">{formatCr(b.amountCr)}</span>
                      <StatusBadge descriptor={b.status === 'paid' || b.status === 'approved' ? { key: 'bill.status.paid', tone: 'success', icon: 'payments' } : { key: 'bill.status.submitted', tone: 'info', icon: 'schedule_send' }} size="sm" />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        <Panel title="Migration Settlement" icon="swap_horiz" subtitle="Relocation and rehabilitation tracking for displaced households." bodyClassName="p-0">
          {projectMigrations.length > 0 ? (
            <DataTable
              minWidth={980}
              rows={projectMigrations}
              rowKey={(m) => m.id}
              columns={[
                { key: 'person', header: 'Affected Person', isRowHeader: true, render: (m) => m.person },
                { key: 'from', header: 'Original Location', render: (m) => <span className="text-caption">{m.originalLocation}</span> },
                { key: 'to', header: 'New Location', render: (m) => <span className="text-caption">{m.newLocation}</span> },
                {
                  key: 'status',
                  header: 'Relocation Status',
                  render: (m) => (
                    <Badge tone={m.relocationStatus === 'completed' ? 'success' : m.relocationStatus === 'in_progress' ? 'warning' : 'neutral'} dot>
                      {m.relocationStatus.replace('_', ' ')}
                    </Badge>
                  ),
                },
                { key: 'comp', header: 'Compensation', cellClassName: 'tabular-nums', render: (m) => formatCr(m.compensationCr) },
                { key: 'rehab', header: 'Rehabilitation', render: (m) => <span className="text-caption">{m.rehabilitation}</span> },
                { key: 'pending', header: 'Pending Action', render: (m) => <span className="text-caption text-warning-strong">{m.pendingAction}</span> },
              ]}
            />
          ) : (
            <p className="p-4 text-body-small text-fg-muted">No migration/relocation cases on this project.</p>
          )}
        </Panel>
      </section>

      {/* Litigation Management */}
      <section id="litigation" className="scroll-mt-24 flex flex-col gap-4">
        <KpiRow>
          <KpiCard label="Active Cases" value={litigation.filter((c) => !['decided', 'withdrawn'].includes(c.status)).length} icon="policy" />
          <KpiCard label="Hearings Scheduled" value={litigation.filter((c) => c.status === 'hearing_scheduled').length} icon="event" iconTone="warning" />
          <KpiCard label="Claims Value" value={formatCr(litigation.reduce((s, c) => s + (c.claimAmountCr ?? 0), 0))} icon="payments" iconTone="neutral" />
          <KpiCard label="Resolved" value={litigation.filter((c) => ['decided', 'withdrawn'].includes(c.status)).length} icon="verified" iconTone="success" />
        </KpiRow>

        <Panel title="Litigation Management" icon="policy" bodyClassName="p-0"
          actions={
            <Button variant="outline" size="sm" icon="add" onClick={() => setAddCaseOpen(true)}>
              Add Case
            </Button>
          }
        >
          <DataTable
            minWidth={960}
            rows={litigation}
            rowKey={(l) => l.id}
            columns={[
              { key: 'id', header: 'Case ID', isRowHeader: true, render: (l) => <span className="nk-mono-id text-fg">{l.id}</span> },
              { key: 'title', header: 'Case', render: (l) => <span className="block max-w-64 truncate" title={l.title}>{l.title}</span> },
              { key: 'court', header: 'Court', render: (l) => <span className="text-caption">{l.court}</span> },
              { key: 'claim', header: 'Claim', cellClassName: 'tabular-nums', render: (l) => (l.claimAmountCr ? formatCr(l.claimAmountCr) : '—') },
              { key: 'status', header: t('common.status'), render: (l) => <StatusBadge descriptor={LITIGATION_STATUS[l.status]} size="sm" /> },
              { key: 'hearing', header: 'Next Hearing', cellClassName: 'tabular-nums', sortable: true, sortValue: (l) => l.nextHearing ?? '', render: (l) => (l.nextHearing ? formatDate(l.nextHearing) : '—') },
            ]}
            rowActions={(l) => (
              <Button variant="outline" size="sm" className="!min-h-7 !px-2.5" onClick={() => setCaseDrawer(l)}>
                {t('common.view')}
              </Button>
            )}
            emptyState={
              <div className="p-8 text-center">
                <p className="text-body-small text-fg-muted">No litigation is linked to this project.</p>
                <Button variant="outline" size="sm" icon="add" className="mt-3" onClick={() => setAddCaseOpen(true)}>
                  Add Case
                </Button>
              </div>
            }
          />
        </Panel>
      </section>

      {/* AI-Based Monitoring & Reports */}
      <section id="ai-monitoring" className="scroll-mt-24 flex flex-col gap-4">
        <Panel
          title="AI-Based Monitoring & Reports"
          icon="monitoring"
          subtitle="Automated analysis of this project's records only — AI assists, officers decide."
          bodyClassName="p-0"
          actions={
            <Button variant="primary" size="sm" icon="auto_awesome" onClick={() => setReportOpen(true)}>
              Generate AI Report
            </Button>
          }
        >
          <div className="flex flex-col gap-3 p-4">
            {insights.map((i) => (
              <Card key={i.id} className="p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge descriptor={AI_CLASSIFICATION[i.classification]} size="sm" />
                  <StatusBadge descriptor={AI_CONFIDENCE[i.confidenceBand]} size="sm" />
                  <span className="text-caption tabular-nums text-fg-subtle">{i.confidencePct}% • {formatDate(i.generatedOn)}</span>
                </div>
                <h3 className="mt-2 text-heading-3 text-fg">{i.title}</h3>
                <p className="mt-1 text-body-small text-fg-muted">{i.insight}</p>
                <p className="mt-2 text-caption text-fg"><strong>Recommended action:</strong> {i.recommendedAction}</p>
              </Card>
            ))}
            {insights.length === 0 && (
              <p className="text-body-small text-fg-muted">No automated monitoring insights generated for this project yet.</p>
            )}
          </div>
        </Panel>

        <Panel title="Recent Activity (This Project)" icon="history" bodyClassName="p-0">
          <DataTable
            minWidth={900}
            rows={projectActivity}
            rowKey={(a) => a.id}
            columns={[
              { key: 'when', header: 'When', cellClassName: 'tabular-nums', render: (a) => <span className="text-caption">{formatDate(a.timestamp)}</span> },
              { key: 'who', header: 'WHO', isRowHeader: true, render: (a) => `${a.actor} (${a.role})` },
              { key: 'what', header: 'WHAT', render: (a) => a.action },
              { key: 'field', header: 'Field', render: (a) => <span className="nk-mono-id text-fg-muted">{a.field}</span> },
              { key: 'old', header: 'Old Value', render: (a) => <span className="text-caption text-fg-muted">{a.oldValue}</span> },
              { key: 'new', header: 'New Value', render: (a) => <span className="text-caption text-fg">{a.newValue}</span> },
            ]}
          />
        </Panel>
      </section>

      <Card className="p-3 text-caption text-fg-subtle">{t('common.mockDataNote')}</Card>

      {/* Litigation case drawer */}
      <Drawer open={caseDrawer !== null} onClose={() => setCaseDrawer(null)} title={caseDrawer?.id ?? ''} titleIcon="policy" width="max-w-xl">
        {caseDrawer && <CaseDrawer caseItem={caseDrawer} />}
      </Drawer>

      {/* Add case */}
      <Modal
        open={addCaseOpen}
        onClose={() => setAddCaseOpen(false)}
        title="Add Litigation Case"
        titleIcon="gavel"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddCaseOpen(false)}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              disabled={!newCase.title.trim()}
              onClick={() => {
                showToast(`Case "${newCase.title.trim()}" registered and shared with the Law Officer (demo).`, 'success')
                setNewCase({ title: '', court: 'Bombay High Court', claim: '' })
                setAddCaseOpen(false)
              }}
            >
              {t('common.submit')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <TextField label="Case title" required value={newCase.title} onChange={(e) => setNewCase((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Claim for extra items — Ch 43+800" />
          <Select label="Court / Authority" value={newCase.court} onChange={(e) => setNewCase((f) => ({ ...f, court: e.target.value }))} options={['Bombay High Court', 'District Court, Pune', 'Arbitration Tribunal', 'MSHCAT'].map((c) => ({ value: c, label: c }))} />
          <TextField label="Claim amount (₹ Cr)" type="number" min={0} step={0.01} value={newCase.claim} onChange={(e) => setNewCase((f) => ({ ...f, claim: e.target.value }))} />
          <TextArea label="Officer notes" rows={2} placeholder="Brief brief-facts for the law officer…" />
        </div>
      </Modal>

      {/* Add progress update */}
      <Modal
        open={addUpdateOpen}
        onClose={() => setAddUpdateOpen(false)}
        title="Add Progress Update"
        titleIcon="add_a_photo"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddUpdateOpen(false)}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              disabled={!newUpdate.activity.trim() || !newUpdate.location.trim() || !(Number(newUpdate.progress) >= 0)}
              onClick={() => {
                const id = `PU-2026-${String(200 + updates.length).padStart(4, '0')}`
                setUpdates((list) => [
                  {
                    id,
                    projectId: project.id,
                    date: new Date().toISOString().slice(0, 10),
                    location: newUpdate.location.trim(),
                    activity: newUpdate.activity.trim(),
                    progressPct: Number(newUpdate.progress),
                    officer: 'Er. S. D. Kulkarni (session)',
                    contractor: project.contractor ?? '—',
                    geoTag: { lat: 18.372 + Math.random() * 0.01, lng: 74.812 + Math.random() * 0.01 },
                    photos: 0,
                    status: 'pending',
                  },
                  ...list,
                ])
                showToast(`Progress update ${id} submitted for verification (demo).`, 'success')
                setNewUpdate({ location: '', activity: '', progress: '' })
                setAddUpdateOpen(false)
              }}
            >
              {t('common.submit')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <TextField label="Location / chainage" required value={newUpdate.location} onChange={(e) => setNewUpdate((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Ch 44+320" />
          <TextField label="Activity" required value={newUpdate.activity} onChange={(e) => setNewUpdate((f) => ({ ...f, activity: e.target.value }))} placeholder="e.g. WMM laying — 240 m" />
          <TextField label="Progress at location (%)" required type="number" min={0} max={100} value={newUpdate.progress} onChange={(e) => setNewUpdate((f) => ({ ...f, progress: e.target.value }))} />
          <p className="text-caption text-fg-subtle">Geo-tag and photos attach from the field app; submissions are verified by the Executive Engineer before posting.</p>
        </div>
      </Modal>

      {/* AI report modal */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="AI Progress & Monitoring Report" titleIcon="smart_toy" size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { showToast('Report exported as PDF (demo file).', 'info'); setReportOpen(false) }}>
              {t('common.export')}
            </Button>
            <Button variant="primary" onClick={() => setReportOpen(false)}>{t('common.close')}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3 text-body-small">
          <div>
            <p className="nk-label">Executive Summary</p>
            <p className="mt-1 text-fg">
              {project.name} stands at {project.physicalProgressPct}% physical and {project.financialProgressPct}% financial
              progress against a plan of ~{plannedNow}%. {project.delayDays > 0 ? `The works run ${project.delayDays} days behind, concentrated at the ${project.milestones.find((m) => (m.delayDays ?? 0) > 0)?.title ?? 'critical milestone'}.` : 'Execution is broadly on schedule.'}
            </p>
          </div>
          <div>
            <p className="nk-label">Key Risks</p>
            <ul className="mt-1 list-disc pl-5 text-fg-muted">
              {insights.slice(0, 3).map((i) => (
                <li key={i.id}>{i.title} — {i.insight.split('.')[0]}.</li>
              ))}
              {insights.length === 0 && <li>No elevated risks detected in the current data window.</li>}
            </ul>
          </div>
          <div>
            <p className="nk-label">Predicted Completion</p>
            <p className="mt-1 text-fg">
              Trend extrapolation places completion around {project.delayDays > 0 ? `${project.delayDays + 14} days after target` : 'the target date'} ({formatDate(project.expectedCompletion)})
              assuming the current run-rate holds.
            </p>
          </div>
          <div>
            <p className="nk-label">Recommended Actions</p>
            <ul className="mt-1 list-disc pl-5 text-fg-muted">
              <li>Verify the {updates.filter((u) => u.status === 'pending').length} pending site update(s) and re-request the rejected one.</li>
              <li>Track the flagged bill(s) in Budget & Finance before the next RA cycle.</li>
              <li>Review the delayed milestone's recovery schedule with the contractor.</li>
            </ul>
          </div>
          <div>
            <p className="nk-label">Milestone Watch</p>
            <p className="mt-1 text-fg-muted">
              {project.milestones.filter((m) => (m.delayDays ?? 0) > 0).length} milestone(s) carry delay; the critical one is
              {' '}{project.milestones.find((m) => (m.delayDays ?? 0) > 0)?.title ?? 'none'}.
            </p>
          </div>
          <p className="rounded-control bg-surface-2 p-2 text-caption text-warning-strong">
            <span className="material-symbols-outlined mr-1 align-middle text-[14px]" aria-hidden="true">smart_toy</span>
            AI-generated draft for officer review — not an automatic decision or statutory report.
          </p>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        onConfirm={() => confirm?.run()}
        danger
      />
    </div>
  )
}

function CaseDrawer({ caseItem }: { caseItem: LitigationCase }) {
  const hearings = HEARINGS.filter((h) => h.caseId === caseItem.id)
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge descriptor={LITIGATION_STATUS[caseItem.status]} />
        {caseItem.claimAmountCr != null && <Badge tone="neutral" icon="payments">Claim {formatCr(caseItem.claimAmountCr)}</Badge>}
      </div>
      <Panel title="Case Summary" icon="description">
        <dl className="grid grid-cols-2 gap-3 text-body-small">
          <DetailField label="Title" value={caseItem.title} />
          <DetailField label="Case No." value={<span className="nk-mono-id">{caseItem.caseNo}</span>} />
          <DetailField label="Court / Authority" value={caseItem.court} />
          <DetailField label="Filed on" value={formatDate(caseItem.filedOn)} />
          <DetailField label="Next hearing" value={caseItem.nextHearing ? formatDate(caseItem.nextHearing) : '—'} />
          <DetailField label="Department counsel" value={caseItem.counsel} />
          {caseItem.contractor && (
            <div className="col-span-2">
              <dt className="text-fg-subtle">Contractor party</dt>
              <dd className="text-fg">{caseItem.contractor}</dd>
            </div>
          )}
          <div className="col-span-2">
            <dt className="text-fg-subtle">Officer notes / summary</dt>
            <dd className="text-fg-muted">{caseItem.summary}</dd>
          </div>
        </dl>
      </Panel>
      <Panel title="Hearings & Orders" icon="event" bodyClassName="p-0">
        <ol className="divide-y divide-border">
          {hearings.map((h, i) => (
            <li key={i} className="p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-label text-fg">{h.purpose}</p>
                <span className="tabular-nums text-caption text-fg-subtle">{formatDate(h.date)}</span>
              </div>
              <p className="mt-1 text-caption text-fg-muted">{h.outcome}</p>
            </li>
          ))}
          {hearings.length === 0 && <li className="p-4 text-body-small text-fg-muted">No hearings recorded for this case.</li>}
        </ol>
      </Panel>
      <Panel title="Financial Exposure" icon="payments">
        <p className="text-body-small text-fg">
          Claim on record: <strong className="tabular-nums">{caseItem.claimAmountCr != null ? formatCr(caseItem.claimAmountCr) : '—'}</strong>.
          Contingent liability is tracked in the financial statements; settlement requires competent-authority approval.
        </p>
      </Panel>
    </div>
  )
}
