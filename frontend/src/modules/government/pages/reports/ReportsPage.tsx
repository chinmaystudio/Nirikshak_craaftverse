import { useState } from 'react'
import { useI18n } from '@/context/I18nContext'
import { Panel, Card } from '@/components/ui/Card'
import { Select, TextField } from '@/components/ui/Fields'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/tables/DataTable'
import { BarChart, DonutChart, Sparkline } from '@/components/charts/Charts'
import { KpiCard } from '@/components/charts/KpiCard'
import { formatCr } from '@/utils/format'
import { useToast } from '@/context/ToastContext'
import { REPORT_TYPES, DEPARTMENTS, DISTRICTS } from '@/constants'
import { PROJECTS } from '@/data/projects'
import { CONTRACTORS } from '@/data/modules'

/**
 * ReportsPage — Reports & Analytics: the spec's 8 report types rendered from
 * mock data (exports are demo-only, nothing is generated server-side).
 */
export function ReportsPage() {
  const { t } = useI18n()
  const { showToast } = useToast()
  const [report, setReport] = useState<string>(REPORT_TYPES[0])
  const [dept, setDept] = useState('')
  const [district, setDistrict] = useState('')
  const [asOn, setAsOn] = useState('')

  const filtered = PROJECTS.filter((p) => (dept ? p.department === dept : true) && (district ? p.district === district : true))
  const outlay = filtered.reduce((s, p) => s + p.sanctionedAmountCr, 0)
  const utilized = filtered.reduce((s, p) => s + p.utilizedAmountCr, 0)
  const avgPhysical = filtered.length ? filtered.reduce((s, p) => s + p.physicalProgressPct, 0) / filtered.length : 0

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-heading-1 text-fg">{t('nav.reports')}</h1>
        <p className="mt-1 text-body-small text-fg-muted">
          Analytics across {REPORT_TYPES.length} standard report families (mock data).
        </p>
      </div>

      <Panel title="Report parameters" icon="tune" bodyClassName="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select label="Report type" value={report} onChange={(e) => setReport(e.target.value)} options={REPORT_TYPES.map((r) => ({ value: r, label: r }))} />
          <Select label={t('common.department')} value={dept} onChange={(e) => setDept(e.target.value)} options={[{ value: '', label: t('common.all') }, ...DEPARTMENTS.map((d) => ({ value: d.name, label: d.name }))]} />
          <Select label={t('common.district')} value={district} onChange={(e) => setDistrict(e.target.value)} options={[{ value: '', label: t('common.all') }, ...DISTRICTS.map((d) => ({ value: d, label: d }))]} />
          <TextField label="As-on date" type="date" value={asOn} onChange={(e) => setAsOn(e.target.value)} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button icon="description" onClick={() => showToast(`Report generated successfully for ${filtered.length} projects in scope.`, 'success')}>
            Generate Report
          </Button>
          <Button variant="outline" icon="print" onClick={() => window.print()}>
            {t('common.printRegister')}
          </Button>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Projects in scope" value={filtered.length} icon="apps" />
        <KpiCard label="Sanctioned outlay" value={formatCr(outlay)} icon="account_balance" />
        <KpiCard label="Utilized" value={formatCr(utilized)} icon="payments" iconTone="success" />
        <KpiCard label="Avg physical progress" value={`${avgPhysical.toFixed(1)}%`} icon="stacked_line_chart" iconTone="primary" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Outlay by department" icon="bar_chart">
          <BarChart
            ariaLabel="Sanctioned outlay by department"
            data={DEPARTMENTS.map((d) => ({
              label: d.code,
              value: PROJECTS.filter((p) => p.department === d.name).reduce((s, p) => s + p.sanctionedAmountCr, 0),
            })).filter((x) => x.value > 0)}
            valueFormatter={(v) => formatCr(v)}
          />
        </Panel>
        <Panel title="Portfolio status mix" icon="donut_large">
          <DonutChart
            ariaLabel="Project status distribution"
            centerValue={String(PROJECTS.length)}
            centerLabel="projects"
            segments={[
              { label: 'In Execution', value: PROJECTS.filter((p) => p.status === 'in_execution').length, color: 'var(--color-primary)' },
              { label: 'Delayed', value: PROJECTS.filter((p) => p.status === 'delayed').length, color: 'var(--color-danger)' },
              { label: 'At Risk', value: PROJECTS.filter((p) => p.status === 'at_risk').length, color: 'var(--color-warning)' },
              { label: 'Completed', value: PROJECTS.filter((p) => p.status === 'completed').length, color: 'var(--color-success)' },
              { label: 'Other', value: PROJECTS.filter((p) => p.status === 'sanctioned' || p.status === 'on_hold').length, color: 'var(--color-surface-3)' },
            ]}
          />
        </Panel>
      </div>

      <Panel title="Contractor performance snapshot" icon="engineering" bodyClassName="p-0">
        <DataTable
          minWidth={820}
          rows={CONTRACTORS}
          rowKey={(c) => c.id}
          columns={[
            { key: 'name', header: 'Contractor', isRowHeader: true, render: (c) => c.name },
            { key: 'class', header: 'Class', render: (c) => <Badge tone="neutral">{c.class}</Badge> },
            { key: 'ontime', header: 'On-Time %', cellClassName: 'tabular-nums', render: (c) => `${c.onTimeCompletionPct}%` },
            { key: 'quality', header: 'Quality', cellClassName: 'tabular-nums', render: (c) => `${c.qualityRating.toFixed(1)}/5` },
            { key: 'trend', header: 'Trend', render: (c) => <Sparkline points={[c.onTimeCompletionPct - 6, c.onTimeCompletionPct - 3, c.onTimeCompletionPct]} ariaLabel={`${c.name} trend`} className="w-24" height={28} /> },
          ]}
        />
      </Panel>
      <p className="text-caption text-fg-subtle">{t('common.mockDataNote')}</p>
    </div>
  )
}
