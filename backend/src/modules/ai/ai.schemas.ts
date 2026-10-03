import { z } from 'zod';

export const ProjectRiskAnalysisSchema = z.object({
  /** @deprecated Legacy-compatible naming for review-priority anomaly score; NOT failure or fraud probability */
  risk_score: z.number().min(0).max(100),
  /** @deprecated Legacy-compatible band naming */
  risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  review_priority_score: z.number().min(0).max(100).optional(),
  review_priority_band: z.string().optional(),
  structural_anomaly_score: z.number().optional(),
  cost_anomaly_score: z.number().optional(),
  operational_drift: z.record(z.any()).optional(),
  summary: z.string(),
  schedule: z.object({
    risk: z.string(),
    reasons: z.array(z.string()),
  }),
  finance: z.object({
    risk: z.string(),
    reasons: z.array(z.string()),
  }),
  environment: z.object({
    risk: z.string(),
    reasons: z.array(z.string()),
  }),
  evidence: z.array(z.string()),
  recommended_actions: z.array(z.string()),
});

export type ProjectRiskAnalysis = z.infer<typeof ProjectRiskAnalysisSchema>;
