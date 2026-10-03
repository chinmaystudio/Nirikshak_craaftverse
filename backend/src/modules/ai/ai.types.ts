import { ProjectRiskAnalysis } from './ai.schemas.js';

export interface AiAuditResult {
  provider: string;
  analysis: ProjectRiskAnalysis;
  saved_insight: any;
}
