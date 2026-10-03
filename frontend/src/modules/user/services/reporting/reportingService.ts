import { latency, offlineGuard } from "@/services/api/client";
import { issueCategoryMeta } from "@/constants/issueCategories";
import type { ReportAIResult } from "@/types/report";
import type { IssueCategory } from "@/types/community";

export interface ReportAnalysisInput {
  categoryId: IssueCategory;
  title: string;
  priority: string;
  projectId: string | null;
}

const CATEGORY_PROJECT_HINTS: Partial<Record<IssueCategory, string>> = {
  pothole: "sinhgad-road",
  "road-damage": "sinhgad-road",
  "construction-quality": "katraj-kondhwa-road",
  "project-delay": "katraj-kondhwa-road",
  "work-stopped": "katraj-kondhwa-road",
  drainage: "kothrud-drainage",
  "water-leakage": "bhosari-water",
  "safety-hazard": "pune-metro-3",
  environmental: "pune-metro-3"
};

export async function analyzeReport(input: ReportAnalysisInput): Promise<ReportAIResult> {
  offlineGuard();
  await latency(1600, 2400);
  const cat = issueCategoryMeta(input.categoryId);
  const projectId = input.projectId ?? CATEGORY_PROJECT_HINTS[input.categoryId] ?? null;
  const detected = input.title.trim() !== "" ? input.title.trim() : `${cat.label} (from report text)`;
  const duplicates = ["pothole", "water-leakage", "safety-hazard"].includes(input.categoryId)
    ? 1 + Math.floor(Math.random() * 3)
    : 0;
  return {
    detected,
    severity: input.priority === "high" || input.priority === "critical" ? "high" : input.priority === "medium" ? "medium" : "low",
    category: cat.label,
    confidence: 86 + Math.floor(Math.random() * 9),
    department: cat.department,
    projectId,
    duplicates
  };
}
