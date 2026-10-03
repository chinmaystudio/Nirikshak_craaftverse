/**
 * Contractor AI Analysis Service.
 * Requests authorized AI assessment for contractor-assigned projects via Express gateway.
 * Never calls Python AI microservice directly.
 */
import { apiClient } from '@/lib/api/apiClient';

export interface ContractorAiAnalysis {
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
    }>;
    recommended_actions?: Array<{
      action: string;
      reason: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH';
      responsible_party: 'GOVERNMENT' | 'CONTRACTOR' | 'BOTH';
    }>;
    contractor_followups?: string[];
    limitations?: string[];
  };
  decision_guardrail: string;
}

export const contractorAiService = {
  /**
   * Request AI analysis for an assigned project.
   * Backend verifies caller's contractor organization assignment.
   */
  async analyzeAssignedProject(projectId: string): Promise<ContractorAiAnalysis> {
    return apiClient.post<ContractorAiAnalysis>(`/api/ai/analyze/${encodeURIComponent(projectId)}`);
  },
};
