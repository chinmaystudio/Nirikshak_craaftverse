import { z } from 'zod';

export const CreateProjectSchema = z.object({
  nirikshak_project_id: z.string().min(3),
  project_name: z.string().min(3),
  description: z.string().optional(),
  sector: z.string().min(2),
  subsector: z.string().optional(),
  project_authority: z.string().min(2),
  state: z.string().default('Maharashtra'),
  city: z.string().default('Pune'),
  location_text: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  total_cost_inr_crore: z.number().positive().optional(),
  planned_start_date: z.string().optional(),
  original_completion_date: z.string().optional(),
  is_public: z.boolean().default(true),
});

export const CreateTenderSchema = z.object({
  project_id: z.string().min(3).max(120),
  title: z.string().trim().min(3).max(240),
  estimated_value_inr_crore: z.number().positive(),
  mode: z.enum(['e-Tender', 'Manually', 'Global']).default('e-Tender'),
  description: z.string().trim().max(2000).optional(),
});

export const SubmitProgressSchema = z.object({
  project_id: z.string().uuid(),
  milestone_id: z.string().uuid().optional(),
  contractor_organization_id: z.string().uuid().optional(), // Derived server-side from active membership (Rule 26)
  reported_progress: z.number().min(0).max(100),
  description: z.string().min(5),
  evidence: z.array(z.object({
    evidence_type: z.enum(['photo', 'video', 'report', 'sensor', 'drone']),
    storage_path: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    metadata: z.record(z.unknown()).optional(),
  })).optional(),
});

export const ReviewProgressSchema = z.object({
  progress_update_id: z.string().uuid(),
  decision: z.enum(['APPROVED', 'REJECTED', 'CLARIFICATION_REQUIRED']),
  verified_progress: z.number().min(0).max(100).nullable().optional(),
  review_notes: z.string().min(2),
});

export const CreateComplaintSchema = z.object({
  project_id: z.string().uuid(),
  category: z.string().min(2),
  title: z.string().min(5),
  description: z.string().min(10),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  user_id: z.string().uuid().optional(),
  evidence_paths: z.array(z.string()).optional(),
});

export const SubmitBidSchema = z.object({
  tender_id: z.string().uuid(),
  contractor_organization_id: z.string().uuid(),
  bid_amount: z.number().positive(),
  technical_score: z.number().min(0).max(100).optional(),
  financial_score: z.number().min(0).max(100).optional(),
});

export const RiskLevelEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'UNKNOWN']);

export const ContractorEvaluationSchema = z.object({
  contractor_name: z.string().optional(),
  performance_rating: z.enum(['LOW', 'MODERATE', 'HIGH', 'EXCELLENT']).default('MODERATE'),
  risk_band: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  strengths: z.array(z.string()).default([]),
  risk_factors: z.array(z.string()).default([]),
  compliance_notes: z.array(z.string()).default([]),
  recommendation: z.string().optional(),
});

export const ProjectRiskAnalysisSchema = z.object({
  risk_score: z.number().min(0).max(100).nullable().optional(),
  risk_level: RiskLevelEnum,
  summary: z.string(),
  schedule: z.object({
    risk: RiskLevelEnum,
    reasons: z.array(z.string()),
  }),
  finance: z.object({
    risk: RiskLevelEnum,
    reasons: z.array(z.string()),
  }),
  environment: z.object({
    risk: RiskLevelEnum,
    reasons: z.array(z.string()),
  }),
  evidence: z.array(z.string()),
  recommended_actions: z.array(z.string()),
  contractor_evaluation: ContractorEvaluationSchema.optional(),
});

export type ProjectRiskAnalysis = z.infer<typeof ProjectRiskAnalysisSchema>;

export const AssistantChatSchema = z.object({
  message: z.string().min(1).max(2000),
  context: z.record(z.unknown()).optional(),
});

