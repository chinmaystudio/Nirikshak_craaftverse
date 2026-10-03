import { Icon } from "@/components/common/Icon";
import type { Project, ProjectMilestone, ProjectDelay } from "@/types/project";
import { shortDate } from "@/utils/formatDate";

const MILESTONE_META = {
  completed: {
    circle: "bg-primary text-on-primary",
    inner: <Icon name="check" className="text-[18px]" />,
    tone: "text-primary",
    badge: <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-900 text-label-sm font-semibold">Completed</span>
  },
  current: {
    circle: "bg-secondary text-on-secondary animate-pulse",
    inner: <Icon name="play_arrow" className="text-[18px]" />,
    tone: "text-secondary",
    badge: <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-label-sm font-bold">Current</span>
  },
  delayed: {
    circle: "bg-error text-on-error",
    inner: <Icon name="priority_high" className="text-[18px]" />,
    tone: "text-error",
    badge: <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-900 text-label-sm font-bold">Delayed</span>
  },
  upcoming: {
    circle: "bg-surface-container-highest text-on-surface-variant border-2 border-outline-variant",
    inner: <Icon name="schedule" className="text-[16px]" />,
    tone: "text-on-surface-variant",
    badge: <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-label-sm font-semibold">Upcoming</span>
  }
} as const;

function TimelineNode({ item }: { item: ProjectMilestone }): JSX.Element {
  const meta = MILESTONE_META[item.status];
  return (
    <li className="relative pl-12 pb-6 last:pb-0">
      <span className={`absolute left-0 top-0 w-9 h-9 rounded-full ${meta.circle} flex items-center justify-center z-10`}>{meta.inner}</span>
      {item.status !== "upcoming" ? (
        <span
          className={`absolute left-[17px] top-10 bottom-0 w-0.5 ${item.status === "delayed" ? "bg-error/40" : "bg-outline-variant/50"}`}
          aria-hidden="true"
        />
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-label-md font-label-md font-bold ${meta.tone}`}>{item.title}</span>
        {meta.badge}
        <span className="text-label-sm font-label-sm text-outline font-mono">{item.date ? shortDate(item.date) : "Scheduled"}</span>
      </div>
      {item.description ? <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">{item.description}</p> : null}
      {item.document ? (
        <span className="inline-flex items-center gap-1 mt-1.5 text-label-sm font-label-sm text-info">
          <Icon name="picture_as_pdf" className="text-[15px]" /> {item.document}
        </span>
      ) : null}
    </li>
  );
}

export function ProjectTimeline({ milestones }: { milestones: ProjectMilestone[] }): JSX.Element {
  return (
    <ol className="relative">
      {milestones.map((m) => (
        <TimelineNode key={m.id} item={m} />
      ))}
    </ol>
  );
}

export function DelayCallout({ delay, dates }: { delay: ProjectDelay; dates: Project["dates"] }): JSX.Element {
  return (
    <div className="bg-red-50 border border-red-200 border-l-4 border-l-error p-4 rounded-lg space-y-2">
      <div className="flex items-center gap-2 text-error font-bold text-label-md">
        <Icon name="running_with_errors" className="text-[20px]" /> DELAY RECORDED — PUBLIC DISCLOSURE
      </div>
      <div className="text-body-sm text-on-surface space-y-1">
        <div>
          <strong>Expected:</strong> {shortDate(dates.originalExpected ?? dates.expected)} → <strong>Delay detected:</strong>{" "}
          {shortDate(delay.detected)} → <strong>Revised completion:</strong> {shortDate(delay.revisedCompletion)}
        </div>
        <div>
          <strong>Reason:</strong> {delay.reason}
        </div>
        <div>
          <strong>Accountability:</strong> {delay.penalty}
        </div>
      </div>
    </div>
  );
}
