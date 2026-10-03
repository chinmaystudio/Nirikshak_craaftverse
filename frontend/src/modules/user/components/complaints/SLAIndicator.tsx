import { Icon } from "@/components/common/Icon";
import { complaintStatusMeta } from "@/constants/complaintStatuses";
import { duration, shortDate } from "@/utils/formatDate";
import type { Complaint } from "@/types/complaint";

export interface SLAState {
  remaining: number;
  breached: boolean;
  closed: boolean;
  within: boolean;
  elapsedPct: number;
}

export function slaState(c: Complaint): SLAState {
  const deadline = c.sla?.deadline ? Number(c.sla.deadline) : Date.now() + 48 * 3600_000;
  const totalHours = c.sla?.totalHours || 48;
  const remaining = deadline - Date.now();
  const total = totalHours * 3600_000;
  const elapsedPct = Math.max(0, Math.min(100, Math.round(((total - remaining) / total) * 100)));
  const breached = remaining <= 0;
  const closed = c.status === "resolved" || c.status === "closed";
  return { remaining, breached, closed, elapsedPct, within: !breached && elapsedPct > 75 };
}

export function SlaPill({ complaint }: { complaint: Complaint }): JSX.Element {
  const s = slaState(complaint);
  if (s.closed)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-900 text-label-sm font-bold border border-green-300">
        <Icon name="task_alt" className="text-[14px]" /> SLA Met
      </span>
    );
  if (s.breached)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-900 text-label-sm font-bold border border-red-300">
        <Icon name="gavel" className="text-[14px]" /> SLA BREACHED
      </span>
    );
  if (s.within)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-label-sm font-bold border border-amber-300">
        <Icon name="hourglass_top" className="text-[14px]" /> {duration(s.remaining)} left
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-label-sm font-semibold border border-blue-300">
      <Icon name="timer" className="text-[14px]" /> {duration(s.remaining)} left
    </span>
  );
}

export function SlaPanel({ complaint }: { complaint: Complaint }): JSX.Element {
  const s = slaState(complaint);
  if (s.closed) {
    return (
      <div className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant/60 shadow-sm space-y-2">
        <div className="text-label-md font-bold text-primary flex items-center gap-2">
          <Icon name="task_alt" className="text-[20px] text-green-600" /> Redressal SLA
        </div>
        <p className="text-body-sm text-on-surface-variant">
          Resolved within the {complaint.sla?.totalHours || 48}-hour service window. Feedback from citizens keeps the accountability score updated.
        </p>
        <div className="text-label-sm text-outline">
          Deadline was {complaint.sla?.deadline ? new Date(complaint.sla.deadline).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : 'On Schedule'}
        </div>
      </div>
    );
  }
  if (s.breached) {
    return (
      <div className="bg-red-50 border border-red-200 border-l-4 border-l-error p-5 rounded-lg space-y-2">
        <div className="flex items-center gap-2 text-error font-bold text-headline-sm">
          <Icon name="report" className="text-[22px]" /> SLA BREACHED
        </div>
        <p className="text-body-sm text-on-surface">
          The {complaint.sla?.totalHours || 48}-hour response deadline elapsed without closure. This complaint was{" "}
          <strong>automatically escalated</strong> to the department head and the Municipal Commissioner's oversight list.
        </p>
        <div className="text-label-sm text-error font-semibold">Escalated under CPGRAMS linkage</div>
      </div>
    );
  }
  const tone = s.within ? "bg-secondary" : "bg-info";
  return (
    <div className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant/60 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-label-md font-bold text-primary flex items-center gap-2">
          <Icon name="timer" className="text-[20px] text-secondary" /> Response Deadline
        </div>
        <span className={`font-mono text-label-md font-bold ${s.within ? "text-secondary" : "text-primary"}`}>
          {duration(s.remaining)} remaining
        </span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-surface-container-high overflow-hidden">
        <div className={`${tone} h-full transition-all`} style={{ width: `${s.elapsedPct}%` }} />
      </div>
      <div className="flex justify-between text-label-sm text-outline">
        <span>Filed {shortDate(complaint.submittedAt)}</span>
        <span>{complaint.sla?.totalHours || 48}-hour SLA window</span>
      </div>
    </div>
  );
}

export function EscalationPath({ complaint }: { complaint: Complaint }): JSX.Element | null {
  if (complaint.status === "resolved" || complaint.status === "closed") return null;
  const levels = ["Junior Engineer", "Assistant Engineer", "Executive Engineer", "Municipal Commissioner Cell"];
  const s = slaState(complaint);
  let active = 0;
  if (complaint.status === "escalated") active = 3;
  else if (s.breached) active = 2;
  else if (complaint.status === "action-taken" || complaint.status === "investigation") active = 1;

  return (
    <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/60 shadow-sm space-y-3">
      <div className="text-label-md font-bold text-primary flex items-center gap-2">
        <Icon name="account_tree" className="text-[20px] text-primary" /> Escalation Path
      </div>
      <ol>
        {levels.map((level, i) => {
          const done = i < active;
          const current = i === active;
          const dot = current ? "bg-secondary ring-4 ring-secondary/20" : done ? "bg-green-600" : "bg-surface-container-highest border-2 border-outline-variant";
          const tone = current ? "text-secondary font-bold" : done ? "text-green-700 font-semibold" : "text-outline font-medium";
          return (
            <li key={level} className="flex items-start gap-2.5">
              <div className="flex flex-col items-center flex-shrink-0">
                <span className={`w-3.5 h-3.5 rounded-full ${dot} mt-1`} />
                {i < levels.length - 1 ? <span className={`w-0.5 h-6 ${i < active ? "bg-green-600/50" : "bg-outline-variant/50"}`} /> : null}
              </div>
              <div className="pb-1">
                <div className={`text-label-md ${tone}`}>{level}</div>
                {current ? <div className="text-[11px] text-outline leading-tight">Current handling level</div> : null}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-label-sm text-outline leading-snug">
        If an SLA deadline is missed, the case escalates to the next level automatically — citizens never need to chase.
      </p>
    </div>
  );
}

export function ComplaintStatusDot({ status }: { status: Complaint["status"] }): JSX.Element {
  const meta = complaintStatusMeta(status);
  return <span className={`w-2.5 h-2.5 rounded-full inline-block ${meta.dotClass}`} />;
}
