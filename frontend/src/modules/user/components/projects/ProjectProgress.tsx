import { statusMeta } from "@/constants/projectStatuses";
import { shortDate } from "@/utils/formatDate";
import { formatCr, remainingFunds } from "@/utils/formatCurrency";
import { ProgressBar } from "@/components/common/ProgressBar";
import type { Project } from "@/types/project";

function FinTile({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }): JSX.Element {
  return (
    <div className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant/60 shadow-sm">
      <div className="text-label-sm font-label-sm text-on-surface-variant">{label}</div>
      <div className={`text-headline-md font-headline-md font-bold mt-1 ${tone}`}>{value}</div>
      <div className="text-body-sm font-body-sm text-outline mt-1 leading-snug">{note}</div>
    </div>
  );
}

export function FinancialSummary({ project }: { project: Project }): JSX.Element {
  const f = project.finance ?? { sanctionedAmount: 0, revisedCost: 0, amountSpent: 0, fundingSource: 'Public Budget', fundingModel: 'EPC', varianceNote: 'Standard execution' };
  const spentPct = Math.round(project.financialProgress || project.progress || 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FinTile label="Sanctioned Cost" value={formatCr(f.sanctionedAmount)} note="Cabinet / Council approved" tone="text-primary" />
        <FinTile label="Revised Cost" value={formatCr(f.revisedCost)} note={f.varianceNote} tone="text-primary" />
        <FinTile label="Funds Spent" value={formatCr(f.amountSpent)} note={`${spentPct}% of allocation utilised`} tone="text-secondary" />
        <FinTile
          label="Remaining"
          value={remainingFunds(f.revisedCost, f.amountSpent, project.status === "completed")}
          note="Balance with executing agency"
          tone="text-primary"
        />
      </div>
      <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/50 space-y-2">
        <div className="flex justify-between text-label-sm font-label-sm">
          <span className="text-on-surface-variant font-semibold">Financial Progress</span>
          <span className="text-primary font-bold">{spentPct}% spent</span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden bg-surface-container-high flex">
          <div className="bg-secondary h-full" style={{ width: `${spentPct}%` }} />
        </div>
        <div className="flex justify-between text-label-sm font-label-sm text-outline">
          <span>{f.fundingSource}</span>
          <span>{f.fundingModel}</span>
        </div>
      </div>
    </div>
  );
}

export function ProgressPanel({ project }: { project: Project }): JSX.Element {
  const meta = statusMeta(project.status);
  const deg = Math.round((360 * Math.min(100, project.progress || 0)) / 100);
  return (
    <div className="bg-surface-container-lowest p-5 md:p-6 rounded-xl border border-outline-variant/60 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
      <div className="md:col-span-3 flex items-center gap-4 justify-center md:justify-start">
        <div
          className="relative w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: `conic-gradient(${project.status === "delayed" ? "#C62828" : project.status === "completed" ? "#16803A" : "#fe932c"} ${deg}deg, #e2e8f0 0deg)`
          }}
        >
          <div className="w-[78%] h-[78%] bg-surface-container-lowest rounded-full flex items-center justify-center">
            <span className="text-headline-sm font-bold text-primary">{project.progress}%</span>
          </div>
        </div>
        <div>
          <div className="text-label-md font-bold text-primary">Overall Completion</div>
          <div className="text-body-sm text-on-surface-variant">
            Current phase:
            <br />
            <strong className="text-primary">{project.phase || 'Execution'}</strong>
          </div>
        </div>
      </div>
      <div className="md:col-span-5 space-y-4">
        <div>
          <div className="flex justify-between text-label-sm font-label-sm mb-1">
            <span className="text-on-surface-variant">Physical Progress</span>
            <span className="font-bold text-primary">{project.physicalProgress ?? project.progress}%</span>
          </div>
          <ProgressBar pct={project.physicalProgress ?? project.progress} toneClass={meta.barClass} />
        </div>
        <div>
          <div className="flex justify-between text-label-sm font-label-sm mb-1">
            <span className="text-on-surface-variant">Financial Progress</span>
            <span className="font-bold text-primary">{project.financialProgress ?? project.progress}%</span>
          </div>
          <ProgressBar pct={project.financialProgress ?? project.progress} toneClass="bg-info" />
        </div>
        <div className="text-label-sm font-label-sm text-outline">
          Variance indicates billing lag or advance work — explained in quarterly audit notes.
        </div>
      </div>
      <div className="md:col-span-4 space-y-2.5 text-body-sm border-t md:border-t-0 md:border-l border-outline-variant/30 pt-4 md:pt-0 md:pl-6">
        <div className="flex gap-2">
          <span className="text-on-surface-variant w-28 flex-shrink-0">Latest update</span>
          <span className="text-primary font-medium">
            {shortDate(project.latestUpdate?.date)} — {project.latestUpdate?.text || 'Quarterly physical audit recorded.'}
          </span>
        </div>
        <div className="flex gap-2">
          <span className="text-on-surface-variant w-28 flex-shrink-0">Last inspection</span>
          <span className="text-primary">
            {shortDate(project.lastInspection?.date)} by {project.lastInspection?.by || 'Field Engineer'}
          </span>
        </div>
        <div className="flex gap-2">
          <span className="text-on-surface-variant w-28 flex-shrink-0">Next milestone</span>
          <span className="text-secondary font-semibold">
            {project.nextMilestone?.name || 'Completion'} • {shortDate(project.nextMilestone?.date)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function MilestoneMiniList({ project }: { project: Project }): JSX.Element {
  return (
    <ol className="relative">
      {(project.timeline ?? [])
        .filter((it) => it.status !== "upcoming")
        .slice(-4)
        .map((it) => {
          const tone = it.status === "delayed" ? "bg-error" : it.status === "current" ? "bg-secondary" : "bg-primary";
          return (
            <li key={it.id} className="flex items-start gap-3 pb-3 last:pb-0">
              <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${tone}`} />
              <div className="flex-1">
                <div className="text-label-md font-semibold text-primary">
                  {it.title} <span className="text-label-sm font-normal text-outline font-mono">{shortDate(it.date)}</span>
                </div>
                <div className="text-body-sm text-on-surface-variant">{it.description}</div>
              </div>
            </li>
          );
        })}
    </ol>
  );
}
