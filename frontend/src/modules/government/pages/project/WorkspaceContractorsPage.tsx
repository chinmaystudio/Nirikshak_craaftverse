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
import { TextField } from '@/components/ui/Fields'
import { PageHeader, KpiRow, FilterBar, DetailField, KpiCard } from '@/components/blocks/Page'
import { formatCr, formatDate } from '@/utils/format'
import { BILL_STATUS, SCORE_BAND } from '@/utils/status'
import { CONTRACTORS } from '@/data/modules'
import { CONTRACTOR_EXTRA } from '@/data/workspace'
import type { Contractor } from '@/types'

/** Project workspace — Contractor Management: register, verification,
 * profiles, performance, penalties and payment history. */
export function WorkspaceContractorsPage() {
  const { t } = useI18n()
  const { showToast } = useToast()
  const { project, workOrder, bills } = useProjectWorkspace()
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState<Contractor | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [newC, setNewC] = useState({ name: '', reg: '', cls: 'Class A' })
  const [verified, setVerified] = useState<Record<string, boolean>>({})

  const rows = useMemo(() => {
    const list = assignedFirst(CONTRACTORS, project?.contractor)
    if (!search) return list
    return list.filter((c) => `${c.name} ${c.registrationNo} ${c.class}`.toLowerCase().includes(search.toLowerCase()))
  }, [search, project?.contractor])

  const highRisk = CONTRACTORS.filter((c) => c.scoreBand === 'poor').length
  const issues = CONTRACTORS.reduce((s, c) => s + c.pendingDefects + c.litigationCount, 0)

  if (!project) return null

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Contractor Management"
        description="Register, verification, performance, penalties and payment history for contractors associated with this project."
        actions={
          <>
            <Button variant="outline" size="sm" icon="download" onClick={() => showToast('Contractor register exported (demo file).', 'info')}>
              {t('common.export')}
            </Button>
            <Button variant="primary" size="sm" icon="add" onClick={() => setAddOpen(true)}>
              Add Contractor
            </Button>
          </>
        }
      />

      <KpiRow>
        <KpiCard label="Registered Contractors" value={CONTRACTORS.length} icon="engineering" />
        <KpiCard label="Verified" value={CONTRACTORS.filter((c) => verified[c.id] ?? true).length} icon="verified" iconTone="success" />
        <KpiCard label="High Risk" value={highRisk} icon="warning" iconTone={highRisk ? 'danger' : 'neutral'} />
        <KpiCard label="Pending Issues" value={issues} icon="report" iconTone={issues ? 'warning' : 'neutral'} delta="Defects + litigation" />
      </KpiRow>

      <FilterBar search={search} onSearch={setSearch} searchPlaceholder="Search contractor, registration no…" onClear={() => setSearch('')} />

      <Panel title={`Contractor Register (${rows.length})`} icon="engineering" bodyClassName="p-0">
        <DataTable
          minWidth={1060}
          rows={rows}
          rowKey={(c) => c.id}
          initialSort={{ key: 'score', dir: 'desc' }}
          columns={[
            { key: 'name', header: 'Contractor', isRowHeader: true, render: (c) => (
              <span className={c.name === project.contractor ? 'font-semibold text-primary-strong' : ''}>
                {c.name}{c.name === project.contractor ? ' (assigned here)' : ''}
              </span>
            ) },
            { key: 'reg', header: 'Registration', render: (c) => <span className="nk-mono-id">{c.registrationNo}</span> },
            { key: 'class', header: 'Class', render: (c) => <Badge tone="neutral">{c.class}</Badge> },
            { key: 'works', header: 'Works', cellClassName: 'tabular-nums', sortable: true, sortValue: (c) => c.completedProjects, render: (c) => `${c.completedProjects} done • ${c.activeProjects} active` },
            { key: 'value', header: 'Contract Value', cellClassName: 'tabular-nums', sortable: true, sortValue: (c) => c.totalValueCr, render: (c) => formatCr(c.totalValueCr) },
            { key: 'ontime', header: 'Completion Rate', cellClassName: 'tabular-nums', sortable: true, sortValue: (c) => c.onTimeCompletionPct, render: (c) => `${c.onTimeCompletionPct}%` },
            { key: 'risk', header: t('common.risk'), render: (c) => <StatusBadge descriptor={SCORE_BAND[c.scoreBand]} size="sm" /> },
            { key: 'lit', header: 'Litigation', cellClassName: 'tabular-nums', render: (c) => (c.litigationCount ? <Badge tone="warning" icon="gavel">{c.litigationCount}</Badge> : <Badge tone="success" icon="check_circle">0</Badge>) },
            {
              key: 'verified',
              header: 'Verified',
              render: (c) => (
                <Badge tone={(verified[c.id] ?? true) ? 'success' : 'warning'} icon={(verified[c.id] ?? true) ? 'verified' : 'hourglass_top'}>
                  {(verified[c.id] ?? true) ? 'Yes' : 'Pending'}
                </Badge>
              ),
            },
          ]}
          rowActions={(c) => (
            <Button variant="outline" size="sm" className="!min-h-7 !px-2.5" onClick={() => setDetail(c)}>
              Profile
            </Button>
          )}
        />
      </Panel>

      <Card className="p-3 text-caption text-fg-subtle">{t('common.mockDataNote')}</Card>

      {/* Profile drawer */}
      <Drawer open={detail !== null} onClose={() => setDetail(null)} title={detail?.name ?? ''} titleIcon="engineering" width="max-w-xl">
        {detail && (
          <ContractorProfile
            contractor={detail}
            isAssigned={detail.name === project.contractor}
            workOrderNo={workOrder?.id ?? project.workOrderNo ?? null}
            bills={bills.filter((b) => b.contractor === detail.name)}
            onVerify={() => {
              setVerified((v) => ({ ...v, [detail.id]: true }))
              showToast(`${detail.name} — registration and GST re-verified against MCA records (demo).`, 'success')
            }}
            onAssign={() => showToast(`Assignment request for ${detail.name} routed to the competent authority (demo).`, 'info')}
          />
        )}
      </Drawer>

      {/* Add contractor */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Contractor to Register"
        titleIcon="add"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              disabled={!newC.name.trim() || !newC.reg.trim()}
              onClick={() => {
                showToast(`${newC.name.trim()} added for verification — credentials checked against PWD contractor database (demo).`, 'success')
                setNewC({ name: '', reg: '', cls: 'Class A' })
                setAddOpen(false)
              }}
            >
              {t('common.submit')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <TextField label="Firm name" required value={newC.name} onChange={(e) => setNewC((f) => ({ ...f, name: e.target.value }))} />
          <TextField label="PWD registration no." required value={newC.reg} onChange={(e) => setNewC((f) => ({ ...f, reg: e.target.value }))} placeholder="e.g. PWD/PUN/2026/****" />
          <TextField label="Class" value={newC.cls} onChange={(e) => setNewC((f) => ({ ...f, cls: e.target.value }))} />
        </div>
      </Modal>
    </div>
  )
}

function assignedFirst(list: Contractor[], assignedName?: string): Contractor[] {
  if (!assignedName) return list
  return [...list].sort((a, b) => Number(b.name === assignedName) - Number(a.name === assignedName))
}

function ContractorProfile({
  contractor,
  isAssigned,
  workOrderNo,
  bills,
  onVerify,
  onAssign,
}: {
  contractor: Contractor
  isAssigned: boolean
  workOrderNo: string | null
  bills: { id: string; billNo: string; amountCr: number; status: keyof typeof BILL_STATUS }[]
  onVerify: () => void
  onAssign: () => void
}) {
  const extra = CONTRACTOR_EXTRA[contractor.id]
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        {isAssigned && <Badge tone="secondary" icon="assignment_turned_in">Assigned to this project</Badge>}
        <StatusBadge descriptor={SCORE_BAND[contractor.scoreBand]} size="sm" />
      </div>

      <Panel title="Company Information" icon="apartment">
        <dl className="grid grid-cols-2 gap-3 text-body-small">
          <DetailField label="Registration" value={<span className="nk-mono-id">{contractor.registrationNo}</span>} />
          <DetailField label="GSTIN" value={<span className="nk-mono-id">{extra?.gstin ?? '—'}</span>} />
          <DetailField label="Class" value={contractor.class} />
          <DetailField label="Empanelled since" value={formatDate(contractor.empanelledSince)} />
          <DetailField label="Districts" value={contractor.districts.join(', ')} />
          <DetailField label="Annual turnover" value={extra ? formatCr(extra.turnoverCr) : '—'} />
          <DetailField label="Manpower" value={extra ? `${extra.staffCount} staff` : '—'} />
          <DetailField label="Key plant & equipment" value={extra?.equipment ?? '—'} />
        </dl>
      </Panel>

      <Panel title="Performance" icon="speed">
        <dl className="grid grid-cols-2 gap-3 text-body-small">
          <DetailField label="Works completed" value={contractor.completedProjects} />
          <DetailField label="Active projects" value={contractor.activeProjects} />
          <DetailField label="Total value" value={<span className="tabular-nums">{formatCr(contractor.totalValueCr)}</span>} />
          <DetailField label="On-time completion" value={`${contractor.onTimeCompletionPct}%`} />
          <DetailField label="Quality rating" value={`${contractor.qualityRating.toFixed(1)}/5`} />
          <DetailField label="AI score" value={`${contractor.aiScore}/100`} />
        </dl>
      </Panel>

      <Panel title="Penalties & Defects" icon="gavel">
        <dl className="grid grid-cols-2 gap-3 text-body-small">
          <DetailField label="Pending defect items" value={contractor.pendingDefects} />
          <DetailField label="Active litigation" value={contractor.litigationCount} />
          <DetailField label="Bank guarantee" value={extra?.bankGuaranteeCr ? formatCr(extra.bankGuaranteeCr) : '—'} />
          <DetailField label="Performance security" value={workOrderNo ? 'As per work order clauses' : '—'} />
        </dl>
        <p className="mt-3 text-caption text-fg-subtle">{contractor.risks.join(' • ')}</p>
      </Panel>

      <Panel title="Payment History" icon="payments" bodyClassName="p-0">
        {bills.length > 0 ? (
          <ul className="divide-y divide-border">
            {bills.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <span className="nk-mono-id text-fg">{b.billNo}</span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums text-body-small text-fg">{formatCr(b.amountCr)}</span>
                  <StatusBadge descriptor={BILL_STATUS[b.status]} size="sm" />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-4 text-body-small text-fg-muted">No bills on record for this contractor.</p>
        )}
      </Panel>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" icon="verified" onClick={onVerify}>
          Verify Contractor
        </Button>
        <Button variant="outline" size="sm" icon="assignment" onClick={onAssign}>
          Assign Project
        </Button>
      </div>
    </div>
  )
}
