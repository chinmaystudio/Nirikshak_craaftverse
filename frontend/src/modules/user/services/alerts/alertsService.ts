import type { GovernmentAlert, GovernmentAlertView, AlertCategory, AlertSeverity } from "@/types/infrastructure";
import { latency, offlineGuard } from "@/services/api/client";
import { appStore } from "@/app/providers/store";
import { ALERT_SEVERITY_ORDER } from "@/constants/alertSeverities";
import { supabase } from "@/core/supabase/client";

export interface AlertFilters {
  severity?: AlertSeverity | "all";
  category?: AlertCategory | "all";
  unreadOnly?: boolean;
}

function withRead(a: GovernmentAlert): GovernmentAlertView {
  return { ...a, read: appStore.getState().readAlerts.includes(a.id) };
}

let cachedAlerts: GovernmentAlert[] = [];

export async function getAlerts(filters: AlertFilters = {}): Promise<GovernmentAlertView[]> {
  offlineGuard();
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      cachedAlerts = data.map((n: any) => ({
        id: n.id,
        category: (n.type === 'project' || n.type === 'infrastructure' || n.type === 'safety' ? n.type : 'infrastructure') as AlertCategory,
        severity: (n.metadata?.priority === 'critical' ? 'critical' : n.metadata?.priority === 'high' ? 'warning' : 'info') as AlertSeverity,
        title: n.title || 'Civic Notice',
        body: n.message || '',
        area: 'Pune Metropolitan Area',
        startTime: n.created_at || new Date().toISOString(),
        endTime: null,
        postedAt: n.created_at || new Date().toISOString(),
        projectId: n.project_id || null,
        contact: 'PMC Disaster Management Cell: 020-25501000',
      }));
    } else {
      cachedAlerts = [];
    }
  } catch (err) {
    console.warn('Failed to fetch alerts from Supabase:', err);
    cachedAlerts = [];
  }

  let out = cachedAlerts.map(withRead);
  if (filters.severity && filters.severity !== "all") out = out.filter((a) => a.severity === filters.severity);
  if (filters.category && filters.category !== "all") out = out.filter((a) => a.category === filters.category);
  if (filters.unreadOnly) out = out.filter((a) => !a.read);
  return out.sort(
    (a, b) => ALERT_SEVERITY_ORDER[a.severity] - ALERT_SEVERITY_ORDER[b.severity] || new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  );
}

export async function getAlertById(id: string): Promise<GovernmentAlertView> {
  offlineGuard();
  const all = await getAlerts();
  const found = all.find((a) => a.id === id);
  if (!found) {
    return Promise.reject(new Error("Alert not found. It may have expired."));
  }
  return found;
}

export function markAlertRead(id: string): void {
  const readAlerts = appStore.getState().readAlerts;
  if (!readAlerts.includes(id)) {
    appStore.setState({ readAlerts: [...readAlerts, id] });
  }
}

export function markAllAlertsRead(): void {
  appStore.setState({ readAlerts: cachedAlerts.map((a) => a.id) });
}

export function unreadAlertCount(): number {
  const readAlerts = appStore.getState().readAlerts;
  return cachedAlerts.filter((a) => !readAlerts.includes(a.id)).length;
}

export function criticalUnreadAlerts(): GovernmentAlertView[] {
  return cachedAlerts
    .filter((a) => a.severity === "critical" && !appStore.getState().readAlerts.includes(a.id))
    .map(withRead);
}


