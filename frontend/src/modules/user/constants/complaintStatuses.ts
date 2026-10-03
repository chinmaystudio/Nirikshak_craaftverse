import type { ComplaintStatus, ComplaintPriority } from "@/types/complaint";
import type { TimelineEventStatus } from "@/types/complaint";

export interface ComplaintStatusMeta {
  label: string;
  chipClass: string;
  dotClass: string;
}

export const COMPLAINT_STATUS_META: Record<ComplaintStatus, ComplaintStatusMeta> = {
  submitted: {
    label: "Submitted",
    chipClass: "bg-slate-100 text-slate-700 border border-slate-300",
    dotClass: "bg-slate-400"
  },
  "under-review": {
    label: "Under Review",
    chipClass: "bg-blue-100 text-blue-900 border border-blue-300",
    dotClass: "bg-info"
  },
  assigned: {
    label: "Assigned",
    chipClass: "bg-indigo-100 text-indigo-900 border border-indigo-300",
    dotClass: "bg-indigo-500"
  },
  investigation: {
    label: "Investigation",
    chipClass: "bg-amber-100 text-amber-900 border border-amber-300",
    dotClass: "bg-secondary"
  },
  "action-taken": {
    label: "Action Taken",
    chipClass: "bg-amber-100 text-amber-900 border border-amber-400",
    dotClass: "bg-secondary"
  },
  resolved: {
    label: "Resolved",
    chipClass: "bg-green-100 text-green-900 border border-green-300",
    dotClass: "bg-green-600"
  },
  closed: {
    label: "Closed",
    chipClass: "bg-slate-200 text-slate-600 border border-slate-300",
    dotClass: "bg-slate-500"
  },
  escalated: {
    label: "Escalated",
    chipClass: "bg-red-100 text-red-900 border border-red-300",
    dotClass: "bg-error"
  }
};

export const COMPLAINT_STAGES: readonly string[] = [
  "Submitted",
  "Under Review",
  "Assigned",
  "Action In Progress",
  "Resolved"
];

const STAGE_INDEX: Record<ComplaintStatus, number> = {
  submitted: 0,
  "under-review": 1,
  assigned: 2,
  investigation: 3,
  "action-taken": 3,
  resolved: 4,
  closed: 4,
  escalated: 3
};

export function stageOf(status: ComplaintStatus): number {
  return STAGE_INDEX[status] ?? 1;
}

export interface PriorityMeta {
  label: string;
  chipClass: string;
  slaHours: number;
}

export const PRIORITY_META: Record<ComplaintPriority, PriorityMeta> = {
  critical: { label: "Critical", chipClass: "bg-red-100 text-red-900", slaHours: 12 },
  high: { label: "High", chipClass: "bg-red-50 text-error border border-red-200", slaHours: 24 },
  medium: { label: "Medium", chipClass: "bg-amber-50 text-amber-900 border border-amber-200", slaHours: 48 },
  low: { label: "Normal", chipClass: "bg-slate-100 text-slate-700 border border-slate-200", slaHours: 72 }
};

export const PRIORITY_ORDER: ComplaintPriority[] = ["high", "medium", "low"];

export const COMPLAINT_FILTERS: ReadonlyArray<{ id: string; label: string }> = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "submitted", label: "Submitted" },
  { id: "under-review", label: "Under Review" },
  { id: "action-taken", label: "Action Taken" },
  { id: "resolved", label: "Resolved" },
  { id: "escalated", label: "Escalated" }
];

export const ESCALATION_LEVELS: readonly string[] = [
  "Junior Engineer",
  "Assistant Engineer",
  "Executive Engineer",
  "Municipal Commissioner Cell"
];

export const TIMELINE_STATUS_META: Record<TimelineEventStatus, { chipClass: string; label: string }> = {
  completed: { chipClass: "bg-green-100 text-green-900", label: "Completed" },
  current: { chipClass: "bg-amber-100 text-amber-900", label: "Current" },
  upcoming: { chipClass: "bg-slate-100 text-slate-600", label: "Upcoming" }
};

export function complaintStatusMeta(status: ComplaintStatus): ComplaintStatusMeta {
  return COMPLAINT_STATUS_META[status] ?? COMPLAINT_STATUS_META.submitted;
}
