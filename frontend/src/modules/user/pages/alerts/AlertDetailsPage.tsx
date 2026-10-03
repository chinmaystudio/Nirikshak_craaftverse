import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { SeverityBadge } from "@/components/common/StatusBadge";
import { LoadingSkeleton } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { useNavigate, getRouteId } from "@/app/router";
import { ROUTES } from "@/constants/routes";
import { useAsync } from "@/hooks/useAsync";
import { useAlertActions } from "@/hooks/useAlerts";
import { toast } from "@/hooks/useToast";
import { getAlertById } from "@/services/alerts/alertsService";
import { severityMeta, ALERT_CATEGORY_META } from "@/constants/alertSeverities";
import { formatDate } from "@/utils/formatDate";


export function AlertDetailsPage(): JSX.Element {
  const navigate = useNavigate();
  const id = getRouteId();
  const { markRead } = useAlertActions();
  const state = useAsync(() => getAlertById(id), [id]);

  if (state.loading) return <LoadingSkeleton kind="detail" />;
  if (state.error || !state.data) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <ErrorState notFound={state.notFound} message={state.error ?? "Alert not found."} onRetry={undefined} />
        <div className="text-center">
          <Button variant="outline" icon="arrow_back" onClick={() => navigate(ROUTES.ALERTS)}>
            Back to Alerts Centre
          </Button>
        </div>
      </div>
    );
  }

  const a = state.data;
  if (!a.read) markRead(a.id);
  const meta = severityMeta(a.severity);
  const catIcon = ALERT_CATEGORY_META[a.category].icon;

  const cell = (icon: string, label: string, value: string): JSX.Element => (
    <div className="bg-surface-container-lowest/70 rounded-lg p-3 border border-outline-variant/20">
      <dt className="text-label-sm font-bold text-on-surface-variant flex items-center gap-1.5 uppercase tracking-wide">
        <Icon name={icon} className="text-[15px]" /> {label}
      </dt>
      <dd className="text-body-sm text-primary font-semibold mt-1">{value}</dd>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate("/alerts")} className="inline-flex items-center gap-1.5 text-primary font-label-md font-bold hover:text-secondary">
        <Icon name="arrow_back" className="text-[20px]" /> Back to Alerts Centre
      </button>
      <article className={`${meta.cardClass} rounded-xl p-6 space-y-4 border border-outline-variant/30`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`w-11 h-11 rounded-full bg-surface-container-lowest flex items-center justify-center ${meta.color}`}>
            <Icon name={meta.icon} className="text-[24px]" />
          </span>
          <SeverityBadge severity={a.severity} />
          <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-primary text-label-sm font-bold">{a.category} Alert</span>
          <span className="text-label-sm font-mono text-outline font-bold ml-auto">REF: {a.id}</span>
        </div>
        <h1 className="text-headline-md font-headline-md font-bold text-primary">{a.title}</h1>
        <p className="text-body-lg text-on-surface leading-relaxed">{a.body}</p>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cell("location_on", "Affected Area", a.area)}
          {cell("alt_route", "Advisory / Detour", a.detour ?? "—")}
          {cell("schedule", "Active From", formatDate(a.startTime, true))}
          {cell("event_busy", "Active Until", a.endTime ? formatDate(a.endTime, true) : "Until further notice")}
          {cell("call", "Contact", a.contact)}
          {cell("campaign", "Published", formatDate(a.postedAt, true))}
        </dl>
        <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant/20">
          {a.projectId ? (
            <Button icon="construction" onClick={() => navigate(`#/projects/${a.projectId}`)}>
              Open Related Project
            </Button>
          ) : null}
          <Button
            variant="outline"
            icon="content_copy"
            onClick={() => {
              void navigator.clipboard
                ?.writeText(`NIRIKSHAK Alert ${a.id} — ${a.title} (${a.area})`)
                .then(() => toast("Alert reference copied to clipboard.", "success"))
                .catch(() => toast("Copy is blocked in this browser context.", "error"));
            }}
          >
            Copy Alert Reference
          </Button>
          <span className="ml-auto self-center text-label-sm text-outline flex items-center gap-1">
            <Icon name={catIcon} className="text-[15px]" /> {a.category}
          </span>
        </div>
      </article>
    </div>
  );
}
