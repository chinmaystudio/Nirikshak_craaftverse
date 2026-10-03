import { useCallback, useMemo } from "react";
import { useAppState, appStore } from "@/app/providers/store";
import {
  getAlerts,
  getAlertById,
  markAlertRead,
  markAllAlertsRead,
  unreadAlertCount,
  criticalUnreadAlerts,
  type AlertFilters
} from "@/services/alerts/alertsService";
import { useAsync } from "./useAsync";
import type { GovernmentAlertView } from "@/types/infrastructure";

export interface UseAlertsResult extends ReturnType<typeof useAsync<GovernmentAlertView[]>> {
  unreadCount: number;
  criticalUnread: GovernmentAlertView[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  getAlert: typeof getAlertById;
}

export function useAlerts(filters?: AlertFilters): UseAlertsResult {
  const readAlerts = useAppState((s) => s.readAlerts);
  const key = filters ? `${filters.severity ?? "all"}|${filters.category ?? "all"}|${String(filters.unreadOnly ?? false)}|${readAlerts.length}` : "all";
  const alerts = useAsync(() => getAlerts(filters ?? {}), [key]);

  const markRead = useCallback((id: string) => markAlertRead(id), []);
  const markAllRead = useCallback(() => {
    markAllAlertsRead();
    appStore.setState({});
  }, []);

  const unreadCount = unreadAlertCount();
  const criticalUnread = useMemo(() => criticalUnreadAlerts(), [readAlerts.length]);

  return { ...alerts, unreadCount, criticalUnread, markRead, markAllRead, getAlert: getAlertById };
}

export function useAlertActions(): Pick<UseAlertsResult, "markRead" | "markAllRead" | "getAlert"> {
  const markRead = useCallback((id: string) => markAlertRead(id), []);
  const markAllRead = useCallback(() => {
    markAllAlertsRead();
    appStore.setState({});
  }, []);
  return { markRead, markAllRead, getAlert: getAlertById };
}
