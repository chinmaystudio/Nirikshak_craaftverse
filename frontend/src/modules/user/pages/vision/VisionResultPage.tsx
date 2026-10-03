import { Icon } from "@/components/common/Icon";
import { PageHeader } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { VisionResultView } from "@/components/vision/VisionResultView";
import { useNavigate, useLocation, getRouteId } from "@/app/router";
import { useInfrastructureVision } from "@/hooks/useInfrastructureVision";
import { toast } from "@/hooks/useToast";
import { latestResult } from "@/services/vision/visionService";
import { queueVisionReportPrefill } from "@/features/infrastructure-vision/visionFlow";
import { ROUTES } from "@/constants/routes";

export function VisionResultPage(): JSX.Element {
  const navigate = useNavigate();
  const { query } = useLocation();
  const routeId = getRouteId();
  const id = routeId === "result" ? "" : routeId;
  const continueToReport = query.continue === "report";
  const { getResult, submitInfo } = useInfrastructureVision();
  const result = id ? getResult(id) : latestResult();

  if (!result) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <PageHeader title="Infrastructure Result" back onBack={() => navigate(ROUTES.VISION)} />
        <div className="mt-5">
          <EmptyState
            icon="photo_camera"
            title="No analysis yet"
            text="Take or upload a photo of public infrastructure and NIRIKSHAK Vision will assist with identification."
            ctaLabel="Identify Infrastructure"
            ctaRoute={ROUTES.VISION}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button onClick={() => navigate(ROUTES.VISION)} className="inline-flex items-center gap-1.5 text-primary font-label-md font-bold hover:text-secondary">
        <Icon name="arrow_back" className="text-[20px]" /> Back to Identify
      </button>
      <VisionResultView
        result={result}
        continueToReport={continueToReport}
        onReport={() => {
          queueVisionReportPrefill(result);
          navigate(ROUTES.REPORT);
        }}
        onInfoSubmit={() => {
          submitInfo(result.id);
          toast("Thank you — this observation was recorded to improve NIRIKSHAK's coverage.", "success");
        }}
        onAnalyzeAnother={() => navigate(ROUTES.VISION)}
      />
    </div>
  );
}
