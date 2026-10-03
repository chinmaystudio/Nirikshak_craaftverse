/**
 * HTTP client for communicating with the Python NIRIKSHAK AI Intelligence Service.
 * Manages shared secret authentication, timeouts, and error handling.
 */
import { env } from '../../core/config/env.js';
import { ServiceUnavailableError, BadRequestError } from '../../core/http/errors.js';

export interface AiClientAnalysisResult {
  analysis_id: string;
  model_version: string;
  versions?: {
    service: string;
    historical_model: string;
    online_model: string;
    rl_policy: string;
    llm_model: string;
  };
  input_quality?: {
    available_fields: number;
    missing_fields: string[];
    imputed_historical_fields: string[];
    completeness_score: number;
  };
  project_id: string | null;
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
    raw_drift_distance?: number;
    drift_percentile?: number;
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
  provenance: Record<string, any>;
  decision_guardrail: string;
}

export class AiServiceClient {
  private baseUrl: string;
  private sharedSecret: string;
  private timeoutMs: number;

  constructor() {
    this.baseUrl = env.AI_SERVICE_URL.replace(/\/$/, '');
    this.sharedSecret = env.AI_SERVICE_SHARED_SECRET;
    this.timeoutMs = env.AI_SERVICE_TIMEOUT_MS;
  }

  private async fetchWithTimeout(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Nirikshak-AI-Key': this.sharedSecret,
      ...(options.headers as Record<string, string>),
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });
      return response;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new ServiceUnavailableError(`AI Intelligence Service timed out after ${this.timeoutMs}ms.`);
      }
      throw new ServiceUnavailableError(`AI Intelligence Service is temporarily unavailable: ${err.message || 'Connection failed'}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async healthCheck(): Promise<{
    status: string;
    historical_model: string;
    online_model: string;
    rl_policy: string;
    openrouter: string;
    model_version: string;
  }> {
    try {
      const res = await this.fetchWithTimeout('/health', { method: 'GET' });
      if (!res.ok) {
        throw new Error(`Status ${res.status}`);
      }
      return await res.json();
    } catch (err: any) {
      return {
        status: 'unavailable',
        historical_model: 'UNAVAILABLE',
        online_model: 'UNAVAILABLE',
        rl_policy: 'UNAVAILABLE',
        openrouter: 'UNAVAILABLE',
        model_version: 'unknown',
      };
    }
  }

  async analyzeProject(
    snapshot: Record<string, any>,
    topK: number = 3,
    includeExplanation: boolean = true
  ): Promise<AiClientAnalysisResult> {
    const res = await this.fetchWithTimeout('/analyze', {
      method: 'POST',
      body: JSON.stringify({
        snapshot,
        top_k_actions: topK,
        include_explanation: includeExplanation,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new BadRequestError(`AI Analysis failed (${res.status}): ${errText || res.statusText}`);
    }

    return await res.json();
  }

  async learnVerifiedSnapshot(snapshot: Record<string, any>): Promise<{ learned: boolean; reason?: string }> {
    try {
      const res = await this.fetchWithTimeout('/learn/snapshot', {
        method: 'POST',
        body: JSON.stringify({
          snapshot,
          verified: true,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.warn(`[AI LEARN WARNING] Online model snapshot learning rejected: ${errText}`);
        return { learned: false, reason: errText };
      }

      return await res.json();
    } catch (err: any) {
      console.warn(`[AI LEARN WARNING] Could not reach AI service for online snapshot learning: ${err.message}`);
      return { learned: false, reason: err.message };
    }
  }

  async submitFeedback(payload: {
    analysis_id: string;
    action: string;
    government_feedback: 'accepted' | 'useful' | 'neutral' | 'rejected' | 'harmful';
    note?: string;
  }): Promise<{ stored: boolean; policy_updated: boolean; analysis_id: string; action: string; already_recorded?: boolean }> {
    const res = await this.fetchWithTimeout('/feedback', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new BadRequestError(`Feedback submission failed (${res.status}): ${errText}`);
    }

    return await res.json();
  }

  async learnOutcome(payload: {
    analysis_id: string;
    action: string;
    current_snapshot: Record<string, any>;
    government_feedback?: string;
    current_snapshot_verified: boolean;
  }): Promise<{ updated: boolean; analysis_id?: string; action: string; reward?: number; reward_components?: Record<string, number>; already_recorded?: boolean; policy_updates?: number }> {
    const res = await this.fetchWithTimeout('/learn/outcome', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new BadRequestError(`Outcome learning failed (${res.status}): ${errText}`);
    }

    return await res.json();
  }
}

export const aiClient = new AiServiceClient();
