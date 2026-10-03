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
import { PageHeader, KpiRow, FilterBar, DetailField, KpiCard } from '@/components/blocks/Page'
import { formatSlaCountdown, formatDate } from '@/utils/format'
import { GRIEVANCE_STATUS, PRIORITY } from '@/utils/status'
import type { Grievance } from '@/types'

/** Project workspace — Complaints & Grievance Tracking for this project only. */
export function WorkspaceComplaintsPage() {
  const { t } = useI18n()
  const { showToast } = useToast()
  const { grievances } = useProjectWorkspace()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [detail, setDetail] = useState<Grievance | null>(null)
  const [assignOpen, setAssignOpen] = useState<Grievance | null>(null)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [newG, setNewG] = useState({ subject: '', category: 'Roads & Footpaths', desc: '' })

  const rows = useMemo(
    () =>
      grievances.filter(
        (g) =>
          (!statusFilter || g.status === statusFilter) &&
          (!priorityFilter || g.priority === priorityFilter) &&
          (!search || `${g.id} ${g.subject} ${g.submittedBy}`.toLowerCase().includes(search.toLowerCase())),
      ),
    [grievances, statusFilter, priorityFilter, search],
  )

  const open = grievances.filter((g) => ['submitted', 'acknowledged'].includes(g.status)).length
  const inProgress = grievances.filter((g) => g.status === 'in_review' || g.status === 'action_taken').length
  const resolved = grievances.filter((g) => ['resolved', 'closed'].includes(g.status)).length
  const escalated = grievances.filter((g) => g.priority === 'urgent' && !['resolved', 'closed', 'rejected'].includes(g.status)).length
  const highPriority = grievances.filter((g) => g.priority === 'high' || g.priority === 'urgent').length

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Complaints & Grievance Tracking"
        description="Citizen complaints linked to this project — categorization, SLA countdown, officer assignment and resolution tracking."
        actions={
          <Button variant="primary" size="sm" icon="add" onClick={() => setRegisterOpen(true)}>
            Register Complaint
          </Button>
        }
      />

      <KpiRow>
        <KpiCard label="Total Complaints" value={grievances.length} icon="report_problem" />
        <KpiCard label="Open / In Progress" value={`${open} / ${inProgress}`} icon="pending_actions" iconTone="warning" />
        <KpiCard label="Resolved" value={resolved} icon="task_alt" iconTone="success" />
        <KpiCard label="Escalated / High Priority" value={`${escalated} / ${highPriority}`} icon="priority_high" iconTone={escalated ? 'danger' : 'neutral'} />
      </KpiRow>

      <FilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search complaint id, subject, citizen…"
        selects={[
          {
            label: t('common.status'),
            value: statusFilter,
            onChange: setStatusFilter,
            options: [{ value: '', label: t('common.all') }, ...Object.entries(GRIEVANCE_STATUS).map(([k, d]) => ({ value: k, label: t(d.key) }))],
          },
          {
            label: t('common.priority'),
            value: priorityFilter,
            onChange: setPriorityFilter,
            options: [{ value: '', label: t('common.all') }, ...Object.entries(PRIORITY).map(([k, d]) => ({ value: k, label: t(d.key) }))],
          },
        ]}
        onClear={() => {
          setSearch('')
          setStatusFilter('')
          setPriorityFilter('')
        }}
      />

      <Panel title={`Complaint Register (${rows.length})`} icon="report_problem" bodyClassName="p-0">
        <DataTable
          minWidth={1000}
          rows={rows}
          rowKey={(g) => g.id}
          initialSort={{ key: 'sla', dir: 'asc' }}
          columns={[
            { key: 'id', header: 'Complaint ID', isRowHeader: true, render: (g) => <span className="nk-mono-id text-fg">{g.id}</span> },
            { key: 'subject', header: 'Subject', render: (g) => <span className="block max-w-56 truncate" title={g.subject}>{g.subject}</span> },
            { key: 'category', header: 'Category', render: (g) => <Badge tone="neutral">{g.category}</Badge> },
            { key: 'priority', header: t('common.priority'), render: (g) => <StatusBadge descriptor={PRIORITY[g.priority]} size="sm" /> },
            { key: 'status', header: t('common.status'), render: (g) => <StatusBadge descriptor={GRIEVANCE_STATUS[g.status]} size="sm" /> },
            { key: 'sla', header: 'SLA', cellClassName: 'tabular-nums', sortable: true, sortValue: (g) => g.slaDeadline, render: (g) => <span className="text-caption tabular-nums">{formatSlaCountdown(g.slaDeadline)}</span> },
            { key: 'assigned', header: 'Assigned To', render: (g) => <span className="text-caption">{g.assignedTo}</span> },
          ]}
          rowActions={(g) => (
            <Button variant="outline" size="sm" className="!min-h-7 !px-2.5" onClick={() => setDetail(g)}>
              {t('common.view')}
            </Button>
          )}
          emptyState={
            <div className="p-8 text-center">
              <p className="text-body-small text-fg-muted">No complaints are currently linked to this project.</p>
              <Button variant="outline" size="sm" icon="add" className="mt-3" onClick={() => setRegisterOpen(true)}>
                Register Complaint
              </Button>
            </div>
          }
        />
      </Panel>

      <Card className="p-3 text-caption text-fg-subtle">{t('common.mockDataNote')}</Card>

      {/* Complaint detail drawer */}
      <Drawer open={detail !== null} onClose={() => setDetail(null)} title={detail ? `Complaint ${detail.id}` : ''} titleIcon="report_problem" width="max-w-lg">
        {detail && (
          <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge descriptor={GRIEVANCE_STATUS[detail.status]} />
              <StatusBadge descriptor={PRIORITY[detail.priority]} size="sm" />
              <Badge tone="neutral" icon="schedule">SLA {formatSlaCountdown(detail.slaDeadline)}</Badge>
            </div>
            <Panel title="Complaint Details" icon="info">
              <dl className="grid grid-cols-2 gap-3 text-body-small">
                <div className="col-span-2"><dt className="text-fg-subtle">Subject</dt><dd className="text-fg">{detail.subject}</dd></div>
                <div className="col-span-2"><dt className="text-fg-subtle">Description</dt><dd className="text-fg-muted">{detail.description}</dd></div>
                <DetailField label="Citizen (masked)" value={detail.submittedBy} />
                <DetailField label="Location" value={detail.district} />
                <DetailField label="Submitted" value={formatDate(detail.submittedOn)} />
                <DetailField label="Assigned officer" value={detail.assignedTo} />
                <DetailField label="Evidence" value={detail.attachments > 0 ? `${detail.attachments} photo/document(s)` : 'None attached'} />
                <DetailField label="Resolution" value={detail.resolutionNote ?? 'Pending'} />
              </dl>
            </Panel>
            <Panel title="Timeline" icon="history" bodyClassName="p-0">
              <ol className="divide-y divide-border">
                {detail.timeline.map((e, i) => (
                  <li key={i} className="p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-label text-fg">{e.action}</p>
                      <span className="tabular-nums text-caption text-fg-subtle">{formatDate(e.timestamp)}</span>
                    </div>
                    <p className="mt-0.5 text-caption text-fg-muted">
                      {e.actor} — {e.note}
                    </p>
                  </li>
                ))}
              </ol>
            </Panel>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" icon="person_add" onClick={() => setAssignOpen(detail)}>
                {t('common.assign')}
              </Button>
              {detail.status !== 'resolved' && detail.status !== 'closed' && (
                <Button
                  variant="primary"
                  size="sm"
                  icon="task_alt"
                  onClick={() => {
                    showToast(`Complaint ${detail.id} marked resolved — citizen feedback request sent (demo).`, 'success')
                    setDetail(null)
                  }}
                >
                  {t('common.resolve')}
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                icon="north_east"
                onClick={() => showToast(`Complaint ${detail.id} escalated to the Collector's office (demo).`, 'warning')}
              >
                {t('common.escalate')}
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Assign modal */}
      <Modal
        open={assignOpen !== null}
        onClose={() => setAssignOpen(null)}
        title="Assign Complaint"
        titleIcon="person_add"
        size="sm"
        footer={<Button variant="outline" onClick={() => setAssignOpen(null)}>{t('common.close')}</Button>}
      >
        <div className="flex flex-col gap-3">
          <Select
            label="Assign to officer"
            value="ee"
            onChange={() => undefined}
            options={[
              { value: 'ee', label: 'Er. S. D. Kulkarni — Executive Engineer' },
              { value: 'ae', label: 'Er. A. S. Shaikh — Dy. Engineer' },
              { value: 'se', label: 'Er. M. P. Joshi — Superintending Engineer' },
            ]}
          />
          <Button
            variant="primary"
            onClick={() => {
              showToast(`Complaint ${assignOpen?.id} assigned — SLA clock continues (demo).`, 'success')
              setAssignOpen(null)
            }}
          >
            {t('common.confirm')}
          </Button>
        </div>
      </Modal>

      {/* Register complaint */}
      <Modal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        title="Register Complaint"
        titleIcon="add"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setRegisterOpen(false)}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              disabled={!newG.subject.trim()}
              onClick={() => {
                showToast(`Complaint registered (${newG.category}) and routed for acknowledgement (demo).`, 'success')
                setNewG({ subject: '', category: 'Roads & Footpaths', desc: '' })
                setRegisterOpen(false)
              }}
            >
              {t('common.submit')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <TextField label="Subject" required value={newG.subject} onChange={(e) => setNewG((f) => ({ ...f, subject: e.target.value }))} />
          <Select
            label="Category"
            value={newG.category}
            onChange={(e) => setNewG((f) => ({ ...f, category: e.target.value }))}
            options={['Roads & Footpaths', 'Water Supply', 'Drainage', 'Street Lighting', 'Encroachment', 'Other'].map((c) => ({ value: c, label: c }))}
          />
          <TextArea label="Description" rows={3} value={newG.desc} onChange={(e) => setNewG((f) => ({ ...f, desc: e.target.value }))} />
          <p className="text-caption text-fg-subtle">Officer-registered complaints carry the citizen's name only with consent; SLA is 7 days.</p>
        </div>
      </Modal>
    </div>
  )
}
