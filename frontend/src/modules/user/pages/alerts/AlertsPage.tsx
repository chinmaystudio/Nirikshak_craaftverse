import { useState } from "react";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSkeleton } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { AlertCard } from "@/components/alerts/AlertCard";
import { useAlerts } from "@/hooks/useAlerts";
import { toast } from "@/hooks/useToast";
import { markAlertRead, markAllAlertsRead } from "@/services/alerts/alertsService";
import type { AlertCategory, AlertSeverity } from "@/types/infrastructure";

const SEVERITY_FILTERS: Array<{ id: AlertSeverity | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical" },
  { id: "warning", label: "Warning" },
  { id: "notice", label: "Notice" },
  { id: "info", label: "Info" }
];

const CATEGORY_FILTERS: Array<{ id: AlertCategory | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "project", label: "Project Alerts" },
  { id: "infrastructure", label: "Infrastructure Works" },
  { id: "safety", label: "Safety Warnings" }
];

export function AlertsPage(): JSX.Element {
  const [severity, setSeverity] = useState<AlertSeverity | "all">("all");
  const [category, setCategory] = useState<AlertCategory | "all">("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const state = useAlerts({ severity, category, unreadOnly });
  const alerts = state.data ?? [];

  const markAll = (): void => {
    markAllAlertsRead();
    toast("All alerts marked as read.", "success");
    state.reload();
  };

  const markRead = (id: string): void => {
    markAlertRead(id);
    state.reload();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts & Warnings"
        sub="Official project alerts, infrastructure advisories and public safety warnings published under the Disaster Management & Urban Safety framework."
        actions={
          alerts.some((a) => !a.read) ? (
            <Button variant="outline" icon="done_all" onClick={markAll}>
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <div className="bg-surface-container-lowest p-3.5 rounded-lg border border-outline-variant/50 shadow-sm flex flex-wrap items-center gap-2">
        <span className="text-label-sm font-bold text-on-surface-variant mr-1">Severity:</span>
        {SEVERITY_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setSeverity(f.id)}
            className={`px-2.5 py-1 rounded text-label-sm font-bold transition-colors ${
              severity === f.id
                ? f.id === "all"
                  ? "bg-primary text-on-primary"
                  : f.id === "critical"
                    ? "bg-red-100 text-red-900 border border-red-300"
                    : f.id === "warning"
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : f.id === "notice"
                        ? "bg-blue-100 text-blue-900 border border-blue-300"
                        : "bg-slate-100 text-slate-700 border border-slate-300"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="text-label-sm font-bold text-on-surface-variant ml-3 mr-1">Category:</span>
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setCategory(f.id)}
            className={`px-2.5 py-1 rounded text-label-sm font-bold transition-colors ${
              category === f.id ? "bg-tertiary-container text-on-tertiary" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {f.label}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-label-sm font-semibold text-on-surface-variant cursor-pointer">
          <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} className="rounded text-primary" /> Unread only
        </label>
        <span className="hidden md:flex items-center gap-1.5 text-label-sm text-outline border-l border-outline-variant/40 pl-3">
          <span className="w-2 h-2 rounded-full bg-secondary animate-ping" /> Live feeds active
        </span>
      </div>

      {state.loading ? (
        <LoadingSkeleton kind="list" />
      ) : state.error ? (
        <ErrorState message={state.error} onRetry={state.reload} />
      ) : alerts.length === 0 ? (
        <EmptyState icon="notifications_off" title="No alerts match this filter" text="You are all caught up. Try widening the severity or category filters." />
      ) : (
        <div className="space-y-4">
          {alerts.map((a) => (
            <AlertCard key={a.id} alert={a} onMarkRead={markRead} />
          ))}
        </div>
      )}
    </div>
  );
}
