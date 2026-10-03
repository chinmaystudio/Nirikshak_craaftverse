import { Icon } from "@/components/common/Icon";
import { COMPLAINT_STAGES, stageOf, complaintStatusMeta } from "@/constants/complaintStatuses";
import { slaState } from "./SLAIndicator";
import { formatDate } from "@/utils/formatDate";
import type { Complaint, ComplaintTimelineEvent, ComplaintStatus } from "@/types/complaint";

export function ComplaintStepper({ complaint }: { complaint: Complaint }): JSX.Element {
  const stage = stageOf(complaint.status);
  const breached = slaState(complaint).breached && complaint.status !== "resolved" && complaint.status !== "closed";
  return (
    <ol className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-1">
      {COMPLAINT_STAGES.map((label, i) => {
        const done = i < stage;
        const isCurrent = i === stage && complaint.status !== "resolved" && complaint.status !== "closed";
        let box = "bg-surface-container-lowest border-outline-variant/30 opacity-60";
        let circle = "bg-outline-variant text-on-surface-variant";
        let title = "text-outline";
        if (done) {
          box = "bg-surface-container-low border-outline-variant/40";
          circle = "bg-primary text-on-primary";
          title = "text-primary";
        }
        if (isCurrent) {
          box = breached ? "bg-red-50 border-error" : "bg-amber-50 border-secondary";
          circle = breached ? "bg-error text-on-error" : "bg-secondary text-on-secondary animate-pulse";
          title = breached ? "text-error" : "text-secondary";
        }
        if (complaint.status === "resolved" && label === "Resolved") {
          box = "bg-green-50 border-green-300";
          circle = "bg-green-600 text-white";
          title = "text-green-800";
        }
        const displayLabel = label === "Action In Progress" && complaint.status === "investigation" ? "Investigation" : label;
        return (
          <li key={label} className={`p-3 rounded border text-center ${box}`}>
            <div className={`w-7 h-7 rounded-full mx-auto flex items-center justify-center mb-1 text-label-sm font-bold ${circle}`}>
              {done || (complaint.status === "resolved" && label === "Resolved") ? "✓" : i + 1}
            </div>
            <div className={`text-label-sm font-bold ${title}`}>
              {i + 1}. {displayLabel}
            </div>
            <div className="text-label-sm text-outline leading-tight mt-0.5">
              {isCurrent ? (breached ? "Auto-escalated" : "In progress") : done ? "Done" : "Pending"}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function TimelineNodeView({ event, last }: { event: ComplaintTimelineEvent; last: boolean }): JSX.Element {
  const breached = event.breach === true;
  const state = event.status;
  const isPending = state === "upcoming";
  let circle = "bg-surface-container-highest text-outline border-2 border-outline-variant/50";
  let tone = "text-outline";
  if (state === "completed") {
    circle = breached ? "bg-error text-on-error" : "bg-primary text-on-primary";
    tone = breached ? "text-error" : "text-primary";
  } else if (state === "current") {
    circle = breached ? "bg-error text-on-error" : "bg-secondary text-on-secondary animate-pulse";
    tone = breached ? "text-error" : "text-secondary";
  }
  const mark = isPending ? <Icon name="radio_button_unchecked" className="text-[16px]" /> : breached ? <Icon name="gavel" className="text-[16px]" /> : "✓";
  return (
    <li className="relative pl-10 pb-5 last:pb-0">
      <span className={`absolute left-0 top-0 w-8 h-8 rounded-full ${circle} flex items-center justify-center text-label-sm font-bold z-10`}>{mark}</span>
      {!isPending && !last ? (
        <span className={`absolute left-[15px] top-9 bottom-0 w-0.5 ${breached ? "bg-error/40" : "bg-outline-variant/40"}`} aria-hidden="true" />
      ) : null}
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className={`text-label-md font-bold ${tone}`}>{event.title}</span>
        <span className="text-label-sm text-outline font-mono">{event.timestamp ? formatDate(event.timestamp, true) : "Pending"}</span>
      </div>
      {event.description ? <p className="text-body-sm text-on-surface-variant mt-0.5">{event.description}</p> : null}
      {event.actor && event.actor !== "—" ? <div className="text-label-sm text-outline mt-0.5">— {event.actor}</div> : null}
    </li>
  );
}

export function ComplaintTimeline({ complaint }: { complaint: Complaint }): JSX.Element {
  return (
    <ol className="relative">
      {complaint.timeline.map((event, i) => (
        <TimelineNodeView key={event.id} event={event} last={i === complaint.timeline.length - 1} />
      ))}
    </ol>
  );
}

const TONES: Record<string, string> = {
  "safety-hazard": "from-red-200 to-red-50",
  "water-leakage": "from-blue-200 to-blue-50",
  environmental: "from-green-200 to-green-50",
  pothole: "from-amber-200 to-amber-50",
  "road-damage": "from-amber-200 to-amber-50",
  drainage: "from-cyan-200 to-cyan-50",
  other: "from-slate-200 to-slate-50",
  "construction-quality": "from-violet-200 to-violet-50"
};

export function statusTone(category: string, status: ComplaintStatus): string {
  void complaintStatusMeta(status);
  return TONES[category] ?? TONES.other;
}
