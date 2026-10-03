import { useI18n } from '@/context/I18nContext'
import { Panel, Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'
import { formatDate } from '@/utils/format'
import { AI_CONFIDENCE, AI_CLASSIFICATION } from '@/utils/status'
import { insightsApi } from '@/api'
import { useApiData } from '@/hooks/useApiData'

/**
 * AiInsightsPage — AI-Assisted Insights. Every card shows Insight, Supporting
 * Data, Confidence, Recommended Action, and a classification chip that
 * separates AI-generated insight from verified data / officer decision.
 * AI never acts: the disclaimer is rendered verbatim.
 */
export function AiInsightsPage() {
  const { t } = useI18n()
  const { data: insights, loading } = useApiData(() => insightsApi.all(), [])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-heading-1 text-fg">{t('nav.aiInsights')}</h1>
        <p className="mt-1 text-body-small text-fg-muted">
          Pattern detection over project data. Every item states its evidence and confidence — the decision stays with the officer.
        </p>
      </div>

      <p className="flex items-center gap-2 rounded-control border border-warning-border bg-warning-tint p-3 text-caption text-warning-strong">
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">smart_toy</span>
        {t('common.aiDisclaimerInsight')}
      </p>

      {loading ? <div className="p-8 text-center text-body-small text-fg-muted">{t('common.loading')}</div> : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {(insights ?? []).map((i) => (
          <Card key={i.id} className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge descriptor={AI_CLASSIFICATION[i.classification]} size="sm" />
              <StatusBadge descriptor={AI_CONFIDENCE[i.confidenceBand]} size="sm" />
              <Badge tone="neutral" icon="percent">{i.confidencePct}%</Badge>
              <Badge tone="neutral" icon="tag">{i.area}</Badge>
              <span className="ml-auto text-caption text-fg-subtle">{formatDate(i.generatedOn)}</span>
            </div>
            <p className="nk-mono-id text-fg-muted">{i.id}</p>
            <h2 className="text-heading-3 text-fg">{i.title}</h2>

            <div>
              <p className="nk-label">Insight</p>
              <p className="mt-1 text-body-small text-fg">{i.insight}</p>
            </div>

            <div>
              <p className="nk-label">Supporting Data</p>
              <p className="mt-1 rounded-control bg-surface-2 p-2.5 text-body-small text-fg-muted">{i.supportingData}</p>
            </div>

            <div>
              <p className="nk-label">Recommended Action</p>
              <p className="mt-1 text-body-small text-fg">
                <span className="material-symbols-outlined mr-1 align-middle text-[16px] text-primary" aria-hidden="true">arrow_circle_right</span>
                {i.recommendedAction}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <span className="text-caption text-fg-subtle">Related:</span>
              {i.relatedProjectIds.map((pid) => (
                <Link key={pid} to={`/government/projects/${encodeURIComponent(pid)}`} className="nk-mono-id text-caption text-primary-strong hover:underline">
                  {pid}
                </Link>
              ))}
              <Button variant="outline" size="sm" className="ml-auto" onClick={() => undefined}>
                Mark reviewed (officer action)
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Panel title="How AI is used in NIRIKSHAK" icon="info">
        <ul className="ml-4 list-disc space-y-1 text-body-small text-fg-muted">
          <li>AI surfaces patterns (delays, quality flags, fund anomalies) as <strong className="text-fg">advisory insight</strong> with supporting data.</li>
          <li>Verified inspection and financial records are labelled <strong className="text-fg">Verified Data</strong>, distinct from AI output.</li>
          <li>All approvals, awards and sanctions remain <strong className="text-fg">Officer Decisions</strong> recorded in the audit trail.</li>
        </ul>
      </Panel>
    </div>
  )
}
