import { useMemo, useState } from 'react'
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
import { PageHeader } from '@/components/blocks/Page'
import { useApiData } from '@/hooks/useApiData'
import { insightsApi } from '@/api'
import { CONTRACTORS } from '@/data/modules'
import { SCORE_BAND } from '@/utils/status'
import type { Contractor } from '@/types'

/** Risk stance derived from the AI score band — assists, never decides. */
function recommendationFor(band: Contractor['scoreBand']): { label: string; tone: 'success' | 'warning' | 'danger' } {
  if (band === 'excellent' || band === 'good') return { label: 'Recommended', tone: 'success' }
  if (band === 'average') return { label: 'Conditional', tone: 'warning' }
  return { label: 'Not Recommended', tone: 'danger' }
}

/** Project workspace — AI Contractor Evaluation: score system, comparison and
 * recommendation rationale. AI assists; the officer's award decision is final. */
export function WorkspaceContractorEvalPage() {
  const { t } = useI18n()
  const { showToast } = useToast()
  const { project } = useProjectWorkspace()
  const [expanded, setExpanded] = useState<string | null>(null)

  const assigned = CONTRACTORS.find((c) => c.name === project?.contractor)
  const evaluation = useApiData(
    () => (assigned ? insightsApi.evaluateContractor(assigned.id) : Promise.resolve(undefined)),
    [assigned?.id],
  )
  const ranked = useMemo(() => [...CONTRACTORS].sort((a, b) => b.aiScore - a.aiScore), [])

  if (!project) return null
  if (assigned && evaluation.loading) return <LoadingBlock />

  if (!assigned) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader
          title="AI Contractor Evaluation"
          description="AI decision-support for contractor capability and risk. Evaluation becomes available after tender award."
        />
        <Panel title="No contractor appointed yet" icon="person_search">
          <p className="text-body-small text-fg-muted">
            This project is at the pre-tender stage. Once a tender is awarded and the work order is issued, the AI
            evaluation runs against the awarded contractor's record.
          </p>
          <p className="mt-2 text-caption text-fg-subtle">{t('common.mockDataNote')}</p>
        </Panel>
      </div>
    )
  }

  const factors = evaluation.data?.factors ?? []
  const rec = recommendationFor(assigned.scoreBand)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="AI Contractor Evaluation"
        description={`AI-assisted capability and risk analysis for ${assigned.name} — the contractor executing this project. Decision support only; the award decision always remains with the authorized officer.`}
        actions={
          <Button
            variant="outline"
            size="sm"
            icon="download"
            onClick={() => showToast('Contractor evaluation report generated (demo file).', 'info')}
          >
            {t('common.export')}
          </Button>
        }
      />

      {/* Score hero */}
      <Panel title="Overall Contractor Score" icon="smart_toy">
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-display tabular-nums text-fg">
            {assigned.aiScore}
            <span className="text-body-small text-fg-subtle">/100 composite</span>
          </span>
          <StatusBadge descriptor={SCORE_BAND[assigned.scoreBand]} />
          <Badge tone={rec.tone} icon={rec.tone === 'success' ? 'thumb_up' : rec.tone === 'warning' ? 'front_hand' : 'block'}>
            {rec.label}
          </Badge>
          <span className="ml-auto text-caption text-fg-subtle">
            AI confidence: <strong className="text-fg">{evaluation.data ? '74% (medium)' : '—'}</strong> · evaluated {evaluation.data ? 'this session' : '—'}
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
        <Panel title="AI Recommendation" icon="auto_awesome">
          <p className="rounded-control border border-primary-border bg-primary-soft p-3 text-body-small text-fg">
            <strong>{rec.label}:</strong> {assigned.name} scores {assigned.aiScore}/100 with a {assigned.onTimeCompletionPct}% on-time
            completion record, {assigned.qualityRating.toFixed(1)}/5 quality rating across {assigned.completedProjects} completed
            government works, and {assigned.litigationCount === 0 ? 'no active litigation' : `${assigned.litigationCount} active litigation case(s)`}.
          </p>
          <p className="mt-3 text-caption text-fg-subtle">Factors supporting this recommendation: on-time completion (20%), quality (18%), defect liability (12%) and litigation exposure (12%) carry the largest weights.</p>
        </Panel>
        <Panel title="Risk & Positive Factors" icon="balance">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="nk-label">Positive factors</p>
              <ul className="mt-2 flex flex-col gap-1">
                {assigned.strengths.map((s) => (
                  <li key={s} className="flex items-start gap-1.5 text-body-small text-fg">
                    <span className="material-symbols-outlined text-[16px] text-success-strong" aria-hidden="true">check_circle</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="nk-label">Risk factors</p>
              <ul className="mt-2 flex flex-col gap-1">
                {assigned.risks.map((s) => (
                  <li key={s} className="flex items-start gap-1.5 text-body-small text-fg">
                    <span className="material-symbols-outlined text-[16px] text-warning-strong" aria-hidden="true">warning</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-3 border-t border-border pt-2 text-caption text-fg-subtle">
            Missing information: audited turnover for FY 2025-26 (filed with the next renewal) and safety statistics for
            subcontracted crews.
          </p>
        </Panel>
      </div>

      <Card className="p-3 text-caption text-warning-strong">
        <span className="material-symbols-outlined mr-1 align-middle text-[16px]" aria-hidden="true">smart_toy</span>
        {t('common.aiDisclaimerEvaluation')}
      </Card>
    </div>
  )
}
