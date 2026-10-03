import { useRef, useState } from "react";
import { Icon } from "@/components/common/Icon";
import { PageHeader } from "@/components/common/StatCard";
import { Button } from "@/components/common/Button";
import { ErrorState } from "@/components/common/ErrorState";
import { VisionCamera, type CameraPhase } from "@/components/vision/VisionCamera";
import { VisionAnalysisPanel } from "@/components/vision/InfrastructureDetails";
import { useNavigate } from "@/app/router";
import { compressImage } from "@/utils/download";
import { saveResult } from "@/services/vision/visionService";
import { useInfrastructureVision } from "@/hooks/useInfrastructureVision";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/useToast";
import { validateImageFile, formatFileSize } from "@/utils/validation";
import { readFileAsDataUrl } from "@/utils/download";
import { findProject } from "@/services/projects/projectsService";
import { ROUTES } from "@/constants/routes";
import type { VisionImageSource } from "@/types/infrastructure";

export function IdentifyInfrastructurePage(): JSX.Element {
  const navigate = useNavigate();
  const auth = useAuth();
  const { analyze } = useInfrastructureVision();
  const query = new URLSearchParams(window.location.search);
  const preProject = query.get("project");
  const continueToReport = query.get("next") === "report";
  const preferred = preProject ? findProject(preProject) : null;

  const [phase, setPhase] = useState<CameraPhase>("idle");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  void fileRef;

  if (!auth.isLoggedIn) {
    return (
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title="Identify Infrastructure"
          sub="Take a photo of public infrastructure to understand what it is, who maintains it, and whether it is associated with a registered project."
        />
        <div className="mt-6">
          <ErrorState
            title="Sign in to use NIRIKSHAK Vision"
            message="Vision analyses are saved to your on-device infrastructure checks and need a citizen identity."
            onRetry={() => navigate(`${ROUTES.LOGIN}?next=${encodeURIComponent(`#/vision${preProject ? `?project=${preProject}` : ""}`)}`)}
          />
        </div>
      </div>
    );
  }

  const beginAnalysis = (dataUrl: string, source: VisionImageSource): void => {
    setAnalyzing(true);
    setAnalysisStep(0);
    setAnalyzeError(null);
    const ticker = window.setInterval(() => setAnalysisStep((s) => Math.min(s + 1, 3)), 750);
    void analyze({ thumb: null, source, preferredProjectId: preProject })
      .then((result) => {
        window.clearInterval(ticker);
        setAnalysisStep(4);
        void compressImage(dataUrl, 480, 0.6).then((thumb) => {
          saveResult({ ...result, thumb });
          navigate(`/vision/result/${result.id}`);
        });
      })
      .catch((e: Error) => {
        window.clearInterval(ticker);
        setAnalyzing(false);
        setAnalyzeError(e.message);
      });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader
        title="Identify Infrastructure"
        sub="Take a photo of public infrastructure to understand what it is, who maintains it, and whether it is associated with a registered project."
      />

      {analyzing ? (
        <VisionAnalysisPanel step={analysisStep} />
      ) : (
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm p-5 space-y-4">
          {preferred ? (
            <div className="bg-[#FEF9EE] border border-[#FDE68A] rounded-lg p-3 text-body-sm text-on-surface flex items-center gap-2">
              <Icon name="link" className="text-[18px] text-secondary" />
              <span>
                Analysis will prioritise matching to <strong className="text-primary">{preferred.name}</strong>.
              </span>
            </div>
          ) : null}
          <VisionCamera
            phase={phase}
            imageDataUrl={imageDataUrl}
            onPhaseChange={setPhase}
            onCapture={(dataUrl) => {
              setImageDataUrl(dataUrl);
              setPhase("preview");
            }}
            onPickFile={(file) => {
              const validation = validateImageFile(file);
              if (!validation.ok) {
                toast(validation.error ?? "File not accepted.", "error");
                return;
              }
              void readFileAsDataUrl(file).then((dataUrl) => {
                setImageDataUrl(dataUrl);
                setPhase("preview");
                toast(`Attached ${file.name} (${formatFileSize(file.size)}).`, "success");
              });
            }}
          />
          {phase === "preview" && imageDataUrl ? (
            <Button
              variant="accent"
              className="w-full"
              size="lg"
              icon="auto_awesome"
              onClick={() => beginAnalysis(imageDataUrl, "upload")}
            >
              Analyze Infrastructure
            </Button>
          ) : null}
          <div className="bg-surface-container-low rounded-lg p-3 text-label-sm text-on-surface-variant flex items-start gap-2">
            <Icon name="shield" className="text-[16px] text-primary flex-shrink-0" />
            <span>
              Photos are processed on-device in this demo and stay in <strong className="text-primary">My Infrastructure Checks</strong> unless you
              attach them to a report. Avoid capturing people or private property.
            </span>
          </div>
        </section>
      )}

      {analyzeError ? <ErrorState message={analyzeError} onRetry={() => setAnalyzeError(null)} /> : null}

      {!analyzing ? (
        <div className="flex items-center justify-between bg-surface-container-lowest rounded-xl border border-outline-variant/60 px-4 py-3">
          <span className="text-body-sm text-on-surface-variant flex items-center gap-2">
            <Icon name="history" className="text-[18px] text-primary" /> Previously analyzed infrastructure
          </span>
          <button onClick={() => navigate(ROUTES.VISION_HISTORY)} className="text-label-md font-bold text-secondary hover:underline">
            My Infrastructure Checks →
          </button>
        </div>
      ) : null}

      {continueToReport ? (
        <div className="bg-info-container border border-info/30 rounded-lg p-3 text-body-sm text-info flex items-center gap-2">
          <Icon name="arrow_forward" className="text-[18px]" /> After the analysis you can continue straight into the report with prefilled details.
        </div>
      ) : null}
    </div>
  );
}
