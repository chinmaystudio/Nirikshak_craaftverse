import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { projectRoute } from "@/constants/routes";
import { findProject } from "@/services/projects/projectsService";
import type { ReportAIResult } from "@/types/report";

const STEPS = [
  "Reading report text and evidence metadata",
  "Classifying issue type and severity",
  "Matching against the project registry",
  "Checking duplicate reports nearby"
];

interface AIVerificationProps {
  stepIndex: number;
  running: boolean;
  result: ReportAIResult | null;
  onRun: () => void;
}

export function AIVerification({ stepIndex, running, result, onRun }: AIVerificationProps): JSX.Element {
  return (
    <div className="space-y-4" data-ai-verify>
      <div className="flex items-start gap-3 bg-surface-container-low p-4 rounded-lg border border-outline-variant/40">
        <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center flex-shrink-0">
          <Icon name="psychology" className="text-[22px]" />
        </span>
        <div>
          <div className="text-label-md font-bold text-primary">AI-Assisted Classification</div>
          <p className="text-body-sm text-on-surface-variant">
            Before submission, the system cross-checks your report against project records, similar complaints and location data. AI only{" "}
            <strong>assists verification</strong> — the final decision always rests with department officials.
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {STEPS.map((step, i) => {
          const done = result !== null || i < stepIndex;
          const active = result === null && i === stepIndex && running;
          return (
            <div key={step} className={`flex items-center gap-2 text-body-sm ${done ? "text-green-700" : active ? "text-primary font-semibold" : "text-outline"}`}>
              {done ? (
                <Icon name="check_circle" className="text-[18px] text-green-600" />
              ) : active ? (
                <span className="w-[18px] h-[18px] rounded-full border-2 border-secondary border-t-transparent animate-spin inline-block" />
              ) : (
                <Icon name="radio_button_unchecked" className="text-[18px]" />
              )}
              {step}
            </div>
          );
        })}
      </div>
      {result ? <AIResultCard result={result} /> : null}
      <Button icon={result ? "refresh" : "auto_awesome"} className="w-full" onClick={onRun} loading={running}>
        {result ? "Re-run Analysis" : "Run AI Analysis"}
      </Button>
    </div>
  );
}

function AIResultCard({ result }: { result: ReportAIResult }): JSX.Element {
  const sevTone = result.severity === "high" ? "text-red-300" : result.severity === "medium" ? "text-amber-300" : "text-green-300";
  const projectName = result.projectId ? findProject(result.projectId)?.name : undefined;
  return (
    <div className="bg-primary-container text-on-primary rounded-xl p-5 space-y-3.5">
      <div className="flex items-center gap-2">
        <span className="w-9 h-9 rounded-full bg-secondary text-on-secondary flex items-center justify-center">
          <Icon name="auto_awesome" className="text-[20px]" />
        </span>
        <div>
          <div className="text-headline-sm font-bold text-surface-container-lowest">AI ANALYSIS COMPLETE</div>
          <div className="text-label-sm text-surface-variant">Verification assistance • advisory only</div>
        </div>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-body-sm">
        <ResultCell label="Issue detected" value={result.detected} />
        <ResultCell label="Likely category" value={result.category} />
        <ResultCell label="Severity" value={result.severity} tone={sevTone} />
        <ResultCell label="Confidence" value={`${result.confidence}%`} />
        <ResultCell label="Recommended department" value={result.department} />
        <ResultCell label="Duplicate reports nearby" value={result.duplicates > 0 ? `${result.duplicates} similar report(s)` : "None found"} />
      </dl>
      {result.projectId && projectName ? (
        <div className="bg-surface-container-lowest/10 border border-surface-container-high/30 rounded-lg p-3 text-body-sm">
          <span className="text-secondary-fixed font-bold">Potential related project: </span>
          <a href={projectRoute(result.projectId)} className="underline font-semibold text-surface-container-lowest">
            {projectName}
          </a>{" "}
          — linking this report to the project file.
        </div>
      ) : null}
      <p className="text-[11px] leading-relaxed text-surface-variant border-t border-surface-container-high/20 pt-2.5">
        <Icon name="info" className="text-[14px] align-[-3px]" /> AI output assists routing and verification. It is not an official determination; a
        department officer makes the final decision under the citizen grievance framework.
      </p>
    </div>
  );
}

function ResultCell({ label, value, tone }: { label: string; value: string; tone?: string }): JSX.Element {
  return (
    <div className="bg-surface-container-lowest/10 rounded-lg px-3 py-2 border border-surface-container-high/20">
      <dt className="text-[11px] uppercase tracking-wider text-surface-variant font-bold">{label}</dt>
      <dd className={`font-semibold text-surface-container-lowest ${tone ?? ""}`}>{value}</dd>
    </div>
  );
}
