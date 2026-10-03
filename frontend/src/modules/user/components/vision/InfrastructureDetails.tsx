import { Icon } from "@/components/common/Icon";
import { ProgressBar } from "@/components/common/ProgressBar";
import { statusMeta } from "@/constants/projectStatuses";
import { formatCr } from "@/utils/formatCurrency";
import { shortDate } from "@/utils/formatDate";
import { findProject } from "@/services/projects/projectsService";
import type { VisionAnalysis } from "@/types/infrastructure";

export function AiBadge(): JSX.Element {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-fixed text-primary text-label-sm font-bold border border-primary-container/20">
      <Icon name="auto_awesome" className="text-[13px]" /> AI-ASSISTED
    </span>
  );
}

export function VerifiedBadge(): JSX.Element {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-900 text-label-sm font-bold border border-green-300">
      <Icon name="verified_user" className="text-[13px]" /> VERIFIED GOVERNMENT RECORD
    </span>
  );
}

export function VisionAnalysisPanel({ step }: { step: number }): JSX.Element {
  const steps = ["Reading image", "Identifying infrastructure", "Checking public project database", "Finding responsible authority"];
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
          <Icon name="auto_awesome" className="text-[22px]" />
        </span>
        <div>
          <div className="text-headline-sm font-bold text-primary flex items-center gap-2">
            NIRIKSHAK VISION <span className="text-label-sm font-normal text-outline">Analyzing infrastructure…</span>
          </div>
          <div className="text-label-sm text-outline">Typically takes a few seconds. AI-assisted; advisory only.</div>
        </div>
      </div>
      <div className="space-y-2">
        {steps.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={s} className={`flex items-center gap-2 text-body-sm ${done ? "text-green-700" : active ? "text-primary font-semibold" : "text-outline"}`}>
              {done ? (
                <Icon name="check_circle" className="text-[18px] text-green-600" />
              ) : active ? (
                <span className="w-[18px] h-[18px] rounded-full border-2 border-secondary border-t-transparent animate-spin inline-block" />
              ) : (
                <Icon name="radio_button_unchecked" className="text-[18px]" />
              )}
              {s}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DetailCell({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/30">
      <div className="text-[10px] font-bold uppercase tracking-wider text-outline">{label}</div>
      <div className="text-body-md font-semibold text-primary mt-0.5">{value}</div>
    </div>
  );
}

export function InfrastructureDetails({ result }: { result: VisionAnalysis }): JSX.Element {
  const attention = result.condition.label !== "Good";
  return (
    <section className="space-y-3">
      <h3 className="text-headline-sm font-bold text-primary">
        Infrastructure Details <span className="text-label-sm font-normal text-outline">(AI estimates)</span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DetailCell label="Type" value={result.infrastructureType} />
        <DetailCell label="Location" value="Ward 12, Pune" />
        <DetailCell label="Visual Condition" value={result.condition.label} />
        <DetailCell label="Estimated Infrastructure Age" value={result.details.ageEstimate} />
        <DetailCell label="Observed Use" value={result.details.usage} />
        <DetailCell label="Materials Observed" value={result.details.materials} />
      </div>
      <section className={`${attention ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-green-50 border-green-300 text-green-800"} border rounded-lg p-4 space-y-2`}>
        <div className="flex items-center gap-2 font-bold text-label-md">
          <Icon name={attention ? "report_problem" : "check_circle"} className="text-[18px]" /> Visual Condition — {result.condition.label}
        </div>
        {result.condition.observations.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {result.condition.observations.map((o) => (
              <span key={o} className="px-2 py-0.5 rounded-full bg-white/70 border border-black/10 text-label-sm font-semibold">
                {o}
              </span>
            ))}
          </div>
        ) : null}
        <p className="text-label-sm leading-relaxed opacity-90">
          AI-assisted visual observation only. This is not a structural safety certification — professional inspection may be required.
        </p>
      </section>
    </section>
  );
}

function PCell({ k, v }: { k: string; v: string }): JSX.Element {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-outline font-bold">{k}</dt>
      <dd className="font-semibold text-primary truncate">{v}</dd>
    </div>
  );
}

export function RelatedProjectBlock({ result }: { result: VisionAnalysis }): JSX.Element | null {
  if (!result.relatedProject) {
    return (
      <section className="bg-surface-container-lowest border border-dashed border-outline-variant rounded-xl p-5 text-center space-y-2">
        <Icon name="search_off" className="text-[28px] text-outline block mx-auto" />
        <h3 className="text-headline-sm font-bold text-primary">Infrastructure Identified — No Project Match</h3>
        <p className="text-body-sm text-on-surface-variant max-w-md mx-auto">
          No registered NIRIKSHAK project could be matched to this infrastructure. You can still report an issue or submit this information to
          improve NIRIKSHAK's coverage.
        </p>
      </section>
    );
  }
  const project = findProject(result.relatedProject.projectId);
  if (!project) return null;
  const meta = statusMeta(project.status);
  return (
    <section className="bg-surface-container-lowest rounded-xl border-2 border-secondary/50 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-[#FEF9EE] border-b border-[#FDE68A] flex items-center justify-between gap-2">
        <span className="text-label-md font-bold text-primary flex items-center gap-1.5">
          <Icon name="link" className="text-[18px] text-secondary" /> Related NIRIKSHAK Project
        </span>
        <VerifiedBadge />
      </div>
      <div className="p-5 grid grid-cols-1 sm:grid-cols-12 gap-4">
        <div className="sm:col-span-8 space-y-2">
          <div className="flex items-center gap-2 text-label-sm font-mono text-primary">
            <span className="bg-surface-container px-2 py-0.5 rounded font-bold">#{project.code}</span>
            <span className={`${meta.chipClass} px-2 py-0.5 rounded-full font-bold`}>{meta.label}</span>
          </div>
          <h3 className="text-headline-sm font-bold text-primary leading-snug">{project.name}</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-body-sm pt-1">
            <PCell k="Department" v={project.agency} />
            <PCell k="Contractor" v={project.contractor.name} />
            <PCell k="Budget" v={formatCr(project.finance.sanctionedAmount)} />
            <PCell k="Expected Completion" v={shortDate(project.dates.actual ?? project.dates.revisedExpected ?? project.dates.expected)} />
          </dl>
        </div>
        <div className="sm:col-span-4 flex flex-col items-center justify-center gap-2 bg-surface-container-low rounded-lg p-3">
          <span className="text-[26px] font-bold text-primary tabular-nums leading-none">{project.progress}%</span>
          <div className="w-full">
            <ProgressBar pct={project.progress} toneClass={meta.barClass} />
          </div>
          <span className="text-label-sm text-on-surface-variant">Progress</span>
        </div>
      </div>
      <div className="px-5 pb-4">
        <a
          href={`#/projects/${project.id}`}
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded bg-primary hover:bg-primary-container text-on-primary text-label-md font-label-md font-bold transition-all active:scale-95"
        >
          <Icon name="open_in_new" className="text-[18px]" /> View Project Transparency
        </a>
      </div>
    </section>
  );
}

export interface AuthorityBlockProps {
  result: VisionAnalysis;
}

export function AuthorityBlock({ result }: AuthorityBlockProps): JSX.Element {
  const a = result.authority;
  return (
    <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-5 space-y-2.5">
      <h3 className="text-headline-sm font-bold text-primary flex items-center gap-2">
        <Icon name="account_balance" className="text-[20px] text-primary" /> Maintained By
      </h3>
      <dl className="space-y-1.5 text-body-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-on-surface-variant flex-shrink-0">Maintained By</dt>
          <dd className="text-primary font-semibold text-right">{a.organization}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-on-surface-variant flex-shrink-0">Responsible Department</dt>
          <dd className="text-primary font-semibold text-right">{a.department}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-on-surface-variant flex-shrink-0">Contact</dt>
          <dd className="text-primary font-semibold text-right">{a.contact}</dd>
        </div>
      </dl>
      <p className="text-label-sm text-outline flex items-start gap-1">
        <Icon name="verified_user" className="text-[14px] flex-shrink-0 text-green-700" /> Authority information shown from registered government
        records.
      </p>
    </section>
  );
}
