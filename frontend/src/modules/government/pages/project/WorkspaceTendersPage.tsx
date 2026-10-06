import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '@/context/I18nContext'
import { useProjectWorkspace } from '@/context/ProjectWorkspaceContext'
import { useToast } from '@/context/ToastContext'
import { tendersApi } from '@/api'
import { Panel, Card } from '@/components/ui/Card'
import { DataTable } from '@/components/tables/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Drawer, Modal } from '@/components/modals/Modal'
import { TextField, Select, TextArea } from '@/components/ui/Fields'
import { PageHeader, KpiRow, FilterBar, KpiCard } from '@/components/blocks/Page'
import { formatCr, formatDate } from '@/utils/format'
import { TENDER_STATUS } from '@/utils/status'
import type { Tender } from '@/types'
import { contractsService } from '../../services/contracts.service'

const PROCUREMENT_STAGES = [
  { key: 'draft', label: 'Draft', icon: 'edit_note' },
  { key: 'published', label: 'Published', icon: 'campaign' },
  { key: 'bid_open', label: 'Bid Submission', icon: 'move_to_inbox' },
  { key: 'under_evaluation', label: 'Evaluation', icon: 'rate_review' },
  { key: 'approval', label: 'Approval', icon: 'approval' },
  { key: 'awarded', label: 'Award & Contract', icon: 'emoji_events' },
]

function stageIndex(status: Tender['status']): number {
  if (status === 'draft') return 0
  if (status === 'published') return 1
  if (status === 'bid_open') return 2
  if (status === 'under_evaluation') return 3
  if (status === 'awarded') return 5
  return 1
}

/** Project workspace — Tender Management: full procurement workspace. */
export function WorkspaceTendersPage() {
  const { t } = useI18n()
  const { showToast } = useToast()
  const { projectId, tenders } = useProjectWorkspace()
  const [tenderList, setTenderList] = useState<Tender[]>(tenders)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [detail, setDetail] = useState<Tender | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newTender, setNewTender] = useState({ title: '', estimate: '', mode: 'e-Tender', scopeSummary: '' })

  useEffect(() => {
    setTenderList(tenders)
  }, [tenders])

  async function handleCreateTender() {
    if (!newTender.title.trim() || !(Number(newTender.estimate) > 0)) return
    setSubmitting(true)
    try {
      const created = await tendersApi.create({
        projectId,
        title: newTender.title.trim(),
        estimatedCostCr: Number(newTender.estimate),
        mode: newTender.mode,
        scopeSummary: newTender.scopeSummary.trim() || undefined,
      })
      setTenderList((prev) => [created, ...prev])
      showToast(`Tender "${created.title}" published successfully (${created.id})`, 'success')
      setNewTender({ title: '', estimate: '', mode: 'e-Tender', scopeSummary: '' })
      setCreateOpen(false)
    } catch (err: any) {
      showToast(err.message || 'Failed to publish tender', 'danger')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCloseTender(tender: Tender) {
    if (!window.confirm(`Close ${tender.id} immediately? New bids will no longer be accepted.`)) return
    try {
      await tendersApi.close(tender.id)
      setTenderList((prev) => prev.map((item) => item.id === tender.id ? { ...item, status: 'cancelled' } : item))
      setDetail(null)
      showToast(`Tender ${tender.id} closed immediately.`, 'success')
    } catch (err: any) {
      showToast(err.message || 'Tender could not be closed.', 'danger')
    }
  }

  async function handleAwardTender(tender: Tender, bidId: string) {
    if (!tender.databaseId) return
    if (!window.confirm(`Award this tender to the selected contractor immediately?`)) return
    try {
      await contractsService.award(tender.databaseId, bidId)
      setTenderList((prev) => prev.map((item) => item.id === tender.id ? { ...item, status: 'awarded' } : item))
      setDetail(null)
      showToast(`Tender ${tender.id} awarded successfully.`, 'success')
    } catch (err: any) {
      showToast(err.message || 'Tender could not be awarded.', 'danger')
    }
  }

  const rows = useMemo(
    () =>
      tenderList.filter(
        (x) =>
          (!statusFilter || x.status === statusFilter) &&
          (!search || `${x.id} ${x.title}`.toLowerCase().includes(search.toLowerCase())),
      ),
    [tenderList, statusFilter, search],
  )

  const active = tenderList.filter((x) => ['published', 'bid_open', 'under_evaluation'].includes(x.status))
  const totalBids = tenderList.reduce((s, x) => s + x.bidsReceived, 0)
  const awarded = tenderList.filter((x) => x.status === 'awarded')
  const avgBid = awarded.length ? awarded.reduce((s, x) => s + (x.awardedAmountCr ?? 0), 0) / awarded.length : 0

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Tender Management"
        description="Procurement workspace for this project — publication, bids, evaluation, approval and award, with the full tender history."
        actions={
          <>
            <Button variant="outline" size="sm" icon="download" onClick={() => showToast('Procurement register exported.', 'info')}>
              {t('common.export')}
            </Button>
            <Button variant="primary" size="sm" icon="add" onClick={() => setCreateOpen(true)}>
              Create Tender
            </Button>
          </>
        }
      />

      <KpiRow>
        <KpiCard label="Active Tenders" value={active.length} icon="campaign" />
        <KpiCard label="Bids Received" value={totalBids} icon="move_to_inbox" iconTone="neutral" />
        <KpiCard label="Under Evaluation" value={tenders.filter((x) => x.status === 'under_evaluation').length} icon="rate_review" iconTone="warning" />
        <KpiCard label="Awarded" value={awarded.length} icon="emoji_events" iconTone="success" delta={avgBid > 0 ? `Avg award ${formatCr(avgBid)}` : undefined} />
      </KpiRow>

      {/* Procurement timeline */}
      <Panel title="Procurement Timeline" icon="timeline">
        <ol className="flex flex-wrap gap-2">
          {PROCUREMENT_STAGES.map((s, i) => {
            const reached = tenders.some((x) => stageIndex(x.status) >= i)
            return (
              <li key={s.key} className="flex items-center gap-2">
                <span
                  className={cnStage(reached)}
                  aria-current={reached ? 'step' : undefined}
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">{s.icon}</span>
                  {s.label}
                </span>
                {i < PROCUREMENT_STAGES.length - 1 && (
                  <span className="material-symbols-outlined text-[16px] text-fg-subtle" aria-hidden="true">chevron_right</span>
                )}
              </li>
            )
          })}
        </ol>
        <p className="mt-3 text-caption text-fg-subtle">Stages reached by at least one tender on this project are highlighted.</p>
      </Panel>

      <FilterBar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search tender no or title…"
        selects={[
          {
            label: t('common.status'),
            value: statusFilter,
            onChange: setStatusFilter,
            options: [{ value: '', label: t('common.all') }, ...Object.entries(TENDER_STATUS).map(([k, d]) => ({ value: k, label: t(d.key) }))],
          },
        ]}
        onClear={() => {
          setSearch('')
          setStatusFilter('')
        }}
      />

      <Panel title={`Tender Register (${rows.length})`} icon="gavel" bodyClassName="p-0">
        <DataTable
          minWidth={1040}
          rows={rows}
          rowKey={(x) => x.id}
          paginated
          pageSize={6}
          initialSort={{ key: 'published', dir: 'desc' }}
          columns={[
            { key: 'id', header: 'Tender No.', isRowHeader: true, render: (x) => <span className="nk-mono-id text-fg">{x.id}</span> },
            { key: 'title', header: 'Title', render: (x) => <span className="block max-w-72 truncate" title={x.title}>{x.title}</span> },
            { key: 'cost', header: 'Est. Value', cellClassName: 'tabular-nums', sortable: true, sortValue: (x) => x.estimatedCostCr, render: (x) => formatCr(x.estimatedCostCr) },
            { key: 'published', header: 'Published', cellClassName: 'tabular-nums', sortable: true, sortValue: (x) => x.publishedOn, render: (x) => formatDate(x.publishedOn) },
            { key: 'deadline', header: 'Closing', cellClassName: 'tabular-nums', render: (x) => formatDate(x.submissionDeadline) },
            { key: 'bids', header: 'Bids', cellClassName: 'tabular-nums', sortable: true, sortValue: (x) => x.bidsReceived, render: (x) => x.bidsReceived },
            { key: 'status', header: t('common.status'), render: (x) => <StatusBadge descriptor={TENDER_STATUS[x.status]} size="sm" /> },
            { key: 'stage', header: 'Stage', render: (x) => <span className="text-caption text-fg-muted">{PROCUREMENT_STAGES[stageIndex(x.status)].label}</span> },
          ]}
          rowActions={(x) => (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="!min-h-7 !px-2.5" onClick={() => setDetail(x)}>{t('common.view')}</Button>
              {['published', 'bid_open'].includes(x.status) && <Button variant="danger" size="sm" className="!min-h-7 !px-2.5" onClick={() => handleCloseTender(x)}>Close Bids</Button>}
            </div>
          )}
          emptyState={
            <div className="p-8 text-center">
              <p className="text-body-small text-fg-muted">No tenders have been created for this project yet — pre-tender projects publish after technical sanction.</p>
              <Button variant="primary" size="sm" icon="add" className="mt-3" onClick={() => setCreateOpen(true)}>
                Create Tender
              </Button>
            </div>
          }
        />
      </Panel>

      <Card className="p-3 text-caption text-fg-subtle">{t('common.mockDataNote')}</Card>

      {/* Tender detail drawer */}
      <Drawer open={detail !== null} onClose={() => setDetail(null)} title={detail?.id ?? ''} titleIcon="gavel" width="max-w-xl">
        {detail && <TenderDetail tender={detail} onAward={(bidId) => handleAwardTender(detail, bidId)} />}
      </Drawer>

      {/* Create tender */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Tender"
        titleIcon="add"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
            <Button
              variant="primary"
              disabled={!newTender.title.trim() || !(Number(newTender.estimate) > 0) || submitting}
              onClick={handleCreateTender}
            >
              {submitting ? 'Publishing...' : 'Publish Tender'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <TextField label="Tender title" required value={newTender.title} onChange={(e) => setNewTender((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Intra-village pipe distribution — Cluster 7" />
          <TextField label="Estimated value (₹ Cr)" required type="number" min={0} step={0.01} value={newTender.estimate} onChange={(e) => setNewTender((f) => ({ ...f, estimate: e.target.value }))} />
          <Select
            label="Mode"
            value={newTender.mode}
            onChange={(e) => setNewTender((f) => ({ ...f, mode: e.target.value }))}
            options={['e-Tender', 'Manually', 'Global'].map((m) => ({ value: m, label: m }))}
          />
          <TextArea label="Scope summary" rows={2} value={newTender.scopeSummary} onChange={(e) => setNewTender((f) => ({ ...f, scopeSummary: e.target.value }))} placeholder="Brief scope for the e-NIT document…" />
        </div>
      </Modal>
    </div>
  )
}

function cnStage(reached: boolean) {
  return [
    'inline-flex items-center gap-1.5 rounded-badge border px-2.5 py-1 text-caption',
    reached
      ? 'border-primary-border bg-primary-soft text-primary-strong'
      : 'border-border bg-surface text-fg-subtle',
  ].join(' ')
}

/** Tender drawer: overview, bids, evaluation, comparison, award. */
function TenderDetail({ tender, onAward }: { tender: Tender; onAward: (bidId: string) => void }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <p className="nk-mono-id text-fg-muted">{tender.id}</p>
        <p className="text-heading-3 text-fg">{tender.title}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge descriptor={TENDER_STATUS[tender.status]} />
          <Badge tone="neutral" icon="payments">Est. {formatCr(tender.estimatedCostCr)}</Badge>
          <Badge tone="neutral" icon="mail">{tender.bidsReceived} bids</Badge>
          <Badge tone="neutral" icon="globe">{tender.mode}</Badge>
        </div>
      </div>

      <Panel title="Overview" icon="info">
        <dl className="grid grid-cols-2 gap-3 text-body-small">
          <div><dt className="text-fg-subtle">Published</dt><dd className="tabular-nums text-fg">{formatDate(tender.publishedOn)}</dd></div>
          <div><dt className="text-fg-subtle">Submission deadline</dt><dd className="tabular-nums text-fg">{formatDate(tender.submissionDeadline)}</dd></div>
          <div><dt className="text-fg-subtle">Opening date</dt><dd className="tabular-nums text-fg">{formatDate(tender.openingDate)}</dd></div>
          <div><dt className="text-fg-subtle">Category</dt><dd className="text-fg">{tender.category}</dd></div>
        </dl>
      </Panel>

      {tender.lots?.length ? (
        <Panel title="Bids — Technical & Financial Evaluation" icon="table_chart" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-body">
              <thead>
                <tr className="nk-table-header">
                  <th className="px-4 text-left">Bidder</th>
                  <th className="px-3 text-right">Quoted</th>
                  <th className="px-3 text-right">Tech.</th>
                  <th className="px-3 text-right">Fin.</th>
                  <th className="px-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {tender.lots.map((l) => (
                  <tr key={l.bidder} className="border-t border-border hover:bg-surface-2">
                    <td className="px-4 py-2.5 font-medium text-fg">{l.bidder}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatCr(l.quotedAmountCr)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{l.technicalScore}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{l.financialScore}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone={l.bidStatus === 'accepted' ? 'success' : l.bidStatus === 'rejected' ? 'danger' : 'info'} dot>
                        {l.bidStatus.replace('_', ' ')}
                      </Badge>
                      {l.bidId && l.bidStatus === 'under_review' && tender.status !== 'awarded' && (
                        <Button variant="primary" size="sm" className="ml-2 !min-h-7 !px-2.5" onClick={() => onAward(l.bidId!)}>
                          Award
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-border p-3 text-caption text-fg-subtle">
            Lowest quoted {formatCr(Math.min(...tender.lots.map((l) => l.quotedAmountCr)))} • Highest {formatCr(Math.max(...tender.lots.map((l) => l.quotedAmountCr)))}
          </p>
        </Panel>
      ) : (
        <Panel title="Bids" icon="move_to_inbox">
          <p className="text-body-small text-fg-muted">Bid opening has not been recorded yet — {tender.bidsReceived} bid(s) received so far against the closing date {formatDate(tender.submissionDeadline)}.</p>
        </Panel>
      )}

      {tender.awardedTo && (
        <Panel title="Award" icon="emoji_events">
          <p className="rounded-control border border-success-border bg-success-tint p-2.5 text-body-small text-success-strong">
            <span className="material-symbols-outlined mr-1 align-middle text-[16px]" aria-hidden="true">emoji_events</span>
            Awarded to {tender.awardedTo} — {formatCr(tender.awardedAmountCr ?? 0)} (officer decision recorded)
          </p>
        </Panel>
      )}

      <p className="text-caption text-fg-subtle">{t('common.mockDataNote')}</p>
    </div>
  )
}
