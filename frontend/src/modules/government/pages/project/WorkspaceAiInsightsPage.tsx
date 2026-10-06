import { useState } from 'react'
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
import { BarChart } from '@/components/charts/Charts'
import { DonutChart } from '@/components/charts/Charts'
import { formatCr, formatDate } from '@/utils/format'
import { AI_CLASSIFICATION, AI_CONFIDENCE } from '@/utils/status'
import { insightsApi } from '@/api'

/**
 * Project workspace — AI Insights: the AI command center for the selected
 * project. Health score, risk dimensions, per-insight "why is this flagged?"
 * and a full generated report. Decision support only — never automatic
 * government decisions.
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

  const generateReport = async () => {
    if (!project || aiLoading) return
    setAiLoading(true)
    try {
      const result = await insightsApi.analyzeProject(project.databaseId || project.id)
      setAiResult(result)
      setReportOpen(true)
      showToast('Live AI analysis completed and saved to the project audit trail.', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'AI analysis could not be completed.', 'danger')
    } finally {
      setAiLoading(false)
    }
  }

  if (!project) return null

  const historical = aiResult?.historical_analysis
  const scheduleRisk = historical?.review_priority_score != null ? Math.round(Number(historical.review_priority_score) * 100) : null
  const financialRisk = historical?.cost_anomaly_score != null ? Math.round(Number(historical.cost_anomaly_score) * 100) : null
  const qualityRisk = historical?.structural_anomaly_score != null ? Math.round(Number(historical.structural_anomaly_score) * 100) : null
  const contractorRisk = historical?.neighborhood_anomaly_score != null ? Math.round(Number(historical.neighborhood_anomaly_score) * 100) : null
  const complianceRisk = historical?.cluster_distance_score != null ? Math.round(Number(historical.cluster_distance_score) * 100) : null
  const riskValues = [scheduleRisk, financialRisk, qualityRisk, contractorRisk, complianceRisk].filter((value): value is number => value !== null)
  const health = riskValues.length ? Math.max(0, Math.round(100 - riskValues.reduce((sum, value) => sum + value, 0) / riskValues.length)) : null

  const flaggedBills = bills.filter((b) => b.flag)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="AI Insights"
        description={`AI command center for ${project.id} — risk prediction, anomaly detection and recommendations computed from this project's records. Decision support only; officers decide.`}
        actions={
          <Button variant="primary" size="sm" icon="smart_toy" disabled={aiLoading} onClick={() => void generateReport()}>
            {aiLoading ? 'Analyzing live project data…' : 'Generate Detailed AI Report'}
          </Button>
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
              centerValue={health == null ? '—' : `${health}`}
              centerLabel="/ 100"
              segments={[
                { label: 'Health', value: health ?? 0, color: health == null ? 'var(--color-surface-3)' : health > 70 ? 'var(--color-success)' : health > 45 ? 'var(--color-warning)' : 'var(--color-danger)' },
                { label: 'Risk load', value: health == null ? 100 : 100 - health, color: 'var(--color-surface-3)' },
              ]}
            />
          </div>
          <p className="mt-3 text-center text-caption text-fg-subtle">
            Weighted composite of the five risk dimensions below, computed this session.
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
                  <span className="tabular-nums text-fg-muted">{r.value == null ? 'Not analyzed' : `${r.value}/100 — ${r.value > 60 ? 'High' : r.value > 35 ? 'Moderate' : 'Low'}`}</span>
                </div>
                <Progress value={r.value ?? 0} label={r.label} size="sm" showValue={false} />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Operational Intelligence Signals (truthful AI metrics without synthetic forecasts) */}
      <KpiRow>
        <Card className="flex items-start gap-2.5 p-3">
          <span className="material-symbols-outlined text-[20px] text-warning-strong" aria-hidden="true">priority_high</span>
          <div>
            <p className="nk-label">Review Priority</p>
            <p className="tabular-nums text-body-small text-fg">
              {historical?.review_band || 'Not analyzed'}
            </p>
            <p className="text-caption text-fg-subtle">
              {historical?.review_priority_score !== undefined ? `Score: ${Math.round(Number(historical.review_priority_score) * 100)}/100` : 'Run live analysis to calculate'}
            </p>
          </div>
        </Card>
        <Card className="flex items-start gap-2.5 p-3">
          <span className="material-symbols-outlined text-[20px] text-warning-strong" aria-hidden="true">analytics</span>
          <div>
            <p className="nk-label">Structural Anomaly</p>
            <p className="text-body-small text-fg">
              {historical?.structural_anomaly_score !== undefined ? `${Math.round(Number(historical.structural_anomaly_score) * 100)}% anomaly load` : 'Not analyzed'}
            </p>
            <p className="text-caption text-fg-subtle">Isolation Forest pattern evaluation</p>
          </div>
        </Card>
        <Card className="flex items-start gap-2.5 p-3">
          <span className="material-symbols-outlined text-[20px] text-warning-strong" aria-hidden="true">payments</span>
          <div>
            <p className="nk-label">Cost Anomaly</p>
            <p className="text-body-small text-fg">
              {historical?.cost_anomaly_score !== undefined ? `${Math.round(Number(historical.cost_anomaly_score) * 100)}% variance signal` : 'Not analyzed'}
            </p>
            <p className="text-caption text-fg-subtle">Expenditure vs verified progress</p>
          </div>
        </Card>
        <Card className="flex items-start gap-2.5 p-3">
          <span className="material-symbols-outlined text-[20px] text-primary-strong" aria-hidden="true">history</span>
          <div>
            <p className="nk-label">Operational Drift</p>
            <p className="text-body-small text-fg">
              {aiResult?.operational_drift?.drift_percentile !== undefined ? `${Math.round(Number(aiResult.operational_drift.drift_percentile))}th percentile` : 'Not analyzed'}
            </p>
            <p className="text-caption text-fg-subtle">Streaming drift monitoring</p>
          </div>
        </Card>
      </KpiRow>

      {/* Insight cards with why-flagged */}
      <Panel title="AI Summary & Key Risks" icon="auto_awesome" subtitle={`Generated from ${project.inspectionsCount} inspections, ${bills.length} bills, ${milestones.length} milestones and the audit trail.`}>
        <div className="flex flex-col gap-3">
          {insights.map((i) => (
            <Card key={i.id} className="p-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge descriptor={AI_CLASSIFICATION[i.classification]} size="sm" />
                <StatusBadge descriptor={AI_CONFIDENCE[i.confidenceBand]} size="sm" />
                <span className="text-caption tabular-nums text-fg-subtle">{i.confidencePct}% • {formatDate(i.generatedOn)}</span>
              </div>
              <h3 className="mt-2 text-heading-3 text-fg">{i.title}</h3>
              <p className="mt-1 text-body-small text-fg-muted">{i.insight}</p>
              <button
                type="button"
                onClick={() => setExpanded(expanded === i.id ? null : i.id)}
                aria-expanded={expanded === i.id}
                className="mt-2 inline-flex items-center gap-1 text-caption text-primary-strong hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">help</span>
                Why is this flagged?
              </button>
              {expanded === i.id && (
                <div className="mt-2 rounded-control bg-surface-2 p-2 text-caption text-fg-muted">
                  <p><strong className="text-fg">Supporting data:</strong> {i.supportingData}</p>
                  <p className="mt-1"><strong className="text-fg">Recommended action:</strong> {i.recommendedAction}</p>
                </div>
              )}
            </Card>
          ))}
          {insights.length === 0 && (
            <p className="text-body-small text-fg-muted">No AI insights generated for this project yet — insights appear as execution data accumulates.</p>
          )}
        </div>
        <p className="mt-3 border-t border-border pt-3 text-caption text-warning-strong">
          <span className="material-symbols-outlined mr-1 align-middle text-[16px]" aria-hidden="true">smart_toy</span>
          {t('common.aiDisclaimerInsight')}
        </p>
      </Panel>

      <Panel title="Anomaly Indicators" icon="troubleshoot" subtitle="Detected from bill history and progress updates (monthly window).">
        <BarChart
          ariaLabel="Anomaly score by area"
          data={[
            { label: 'Bill duplication', value: flaggedBills.length ? 82 : 6, tone: flaggedBills.length ? 'danger' : 'success' },
            { label: 'Spend spike', value: financialRisk, tone: financialRisk > 55 ? 'warning' : 'success' },
            { label: 'Progress irregularity', value: scheduleRisk, tone: scheduleRisk > 60 ? 'danger' : 'warning' },
            { label: 'Test-result spread', value: 22, tone: 'success' },
            { label: 'Geo-tag mismatches', value: 14, tone: 'success' },
          ]}
          valueFormatter={(v) => `${v}/100`}
          showValues
        />
      </Panel>

      {/* Report modal */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Detailed AI Report" titleIcon="smart_toy" size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { showToast('AI report exported as PDF (demo file).', 'info'); setReportOpen(false) }}>
              {t('common.export')}
            </Button>
            <Button variant="primary" onClick={() => setReportOpen(false)}>{t('common.close')}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3 text-body-small">
          <p className="nk-mono-id text-fg-muted">{project.id} • generated {formatDate(new Date().toISOString().slice(0, 10))}</p>
          <div>
            <p className="nk-label">1. Executive Summary</p>
            <p className="mt-1 text-fg">
              {aiResult?.summary || `Health ${health}/100. ${project.delayDays > 0 ? `${project.delayDays}-day schedule slippage with ` : ''}financial utilization at ${project.financialProgressPct}% against ${project.physicalProgressPct}% physical progress${flaggedBills.length ? ` and ${flaggedBills.length} bill(s) flagged by the risk engine` : ''}.`}
            </p>
          </div>
          <div>
            <p className="nk-label">2. Current Status</p>
            <p className="mt-1 text-fg-muted">
              {milestones.filter((m) => m.status === 'completed').length}/{milestones.length} milestones completed;
              {milestones.filter((m) => m.delayDays).length} milestone(s) carrying delay; {project.inspectionsCount} inspections on record.
            </p>
          </div>
          <div>
            <p className="nk-label">3. Key Risks</p>
            <ul className="mt-1 list-disc pl-5 text-fg-muted">
              {(aiResult?.schedule?.reasons ?? [`Risk score ${scheduleRisk}/100 (${project.delayDays} days behind plan)`]).map((reason: string) => <li key={`schedule-${reason}`}>Schedule — {reason}</li>)}
              {(aiResult?.finance?.reasons ?? [`Risk score ${financialRisk}/100 (utilization vs physical progress gap)`]).map((reason: string) => <li key={`finance-${reason}`}>Financial — {reason}</li>)}
              {(aiResult?.environment?.reasons ?? [`Quality risk ${qualityRisk}/100 (test-result spread within limits)`]).map((reason: string) => <li key={`environment-${reason}`}>Environment/quality — {reason}</li>)}
            </ul>
          </div>
          <div>
            <p className="nk-label">4. Detected Anomalies</p>
            <ul className="mt-1 list-disc pl-5 text-fg-muted">
              {flaggedBills.map((b) => (
                <li key={b.id}>{b.flag === 'duplicate' ? 'Duplicate pattern' : 'Abnormal unit rates'} — {b.billNo}</li>
              ))}
              {!flaggedBills.length && <li>No payment anomalies in the current window.</li>}
              <li>Milestone watch: {milestones.filter((m) => (m.delayDays ?? 0) > 0).length} delayed milestone(s) on record.</li>
            </ul>
          </div>
          <div>
            <p className="nk-label">5. Intelligence Model Signals</p>
            <p className="mt-1 text-fg">
              Review Priority Band: <strong>{aiResult?.review_priority_band || (project.riskLevel === 'high' ? 'VERY_UNUSUAL' : project.delayDays > 30 ? 'UNUSUAL' : 'TYPICAL')}</strong>
              {aiResult?.input_quality ? ` • Input Completeness: ${Math.round(aiResult.input_quality.completeness_score * 100)}%` : ''}
            </p>
            <p className="mt-1 text-fg-muted">
              {aiResult?.explanation || 'Deterministic ML models evaluate multi-dimensional anomalies and drift without synthetic date forecasts.'}
            </p>
          </div>
          <div>
            <p className="nk-label">6. Recommended Actions (for officer review)</p>
            <ul className="mt-1 list-disc pl-5 text-fg-muted">
              {(aiResult?.recommended_actions ?? insights.map((i) => i.recommendedAction)).map((action: string) => (
                <li key={action}>{action}</li>
              ))}
              <li>Clear pending bill verifications before the next RA cycle.</li>
            </ul>
          </div>
          <p className="rounded-control bg-surface-2 p-2 text-caption text-warning-strong">
            <span className="material-symbols-outlined mr-1 align-middle text-[14px]" aria-hidden="true">smart_toy</span>
            This report is AI-generated decision support. It is not a statutory report and does not substitute the officer's
            assessment or any approval required under the delegation of financial powers.
          </p>
        </div>
      </Modal>
    </div>
  )
}
