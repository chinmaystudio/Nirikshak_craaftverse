import { z } from 'zod';

export const ProjectRiskAnalysisSchema = z.object({
  risk_score: z.number().min(0).max(100),
  risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
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
