import { useMemo, useState } from 'react'
import { useI18n } from '@/context/I18nContext'
import { useProjectWorkspace } from '@/context/ProjectWorkspaceContext'
import { useToast } from '@/context/ToastContext'
import { financeApi } from '@/api'
import { Panel, Card } from '@/components/ui/Card'
import { DataTable } from '@/components/tables/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Button } from '@/components/ui/Button'
import { Drawer, Modal } from '@/components/modals/Modal'
import { TextField, Select, TextArea } from '@/components/ui/Fields'
import { PageHeader, KpiRow, FilterBar, ConfirmDialog, DetailField, KpiCard } from '@/components/blocks/Page'
import { SegmentBar, BarChart } from '@/components/charts/Charts'
import { formatCr, formatDate } from '@/utils/format'
import { APPROVAL_STATUS, BILL_FLAG, BILL_STATUS } from '@/utils/status'
import { BUDGET_HEADS, MONTHLY_SPEND, billRiskFor } from '@/data/workspace'
import type { BudgetHead } from '@/data/workspace'
import type { BillItem } from '@/types'
import { FUNDING_SOURCES } from '@/constants'

/** Project workspace — Budget & Finance: full financial control center with
 * allocation control, expenditure analytics, fund-release tracking and the
 * complete Payment & Bill Management workflow (scoped to the open project). */
export function WorkspaceBudgetPage() {
  const { t } = useI18n()
  const { showToast } = useToast()
  const { project, approvals, bills } = useProjectWorkspace()
  const [billState, setBillState] = useState<BillItem[]>(bills)
  const [headState, setHeadState] = useState<BudgetHead[]>(project ? (BUDGET_HEADS[project.id] ?? []) : [])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [billDrawer, setBillDrawer] = useState<BillItem | null>(null)
  const [headDrawer, setHeadDrawer] = useState<BudgetHead | null>(null)
  const [addHeadOpen, setAddHeadOpen] = useState(false)
  const [newHead, setNewHead] = useState({ head: '', amountCr: '', source: '' })
  const [confirm, setConfirm] = useState<{ title: string; message: string; run: () => void } | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  const fin = project?.financials
  const utilization = fin && fin.sanctionedAmountCr > 0 ? (fin.amountUtilizedCr / fin.sanctionedAmountCr) * 100 : 0
  const revised = fin?.revisedAmountCr
  const overrunCr = revised != null && fin ? revised - fin.sanctionedAmountCr : 0
  const remaining = fin ? fin.sanctionedAmountCr - fin.amountUtilizedCr : 0
  const releaseApprovals = approvals.filter((a) => a.type.includes('Fund Release'))
  const spend = project ? (MONTHLY_SPEND[project.id] ?? []) : []
  const heads = useMemo(() => headState, [headState])

  const filteredHeads = heads.filter(
    (h) => !search || h.head.toLowerCase().includes(search.toLowerCase()),
  )

  const filteredBills = useMemo(
    () =>
      billState.filter((b) => {
        if (statusFilter && b.status !== statusFilter) return false
        if (typeFilter && b.type !== typeFilter) return false
        if (riskFilter === 'flagged' && !b.flag) return false
        if (riskFilter === 'clear' && b.flag) return false
        return !search || `${b.id} ${b.billNo} ${b.contractor} ${b.mbEntry}`.toLowerCase().includes(search.toLowerCase())
      }),
    [billState, statusFilter, typeFilter, riskFilter, search],
  )

  const flagged = billState.filter((b) => b.flag)
  const pendingAmount = billState.filter((b) => ['submitted', 'verified'].includes(b.status)).reduce((s, b) => s + b.amountCr, 0)
  const paidAmount = billState.filter((b) => b.status === 'paid').reduce((s, b) => s + b.amountCr, 0)

  /** Demo state transitions — never persisted; every action is announced. */
  const transitionBill = (id: string, action: 'verify' | 'approve' | 'pay' | 'return', note?: string) => {
    setBillState((list) =>
      list.map((b) => {
        if (b.id !== id) return b
        if (action === 'verify') return { ...b, status: 'verified', verifiedBy: 'Er. S. D. Kulkarni (session)' }
        if (action === 'approve') return { ...b, status: 'approved', approvedBy: 'SE, Pune Circle (session)' }
        if (action === 'pay') return { ...b, status: 'paid', paidOn: new Date().toISOString().slice(0, 10) }
        return { ...b, status: 'returned', flagNote: note ?? b.flagNote }
      }),
    )
    const messages = {
      verify: `Bill ${id} marked verified — forwarded for approval.`,
      approve: `Bill ${id} approved for payment.`,
      pay: `Payment recorded against bill ${id} (demo).`,
      return: `Bill ${id} returned to contractor for correction.`,
    } as const
    showToast(messages[action], action === 'return' ? 'warning' : 'success')
  }

  if (!project || !fin) return null

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Budget & Finance"
        description="Financial control center — allocation, expenditure, fund releases and the complete bill-payment workflow for this project."
        actions={
          <>
            <Button variant="outline" size="sm" icon="download" onClick={() => setExportOpen(true)}>
              {t('common.export')}
            </Button>
            <Button variant="primary" size="sm" icon="add" onClick={() => setAddHeadOpen(true)}>
              Add Budget Allocation
            </Button>
          </>
        }
      />

      <KpiRow>
        <KpiCard label="Sanctioned" value={formatCr(fin.sanctionedAmountCr)} icon="account_balance" />
        <KpiCard label="Utilized" value={formatCr(fin.amountUtilizedCr)} icon="payments" iconTone="success" delta={`${utilization.toFixed(1)}% of sanction`} deltaTone="neutral" />
        <KpiCard label="Remaining Budget" value={formatCr(Math.max(0, remaining))} icon="savings" iconTone="neutral" delta={fin.amountCommittedCr ? `${formatCr(fin.amountCommittedCr)} committed` : undefined} />
        <KpiCard
          label="Cost Variance"
          value={revised != null && overrunCr !== 0 ? `${overrunCr > 0 ? '+' : ''}${formatCr(overrunCr)}` : 'Nil'}
          icon="trending_up"
          iconTone={revised != null && overrunCr > 0 ? 'danger' : 'neutral'}
          delta={revised != null ? 'Revised cost on record' : 'Sanctioned cost holds'}
          deltaTone={revised != null && overrunCr > 0 ? 'danger' : 'success'}
        />
      </KpiRow>

      {/* Allocation + analytics */}
      <section id="allocation" className="scroll-mt-24 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="Budget vs Expenditure" icon="donut_small">
            <SegmentBar
              ariaLabel="Budget split"
              segments={[
                { label: `Utilized ${formatCr(fin.amountUtilizedCr)}`, value: fin.amountUtilizedCr, className: 'bg-success' },
                { label: `Committed ${formatCr(fin.amountCommittedCr)}`, value: fin.amountCommittedCr, className: 'bg-warning' },
                { label: `Unspent ${formatCr(Math.max(0, remaining - fin.amountCommittedCr))}`, value: Math.max(0, remaining - fin.amountCommittedCr), className: 'bg-surface-3' },
              ]}
            />
            <ul className="mt-4 flex flex-col gap-3">
              {fin.fundingSources.map((f) => (
                <li key={f.source}>
                  <div className="mb-1 flex items-center justify-between text-body-small">
                    <span className="text-fg">{f.source}</span>
                    <span className="tabular-nums text-fg-muted">{formatCr(f.amountCr)} • {f.sharePct}%</span>
                  </div>
                  <Progress value={f.sharePct} label={`${f.source} share`} size="sm" showValue={false} />
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Monthly Expenditure — Planned vs Actual" icon="bar_chart">
            {spend.length > 0 ? (
              <>
                <BarChart
                  ariaLabel="Actual monthly expenditure"
                  data={spend.map((m) => ({ label: m.month, value: m.actualCr, tone: 'success' as const }))}
                  valueFormatter={(v) => formatCr(v)}
                  showValues={false}
                />
                <div className="mt-3 border-t border-border pt-3">
                  <BarChart
                    ariaLabel="Planned monthly expenditure"
                    data={spend.map((m) => ({ label: m.month, value: m.plannedCr }))}
                    valueFormatter={(v) => formatCr(v)}
                    showValues={false}
                  />
                </div>
                <p className="mt-3 text-caption text-fg-subtle">
                  Top: actual bookings • Bottom: planned curve. Cumulative actual {formatCr(spend.reduce((s, m) => s + m.actualCr, 0))} vs planned {formatCr(spend.reduce((s, m) => s + m.plannedCr, 0))}.
                </p>
              </>
            ) : (
              <p className="text-body-small text-fg-muted">Monthly expenditure booking starts after the first RA bill is paid.</p>
            )}
          </Panel>
        </div>

        <FilterBar
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search budget head…"
          onClear={() => setSearch('')}
        />
        <Panel title={`Budget Allocation (${filteredHeads.length})`} icon="account_balance_wallet" bodyClassName="p-0">
          <DataTable
            minWidth={880}
            rows={filteredHeads}
            rowKey={(h) => h.id}
            paginated
            pageSize={6}
            initialSort={{ key: 'original', dir: 'desc' }}
            columns={[
              { key: 'head', header: 'Budget Head', isRowHeader: true, sortable: true, sortValue: (h) => h.head, render: (h) => h.head },
              { key: 'original', header: 'Original', cellClassName: 'tabular-nums', sortable: true, sortValue: (h) => h.originalCr, render: (h) => formatCr(h.originalCr) },
              { key: 'revised', header: 'Revised', cellClassName: 'tabular-nums', render: (h) => (h.revisedCr != null ? formatCr(h.revisedCr) : '—') },
              { key: 'utilized', header: 'Utilized', cellClassName: 'tabular-nums', sortable: true, sortValue: (h) => h.utilizedCr, render: (h) => formatCr(h.utilizedCr) },
              { key: 'remaining', header: 'Remaining', cellClassName: 'tabular-nums', render: (h) => formatCr(Math.max(0, (h.revisedCr ?? h.originalCr) - h.utilizedCr)) },
              {
                key: 'utilization',
                header: 'Utilization',
                render: (h) => {
                  const pct = Math.min(100, (h.utilizedCr / (h.revisedCr ?? h.originalCr)) * 100)
                  return <Progress value={pct} label={`${h.head} utilization`} size="sm" className="min-w-28" showValue={false} />
                },
              },
              {
                key: 'variance',
                header: t('common.risk'),
                render: (h) => {
                  const variance = (h.revisedCr ?? 0) - h.originalCr
                  const burn = h.utilizedCr / (h.revisedCr ?? h.originalCr)
                  if (variance > 0) return <Badge tone="warning" icon="trending_up">Revised +{formatCr(variance)}</Badge>
                  if (burn > 0.9) return <Badge tone="warning" icon="priority_high">Burn {(burn * 100).toFixed(0)}%</Badge>
                  return <Badge tone="success" icon="check_circle">Normal</Badge>
                },
              },
            ]}
            rowActions={(h) => (
              <Button variant="outline" size="sm" className="!min-h-7 !px-2.5" onClick={() => setHeadDrawer(h)}>
                {t('common.view')}
              </Button>
            )}
            emptyState={
              <div className="p-8 text-center">
                <p className="text-body-small text-fg-muted">No budget heads have been allocated for this project yet.</p>
                <Button variant="primary" size="sm" icon="add" className="mt-3" onClick={() => setAddHeadOpen(true)}>
                  Add Budget Allocation
                </Button>
              </div>
            }
          />
        </Panel>
      </section>

      {/* Fund release tracking */}
      <section id="fund-release" className="scroll-mt-24">
        <Panel title="Fund Release Tracking" icon="route" bodyClassName="p-0">
          {releaseApprovals.length > 0 ? (
            <ul className="divide-y divide-border">
              {releaseApprovals.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div>
                    <p className="text-label text-fg">{a.type}</p>
                    <p className="text-caption text-fg-muted">
                      {a.submittedBy} • {formatDate(a.submittedOn)} • SLA {formatDate(a.slaDueDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.amountCr != null && <Badge tone="neutral" icon="payments">{formatCr(a.amountCr)}</Badge>}
                    <StatusBadge descriptor={APPROVAL_STATUS[a.status]} size="sm" />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-4 text-body-small text-fg-muted">
              No fund-release actions recorded yet. Last tranche credited {formatDate(fin.lastTrancheDate)}
              {fin.nextTrancheDueCr ? `; next due ${formatCr(fin.nextTrancheDueCr)}.` : '.'}
            </p>
          )}
        </Panel>
      </section>

      {/* Cost-overrun tracking */}
      <section id="cost-overrun" className="scroll-mt-24">
        <Panel title="Cost & Time Overrun Tracking" icon="trending_up">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="p-3">
              <p className="nk-label">Cost overrun</p>
              <p className="tabular-nums text-label text-fg">
                {revised != null && overrunCr !== 0 ? `${overrunCr > 0 ? '+' : ''}${formatCr(overrunCr)}` : 'None recorded'}
              </p>
              <p className="text-caption text-fg-subtle">
                {revised != null ? `${formatCr(fin.sanctionedAmountCr)} sanctioned → ${formatCr(revised)} revised` : 'Sanctioned cost holds.'}
              </p>
            </Card>
            <Card className="p-3">
              <p className="nk-label">Time overrun</p>
              <p className="tabular-nums text-label text-fg">{project.delayDays > 0 ? `${project.delayDays} ${t('common.days')}` : 'On schedule'}</p>
              <p className="text-caption text-fg-subtle">Against expected completion {formatDate(project.expectedCompletion)}</p>
            </Card>
            <Card className="p-3">
              <p className="nk-label">Commitment risk</p>
              <p className="tabular-nums text-label text-fg">{formatCr(fin.amountCommittedCr)}</p>
              <p className="text-caption text-fg-subtle">Committed but not yet billed.</p>
            </Card>
          </div>
        </Panel>
      </section>

      {/* Payment & Bill Management */}
      <section id="payments" className="scroll-mt-24 flex flex-col gap-4">
        <KpiRow>
          <KpiCard label="Total Bills" value={billState.length} icon="receipt_long" />
          <KpiCard label="Pending Verification" value={billState.filter((b) => b.status === 'submitted').length} icon="hourglass_top" iconTone="warning" />
          <KpiCard label="Approved / Paid" value={billState.filter((b) => ['approved', 'paid'].includes(b.status)).length} icon="task_alt" iconTone="success" />
          <KpiCard label="Flagged Bills" value={flagged.length} icon="flag" iconTone={flagged.length ? 'danger' : 'neutral'} />
        </KpiRow>
        <KpiRow>
          <KpiCard label="Paid Amount" value={formatCr(paidAmount)} icon="payments" iconTone="success" />
          <KpiCard label="Pending Amount" value={formatCr(pendingAmount)} icon="pending_actions" iconTone="warning" />
          <KpiCard label="Next Tranche Due" value={fin.nextTrancheDueCr ? formatCr(fin.nextTrancheDueCr) : '—'} icon="event_repeat" />
          <KpiCard label="Last Tranche" value={formatDate(fin.lastTrancheDate)} icon="history" iconTone="neutral" />
        </KpiRow>

        <FilterBar
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search bill no, ref, contractor, e-MB entry…"
          selects={[
            {
              label: t('common.status'),
              value: statusFilter,
              onChange: setStatusFilter,
              options: [{ value: '', label: t('common.all') }, ...(['submitted', 'verified', 'approved', 'paid', 'returned'] as const).map((s) => ({ value: s, label: t(BILL_STATUS[s].key) }))],
            },
            {
              label: 'Bill type',
              value: typeFilter,
              onChange: setTypeFilter,
              options: [{ value: '', label: t('common.all') }, ...(['RA Bill', 'Final Bill', 'Material Bill', 'Labour Bill'] as const).map((x) => ({ value: x, label: x }))],
            },
            {
              label: t('common.risk'),
              value: riskFilter,
              onChange: setRiskFilter,
              options: [
                { value: '', label: t('common.all') },
                { value: 'flagged', label: 'Flagged only' },
                { value: 'clear', label: 'Clear only' },
              ],
            },
          ]}
          onClear={() => {
            setSearch('')
            setStatusFilter('')
            setTypeFilter('')
            setRiskFilter('')
          }}
        />

        <Panel title="Payment & Bill Management" icon="receipt_long" subtitle="Bills submitted against this project only. Actions update the register for this session (demo)." bodyClassName="p-0">
          <DataTable
            minWidth={1040}
            rows={filteredBills}
            rowKey={(b) => b.id}
            paginated
            pageSize={8}
            initialSort={{ key: 'submitted', dir: 'desc' }}
            columns={[
              { key: 'id', header: 'Ref', render: (b) => <span className="nk-mono-id text-fg-muted">{b.id}</span> },
              { key: 'billNo', header: 'Bill No.', isRowHeader: true, sortable: true, sortValue: (b) => b.billNo, render: (b) => <span className="nk-mono-id text-fg">{b.billNo}</span> },
              { key: 'type', header: 'Type', render: (b) => <Badge tone="neutral">{b.type}</Badge> },
              { key: 'amount', header: t('common.amount'), cellClassName: 'tabular-nums', sortable: true, sortValue: (b) => b.amountCr, render: (b) => formatCr(b.amountCr) },
              { key: 'status', header: 'Status', render: (b) => <StatusBadge descriptor={BILL_STATUS[b.status]} size="sm" /> },
              { key: 'risk', header: t('common.risk'), render: (b) => (b.flag ? <StatusBadge descriptor={BILL_FLAG[b.flag]} size="sm" /> : <Badge tone="success" icon="check_circle">Clear</Badge>) },
              { key: 'submitted', header: 'Submitted', cellClassName: 'tabular-nums', sortable: true, sortValue: (b) => b.submittedOn, render: (b) => formatDate(b.submittedOn) },
            ]}
            rowActions={(b) => (
              <Button variant="outline" size="sm" className="!min-h-7 !px-2.5" onClick={() => setBillDrawer(b)}>
                {t('common.view')}
              </Button>
            )}
            emptyState={
              <div className="p-8 text-center">
                <p className="text-body-small text-fg-muted">No bills match the current filters, or none have been submitted for this project yet.</p>
                <p className="mt-2 text-caption text-fg-subtle">Bills are raised by the contractor against certified e-MB entries.</p>
              </div>
            }
          />
        </Panel>

        {/* Duplicate / abnormal bill detection */}
        <section id="duplicates" className="scroll-mt-24">
          <Panel title="Duplicate & Abnormal Bill Detection" icon="content_copy" subtitle="AI-assisted flags — every flag is reviewed by the authorized officer." bodyClassName="p-0">
            {flagged.length > 0 ? (
              <ul className="divide-y divide-border">
                {flagged.map((b) => {
                  const risk = billRiskFor(b)
                  return (
                    <li key={b.id} className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="nk-mono-id text-fg">{b.billNo}</p>
                        <StatusBadge descriptor={BILL_FLAG[b.flag!]} size="sm" />
                      </div>
                      <p className="mt-1 text-caption text-fg-muted">{b.flagNote}</p>
                      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-caption text-fg-subtle">
                        <span>Duplicate probability: <strong className="text-fg">{risk.duplicateProbabilityPct}%</strong></span>
                        <span>Amount anomaly: <strong className="text-fg">+{risk.amountAnomalyPct}%</strong></span>
                        <span>Risk score: <strong className="text-fg">{risk.riskScore}/100</strong></span>
                        {risk.previousSimilarBill && <span>Similar: <strong className="text-fg">{risk.previousSimilarBill}</strong></span>}
                      </p>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="p-4 text-body-small text-fg-muted">No duplicate or abnormal bills flagged on this project.</p>
            )}
            <p className="border-t border-border p-3 text-caption text-warning-strong">
              <span className="material-symbols-outlined mr-1 align-middle text-[16px]" aria-hidden="true">smart_toy</span>
              AI Bill Risk Check assists verification — the officer's decision on every bill remains final.
            </p>
          </Panel>
        </section>
      </section>

      <Card className="p-3 text-caption text-fg-subtle">{t('common.mockDataNote')}</Card>

      {/* Bill detail drawer */}
      <Drawer
        open={billDrawer !== null}
        onClose={() => setBillDrawer(null)}
        title={billDrawer ? `Bill ${billDrawer.billNo}` : ''}
        titleIcon="receipt_long"
        width="max-w-xl"
      >
        {billDrawer && <BillDrawerContent bill={billDrawer} onAction={transitionBill} />}
      </Drawer>

      {/* Budget head drawer */}
      <Drawer
        open={headDrawer !== null}
        onClose={() => setHeadDrawer(null)}
        title={headDrawer?.head ?? ''}
        titleIcon="account_balance_wallet"
        width="max-w-md"
      >
        {headDrawer && (
          <div className="flex flex-col gap-4 p-4">
            <dl className="grid grid-cols-2 gap-3 text-body-small">
              <DetailField label="Original allocation" value={<span className="tabular-nums">{formatCr(headDrawer.originalCr)}</span>} />
              <DetailField label="Revised allocation" value={<span className="tabular-nums">{headDrawer.revisedCr != null ? formatCr(headDrawer.revisedCr) : '—'}</span>} />
              <DetailField label="Utilized" value={<span className="tabular-nums">{formatCr(headDrawer.utilizedCr)}</span>} />
              <DetailField label="Remaining" value={<span className="tabular-nums">{formatCr(Math.max(0, (headDrawer.revisedCr ?? headDrawer.originalCr) - headDrawer.utilizedCr))}</span>} />
              <DetailField label="Charged bills" value={billState.filter((b) => b.status === 'paid' || b.status === 'approved').length} />
              <DetailField label="Funding source" value={fin.fundingSources[0]?.source ?? '—'} />
            </dl>
            <Progress
              value={(headDrawer.utilizedCr / (headDrawer.revisedCr ?? headDrawer.originalCr)) * 100}
              label="Head utilization"
            />
            <p className="text-caption text-fg-subtle">
              Expenditure against this head is booked from verified RA/material bills. Utilization above 90% raises a
              burn warning for re-appropriation review.
            </p>
          </div>
        )}
      </Drawer>

      {/* Add budget allocation */}
      <Modal
        open={addHeadOpen}
        onClose={() => setAddHeadOpen(false)}
        title="Add Budget Allocation"
        titleIcon="add"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddHeadOpen(false)}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              disabled={!newHead.head.trim() || !(Number(newHead.amountCr) > 0) || !newHead.source}
              onClick={() => {
                const amount = Number(newHead.amountCr)
                void financeApi.createAllocation(project.id, amount, newHead.head.trim(), newHead.source)
                setHeadState((list) => [
                  ...list,
                  { id: `BH-${Date.now()}`, head: newHead.head.trim(), originalCr: amount, utilizedCr: 0 },
                ])
                showToast(`Budget head "${newHead.head.trim()}" (${formatCr(amount)}) allocated successfully and routed for administrative approval.`, 'success')
                setNewHead({ head: '', amountCr: '', source: '' })
                setAddHeadOpen(false)
              }}
            >
              {t('common.submit')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <TextField label="Budget head" required value={newHead.head} onChange={(e) => setNewHead((f) => ({ ...f, head: e.target.value }))} placeholder="e.g. Utility shifting — Phase 2" />
          <TextField label="Amount (₹ Cr)" required type="number" min={0} step={0.01} value={newHead.amountCr} onChange={(e) => setNewHead((f) => ({ ...f, amountCr: e.target.value }))} />
          <Select
            label="Funding source"
            required
            value={newHead.source}
            onChange={(e) => setNewHead((f) => ({ ...f, source: e.target.value }))}
            placeholder={t('common.select')}
            options={FUNDING_SOURCES.map((f) => ({ value: f, label: f }))}
          />
          <TextArea label="Justification" rows={2} placeholder="Administrative approval reference / work item…" />
        </div>
      </Modal>

      {/* Export menu (mock) */}
      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export Financial Report"
        titleIcon="download"
        size="sm"
        footer={
          <Button variant="outline" onClick={() => setExportOpen(false)}>{t('common.close')}</Button>
        }
      >
        <div className="flex flex-col gap-2">
          {['Financial Utilization Report (PDF)', 'Budget head register (XLSX)', 'Bill payment register (XLSX)'].map((label) => (
            <Button
              key={label}
              variant="outline"
              icon="download"
              onClick={() => {
                showToast(`${label} generated for ${project.id} (demo file).`, 'info')
                setExportOpen(false)
              }}
            >
              {label}
            </Button>
          ))}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        onConfirm={() => confirm?.run()}
      />
    </div>
  )
}

/** Bill drawer: information, breakdown, AI risk check, history and workflow actions. */
function BillDrawerContent({
  bill,
  onAction,
}: {
  bill: BillItem
  onAction: (id: string, action: 'verify' | 'approve' | 'pay' | 'return', note?: string) => void
}) {
  const { t } = useI18n()
  const { showToast } = useToast()
  const risk = billRiskFor(bill)
  const gross = bill.amountCr
  const gst = Math.round(gross * 0.09 * 100) / 100
  const retention = Math.round(gross * 0.05 * 100) / 100
  const net = Math.round((gross - retention) * 100) / 100

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge descriptor={BILL_STATUS[bill.status]} />
        {bill.flag ? <StatusBadge descriptor={BILL_FLAG[bill.flag]} size="sm" /> : <Badge tone="success" icon="check_circle">Risk clear</Badge>}
      </div>

      <Panel title="Bill Information" icon="info">
        <dl className="grid grid-cols-2 gap-3 text-body-small">
          <DetailField label="Reference" value={<span className="nk-mono-id">{bill.id}</span>} />
          <DetailField label="Contractor" value={bill.contractor} />
          <DetailField label="Type" value={bill.type} />
          <DetailField label="Submitted" value={formatDate(bill.submittedOn)} />
          <DetailField label="e-MB entry" value={<span className="nk-mono-id">{bill.mbEntry}</span>} />
          <DetailField label="Paid on" value={bill.paidOn ? formatDate(bill.paidOn) : '—'} />
        </dl>
      </Panel>

      <Panel title="Amount Breakdown" icon="calculate">
        <dl className="grid grid-cols-2 gap-3 text-body-small">
          <DetailField label="Gross claim" value={<span className="tabular-nums">{formatCr(gross)}</span>} />
          <DetailField label="GST (9%×2, shown net)" value={<span className="tabular-nums">{formatCr(gst)} component</span>} />
          <DetailField label="Retention (5%)" value={<span className="tabular-nums text-warning-strong">− {formatCr(retention)}</span>} />
          <DetailField label="Net payable" value={<span className="tabular-nums font-semibold">{formatCr(net)}</span>} />
          <DetailField label="Previous payments" value={<span className="tabular-nums">{formatCr(Math.max(0, gross * 2.4))} (RA cycle)</span>} />
          <DetailField label="Supporting documents" value="MB extract, test certs — 4 files" />
        </dl>
      </Panel>

      <Panel title="AI Bill Risk Check" icon="smart_toy">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-display tabular-nums text-fg">{risk.duplicateProbabilityPct}%</p>
            <p className="text-caption text-fg-subtle">Duplicate probability</p>
          </div>
          <div className="text-center">
            <p className="text-display tabular-nums text-fg">+{risk.amountAnomalyPct}%</p>
            <p className="text-caption text-fg-subtle">Amount anomaly</p>
          </div>
          <div className="text-center">
            <p className={risk.riskScore > 60 ? 'text-display tabular-nums text-danger-strong' : 'text-display tabular-nums text-success-strong'}>{risk.riskScore}</p>
            <p className="text-caption text-fg-subtle">Risk score /100</p>
          </div>
        </div>
        {risk.previousSimilarBill && (
          <p className="mt-3 text-caption text-fg-muted">Most similar previous bill: <span className="nk-mono-id text-fg">{risk.previousSimilarBill}</span></p>
        )}
        <p className="mt-2 rounded-control bg-surface-2 p-2 text-caption text-fg-muted">
          <strong className="text-fg">Why this score?</strong> {risk.explanation}
        </p>
        <p className="mt-2 text-caption text-warning-strong">
          <span className="material-symbols-outlined mr-1 align-middle text-[14px]" aria-hidden="true">smart_toy</span>
          AI-assisted check — the verifying officer's decision remains final.
        </p>
      </Panel>

      <Panel title="Verification & Approval History" icon="history">
        <ol className="flex flex-col gap-2">
          {(
            [
              bill.status !== 'submitted' && { label: 'Verified', detail: bill.verifiedBy ?? '—' },
              ['approved', 'paid'].includes(bill.status) && { label: 'Approved for payment', detail: bill.approvedBy ?? '—' },
              bill.status === 'paid' && { label: 'Payment credited', detail: bill.paidOn ? formatDate(bill.paidOn) : '—' },
              bill.status === 'returned' && { label: 'Returned to contractor', detail: bill.flagNote ?? '—' },
            ].filter(Boolean) as { label: string; detail: string }[]
          ).map((row, i) => (
            <li key={i} className="flex items-start gap-2 text-body-small">
              <span className="material-symbols-outlined text-[16px] text-success-strong" aria-hidden="true">check_circle</span>
              <span>
                <strong className="text-fg">{row.label}</strong> — {row.detail}
              </span>
            </li>
          ))}
          {bill.status === 'submitted' && <li className="text-body-small text-fg-muted">No verification action recorded yet.</li>}
        </ol>
      </Panel>

      <div className="sticky bottom-0 -mx-4 border-t border-border bg-surface p-3">
        <div className="flex flex-wrap gap-2">
          {bill.status === 'submitted' && (
            <Button variant="primary" size="sm" icon="fact_check" onClick={() => onAction(bill.id, 'verify')}>
              {t('common.verify')}
            </Button>
          )}
          {bill.status === 'verified' && (
            <Button variant="primary" size="sm" icon="task_alt" onClick={() => onAction(bill.id, 'approve')}>
              {t('common.approve')}
            </Button>
          )}
          {bill.status === 'approved' && (
            <Button variant="primary" size="sm" icon="payments" onClick={() => onAction(bill.id, 'pay')}>
              Mark Paid
            </Button>
          )}
          {['submitted', 'verified'].includes(bill.status) && (
            <Button
              variant="outline"
              size="sm"
              icon="u_turn_left"
              onClick={() =>
                onAction(bill.id, 'return', 'Returned by verifying officer — measure corrections requested (session action).')
              }
            >
              {t('common.return')}
            </Button>
          )}
          {bill.status !== 'paid' && bill.status !== 'returned' && (
            <Button
              variant="danger"
              size="sm"
              icon="block"
              onClick={() => showToast(`Bill ${bill.id} rejection requires recording a reason — use Return for correction or raise an audit flag.`, 'warning')}
            >
              {t('common.reject')}
            </Button>
          )}
        </div>
        <p className="mt-2 text-caption text-fg-subtle">Actions apply to this demo session only and are announced in the audit log.</p>
      </div>
    </div>
  )
}
