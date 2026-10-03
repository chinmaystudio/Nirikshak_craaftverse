import { Icon } from "@/components/common/Icon";
import { ProgressBar } from "@/components/common/ProgressBar";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { AiBadge, InfrastructureDetails, RelatedProjectBlock, AuthorityBlock } from "./InfrastructureDetails";
import { formatDate } from "@/utils/formatDate";
import { ROUTES, projectRoute } from "@/constants/routes";
import type { VisionAnalysis } from "@/types/infrastructure";

interface VisionResultViewProps {
  result: VisionAnalysis;
  continueToReport: boolean;
  onReport: () => void;
  onInfoSubmit: () => void;
  onAnalyzeAnother: () => void;
}

export function VisionResultView({ result, continueToReport, onReport, onInfoSubmit, onAnalyzeAnother }: VisionResultViewProps): JSX.Element {
  const problematic = result.condition.label !== "Good";
  return (
    <div className="space-y-5" data-vision-result={result.id}>
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-5 relative min-h-[220px] bg-surface-container">
            {result.thumb ? (
              <img className="absolute inset-0 w-full h-full object-cover" alt="Analyzed infrastructure photo" src={result.thumb} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon name="image" className="text-[56px] text-outline" />
              </div>
            )}
            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-primary/85 text-on-primary text-label-sm font-semibold">
              {result.imageSource === "camera" ? "Camera capture" : "Uploaded photo"}
            </span>
          </div>
          <div className="md:col-span-7 p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-outline">Infrastructure Identified</span>
              <AiBadge />
            </div>
            <h2 className="text-[24px] leading-tight font-bold text-primary uppercase">{result.infrastructureLabel}</h2>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-label-sm mb-1">
                  <span className="text-on-surface-variant">Confidence</span>
                  <span className="font-bold text-primary tabular-nums">{result.confidence}%</span>
                </div>
                <ProgressBar pct={result.confidence} toneClass="bg-info" />
              </div>
            </div>
            <p className="text-body-sm text-on-surface-variant leading-relaxed">{result.description}</p>
            <div className="text-label-sm text-outline font-mono">
              {result.id} • {formatDate(result.analyzedAt, true)}
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-2">
        <h3 className="text-headline-sm font-bold text-primary flex items-center gap-2">
          <AiBadge /> <span className="ml-1">What is this?</span>
        </h3>
        <p className="text-body-md text-on-surface leading-relaxed">{result.description}</p>
      </section>

      <InfrastructureDetails result={result} />
      <RelatedProjectBlock result={result} />
      <AuthorityBlock result={result} />

      <details className="bg-surface-container-low rounded-lg border border-outline-variant/40">
        <summary className="px-4 py-2.5 cursor-pointer text-label-md font-bold text-primary flex items-center gap-1.5 select-none">
          <Icon name="info" className="text-[17px] text-outline" /> About this result
        </summary>
        <p className="px-4 pb-3 text-label-sm text-on-surface-variant leading-relaxed">
          This result is AI-assisted and may not be accurate in all situations. Government project and authority information is shown from
          registered records where available. Visual condition observations should not be treated as a structural safety certification.
        </p>
      </details>

      <section className="space-y-3">
        {problematic ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-2">
            <span className="text-body-sm font-semibold text-error flex items-center gap-1.5">
              <Icon name="report_problem" className="text-[18px]" /> Something looks wrong with this infrastructure?
            </span>
            <Button variant="accent" size="sm" icon="report" onClick={onReport}>
              Report an Issue
            </Button>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          {result.relatedProject ? (
            <Button icon="open_in_new" onClick={() => window.location.assign(projectRoute(result.relatedProject?.projectId ?? ""))}>
              View Project
            </Button>
          ) : null}
          <Button variant="accent" icon="report" onClick={onReport}>
            Report an Issue
          </Button>
          {result.infoSubmitted ? (
            <span className="inline-flex items-center justify-center gap-1.5 rounded border border-outline-variant bg-surface-container-low text-on-surface-variant px-4 py-2 text-label-md font-bold opacity-70">
              <Icon name="task_alt" className="text-[18px]" /> Info Submitted ✓
            </span>
          ) : (
            <Button variant="soft" icon="upload_file" onClick={onInfoSubmit}>
              Submit Infrastructure Information
            </Button>
          )}
          <Button variant="soft" icon="photo_camera" onClick={onAnalyzeAnother}>
            Analyze Another Photo
          </Button>
          {continueToReport ? (
            <Button variant="success" icon="arrow_forward" onClick={onReport}>
              Continue to Report
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export function VisionHistoryList({
  history,
  onOpen
}: {
  history: VisionAnalysis[];
  onOpen: (id: string) => void;
}): JSX.Element {
  if (history.length === 0) {
    return (
      <EmptyState
        icon="photo_camera"
        title="No infrastructure checks yet"
        text="Photos you analyze with NIRIKSHAK Vision will appear here so you can reopen results anytime."
        ctaLabel="Identify Infrastructure"
        ctaRoute={ROUTES.VISION}
      />
    );
  }
  return (
    <div className="space-y-3">
      {history.map((r) => {
        const attention = r.condition.label !== "Good";
        return (
          <button
            key={r.id}
            onClick={() => onOpen(r.id)}
            className="w-full text-left bg-surface-container-lowest p-3.5 rounded-lg border border-outline-variant/50 hover:border-primary/40 transition-all flex items-center gap-3.5"
          >
            <div className="w-16 h-16 rounded-lg overflow-hidden border border-outline-variant/40 flex-shrink-0 bg-surface-container">
              {r.thumb ? (
                <img className="w-full h-full object-cover" alt={r.shortLabel} src={r.thumb} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon name="image" className="text-[22px] text-outline" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-mono text-outline">
                {formatDate(r.analyzedAt)} • {r.id}
              </div>
              <div className="text-body-md font-semibold text-primary truncate">{r.shortLabel}</div>
              <div className="text-label-sm mt-0.5">
                {r.relatedProject ? (
                  <span className="text-green-700 font-semibold flex items-center gap-1">
                    <Icon name="link" className="text-[13px]" /> Matched Project:{" "}
                    {`#${r.relatedProject.projectId.slice(0, 3).toUpperCase()}`}
                  </span>
                ) : (
                  <span className="text-outline">No project matched</span>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <span
                className={`px-2 py-0.5 rounded-full text-label-sm font-bold border ${
                  attention ? "bg-amber-50 text-amber-900 border-amber-300" : "bg-green-50 text-green-800 border-green-300"
                }`}
              >
                {r.condition.label}
              </span>
              <div className="text-label-sm text-outline mt-1">{r.confidence}%</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
