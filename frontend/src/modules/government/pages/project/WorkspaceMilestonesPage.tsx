import { useState } from 'react'
import { useI18n } from '@/context/I18nContext'
import { useProjectWorkspace } from '@/context/ProjectWorkspaceContext'
import { useToast } from '@/context/ToastContext'
import { Panel, Card } from '@/components/ui/Card'
import { DataTable } from '@/components/tables/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Button } from '@/components/ui/Button'
import { Drawer, Modal } from '@/components/modals/Modal'
import { TextField, Select } from '@/components/ui/Fields'
import { PageHeader, KpiRow, ConfirmDialog, DetailField, KpiCard } from '@/components/blocks/Page'
import { formatCr, formatDate } from '@/utils/format'
import { MILESTONE_STATUS } from '@/utils/status'
import { MILESTONE_META } from '@/data/workspace'
import type { Milestone } from '@/types'

const VERIFICATION_TONE = {
  verified: { key: 'status.approved', tone: 'success', icon: 'verified' },
  pending: { key: 'status.pending', tone: 'warning', icon: 'hourglass_top' },
  rejected: { key: 'status.rejected', tone: 'danger', icon: 'cancel' },
  not_due: { key: 'status.upcoming', tone: 'neutral', icon: 'schedule' },
} as const

/** Project workspace — Milestone Management: tracker with verification,
 * milestone-based payments and a visual timeline. */
export function WorkspaceMilestonesPage() {
  const { t } = useI18n()
  const { showToast } = useToast()
  const { project } = useProjectWorkspace()
  const [milestones, setMilestones] = useState<Milestone[]>(project?.milestones ?? [])
  const [detail, setDetail] = useState<Milestone | null>(null)
  const [updateTarget, setUpdateTarget] = useState<Milestone | null>(null)
  const [newProgress, setNewProgress] = useState('')
  const [confirm, setConfirm] = useState<{ title: string; message: string; run: () => void } | null>(null)

  if (!project) return null

  const meta = (m: Milestone) => MILESTONE_META[m.id]
  const completed = milestones.filter((m) => m.status === 'completed').length
  const inProgress = milestones.filter((m) => m.status === 'in_progress').length
  const delayed = milestones.filter((m) => m.status === 'delayed').length
  const pendingVerification = milestones.filter((m) => meta(m)?.verification === 'pending').length

  const decideVerification = (m: Milestone, verdict: 'verified' | 'rejected') => {
    setMilestones((list) =>
      list.map((x) => (x.id === m.id ? { ...x, status: verdict === 'verified' && x.physicalProgressPct === 100 ? 'completed' : x.status } : x)),
    )
    showToast(
      verdict === 'verified'
        ? `Milestone "${m.title}" verification recorded — linked payment may proceed.`
        : `Milestone "${m.title}" verification rejected — correction requested from site.`,
      verdict === 'verified' ? 'success' : 'warning',
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Milestone Management"
        description="Creation, deadline tracking, completion verification and milestone-based payments for this project."
        actions={
          <>
            <Button variant="outline" size="sm" icon="download" onClick={() => showToast('Milestone register exported (demo file).', 'info')}>
              {t('common.export')}
            </Button>
            <Button variant="primary" size="sm" icon="add" onClick={() => showToast('Milestone creation opens the planning wizard with pre-filled contract data (demo).', 'info')}>
              Add Milestone
            </Button>
          </>
        }
      />

      <KpiRow>
        <KpiCard label="Total Milestones" value={milestones.length} icon="fact_check" />
        <KpiCard label="Completed" value={completed} icon="verified" iconTone="success" />
        <KpiCard label="In Progress / Delayed" value={`${inProgress} / ${delayed}`} icon="construction" iconTone={delayed ? 'danger' : 'neutral'} />
        <KpiCard label="Pending Verification" value={pendingVerification} icon="hourglass_top" iconTone={pendingVerification ? 'warning' : 'neutral'} />
      </KpiRow>

      {/* Visual timeline */}
      <Panel title="Milestone Timeline" icon="timeline">
        <ol className="relative ml-3 border-l-2 border-border">
          {milestones.map((m) => (
            <li key={m.id} className="mb-4 ml-4 last:mb-0">
              <span
                className={`absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full border-2 border-surface ${
                  m.status === 'completed' ? 'bg-success' : m.status === 'delayed' ? 'bg-danger' : m.status === 'upcoming' ? 'bg-surface-3' : 'bg-primary'
                }`}
                aria-hidden="true"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setDetail(m)} className="text-body-small font-medium text-fg hover:text-primary-strong hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                  {m.title}
                </button>
                <StatusBadge descriptor={MILESTONE_STATUS[m.status]} size="sm" />
              </div>
              <p className="mt-0.5 text-caption text-fg-subtle">
                {formatDate(m.plannedStart)} → {formatDate(m.plannedEnd)}
                {m.actualEnd ? ` • finished ${formatDate(m.actualEnd)}` : ''}
                {m.delayDays ? ` • +${m.delayDays} ${t('common.days')}` : ''}
              </p>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel title={`Milestone Register (${milestones.length})`} icon="checklist" bodyClassName="p-0">
        <DataTable
          minWidth={1060}
          rows={milestones}
          rowKey={(m) => m.id}
          columns={[
            { key: 'title', header: 'Milestone', isRowHeader: true, render: (m) => (
              <button type="button" onClick={() => setDetail(m)} className="text-left font-medium text-fg hover:text-primary-strong hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                {m.title}
              </button>
            ) },
            { key: 'window', header: 'Planned Window', cellClassName: 'tabular-nums', render: (m) => `${formatDate(m.plannedStart)} → ${formatDate(m.plannedEnd)}` },
            { key: 'progress', header: t('common.progress'), sortable: true, sortValue: (m) => m.physicalProgressPct, render: (m) => <Progress value={m.physicalProgressPct} label={`Progress of ${m.title}`} size="sm" className="min-w-28" /> },
            { key: 'status', header: t('common.status'), render: (m) => <StatusBadge descriptor={MILESTONE_STATUS[m.status]} size="sm" /> },
            {
              key: 'verification',
              header: 'Verification',
              render: (m) => {
                const v = meta(m)?.verification ?? 'not_due'
                return <StatusBadge descriptor={VERIFICATION_TONE[v]} size="sm" />
              },
            },
            {
              key: 'payment',
              header: 'Payment Linked',
              render: (m) => {
                const v = meta(m)
                if (!v?.paymentLinked) return <span className="text-caption text-fg-subtle">—</span>
                return <span className="nk-mono-id text-caption text-fg">{v.paymentRef ?? 'Linked'}</span>
              },
            },
            { key: 'delay', header: 'Delay', cellClassName: 'tabular-nums', render: (m) => (m.delayDays ? <Badge tone="danger" icon="timer_off">+{m.delayDays}d</Badge> : <span className="text-caption text-fg-subtle">—</span>) },
          ]}
          rowActions={(m) => (
            <Button
              variant="outline"
              size="sm"
              className="!min-h-7 !px-2.5"
              onClick={() => {
                setUpdateTarget(m)
                setNewProgress(String(m.physicalProgressPct))
              }}
            >
              Update
            </Button>
          )}
        />
      </Panel>

      <Card className="p-3 text-caption text-fg-subtle">{t('common.mockDataNote')}</Card>

      {/* Milestone detail drawer */}
      <Drawer open={detail !== null} onClose={() => setDetail(null)} title={detail?.title ?? ''} titleIcon="fact_check" width="max-w-lg">
        {detail && (
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge descriptor={MILESTONE_STATUS[detail.status]} />
              <Badge tone="neutral" icon="speed">{detail.physicalProgressPct}%</Badge>
              {detail.delayDays ? <Badge tone="danger" icon="timer_off">+{detail.delayDays} {t('common.days')}</Badge> : null}
            </div>
            <Panel title="Scope & Schedule" icon="info">
              <dl className="grid grid-cols-2 gap-3 text-body-small">
                <DetailField label="Planned start" value={formatDate(detail.plannedStart)} />
                <DetailField label="Planned end" value={formatDate(detail.plannedEnd)} />
                <DetailField label="Actual start" value={detail.actualStart ? formatDate(detail.actualStart) : '—'} />
                <DetailField label="Actual end" value={detail.actualEnd ? formatDate(detail.actualEnd) : '—'} />
                <DetailField label="Responsible" value={project.contractor ?? 'Department (in-house)'} />
                <DetailField label="Remarks" value={detail.remarks ?? '—'} />
              </dl>
            </Panel>
            <Panel title="Deliverables & Evidence" icon="inventory">
              <ul className="flex flex-col gap-1.5">
                {(meta(detail)?.deliverables ?? []).map((d) => (
                  <li key={d} className="flex items-center gap-2 text-body-small text-fg">
                    <span className="material-symbols-outlined text-[16px] text-fg-subtle" aria-hidden="true">attach_file</span>
                    {d}
                  </li>
                ))}
                {(meta(detail)?.deliverables ?? []).length === 0 && <li className="text-body-small text-fg-muted">Deliverable checklist appears once execution starts.</li>}
              </ul>
              <p className="mt-3 text-caption text-fg-subtle">
                Photos and inspection records attach from the execution module ({project.inspectionsCount} inspections on record).
              </p>
            </Panel>
            <Panel title="Verification & Payment" icon="payments">
              <dl className="grid grid-cols-2 gap-3 text-body-small">
                <DetailField
                  label="Verification"
                  value={<StatusBadge descriptor={VERIFICATION_TONE[meta(detail)?.verification ?? 'not_due']} size="sm" />}
                />
                <DetailField label="Verified by" value={meta(detail)?.verifiedBy ?? '—'} />
                <DetailField label="Payment linked" value={meta(detail)?.paymentLinked ? (meta(detail)?.paymentRef ?? 'Yes') : 'No'} />
                <DetailField
                  label="Certified value"
                  value={<span className="tabular-nums">{meta(detail)?.paymentLinked ? formatCr(Math.round(project.sanctionedAmountCr * 0.12 * 100) / 100) : '—'}</span>}
                />
              </dl>
              {detail.status !== 'upcoming' && meta(detail)?.verification === 'pending' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="primary" size="sm" icon="verified" onClick={() => { decideVerification(detail, 'verified'); setDetail(null) }}>
                    {t('common.approve')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon="u_turn_left"
                    onClick={() =>
                      setConfirm({
                        title: 'Reject milestone verification?',
                        message: `"${detail.title}" will be marked rejected and the contractor asked to re-submit measurements.`,
                        run: () => decideVerification(detail, 'rejected'),
                      })
                    }
                  >
                    {t('common.reject')}
                  </Button>
                </div>
              )}
            </Panel>
          </div>
        )}
      </Drawer>

      {/* Update progress modal */}
      <Modal
        open={updateTarget !== null}
        onClose={() => setUpdateTarget(null)}
        title={`Update Progress — ${updateTarget?.title ?? ''}`}
        titleIcon="edit"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setUpdateTarget(null)}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              disabled={!(Number(newProgress) >= 0 && Number(newProgress) <= 100)}
              onClick={() => {
                if (!updateTarget) return
                const value = Number(newProgress)
                setMilestones((list) =>
                  list.map((m) =>
                    m.id === updateTarget.id
                      ? { ...m, physicalProgressPct: value, status: value === 100 ? ('completed' as const) : m.status === 'upcoming' ? ('in_progress' as const) : m.status }
                      : m,
                  ),
                )
                showToast(`Progress on "${updateTarget.title}" set to ${value}% — verification requested (demo).`, 'success')
                setUpdateTarget(null)
              }}
            >
              {t('common.submit')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <TextField label="Physical progress (%)" required type="number" min={0} max={100} value={newProgress} onChange={(e) => setNewProgress(e.target.value)} />
          <Select
            label="Verification basis"
            value="inspection"
            onChange={() => undefined}
            options={[
              { value: 'inspection', label: 'Site inspection record' },
              { value: 'drone', label: 'Drone orthomosaic' },
              { value: 'mb', label: 'e-MB entry' },
            ]}
          />
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
