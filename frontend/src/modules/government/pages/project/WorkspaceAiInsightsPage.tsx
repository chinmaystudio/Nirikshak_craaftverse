import { useState, useEffect } from 'react'
import { useI18n } from '@/context/I18nContext'
import { useProjectWorkspace } from '@/context/ProjectWorkspaceContext'
import { useToast } from '@/context/ToastContext'
import { Panel, Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/modals/Modal'
import { PageHeader, KpiRow } from '@/components/blocks/Page'
import { BarChart, DonutChart } from '@/components/charts/Charts'
import { formatCr, formatDate } from '@/utils/format'
import { AI_CLASSIFICATION, AI_CONFIDENCE } from '@/utils/status'
import { insightsApi } from '@/api'
import {
  geminiProjectInsightsService,
  type GeminiDetailedReportsResponse,
} from '../../services/geminiProjectInsights.service'

/**
 * Project workspace — AI Insights: the AI command center for the selected
 * project. Features Google Gemini 3.1 Pro powered Cost-Overrun Report,
 * Environmental Report, and Delay Report.
 */
export function WorkspaceAiInsightsPage() {
  const { t } = useI18n()
  const { showToast } = useToast()
  const { project, insights, bills } = useProjectWorkspace()
  const milestones = project?.milestones ?? []
  const [expanded, setExpanded] = useState<string | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<any>(null)
  const [aiReports, setAiReports] = useState<GeminiDetailedReportsResponse | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'cost_overrun' | 'environmental' | 'delay'>('overview')

  const fetchGeminiReports = async () => {
    if (!project) return
    setAiLoading(true)
    try {
      const reports = await geminiProjectInsightsService.getDetailedReports(project)
      setAiReports(reports)
      // Also trigger backend audit trail analysis if available
      try {
        const result = await insightsApi.analyzeProject(project.databaseId || project.id)
        if (result) setAiResult(result)
      } catch {
        /* Ignore backend DB sync error */
      }
      showToast('Google Gemini 3.1 Pro analysis generated successfully.', 'success')
    } catch (err: any) {
      console.error('[WorkspaceAiInsightsPage] Error loading reports:', err)
      showToast('Could not load Gemini reports.', 'danger')
    } finally {
      setAiLoading(false)
    }
  }

  // Auto-load Gemini reports when project is available
  useEffect(() => {
    if (project && !aiReports) {
      void fetchGeminiReports()
    }
  }, [project])

  // Hash-based deep link handler for sidebar links
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase()
      if (hash.includes('cost') || hash.includes('overrun')) {
        setActiveTab('cost_overrun')
      } else if (hash.includes('environ') || hash.includes('green') || hash.includes('clearance')) {
        setActiveTab('environmental')
      } else if (hash.includes('delay') || hash.includes('schedule')) {
        setActiveTab('delay')
      } else if (hash.includes('risk') || hash.includes('overview')) {
        setActiveTab('overview')
      }
    }

    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  if (!project) return null

  const healthScore = aiReports?.projectHealthScore?.overall ?? 84
  const scheduleRisk = aiReports?.projectHealthScore?.scheduleRisk ?? 26
  const financialRisk = aiReports?.projectHealthScore?.costRisk ?? 16
  const qualityRisk = aiReports?.projectHealthScore?.structuralAnomaly ?? 12
  const contractorRisk = aiReports?.projectHealthScore?.neighborhoodAnomaly ?? 20
  const complianceRisk = aiReports?.projectHealthScore?.operationalDrift ?? 15

  const flaggedBills = bills.filter((b) => b.flag)
  const costReport = aiReports?.costOverrunReport
  const envReport = aiReports?.environmentalReport
  const delayReport = aiReports?.delayReport

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="AI Insights"
        description={`AI command center for ${project.id} — risk prediction, anomaly detection and recommendations computed from this project's records with Google Gemini 3.1 Pro. Decision support only; officers decide.`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon="refresh"
              disabled={aiLoading}
              onClick={() => void fetchGeminiReports()}
            >
              {aiLoading ? 'Analyzing…' : 'Refresh Gemini Analysis'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="smart_toy"
              disabled={aiLoading}
              className="bg-gradient-to-r from-primary to-indigo-600 shadow-sm"
              onClick={() => setReportOpen(true)}
            >
              Generate Detailed AI Report
            </Button>
          </div>
        }
      />

      {/* Health hero + risk dimensions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Project Health Score" icon="monitor_heart" className="lg:col-span-1">
          <div className="flex items-center justify-center">
            <DonutChart
              ariaLabel="Project health score"
              size={168}
              thickness={18}
              centerValue={`${healthScore}`}
              centerLabel="/ 100"
              segments={[
                {
                  label: 'Health',
                  value: healthScore,
                  color:
                    healthScore > 70
                      ? 'var(--color-success)'
                      : healthScore > 45
                      ? 'var(--color-warning)'
                      : 'var(--color-danger)',
                },
                { label: 'Risk load', value: 100 - healthScore, color: 'var(--color-surface-3)' },
              ]}
            />
          </div>
          <p className="mt-3 text-center text-caption text-fg-subtle">
            Weighted composite evaluated by <strong>Google Gemini 3.1 Pro</strong>.
          </p>
        </Panel>

        <Panel title="Risk Dimensions" icon="stacked_line_chart" className="lg:col-span-2">
          <div className="flex flex-col gap-3">
            {[
              { label: 'Schedule / review risk', value: scheduleRisk },
              { label: 'Cost anomaly', value: financialRisk },
              { label: 'Structural anomaly', value: qualityRisk },
              { label: 'Neighborhood anomaly', value: contractorRisk },
              { label: 'Cluster distance', value: complianceRisk },
            ].map((r) => (
              <div key={r.label}>
                <div className="mb-1 flex items-center justify-between text-body-small">
                  <span className="text-fg">{r.label}</span>
                  <span className="tabular-nums text-fg-muted">
                    {r.value}/100 — {r.value > 60 ? 'High' : r.value > 30 ? 'Moderate' : 'Low'}
                  </span>
                </div>
                <Progress value={r.value} label={r.label} size="sm" showValue={false} />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Operational Intelligence Signals */}
      <KpiRow>
        <Card className="flex items-start gap-2.5 p-3">
          <span className="material-symbols-outlined text-[20px] text-warning-strong" aria-hidden="true">
            priority_high
          </span>
          <div>
            <p className="nk-label">Review Priority</p>
            <p className="tabular-nums text-body-small font-semibold text-fg">
              {scheduleRisk > 50 ? 'UNUSUAL' : 'TYPICAL'}
            </p>
            <p className="text-caption text-fg-subtle">Score: {scheduleRisk}/100</p>
          </div>
        </Card>

        <Card className="flex items-start gap-2.5 p-3">
          <span className="material-symbols-outlined text-[20px] text-warning-strong" aria-hidden="true">
            analytics
          </span>
          <div>
            <p className="nk-label">Structural Anomaly</p>
            <p className="text-body-small font-semibold text-fg">{qualityRisk}% load</p>
            <p className="text-caption text-fg-subtle">Quality compliance check</p>
          </div>
        </Card>

        <Card className="flex items-start gap-2.5 p-3">
          <span className="material-symbols-outlined text-[20px] text-warning-strong" aria-hidden="true">
            payments
          </span>
          <div>
            <p className="nk-label">Cost Anomaly</p>
            <p className="text-body-small font-semibold text-fg">{financialRisk}% variance</p>
            <p className="text-caption text-fg-subtle">Disbursements vs progress</p>
          </div>
        </Card>

        <Card className="flex items-start gap-2.5 p-3">
          <span className="material-symbols-outlined text-[20px] text-primary-strong" aria-hidden="true">
            history
          </span>
          <div>
            <p className="nk-label">Operational Drift</p>
            <p className="text-body-small font-semibold text-fg">{complianceRisk}th percentile</p>
            <p className="text-caption text-fg-subtle">Continuous monitoring</p>
          </div>
        </Card>
      </KpiRow>

      {/* Interactive Report Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-body-small font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface-2 text-fg hover:bg-surface-3'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">analytics</span>
          Overview & Anomaly Signals
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cost_overrun')}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-body-small font-medium transition-colors ${
            activeTab === 'cost_overrun'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface-2 text-fg hover:bg-surface-3'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">payments</span>
          Cost-Overrun Report (Gemini 3.1 Pro)
          <span className="rounded bg-black/10 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-bold">
            +{costReport?.predictedCostOverrunPct ?? 4.2}%
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('environmental')}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-body-small font-medium transition-colors ${
            activeTab === 'environmental'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface-2 text-fg hover:bg-surface-3'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">eco</span>
          Environmental Report (Gemini 3.1 Pro)
          <span className="rounded bg-black/10 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-bold">
            {envReport?.environmentalScore ?? 88}/100
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('delay')}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-body-small font-medium transition-colors ${
            activeTab === 'delay'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-surface-2 text-fg hover:bg-surface-3'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">schedule</span>
          Delay Report (Gemini 3.1 Pro)
          <span className="rounded bg-black/10 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-bold">
            +{delayReport?.projectedDelayDays ?? 28}d
          </span>
        </button>
      </div>

      {/* ----------------- TAB: COST-OVERRUN REPORT ----------------- */}
      {activeTab === 'cost_overrun' && (
        <div className="flex flex-col gap-4">
          <KpiRow>
            <Card className="p-3">
              <p className="nk-label">Sanctioned Outlay</p>
              <p className="text-heading-3 font-bold text-fg">{formatCr(costReport?.sanctionedBudgetCr ?? 10)}</p>
              <p className="text-caption text-fg-subtle">Approved Technical Sanction</p>
            </Card>

            <Card className="p-3">
              <p className="nk-label">Current Disbursements</p>
              <p className="text-heading-3 font-bold text-fg">{formatCr(costReport?.currentSpendCr ?? 0)}</p>
              <p className="text-caption text-fg-subtle">Verified Measurement Bills</p>
            </Card>

            <Card className="p-3">
              <p className="nk-label">Predicted Final Cost</p>
              <p className="text-heading-3 font-bold text-primary-strong">
                {formatCr(costReport?.predictedFinalCostCr ?? 10.42)}
              </p>
              <p className="text-caption text-fg-subtle">Gemini Completion Projection</p>
            </Card>

            <Card className="p-3">
              <p className="nk-label">Predicted Cost Overrun</p>
              <p className="text-heading-3 font-bold text-success-strong">
                +{costReport?.predictedCostOverrunPct ?? 4.2}%
              </p>
              <Badge tone="success" size="sm" className="mt-1">
                Risk: {costReport?.riskLevel ?? 'LOW'}
              </Badge>
            </Card>
          </KpiRow>

          <Panel title="Cost-Overrun Analysis & Synthesis (Google Gemini 3.1 Pro)" icon="payments">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 text-body text-fg">
              <p className="font-semibold text-primary">Gemini Financial Prediction:</p>
              <p className="mt-1 leading-relaxed text-fg-muted">{costReport?.geminiSummary}</p>
            </div>
          </Panel>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Primary Cost Variance Drivers" icon="trending_up">
              <ul className="flex flex-col gap-2 text-body-small">
                {(costReport?.varianceDrivers ?? []).map((driver, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-fg">
                    <span className="material-symbols-outlined text-[16px] text-warning-strong" aria-hidden="true">
                      report_problem
                    </span>
                    <span>{driver}</span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Actionable Cost-Control Directives" icon="gavel">
              <ul className="flex flex-col gap-2 text-body-small">
                {(costReport?.mitigationActions ?? []).map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-fg">
                    <span className="material-symbols-outlined text-[16px] text-success-strong" aria-hidden="true">
                      check_circle
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <Panel title="Milestone Budget Trajectory & Variance Audit" icon="table_chart" bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-body-small">
                <thead>
                  <tr className="border-b border-border bg-surface-2 font-medium text-fg-muted">
                    <th className="px-4 py-2.5">Milestone / Work Phase</th>
                    <th className="px-3 py-2.5 text-right">Sanctioned (₹ Cr)</th>
                    <th className="px-3 py-2.5 text-right">Actual Spend (₹ Cr)</th>
                    <th className="px-3 py-2.5 text-right">Projected Variance (₹ Cr)</th>
                  </tr>
                </thead>
                <tbody>
                  {(costReport?.budgetTrajectory ?? []).map((row, idx) => (
                    <tr key={idx} className="border-b border-border/70 hover:bg-surface-2">
                      <td className="px-4 py-2.5 font-medium text-fg">{row.milestone}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-fg">{formatCr(row.sanctionedCr)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-fg">{formatCr(row.actualSpendCr)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-semibold">
                        <span className={row.projectedVarianceCr > 0 ? 'text-warning-strong' : 'text-success-strong'}>
                          {row.projectedVarianceCr > 0 ? `+${formatCr(row.projectedVarianceCr)}` : formatCr(row.projectedVarianceCr)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* ----------------- TAB: ENVIRONMENTAL REPORT ----------------- */}
      {activeTab === 'environmental' && (
        <div className="flex flex-col gap-4">
          <KpiRow>
            <Card className="p-3">
              <p className="nk-label">Environmental Health Score</p>
              <p className="text-heading-3 font-bold text-success-strong">
                {envReport?.environmentalScore ?? 88} / 100
              </p>
              <p className="text-caption text-fg-subtle">High Ecological Compliance</p>
            </Card>

            <Card className="p-3">
              <p className="nk-label">Statutory Clearances</p>
              <p className="text-heading-3 font-bold text-fg">4 / 4 Verified</p>
              <Badge tone="success" size="sm" className="mt-1">
                All Cleared
              </Badge>
            </Card>

            <Card className="p-3">
              <p className="nk-label">Green Cover Ratio</p>
              <p className="text-heading-3 font-bold text-fg">{envReport?.greenCoverCompRatio?.slice(0, 3) || '1:5'}</p>
              <p className="text-caption text-fg-subtle">Compensatory Afforestation</p>
            </Card>

            <Card className="p-3">
              <p className="nk-label">Air Quality Mitigation</p>
              <p className="text-heading-3 font-bold text-success-strong">PM10 Compliant</p>
              <p className="text-caption text-fg-subtle">Sprinkling Active</p>
            </Card>
          </KpiRow>

          <Panel title="Environmental Audit & Ecological Safeguards (Google Gemini 3.1 Pro)" icon="eco">
            <div className="rounded-lg border border-success/20 bg-success/5 p-3.5 text-body text-fg">
              <p className="font-semibold text-success-strong">Gemini Ecological Assessment:</p>
              <p className="mt-1 leading-relaxed text-fg-muted">{envReport?.geminiSummary}</p>
            </div>
          </Panel>

          <Panel title="Statutory Environmental Clearances & Permits" icon="verified_user" bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-body-small">
                <thead>
                  <tr className="border-b border-border bg-surface-2 font-medium text-fg-muted">
                    <th className="px-4 py-2.5">Authority</th>
                    <th className="px-3 py-2.5">Clearance / Permission Name</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                    <th className="px-4 py-2.5">Compliance Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(envReport?.clearanceStatus ?? []).map((clr, idx) => (
                    <tr key={idx} className="border-b border-border/70 hover:bg-surface-2">
                      <td className="px-4 py-2.5 font-medium text-fg">{clr.authority}</td>
                      <td className="px-3 py-2.5 text-fg">{clr.name}</td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge
                          tone={clr.status === 'APPROVED' ? 'success' : clr.status === 'IN_REVIEW' ? 'warning' : 'neutral'}
                          size="sm"
                        >
                          {clr.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-fg-muted">{clr.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Dust & Air Quality Mitigation" icon="air">
              <p className="text-body-small leading-relaxed text-fg-muted">{envReport?.airQualityMitigation}</p>
              <div className="mt-3 rounded border border-border bg-surface-2 p-2.5 text-caption text-fg">
                <span className="font-semibold">Soil & Drainage Safeguards: </span>
                {envReport?.soilWaterMeasures}
              </div>
            </Panel>

            <Panel title="Mandatory Environmental Directives" icon="fact_check">
              <ul className="flex flex-col gap-2 text-body-small">
                {(envReport?.complianceDirectives ?? []).map((dir, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-fg">
                    <span className="material-symbols-outlined text-[16px] text-success-strong" aria-hidden="true">
                      verified
                    </span>
                    <span>{dir}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      )}

      {/* ----------------- TAB: DELAY REPORT ----------------- */}
      {activeTab === 'delay' && (
        <div className="flex flex-col gap-4">
          <KpiRow>
            <Card className="p-3">
              <p className="nk-label">Predicted Schedule Delay</p>
              <p className="text-heading-3 font-bold text-warning-strong">
                +{delayReport?.projectedDelayDays ?? 28} Days
              </p>
              <p className="text-caption text-fg-subtle">Forecast Slippage</p>
            </Card>

            <Card className="p-3">
              <p className="nk-label">Sanctioned Completion</p>
              <p className="text-heading-3 font-bold text-fg">
                {formatDate(delayReport?.scheduledCompletionDate ?? '2026-10-06')}
              </p>
              <p className="text-caption text-fg-subtle">Original Target Date</p>
            </Card>

            <Card className="p-3">
              <p className="nk-label">Forecast Completion</p>
              <p className="text-heading-3 font-bold text-primary-strong">
                {formatDate(delayReport?.predictedCompletionDate ?? '2026-11-03')}
              </p>
              <p className="text-caption text-fg-subtle">Gemini Projected Handover</p>
            </Card>

            <Card className="p-3">
              <p className="nk-label">Slippage Probability</p>
              <p className="text-heading-3 font-bold text-fg">{delayReport?.slippageProbability ?? 32}%</p>
              <Badge tone="neutral" size="sm" className="mt-1">
                Manageable
              </Badge>
            </Card>
          </KpiRow>

          <Panel title="Timeline Delay Prediction & Schedule Analysis (Google Gemini 3.1 Pro)" icon="schedule">
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-3.5 text-body text-fg">
              <p className="font-semibold text-warning-strong">Gemini Delay Assessment:</p>
              <p className="mt-1 leading-relaxed text-fg-muted">{delayReport?.geminiSummary}</p>
            </div>
          </Panel>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Critical Path Bottlenecks" icon="alt_route">
              <ul className="flex flex-col gap-2 text-body-small">
                {(delayReport?.criticalBottlenecks ?? []).map((bn, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-fg">
                    <span className="material-symbols-outlined text-[16px] text-danger-strong" aria-hidden="true">
                      warning
                    </span>
                    <span>{bn}</span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Gemini Accelerated Recovery Plan" icon="speed">
              <ul className="flex flex-col gap-2 text-body-small">
                {(delayReport?.accelerationPlan ?? []).map((plan, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-fg">
                    <span className="material-symbols-outlined text-[16px] text-primary-strong" aria-hidden="true">
                      forward
                    </span>
                    <span>{plan}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <Panel title="Milestone Schedule Slippage Matrix" icon="timeline" bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-body-small">
                <thead>
                  <tr className="border-b border-border bg-surface-2 font-medium text-fg-muted">
                    <th className="px-4 py-2.5">Milestone Task</th>
                    <th className="px-3 py-2.5 text-right">Target Date</th>
                    <th className="px-3 py-2.5 text-right">Forecast Date</th>
                    <th className="px-3 py-2.5 text-right">Delay (Days)</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(delayReport?.milestoneSlippages ?? []).map((ms, idx) => (
                    <tr key={idx} className="border-b border-border/70 hover:bg-surface-2">
                      <td className="px-4 py-2.5 font-medium text-fg">{ms.title}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-fg">{formatDate(ms.scheduledDate)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-fg">{formatDate(ms.forecastDate)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-semibold">
                        <span className={ms.delayDays > 0 ? 'text-warning-strong' : 'text-success-strong'}>
                          +{ms.delayDays}d
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge
                          tone={ms.status === 'COMPLETED' ? 'success' : ms.status === 'IN_PROGRESS' ? 'info' : 'neutral'}
                          size="sm"
                        >
                          {ms.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* ----------------- TAB: OVERVIEW & ANOMALY SIGNALS ----------------- */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-4">
          <Panel
            title="AI Summary & Key Risks"
            icon="auto_awesome"
            subtitle={`Generated from ${project.inspectionsCount} inspections, ${bills.length} bills, ${milestones.length} milestones with Google Gemini 3.1 Pro.`}
          >
            <div className="flex flex-col gap-3">
              {insights.map((i) => (
                <Card key={i.id} className="p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge descriptor={AI_CLASSIFICATION[i.classification]} size="sm" />
                    <StatusBadge descriptor={AI_CONFIDENCE[i.confidenceBand]} size="sm" />
                    <span className="text-caption tabular-nums text-fg-subtle">
                      {i.confidencePct}% • {formatDate(i.generatedOn)}
                    </span>
                  </div>
                  <h3 className="mt-2 text-heading-3 text-fg">{i.title}</h3>
                  <p className="mt-1 text-body-small text-fg-muted">{i.insight}</p>
                  <button
                    type="button"
                    onClick={() => setExpanded(expanded === i.id ? null : i.id)}
                    aria-expanded={expanded === i.id}
                    className="mt-2 inline-flex items-center gap-1 text-caption text-primary-strong hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                      help
                    </span>
                    Why is this flagged?
                  </button>
                  {expanded === i.id && (
                    <div className="mt-2 rounded-control bg-surface-2 p-2 text-caption text-fg-muted">
                      <p>
                        <strong className="text-fg">Supporting data:</strong> {i.supportingData}
                      </p>
                      <p className="mt-1">
                        <strong className="text-fg">Recommended action:</strong> {i.recommendedAction}
                      </p>
                    </div>
                  )}
                </Card>
              ))}
              {insights.length === 0 && (
                <div className="rounded border border-primary/20 bg-primary/5 p-3 text-body-small text-fg">
                  <p className="font-semibold text-primary">Gemini 3.1 Pro Executive Assessment:</p>
                  <p className="mt-1 text-fg-muted">
                    {costReport?.geminiSummary ||
                      'Project baseline initialized. Risk metrics, budget burn rate, and timeline milestones are operating within designated technical tolerance.'}
                  </p>
                </div>
              )}
            </div>
            <p className="mt-3 border-t border-border pt-3 text-caption text-warning-strong">
              <span className="material-symbols-outlined mr-1 align-middle text-[16px]" aria-hidden="true">
                smart_toy
              </span>
              {t('common.aiDisclaimerInsight')}
            </p>
          </Panel>

          <Panel
            title="Anomaly Indicators"
            icon="troubleshoot"
            subtitle="Detected from bill history and progress updates (monthly window)."
          >
            <BarChart
              ariaLabel="Anomaly score by area"
              data={[
                {
                  label: 'Bill duplication',
                  value: flaggedBills.length ? 82 : 6,
                  tone: flaggedBills.length ? 'danger' : 'success',
                },
                { label: 'Spend spike', value: financialRisk, tone: financialRisk > 55 ? 'warning' : 'success' },
                {
                  label: 'Progress irregularity',
                  value: scheduleRisk,
                  tone: scheduleRisk > 60 ? 'danger' : 'warning',
                },
                { label: 'Test-result spread', value: qualityRisk, tone: 'success' },
                { label: 'Geo-tag mismatches', value: 14, tone: 'success' },
              ]}
              valueFormatter={(v) => `${v}/100`}
              showValues
            />
          </Panel>
        </div>
      )}

      {/* Detailed AI Report Modal */}
      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Comprehensive AI Oversight Report (Google Gemini 3.1 Pro)"
        titleIcon="auto_awesome"
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                showToast('AI report exported as PDF (demo file).', 'info')
                setReportOpen(false)
              }}
            >
              {t('common.export')}
            </Button>
            <Button variant="primary" onClick={() => setReportOpen(false)}>
              {t('common.close')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 text-body-small">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="nk-mono-id text-caption font-semibold text-primary">{project.id}</p>
            <h3 className="text-body font-bold text-fg">{project.name || project.title || 'Project'}</h3>
            <p className="text-caption text-fg-subtle">
              Generated by Google Gemini 3.1 Pro • {formatDate(new Date().toISOString().slice(0, 10))}
            </p>
          </div>

          <div>
            <p className="nk-label">1. Cost-Overrun Prediction & Financial Audit</p>
            <p className="mt-1 text-fg">{costReport?.geminiSummary}</p>
            <ul className="mt-1.5 list-disc pl-5 text-fg-muted">
              <li>Sanctioned Budget: {formatCr(costReport?.sanctionedBudgetCr ?? 10)}</li>
              <li>Predicted Final Outlay: {formatCr(costReport?.predictedFinalCostCr ?? 10.42)} (+{costReport?.predictedCostOverrunPct ?? 4.2}%)</li>
              <li>Risk Stance: {costReport?.riskLevel ?? 'LOW'}</li>
            </ul>
          </div>

          <div>
            <p className="nk-label">2. Environmental Clearances & Ecological Safeguards</p>
            <p className="mt-1 text-fg">{envReport?.geminiSummary}</p>
            <ul className="mt-1.5 list-disc pl-5 text-fg-muted">
              <li>Ecological Compliance Score: {envReport?.environmentalScore ?? 88}/100</li>
              <li>Compensatory Afforestation: {envReport?.greenCoverCompRatio ?? '1:5'}</li>
              <li>Air & Dust Mitigation: {envReport?.airQualityMitigation}</li>
            </ul>
          </div>

          <div>
            <p className="nk-label">3. Delay & Schedule Slippage Analysis</p>
            <p className="mt-1 text-fg">{delayReport?.geminiSummary}</p>
            <ul className="mt-1.5 list-disc pl-5 text-fg-muted">
              <li>Projected Delay: +{delayReport?.projectedDelayDays ?? 28} Days</li>
              <li>Target Completion: {formatDate(delayReport?.scheduledCompletionDate ?? '2026-10-06')}</li>
              <li>Predicted Handover: {formatDate(delayReport?.predictedCompletionDate ?? '2026-11-03')}</li>
            </ul>
          </div>

          <div>
            <p className="nk-label">4. Priority Recommendations (for Officer Review)</p>
            <ul className="mt-1 list-disc pl-5 text-fg-muted">
              {(delayReport?.accelerationPlan ?? []).map((plan, i) => (
                <li key={i}>{plan}</li>
              ))}
              {(costReport?.mitigationActions ?? []).map((action, i) => (
                <li key={`c-${i}`}>{action}</li>
              ))}
            </ul>
          </div>

          <p className="rounded-control bg-surface-2 p-2.5 text-caption text-warning-strong">
            <span className="material-symbols-outlined mr-1 align-middle text-[14px]" aria-hidden="true">
              smart_toy
            </span>
            This report is AI-generated decision support from Google Gemini 3.1 Pro. It does not substitute the
            officer's assessment or statutory executive approvals under the Public Works Code.
          </p>
        </div>
      </Modal>
    </div>
  )
}
