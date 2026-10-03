import { useAppState, appStore } from "@/app/providers/store";
import type { ReportPrefill, LocationPrefill } from "@/types/api";
import type { Complaint, ComplaintStatus, ComplaintPriority } from "@/types/complaint";
import type { IssueCategory } from "@/types/community";

export function useComplaintsData(): { created: Complaint[] } {
  const created = useAppState((s) => s.created);
  return { created };
}

export function setReportPrefill(prefill: ReportPrefill): void {
  appStore.setState({ visionPrefill: prefill });
}

export function consumeReportPrefill(): ReportPrefill | null {
  const prefill = appStore.getState().visionPrefill;
  if (prefill) {
    appStore.setState({ visionPrefill: null });
  }
  return prefill;
}

export function setLocationPrefill(prefill: LocationPrefill): void {
  appStore.setState({ locationPrefill: prefill });
}

export function consumeLocationPrefill(): LocationPrefill | null {
  const prefill = appStore.getState().locationPrefill;
  if (prefill) {
    appStore.setState({ locationPrefill: null });
  }
  return prefill;
}

export function isClosed(status: ComplaintStatus): boolean {
  return status === "resolved" || status === "closed";
}

export const CLOSED_STATUSES: ComplaintStatus[] = ["resolved", "closed"];

export function priorityLabel(p: ComplaintPriority): string {
  return { critical: "Critical", high: "High", medium: "Medium", low: "Normal" }[p];
}

export type { Complaint, ComplaintStatus, ComplaintPriority, IssueCategory, ReportPrefill, LocationPrefill };
