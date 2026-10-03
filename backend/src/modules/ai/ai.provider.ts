/**
 * Compatibility wrapper for legacy LLMProvider callers.
 * Delegates execution to the canonical Python AI microservice via aiClient.
 */
import { aiClient } from './ai.client.js';
import { ProjectRiskAnalysis } from './ai.schemas.js';

export interface LLMProvider {
  readonly name: string;
  analyzeProject(prompt: string, context: Record<string, unknown>): Promise<ProjectRiskAnalysis>;
}

/**
 * Compatibility wrapper for legacy LLMProvider callers.
 * @deprecated Legacy-compatible adapter. The field `risk_score` is a legacy alias for `review_priority_score`
 * and represents an unsupervised anomaly review priority relative to the historical baseline; it is NOT
 * a probability of failure, delay, or fraud.
 * Modern callers should consume the canonical Express AI endpoints directly.
 */
export class PythonServiceLLMAdapter implements LLMProvider {
  readonly name = 'NIRIKSHAK AI (ML + OpenRouter)';

  async analyzeProject(_prompt: string, context: Record<string, unknown>): Promise<ProjectRiskAnalysis> {
    const res = await aiClient.analyzeProject(context, 3, true);
    const score = Math.round(res.historical_analysis.review_priority_score);
    const band = res.historical_analysis.review_band;

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (band === 'VERY_UNUSUAL' || score >= 90) riskLevel = 'CRITICAL';
    else if (band === 'UNUSUAL' || score >= 75) riskLevel = 'HIGH';
    else if (band === 'MODERATE' || score >= 50) riskLevel = 'MEDIUM';

    return {
      risk_score: score,
      risk_level: riskLevel,
      review_priority_score: score,
      review_priority_band: band,
      structural_anomaly_score: res.historical_analysis.structural_anomaly_score,
      cost_anomaly_score: res.historical_analysis.cost_anomaly_score,
      operational_drift: res.operational_drift,
      summary: res.llm?.summary || res.historical_analysis.signals.join('; '),
      schedule: {
        risk: res.operational_drift.available ? `Drift percentile ${res.operational_drift.drift_percentile}%` : 'Historical baseline review',
        reasons: res.historical_analysis.signals,
      },
      finance: {
        risk: `Cost Anomaly Score ${res.historical_analysis.cost_anomaly_score}/100`,
        reasons: res.historical_analysis.signals.filter((s) => s.toLowerCase().includes('cost')),
      },
      environment: {
        risk: 'Standard compliance check',
        reasons: [],
      },
      evidence: res.historical_analysis.signals,
      recommended_actions: res.recommended_actions.map((a) => a.action),
    };
  }
}

export function getLLMProvider(): LLMProvider {
  return new PythonServiceLLMAdapter();
}
