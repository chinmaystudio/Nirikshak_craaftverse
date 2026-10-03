import { Icon } from "@/components/common/Icon";
import { SeverityBadge } from "@/components/common/StatusBadge";
import { severityMeta, ALERT_CATEGORY_META } from "@/constants/alertSeverities";
import { shortDate } from "@/utils/formatDate";
import { alertRoute } from "@/constants/routes";
import type { GovernmentAlertView } from "@/types/infrastructure";

interface AlertCardProps {
  alert: GovernmentAlertView;
  onMarkRead: (id: string) => void;
}

export function AlertCard({ alert, onMarkRead }: AlertCardProps): JSX.Element {
  const meta = severityMeta(alert.severity);
  const catIcon = ALERT_CATEGORY_META[alert.category].icon;
  const time = alert.endTime ? `${shortDate(alert.startTime)} → ${shortDate(alert.endTime)}` : `Active from ${shortDate(alert.startTime)}`;
  return (
    <article className={`${meta.cardClass} p-5 rounded-r-lg border border-outline-variant/30 space-y-2.5 ${alert.read ? "opacity-80" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name={meta.icon} className={`text-[22px] ${meta.color}`} />
          <span className="font-bold text-primary text-headline-sm font-headline-sm">{alert.title}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!alert.read ? <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping" title="Unread" /> : null}
          <SeverityBadge severity={alert.severity} />
          <span className="text-label-sm font-mono text-outline font-bold">REF: {alert.id}</span>
        </div>
      </div>
      <p className="text-body-md text-on-surface line-clamp-2">{alert.body}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-label-sm font-label-sm text-on-surface-variant">
        <span className="flex items-center gap-1">
          <Icon name={catIcon} className="text-[15px]" /> {alert.category} Alert
        </span>
        <span className="flex items-center gap-1">
          <Icon name="location_on" className="text-[15px]" /> {alert.area}
        </span>
        <span className="flex items-center gap-1">
          <Icon name="schedule" className="text-[15px]" /> {time}
        </span>
        <span className="ml-auto flex items-center gap-2">
          {!alert.read ? (
            <button
              onClick={() => onMarkRead(alert.id)}
              className="px-2.5 py-1 rounded bg-primary text-on-primary text-label-sm font-bold hover:bg-primary-container"
            >
              Mark as read
            </button>
          ) : (
            <span className="text-outline">Read</span>
          )}
          <a
            href={alertRoute(alert.id)}
            className="px-2.5 py-1 rounded border border-primary text-primary text-label-sm font-bold hover:bg-surface-container"
          >
            View Details →
          </a>
        </span>
      </div>
    </article>
  );
}
