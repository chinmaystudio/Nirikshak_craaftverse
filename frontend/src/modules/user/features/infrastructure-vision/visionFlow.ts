import { appStore } from "@/app/providers/store";
import type { VisionAnalysis } from "@/types/infrastructure";

export function queueVisionReportPrefill(result: VisionAnalysis): void {
  appStore.setState({
    visionPrefill: {
      imageThumb: result.thumb,
      analysisId: result.id,
      categoryId: result.reportCategory,
      projectId: result.relatedProject?.projectId ?? null,
      summary: `${result.infrastructureLabel} — ${result.condition.label}`
    },
    next: null
  });
}
