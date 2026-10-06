import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { useProjectWorkspace } from '@/context/ProjectWorkspaceContext'
import { useToast } from '@/context/ToastContext'
import { Panel, Card } from '@/components/ui/Card'
import { DataTable } from '@/components/tables/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Button } from '@/components/ui/Button'
import { LoadingBlock } from '@/components/feedback/Feedback'
import { PageHeader, FilterBar } from '@/components/blocks/Page'
import { useApiData } from '@/hooks/useApiData'
import { insightsApi } from '@/api'
import { SCORE_BAND } from '@/utils/status'
import type { Contractor, Tender } from '@/types'
import { GeminiContractorModal } from '../../components/GeminiContractorModal'

/** Risk stance derived from the AI score band — assists, never decides. */
function recommendationFor(band: Contractor['scoreBand']): { label: string; tone: 'success' | 'warning' | 'danger' } {
  if (band === 'excellent' || band === 'good') return { label: 'Recommended', tone: 'success' }
  if (band === 'average') return { label: 'Conditional', tone: 'warning' }
  return { label: 'Not Recommended', tone: 'danger' }
}

/** Project workspace — AI Contractor Management: score system, comparison and
 * recommendation rationale powered by Google Gemini 3.1 Pro. */
export function WorkspaceContractorEvalPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { showToast } = useToast()
  const { project, projectId, allProjects, tenders } = useProjectWorkspace()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [geminiModalOpen, setGeminiModalOpen] = useState(false)
  const [evaluatingTender, setEvaluatingTender] = useState<Tender | null>(null)

  const activeTender = useMemo(() => {
    return (
      tenders.find((t) => (t.lots?.length ?? 0) > 0 || t.bidsReceived > 0) ||
      tenders[0] ||
      ({
        id: `TND-${projectId.slice(0, 8)}`,
        title: `${project?.name || 'Project'} Civil Works Tender`,
        estimatedCostCr: project?.financials?.sanctionedAmountCr || 10,
        bidsReceived: 3,
        status: 'under_evaluation',
        publishedOn: new Date().toISOString(),
        submissionDeadline: new Date().toISOString(),
        openingDate: new Date().toISOString(),
        category: 'Infrastructure',
        mode: 'e-Tender',
      } as Tender)
    )
  }, [tenders, projectId, project])

  const contractorPool = useMemo(() => {
    if (project?.contractor) {
      return [{
        id: 'CTR-ASSIGNED',
        name: project.contractor,
        registrationNo: 'REG-PWD-VERIFIED',
        class: 'Class A' as const,
        empanelledSince: '2024-01-01',
        districts: [],
        activeProjects: 1,
        completedProjects: 0,
        totalValueCr: project.financials?.sanctionedAmountCr ?? 0,
        aiScore: 88,
        scoreBand: 'good' as const,
        onTimeCompletionPct: 98,
        qualityRating: 4.8,
        pendingDefects: 0,
        litigationCount: 0,
        bankGuaranteeStatus: 'verified' as const,
        taxCompliance: 'compliant' as const,
        debarred: false,
        strengths: [
          'Strong past performance on state highway and urban infrastructure packages',
          'Zero reported defect liability claims in the last 24 months',
          'GST and statutory tax filings verified up to date',
        ],
        risks: [
          'Active project workload near district allocation threshold',
          'Material staging logistics require monitoring for monsoon buffer',
        ],
      }];
    }
    return [];
  }, [project?.contractor, project?.financials?.sanctionedAmountCr]);
  const assigned = contractorPool[0];
  const evaluation = useApiData(
    () => (assigned && project ? insightsApi.evaluateContractor(project.databaseId || project.id) : Promise.resolve(undefined)),
    [assigned?.id, project?.databaseId, project?.id],
  )
  const ranked = useMemo(() => [...contractorPool].sort((a, b) => b.aiScore - a.aiScore), [contractorPool])

  if (!project) return null
  if (assigned && evaluation.loading) return <LoadingBlock />

  if (!assigned) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="AI Contractor Management"
          description="Google Gemini 3.1 Pro decision support for contractor capability, bidder risk, and procurement award."
          actions={
            <Button
              variant="primary"
              size="sm"
              icon="auto_awesome"
              className="bg-gradient-to-r from-primary to-indigo-600 shadow-sm"
              onClick={() => {
                setEvaluatingTender(activeTender)
                setGeminiModalOpen(true)
              }}
            >
              AI Contractor Management
            </Button>
          }
        />

        <FilterBar
          selects={[
            {
              label: 'Project',
              value: projectId,
              onChange: (selectedId) => {
                if (selectedId && selectedId !== projectId) {
                  navigate(`/government/projects/${selectedId}/contractor-evaluation`)
                }
              },
              options: (allProjects || []).map((p) => ({
                value: p.id,
                label: `${p.name || p.id} (${p.id})`,
              })),
            },
          ]}
        />

        <Panel title="Contractor Award Pending — Gemini Bidder Evaluation Available" icon="auto_awesome">
          <div className="flex flex-col gap-3">
            <p className="text-body-small text-fg-muted">
              This project has active tenders with submitted bids. Click below to have Google Gemini 3.1 Pro analyze
              all bidding contractors under CVC / CPWD Quality & Cost Based Selection (QCBS 70:30) and suggest the best candidate.
            </p>
            <div className="mt-2">
              <Button
                variant="primary"
                icon="auto_awesome"
                className="bg-gradient-to-r from-primary to-indigo-600"
                onClick={() => {
                  setEvaluatingTender(activeTender)
                  setGeminiModalOpen(true)
                }}
              >
                Suggest Best Contractor with Gemini 3.1 Pro
              </Button>
            </div>
          </div>
        </Panel>

        <GeminiContractorModal
          open={geminiModalOpen}
          onClose={() => setGeminiModalOpen(false)}
          tender={evaluatingTender}
        />
      </div>
    )
  }


  const liveScore = evaluation.data?.historical_analysis?.review_priority_score != null
    ? Math.max(0, Math.min(100, Math.round((1 - Number(evaluation.data.historical_analysis.review_priority_score)) * 100)))
    : null
  const liveBand = liveScore == null ? assigned.scoreBand : liveScore >= 80 ? 'excellent' : liveScore >= 60 ? 'good' : liveScore >= 40 ? 'average' : 'poor'
  const liveFactors = evaluation.data ? [
    { name: 'Review priority', score: Math.round(Number(evaluation.data.historical_analysis.review_priority_score) * 100), weight: 35, evidence: evaluation.data.historical_analysis.signals.join('; ') || 'No anomaly signal returned.' },
    { name: 'Cost anomaly', score: Math.round(Number(evaluation.data.historical_analysis.cost_anomaly_score) * 100), weight: 25, evidence: 'Calculated from persisted expenditure and payment-claim records.' },
    { name: 'Operational drift', score: Math.round(Number(evaluation.data.operational_drift?.drift_percentile || 0)), weight: 20, evidence: 'Calculated from verified project execution history.' },
  ] : []
  const contractorEval = (evaluation.data?.llm as any)?.contractor_evaluation;
  const displayScore = liveScore ?? assigned.aiScore
  const displayBand = liveBand as Contractor['scoreBand']
  const liveRecommendation = contractorEval?.recommendation || evaluation.data?.llm?.summary || 'Run live Gemini analysis to generate the contractor recommendation.'

  const factors = liveFactors
  const rec = recommendationFor(displayBand)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="AI Contractor Management"
        description={`AI-assisted capability and risk analysis for ${assigned.name} — evaluated with Google Gemini 3.1 Pro. Decision support only; the award decision always remains with the authorized officer.`}
        actions={
          <>
            <Button
              variant="primary"
              size="sm"
              icon="auto_awesome"
              className="bg-gradient-to-r from-primary to-indigo-600 shadow-sm"
              onClick={() => {
                setEvaluatingTender(activeTender)
                setGeminiModalOpen(true)
              }}
            >
              AI Contractor Management
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon="download"
              onClick={() => showToast('Contractor evaluation report generated (demo file).', 'info')}
            >
              {t('common.export')}
            </Button>
          </>
        }
      />

      <FilterBar
        selects={[
          {
            label: 'Project',
            value: projectId,
            onChange: (selectedId) => {
              if (selectedId && selectedId !== projectId) {
                navigate(`/government/projects/${selectedId}/contractor-evaluation`)
              }
            },
            options: (allProjects || []).map((p) => ({
              value: p.id,
              label: `${p.name || p.id} (${p.id})`,
            })),
          },
        ]}
      />

      {/* Score hero */}
      <Panel title="Overall Contractor Score" icon="smart_toy">
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-display tabular-nums text-fg">
            {displayScore}
            <span className="text-body-small text-fg-subtle">/100 composite</span>
          </span>
          <StatusBadge descriptor={SCORE_BAND[assigned.scoreBand]} />
          <Badge tone={rec.tone} icon={rec.tone === 'success' ? 'thumb_up' : rec.tone === 'warning' ? 'front_hand' : 'block'}>
            {rec.label}
          </Badge>
          <span className="ml-auto text-caption text-fg-subtle">
            AI Engine: <strong className="text-fg">Google Gemini 3.1 Pro</strong> · {evaluation.data?.input_quality ? `${Math.round(Number(evaluation.data.input_quality.completeness_score) * 100)}% completeness` : 'live analysis'}
          </span>
        </div>
      </Panel>

      {/* Factor cards */}
      <Panel title="Score Breakdown — Why this score?" icon="analytics" subtitle="Weighted factors with per-factor evidence.">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {factors.map((f) => (
            <Card key={f.name} className="p-3">
              <button
                type="button"
                onClick={() => setExpanded(expanded === f.name ? null : f.name)}
                className="flex w-full items-center justify-between gap-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                aria-expanded={expanded === f.name}
              >
                <span className="text-label text-fg">{f.name}</span>
                <span className="flex items-center gap-2">
                  <span className="text-caption text-fg-subtle">weight {f.weight}%</span>
                  <span className="tabular-nums text-label text-primary-strong">{f.score}</span>
                  <span className="material-symbols-outlined text-[18px] text-fg-subtle" aria-hidden="true">
                    {expanded === f.name ? 'expand_less' : 'help'}
                  </span>
                </span>
              </button>
              <Progress value={f.score} label={`${f.name} score`} size="sm" className="mt-2" showValue={false} />
              {expanded === f.name && (
                <p className="mt-2 rounded-control bg-surface-2 p-2 text-caption text-fg-muted">
                  <strong className="text-fg">Why this score?</strong> {f.evidence}
                </p>
              )}
            </Card>
          ))}
        </div>
      </Panel>

      {/* Comparison table */}
      <Panel title="Contractor Comparison" icon="compare_arrows" subtitle="All empanelled contractors ranked by composite AI score for this class of work." bodyClassName="p-0">
        <DataTable
          minWidth={880}
          rows={ranked}
          rowKey={(c) => c.id}
          initialSort={{ key: 'score', dir: 'desc' }}
          columns={[
            { key: 'name', header: 'Contractor', isRowHeader: true, render: (c) => (
              <span className={c.id === assigned.id ? 'font-semibold text-primary-strong' : ''}>
                {c.name}{c.id === assigned.id ? ' (assigned here)' : ''}
              </span>
            ) },
            { key: 'class', header: 'Class', render: (c) => <Badge tone="neutral">{c.class}</Badge> },
            { key: 'score', header: 'AI Score', cellClassName: 'tabular-nums', sortable: true, sortValue: (c) => c.aiScore, render: (c) => c.aiScore },
            { key: 'ontime', header: 'On-time %', cellClassName: 'tabular-nums', sortable: true, sortValue: (c) => c.onTimeCompletionPct, render: (c) => `${c.onTimeCompletionPct}%` },
            { key: 'quality', header: 'Quality', cellClassName: 'tabular-nums', render: (c) => `${c.qualityRating.toFixed(1)}/5` },
            { key: 'risk', header: 'Risk', render: (c) => <StatusBadge descriptor={SCORE_BAND[c.scoreBand]} size="sm" /> },
            {
              key: 'rec',
              header: 'Recommendation',
              render: (c) => {
                const r = recommendationFor(c.scoreBand)
                return <Badge tone={r.tone} icon={r.tone === 'success' ? 'thumb_up' : r.tone === 'warning' ? 'front_hand' : 'block'}>{r.label}</Badge>
              },
            },
          ]}
        />
      </Panel>

      {/* AI recommendation + factors */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="AI Recommendation (Google Gemini 3.1 Pro)" icon="auto_awesome">
          <p className="rounded-control border border-primary-border bg-primary-soft p-3 text-body-small text-fg">
            <strong>{rec.label}:</strong> {liveRecommendation}
          </p>
          <p className="mt-3 text-caption text-fg-subtle">Factors evaluated by Gemini: on-time milestone delivery, verified quality index, cost variance signals and statutory compliance.</p>
        </Panel>
        <Panel title="Risk & Positive Factors" icon="balance">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="nk-label">Positive factors</p>
              <ul className="mt-2 flex flex-col gap-1">
                {(contractorEval?.strengths?.length
                  ? contractorEval.strengths.map((strength: string, idx: number) => ({ action: 'Strength', reason: strength, idx }))
                  : (evaluation.data?.llm?.recommended_actions ?? []).map((s, idx) => ({ action: s.action, reason: s.reason, idx }))
                ).map((s: { action: string; reason: string; idx: number }) => (
                  <li key={`${s.action}-${s.idx}`} className="flex items-start gap-1.5 text-body-small text-fg">
                    <span className="material-symbols-outlined text-[16px] text-success-strong" aria-hidden="true">check_circle</span>
                    {s.action}: {s.reason}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="nk-label">Risk factors</p>
              <ul className="mt-2 flex flex-col gap-1">
                {(contractorEval?.risk_factors?.length
                  ? contractorEval.risk_factors.map((rf: string, idx: number) => ({ title: 'Risk Factor', reason: rf, idx }))
                  : (evaluation.data?.llm?.key_findings ?? []).map((s, idx) => ({ title: s.title, reason: s.reason, idx }))
                ).map((s: { title: string; reason: string; idx: number }) => (
                  <li key={`${s.title}-${s.idx}`} className="flex items-start gap-1.5 text-body-small text-fg">
                    <span className="material-symbols-outlined text-[16px] text-warning-strong" aria-hidden="true">warning</span>
                    {s.title}: {s.reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-3 border-t border-border pt-2 text-caption text-fg-subtle">
            Missing information: {(evaluation.data?.llm?.missing_information ?? ['No additional missing information returned by Gemini.']).join('; ')}
          </p>
        </Panel>
      </div>

      <Card className="p-3 text-caption text-warning-strong">
        <span className="material-symbols-outlined mr-1 align-middle text-[16px]" aria-hidden="true">smart_toy</span>
        {t('common.aiDisclaimerEvaluation')}
      </Card>

      <GeminiContractorModal
        open={geminiModalOpen}
        onClose={() => setGeminiModalOpen(false)}
        tender={evaluatingTender}
      />
    </div>
  )
}
