import type { AlertSeverity, AlertCategory } from "@/types/infrastructure";

export interface SeverityMeta {
  label: string;
  chipClass: string;
  cardClass: string;
  icon: string;
  color: string;
}

export const SEVERITY_META: Record<AlertSeverity, SeverityMeta> = {
  critical: {
    label: "CRITICAL",
    chipClass: "bg-red-100 text-red-900 border border-red-300",
    cardClass: "bg-red-50/70 border-l-4 border-error",
    icon: "report",
    color: "text-error"
  },
  warning: {
    label: "WARNING",
    chipClass: "bg-amber-100 text-amber-900 border border-amber-300",
    cardClass: "bg-amber-50/70 border-l-4 border-secondary",
    icon: "warning",
    color: "text-secondary"
  },
  notice: {
    label: "NOTICE",
    chipClass: "bg-blue-100 text-blue-900 border border-blue-300",
    cardClass: "bg-blue-50/70 border-l-4 border-primary-container",
    icon: "campaign",
    color: "text-primary-container"
  },
  info: {
    label: "INFO",
    chipClass: "bg-slate-100 text-slate-700 border border-slate-300",
    cardClass: "bg-slate-50 border-l-4 border-slate-400",
    icon: "info",
    color: "text-slate-500"
  }
};

export const ALERT_CATEGORY_META: Record<AlertCategory, { label: string; icon: string }> = {
  project: { label: "Project Alerts", icon: "construction" },
  infrastructure: { label: "Infrastructure Works", icon: "edit_road" },
  safety: { label: "Safety Warnings", icon: "health_and_safety" }
};

export const ALERT_SEVERITY_ORDER: Record<AlertSeverity, number> = {
  critical: 0,
  warning: 1,
  notice: 2,
  info: 3
};

export function severityMeta(sev: AlertSeverity): SeverityMeta {
  return SEVERITY_META[sev] ?? SEVERITY_META.info;
}
