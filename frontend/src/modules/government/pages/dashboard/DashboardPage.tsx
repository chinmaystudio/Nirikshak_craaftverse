import { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/core/supabase/client'
import { useI18n } from '@/context/I18nContext'
import { KpiCard } from '@/components/charts/KpiCard'
import { Panel, Card } from '@/components/ui/Card'
import { Button, IconButton } from '@/components/ui/Button'
import { Select, TextField } from '@/components/ui/Fields'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Progress } from '@/components/ui/Progress'
import { BarChart, SegmentBar, DonutChart } from '@/components/charts/Charts'
import { DataTable } from '@/components/tables/DataTable'
import { formatCr, formatPct, formatDate } from '@/utils/format'
import { PROJECT_STATUS } from '@/utils/status'
import type { Project } from '@/types'
import { projectsApi } from '@/api'
import { useApiData } from '@/hooks/useApiData'
import { cn } from '@/utils/cn'

/**
 * DashboardPage — the preserved Stitch government command dashboard: 8 KPI
 * cards, executive summary, portfolio health, pipeline analytics, urgent
 * officer action queue, ground-truth field feed, and the filterable projects
 * register. Production figures come from the authenticated Supabase views.
 */
export function DashboardPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { data: projects, loading } = useApiData(() => projectsApi.all(), [])
  const [division, setDivision] = useState('')
  const [health, setHealth] = useState('')
  const [budget, setBudget] = useState('')
  const [keyword, setKeyword] = useState('')
  const [expandedDepts, setExpandedDepts] = useState(false)
  const [loadedAt] = useState(() => new Date())
  const [pendingClearanceCount, setPendingClearanceCount] = useState<number>(0)

  useEffect(() => {
    async function fetchPendingRequests() {
      try {
        const [govRes, conRes] = await Promise.all([
          (supabase.from as any)('government_access_requests').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
          (supabase.from as any)('contractor_access_requests').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
        ])
        const total = (govRes.count || 0) + (conRes.count || 0)
        setPendingClearanceCount(total)
      } catch (err) {
        console.error('Failed to count pending clearance requests:', err)
      }
    }
    fetchPendingRequests()
  }, [])

  const list = useMemo(() => {
    let rows = projects ?? []
    if (division) rows = rows.filter((p) => p.division === division)
    if (health === 'delayed') rows = rows.filter((p) => p.status === 'delayed')
    if (health === 'at_risk') rows = rows.filter((p) => p.status === 'at_risk')
    if (health === 'on_track') rows = rows.filter((p) => p.status === 'in_execution' || p.status === 'sanctioned')
    if (budget === '1') rows = rows.filter((p) => p.sanctionedAmountCr > 1)
    if (budget === '10') rows = rows.filter((p) => p.sanctionedAmountCr > 10)
    if (budget === '100') rows = rows.filter((p) => p.sanctionedAmountCr > 100)
    if (keyword.trim()) {
      const k = keyword.trim().toLowerCase()
      rows = rows.filter((p) => (p.name || '').toLowerCase().includes(k) || (p.id || '').toLowerCase().includes(k))
    }
    return rows
  }, [projects, division, health, budget, keyword])

  const totals = useMemo(() => {
    const rows = projects ?? []
    const active = rows.filter((p) => p.status !== 'completed' && p.status !== 'on_hold')
    const outlay = rows.reduce((s, p) => s + p.sanctionedAmountCr, 0)
    const utilized = rows.reduce((s, p) => s + p.utilizedAmountCr, 0)
    const avgPhys = rows.length ? rows.reduce((s, p) => s + p.physicalProgressPct, 0) / rows.length : 0
    const delayed = rows.filter((p) => p.status === 'delayed' || p.delayDays > 0).length
    const pendingApprovals = rows.reduce((sum, project) => sum + (project.pendingApprovals || 0), 0)
    const openGrievances = rows.reduce((sum, project) => sum + (project.openComplaints || 0), 0)
    return { active: active.length, outlay, utilized, avgPhys, delayed, pendingApprovals, openGrievances }
  }, [projects])

  const byDepartment = useMemo(() => {
    const map = new Map<string, { count: number; delayRisk: number }>()
    for (const p of projects ?? []) {
      const dept = (p.department || 'Public Works').replace(/ Department$/i, '').trim()
      const e = map.get(dept) ?? { count: 0, delayRisk: 0 }
      e.count += 1
      if (p.status === 'delayed' || p.status === 'at_risk') e.delayRisk += 1
      map.set(dept, e)
    }
    return Array.from(map.entries())
      .map(([dept, v]) => ({
        label: dept || 'Infrastructure',
        value: v.count,
        risk: v.delayRisk,
        count: v.count,
      }))
      .sort((a, b) => b.count - a.count)
  }, [projects])

  const statusSplit = useMemo(() => {
    const rows = projects ?? []
    const count = (s: Project['status']) => rows.filter((p) => p.status === s).length
    return [
      { label: 'In Execution', value: count('in_execution'), className: 'bg-primary' },
      { label: 'Sanctioned', value: count('sanctioned'), className: 'bg-info' },
      { label: 'Delayed', value: count('delayed'), className: 'bg-danger' },
      { label: 'At Risk', value: count('at_risk'), className: 'bg-warning' },
      { label: 'Completed', value: count('completed'), className: 'bg-success' },
      { label: 'On Hold', value: count('on_hold'), className: 'bg-surface-3' },
    ]
  }, [projects])

  return (
    <div className="flex flex-col gap-5">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-heading-1 text-fg">{t('dash.greeting')}</h1>
          <p className="mt-1 text-body-small text-fg-muted">
            {t('dash.subtitle')} • <span className="tabular-nums">Supabase data loaded {loadedAt.toLocaleString('en-IN')}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon="add_task" onClick={() => navigate('/government/projects/create')}>
            {t('dash.sanctionNewProject')}
          </Button>
          <Button variant="outline" size="sm" icon="crisis_alert" onClick={() => navigate('/government/complaints')}>
            {t('dash.fieldEscalations')}
          </Button>
        </div>
      </div>

      {/* Registration Clearance Queue Alert */}
      {pendingClearanceCount > 0 && (
        <div className="rounded-control border border-warning-border bg-warning-tint p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[24px] text-warning-strong shrink-0 mt-0.5">
              how_to_reg
            </span>
            <div>
              <div className="text-body font-bold text-warning-strong flex items-center gap-2">
                <span>Registration Clearance Queue ({pendingClearanceCount} pending)</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-warning-strong text-white animate-pulse">
                  Action Required
                </span>
              </div>
              <p className="text-body-small text-fg-muted mt-0.5">
                New government officer clearance requests have been received. Review and approve credentials in the Master Clearance Portal.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            icon="verified_user"
            onClick={() => navigate('/government/access-requests')}
            className="shrink-0 font-bold"
          >
            Review &amp; Approve Requests →
          </Button>
        </div>
      )}

      {/* 8 KPI cards (Stitch grid: 1/2/4/7 cols) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
        <KpiCard label={t('dash.kpi.activeProjects')} value={loading ? '—' : totals.active.toLocaleString('en-IN')} icon="map" iconTone="primary" />
        <KpiCard label={t('dash.kpi.totalOutlay')} value={loading ? '—' : formatCr(totals.outlay)} icon="account_balance" iconTone="primary" />
        <KpiCard label={t('dash.kpi.fundsUtilized')} value={loading ? '—' : formatCr(totals.utilized)} icon="payments" iconTone="success" delta={`${totals.outlay ? formatPct((totals.utilized / totals.outlay) * 100, 1) : '—'} of outlay`} deltaTone="neutral" />
        <KpiCard label={t('dash.kpi.avgPhysical')} value={loading ? '—' : formatPct(totals.avgPhys)} icon="trending_up" iconTone="neutral" />
        <KpiCard label={t('dash.kpi.delayedWorks')} value={loading ? '—' : totals.delayed} icon="timer_off" iconTone="danger" />
        <KpiCard label={t('dash.kpi.pendingApprovals')} value={loading ? '—' : totals.pendingApprovals} icon="rule" iconTone="warning" footer={<Link className="text-primary-strong hover:underline" to="/government/approvals">{t('common.viewAll')}</Link>} />
        <KpiCard label={t('dash.kpi.openGrievances')} value={loading ? '—' : totals.openGrievances} icon="report_problem" iconTone="warning" footer={<Link className="text-primary-strong hover:underline" to="/government/complaints">{t('common.viewAll')}</Link>} />
      </div>

      {/* Executive summary + pipeline (5+7 split) */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel
          title={t('dash.executiveSummary')}
          icon="analytics"
          className="xl:col-span-5"
          actions={<Link to="/government/reports" className="inline-flex items-center gap-1 text-caption text-primary-strong hover:underline">Pipeline Analytics <span className="material-symbols-outlined text-[14px]" aria-hidden="true">arrow_forward</span></Link>}
        >
          <div className="flex flex-col gap-4">
            <p className="text-body text-fg-muted">
              Portfolio of {totals.active} active works worth {formatCr(totals.outlay)} sanctioned this FY.
              <strong className="text-fg"> {totals.pendingApprovals} pending approvals</strong> and
              <strong className="text-fg"> {totals.delayed} delayed works</strong> need officer attention.
            </p>
            <SegmentBar ariaLabel="Portfolio status split" segments={statusSplit} />
            <p className="border-t border-border pt-2 text-caption text-fg-subtle">{t('dash.statutoryNote')}</p>
          </div>
        </Panel>

        <Panel
          title={t('dash.healthByDepartment')}
          icon="account_balance"
          className="xl:col-span-7"
          actions={
            byDepartment.length > 5 ? (
              <Button
                variant="outline"
                size="sm"
                icon={expandedDepts ? 'unfold_less' : 'unfold_more'}
                onClick={() => setExpandedDepts(!expandedDepts)}
              >
                {expandedDepts ? 'Show Top 5' : `Expand All (${byDepartment.length})`}
              </Button>
            ) : undefined
          }
        >
          <div className={cn(expandedDepts && 'max-h-[460px] overflow-y-auto pr-2 custom-scrollbar transition-all')}>
            <BarChart
              ariaLabel="Projects by department"
              labelWidth="w-48 sm:w-64"
              data={(expandedDepts ? byDepartment : byDepartment.slice(0, 5)).map((d) => ({
                label: d.label,
                value: d.count,
                tone: d.risk > 1 ? ('warning' as const) : ('primary' as const),
              }))}
              valueFormatter={(v) => `${v}`}
              showValues
            />
          </div>
          {byDepartment.length > 5 && (
            <div className="mt-3 flex justify-center border-t border-border pt-2.5">
              <Button
                variant="outline"
                size="sm"
                icon={expandedDepts ? 'expand_less' : 'expand_more'}
                onClick={() => setExpandedDepts(!expandedDepts)}
              >
                {expandedDepts ? 'Collapse to Top 5' : `Expand All ${byDepartment.length} Departments`}
              </Button>
            </div>
          )}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card className="p-3">
              <p className="nk-label">{t('dash.pipelineAnalytics')}</p>
              <DonutChart
                ariaLabel="Pipeline distribution"
                size={110}
                thickness={14}
                centerValue={`${totals.active}`}
                centerLabel="Active"
                segments={[
                  { label: 'Execution', value: statusSplit[0].value, color: 'var(--color-primary)' },
                  { label: 'Sanctioned', value: statusSplit[1].value, color: 'var(--color-info)' },
                  { label: 'At Risk / Delayed', value: statusSplit[2].value + statusSplit[3].value, color: 'var(--color-danger)' },
                  { label: 'Completed', value: statusSplit[4].value, color: 'var(--color-success)' },
                ]}
              />
            </Card>
            <Card className="p-3">
              <p className="nk-label">{t('dash.kpi.fundsUtilized')} vs {t('dash.kpi.totalOutlay')}</p>
              <div className="mt-3">
                <Progress value={totals.outlay ? (totals.utilized / totals.outlay) * 100 : 0} label="Fund utilization" tone="success" />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-caption">
                <div><dt className="text-fg-subtle">{t('dash.kpi.totalOutlay')}</dt><dd className="tabular-nums font-semibold text-fg">{formatCr(totals.outlay)}</dd></div>
                <div><dt className="text-fg-subtle">{t('dash.kpi.fundsUtilized')}</dt><dd className="tabular-nums font-semibold text-fg">{formatCr(totals.utilized)}</dd></div>
              </dl>
            </Card>
          </div>
        </Panel>
      </div>


      {/* Projects register with filters */}
      <Panel title={t('dash.projectsRegister')} icon="map" subtitle={t('dash.registerSubtitle')} bodyClassName="p-0">
        <div className="grid grid-cols-1 gap-3 border-b border-border p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label={t('dash.filterDivision')}
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            options={[
              { value: '', label: 'All Divisions' },
              { value: 'Pune', label: 'Pune Division' },
              { value: 'Nashik', label: 'Nashik Division' },
              { value: 'Nagpur', label: 'Nagpur Division' },
              { value: 'Amravati', label: 'Amravati Division' },
              { value: 'Chhatrapati Sambhajinagar', label: 'Chh. Sambhajinagar Division' },
            ]}
          />
          <Select
            label={t('dash.filterHealth')}
            value={health}
            onChange={(e) => setHealth(e.target.value)}
            options={[
              { value: '', label: t('dash.healthAll') },
              { value: 'on_track', label: t('dash.healthOnTrack') },
              { value: 'at_risk', label: t('dash.healthAtRisk') },
              { value: 'delayed', label: t('dash.healthDelayed') },
            ]}
          />
          <Select
            label={t('dash.filterBudget')}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            options={[
              { value: '', label: t('dash.budgetAny') },
              { value: '1', label: t('dash.budgetAbove1Cr') },
              { value: '10', label: t('dash.budgetAbove10Cr') },
              { value: '100', label: t('dash.budgetAbove100Cr') },
            ]}
          />
          <TextField
            label={t('dash.keyword')}
            placeholder={t('dash.keywordPlaceholder')}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <DataTable<Project>
          minWidth={1000}
          caption="Projects register"
          rows={list}
          rowKey={(p) => p.id}
          paginated={true}
          pageSize={10}
          columns={[
            { key: 'id', header: 'ID', isRowHeader: true, render: (p) => <span className="nk-mono-id text-fg-muted">{p.id}</span> },
            { key: 'name', header: 'Project', render: (p) => <span className="block max-w-80 truncate font-medium text-fg" title={p.name}>{p.name}</span> },
            { key: 'dept', header: t('common.department'), render: (p) => (p.department || 'Public Works').replace(/ Department$/i, '') },
            { key: 'district', header: t('common.district'), render: (p) => p.district || 'Pune' },
            { key: 'status', header: t('common.status'), render: (p) => <StatusBadge descriptor={PROJECT_STATUS[p.status]} /> },
            { key: 'amount', header: 'Sanctioned', cellClassName: 'tabular-nums', render: (p) => formatCr(p.sanctionedAmountCr) },
            { key: 'progress', header: t('common.progress'), render: (p) => <Progress value={p.physicalProgressPct} label={`Physical progress of ${p.id}`} size="sm" className="min-w-36" /> },
            { key: 'eoc', header: 'Completion', cellClassName: 'tabular-nums', render: (p) => formatDate(p.expectedCompletion) },
          ]}
          rowActions={(p) => (
            <Button variant="primary" size="sm" onClick={() => navigate(`/government/projects/${p.id}`)}>
              {t('common.viewProject')}
            </Button>
          )}
          emptyState={
            <div className="p-8 text-center text-body-small text-fg-muted">
              {t('common.noResults')}
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={() => { setDivision(''); setHealth(''); setBudget(''); setKeyword('') }}>
                  {t('common.clearFilters')}
                </Button>
              </div>
            </div>
          }
        />
      </Panel>
    </div>
  )
}
