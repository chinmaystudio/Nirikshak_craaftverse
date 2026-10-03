/**
 * Government AI Intelligence Service.
 * Interfaces with the Express backend AI gateway (/api/ai).
 * Never directly calls the Python AI service.
 */
import { apiClient } from '@/lib/api/apiClient';
import { supabase } from '@/lib/supabase/client';
import type { AiInsight } from '@/modules/government/types';

export interface AiAnalysisResult {
  analysis_id: string;
  project_id: string;
  model_version: string;
  historical_analysis: {
    archetype_cluster: number;
    structural_anomaly_score: number;
    neighborhood_anomaly_score: number;
    cluster_distance_score: number;
    cost_anomaly_score: number;
    review_priority_score: number;
    review_band: string;
    signals: string[];
    limitations: string[];
  };
  operational_drift: {
    available: boolean;
    live_cluster?: number;
    drift_percentile?: number;
    raw_drift_distance?: number;
  };
  recommended_actions: Array<{
    action: string;
    score: number;
    learned_mean_reward: number;
    uncertainty_bonus: number;
    reason?: string;
  }>;
  llm: {
    status: 'READY' | 'DISABLED' | 'UNAVAILABLE' | 'ERROR';
    provider?: string;
    model?: string;
    summary?: string;
    key_findings?: Array<{
      title: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
      reason: string;
      evidence_keys?: string[];
    }>;
    recommended_actions?: Array<{
      action: string;
      reason: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH';
      responsible_party: 'GOVERNMENT' | 'CONTRACTOR' | 'BOTH';
    }>;
    missing_information?: string[];
    government_review_notes?: string[];
    contractor_followups?: string[];
    limitations?: string[];
  };
  saved_insight_id?: string;
  decision_guardrail: string;
}

export const aiService = {
  /**
   * Request multi-tier AI analysis for an authorized project.
   */
  async analyzeProject(projectId: string): Promise<AiAnalysisResult> {
    return apiClient.post<AiAnalysisResult>(`/api/ai/analyze/${encodeURIComponent(projectId)}`);
  },

  /**
   * Submit Government official feedback on recommendation efficacy.
   */
  async submitFeedback(payload: {
    analysis_id: string;
    government_feedback: 'accepted' | 'useful' | 'neutral' | 'rejected' | 'harmful';
    note?: string;
  }): Promise<{ updated: boolean; action: string; reward: number }> {
    return apiClient.post<{ updated: boolean; action: string; reward: number }>('/api/ai/feedback', payload);
  },

  /**
   * List historical persisted AI insights from Supabase.
   */
  async all(): Promise<AiInsight[]> {
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id,
          area:
            item.insight_type === 'schedule_risk'
              ? 'Schedule & Delay Prediction'
              : item.insight_type === 'complaint_cluster'
              ? 'Public Grievance Correlation'
              : 'Cost & Material Anomaly',
          title: item.title,
          insight: item.summary,
          supportingData: Array.isArray(item.evidence) ? item.evidence.join('; ') : item.evidence || '',
          confidencePct: Math.round((Number(item.confidence) || 0.85) * 100),
          confidenceBand:
            Number(item.confidence) >= 0.85 ? 'high' : Number(item.confidence) >= 0.65 ? 'medium' : ('low' as any),
          recommendedAction: Array.isArray(item.recommended_actions)
            ? item.recommended_actions.join('; ')
            : item.recommended_actions || '',
          relatedProjectIds: item.project_id ? [item.project_id] : [],
          generatedOn: (item.created_at || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
          classification: 'ai_insight' as const,
        }));
      }
    } catch (err) {
      console.warn('Error fetching AI insights from Supabase:', err);
    }
    return [];
  },

  async evaluateContractor(_id: string): Promise<undefined> {
    return undefined;
  },
};

export const governmentAiService = aiService;
