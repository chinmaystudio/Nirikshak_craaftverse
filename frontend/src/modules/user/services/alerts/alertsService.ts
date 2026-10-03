import type { GovernmentAlert, GovernmentAlertView, AlertCategory, AlertSeverity } from "@/types/infrastructure";
import { latency, offlineGuard } from "@/services/api/client";
import { alerts } from "../../data/alerts";
import { appStore } from "@/app/providers/store";
import { ALERT_SEVERITY_ORDER } from "@/constants/alertSeverities";
import { environment } from "@/config/environment";

export interface AlertFilters {
  severity?: AlertSeverity | "all";
  category?: AlertCategory | "all";
  unreadOnly?: boolean;
}

function withRead(a: GovernmentAlert): GovernmentAlertView {
  return { ...a, read: appStore.getState().readAlerts.includes(a.id) };
}

export async function getAlerts(filters: AlertFilters = {}): Promise<GovernmentAlertView[]> {
  offlineGuard();
  if (!environment.demoMode) return [];
  await latency(300, 600);
  let out = alerts.map(withRead);
  if (filters.severity && filters.severity !== "all") out = out.filter((a) => a.severity === filters.severity);
  if (filters.category && filters.category !== "all") out = out.filter((a) => a.category === filters.category);
  if (filters.unreadOnly) out = out.filter((a) => !a.read);
  return out.sort(
    (a, b) => ALERT_SEVERITY_ORDER[a.severity] - ALERT_SEVERITY_ORDER[b.severity] || new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  );
}

export async function getAlertById(id: string): Promise<GovernmentAlertView> {
  offlineGuard();
  if (!environment.demoMode) return Promise.reject(new Error("No published public alert was found."));
  await latency(250, 500);
  const found = alerts.find((a) => a.id === id);
  if (!found) {
    return Promise.reject(new Error("Alert not found. It may have expired."));
  }
  return withRead(found);
}

export function markAlertRead(id: string): void {
  const readAlerts = appStore.getState().readAlerts;
  if (!readAlerts.includes(id)) {
    appStore.setState({ readAlerts: [...readAlerts, id] });
  }
}

export function markAllAlertsRead(): void {
  appStore.setState({ readAlerts: alerts.map((a) => a.id) });
}

export function unreadAlertCount(): number {
  if (!environment.demoMode) return 0;
  const readAlerts = appStore.getState().readAlerts;
  return alerts.filter((a) => !readAlerts.includes(a.id)).length;
}

export function criticalUnreadAlerts(): GovernmentAlertView[] {
  if (!environment.demoMode) return [];
  return alerts
    .filter((a) => a.severity === "critical" && !appStore.getState().readAlerts.includes(a.id))
    .map(withRead);
}

