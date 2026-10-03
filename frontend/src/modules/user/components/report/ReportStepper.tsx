import type { ReportDraft } from "@/types/report";

export const REPORT_STEPS: readonly string[] = ["Issue Type", "Describe", "Location", "Evidence", "AI Check", "Review", "Done"];

export function ReportStepper({ current }: { current: number }): JSX.Element {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1" aria-label="Reporting steps">
      {REPORT_STEPS.slice(0, 6).map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-1 flex-shrink-0">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${active ? "bg-primary text-on-primary" : done ? "text-green-700" : "text-outline"}`}>
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  active ? "bg-secondary text-on-secondary" : done ? "bg-green-600 text-white" : "bg-surface-container-highest text-outline"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className="text-[11px] font-semibold whitespace-nowrap">{label}</span>
            </div>
            {i < 5 ? <span className="w-4 h-0.5 bg-outline-variant/50" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

export function wizardTitle(step: number): string {
  return [
    "What kind of issue are you reporting?",
    "Describe the issue",
    "Where is it located?",
    "Add evidence (photos)",
    "AI verification",
    "Review & submit"
  ][step] ?? "";
}

export function wizardSub(step: number): string {
  return [
    "Pick the closest match — AI will refine it during verification.",
    "A clear title and description helps the department act faster.",
    "Exact location lets engineers find the spot on their first visit.",
    "Geotagged photos strengthen your case. You may also add evidence later.",
    "Our AI cross-checks your report before routing it to officials.",
    "Verify every detail — your complaint gets a tracking ID on submission."
  ][step] ?? "";
}

export function NextButtonLabel(step: number): string {
  if (step === 3) return "Continue to AI-Assisted Review";
  if (step === 5) return "Submit Complaint";
  return "Next";
}

export function SummaryRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="px-4 py-2.5 flex gap-4">
      <dt className="w-40 flex-shrink-0 text-on-surface-variant">{label}</dt>
      <dd className="text-primary font-medium flex-1 break-words">{value}</dd>
    </div>
  );
}

export type { ReportDraft };
