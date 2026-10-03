import { PageHeader } from "@/components/common/StatCard";
import { LoadingSkeleton } from "@/components/common/LoadingState";
import { Button } from "@/components/common/Button";
import { VisionHistoryList } from "@/components/vision/VisionResultView";
import { useNavigate } from "@/app/router";
import { useInfrastructureVision } from "@/hooks/useInfrastructureVision";
import { ROUTES } from "@/constants/routes";

export function VisionHistoryPage(): JSX.Element {
  const navigate = useNavigate();
  const { history } = useInfrastructureVision();

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader
        title="My Infrastructure Checks"
        sub="Photos you analyzed with NIRIKSHAK Vision — reopen any result to view details or report an issue."
        actions={
          <Button variant="accent" icon="photo_camera" onClick={() => navigate(ROUTES.VISION)}>
            Identify Infrastructure
          </Button>
        }
      />
      {history.length === 0 ? (
        <LoadingSkeleton kind="list" />
      ) : (
        <VisionHistoryList history={history} onOpen={(id) => navigate(`/vision/result/${id}`)} />
      )}
      <p className="text-label-sm text-outline text-center">
        History is stored on this device (last 12 checks). Attach a photo to a report to share it with the department.
      </p>
    </div>
  );
}
