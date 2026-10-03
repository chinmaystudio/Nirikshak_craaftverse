import { Icon } from "@/components/common/Icon";
import { CommunityStatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import { projectRoute } from "@/constants/routes";
import { relativeTime, shortDate } from "@/utils/formatDate";
import type { CommunityIssueView } from "@/types/community";

export function ConfirmationMeter({ pct }: { pct: number }): JSX.Element {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-label-sm font-label-sm">
        <span className="text-on-surface-variant">Community confirmation</span>
        <span className="font-bold text-primary">{pct}%</span>
      </div>
      <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
        <div className="bg-secondary h-full rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

interface CommunityIssueCardProps {
  issue: CommunityIssueView;
  onConfirm: (id: string) => void;
}

export function CommunityIssueCard({ issue, onConfirm }: CommunityIssueCardProps): JSX.Element {
  return (
    <article className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant/60 shadow-sm hover:shadow-md transition-shadow space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap text-label-sm font-label-sm">
          <CommunityStatusBadge status={issue.status} />
          <span className="text-outline flex items-center gap-1">
            <Icon name="place" className="text-[14px]" /> {issue.location.split(",")[0]}
          </span>
          <span className="text-outline flex items-center gap-1">
            <Icon name="groups" className="text-[15px]" /> {issue.affected} citizens affected
          </span>
        </div>
        <span className="text-label-sm font-mono text-outline flex-shrink-0">{issue.id}</span>
      </div>
      <h3 className="text-headline-sm font-bold text-primary">{issue.title}</h3>
      <p className="text-body-sm text-on-surface-variant line-clamp-2">{issue.description}</p>
      <ConfirmationMeter pct={issue.confirmPct} />
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-outline-variant/30">
        <div className="flex items-center gap-3 text-label-sm text-outline">
          <span className="flex items-center gap-1">
            <Icon name="thumb_up" className="text-[15px]" /> {issue.upvotes} support
          </span>
          <span className="flex items-center gap-1">
            <Icon name="forum" className="text-[15px]" /> {issue.comments.length} replies
          </span>
          <span>{relativeTime(issue.reportedAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={issue.userConfirmed ? "soft" : "accent"}
            size="sm"
            disabled={issue.userConfirmed}
            onClick={() => onConfirm(issue.id)}
          >
            {issue.userConfirmed ? "✓ Confirmed" : "Confirm Issue"}
          </Button>
          <a
            href={`#/community/${issue.id}`}
            className="px-3 py-1.5 rounded border border-primary text-primary text-label-md font-label-md hover:bg-surface-container transition-colors"
          >
            View Details
          </a>
        </div>
      </div>
    </article>
  );
}

export function ConfirmationList({ issue }: { issue: CommunityIssueView }): JSX.Element | null {
  const list = issue.confirmers.slice(0, 3);
  if (list.length === 0) return null;
  return (
    <div className="space-y-2">
      {list.map((c) => (
        <div key={c.name} className="flex items-start gap-2.5 text-body-sm">
          <div className="w-8 h-8 rounded-full bg-surface-container text-primary flex items-center justify-center flex-shrink-0 text-label-sm font-bold">
            {c.name[0]}
          </div>
          <div>
            <div className="font-semibold text-primary">
              {c.name} <span className="text-label-sm font-normal text-outline">• {c.ward} • {relativeTime(c.at)}</span>
            </div>
            <div className="text-on-surface-variant">{c.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CommunityIssueSummary({ issue }: { issue: CommunityIssueView }): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-label-sm font-label-sm text-on-surface-variant">
      <span className="flex items-center gap-1">
        <Icon name="groups" className="text-[16px]" /> <strong>{issue.affected}</strong>&nbsp;citizens affected
      </span>
      <span className="flex items-center gap-1">
        <Icon name="how_to_reg" className="text-[16px]" /> <strong>{issue.confirmations}</strong>&nbsp;confirmations
      </span>
      <span className="flex items-center gap-1">
        <Icon name="schedule" className="text-[16px]" /> Reported {shortDate(issue.reportedAt)}
      </span>
      <span className="flex items-center gap-1">
        <Icon name="person" className="text-[16px]" /> {issue.reportedBy}
      </span>
    </div>
  );
}

export function RelatedProjectMini({ issue }: { issue: CommunityIssueView }): JSX.Element | null {
  if (!issue.projectId) return null;
  return (
    <a href={projectRoute(issue.projectId)} className="block p-3 rounded-lg border border-outline-variant/40 hover:border-primary/40 transition-colors">
      <div className="text-body-md font-semibold text-primary">
        {issue.projectId} <span className="text-label-sm text-secondary font-bold">View project dossier →</span>
      </div>
    </a>
  );
}
