import type { ComplaintStatus, ComplaintPriority } from "@/types/complaint";
import type { ProjectStatus } from "@/types/project";
import type { AlertSeverity } from "@/types/infrastructure";
import type { CommunityIssueStatus } from "@/types/community";
import { statusMeta } from "@/constants/projectStatuses";
import { complaintStatusMeta, PRIORITY_META } from "@/constants/complaintStatuses";
import { severityMeta } from "@/constants/alertSeverities";

interface StatusBadgeProps {
  status: ProjectStatus;
  extraClass?: string;
}

export function ProjectStatusBadge({ status, extraClass = "" }: StatusBadgeProps): JSX.Element {
  const meta = statusMeta(status);
  return (
    <span className={`px-2 py-0.5 rounded-full text-label-sm font-label-sm font-bold ${meta.chipClass} ${extraClass}`}>{meta.label}</span>
  );
}

export function ComplaintStatusBadge({ status }: { status: ComplaintStatus }): JSX.Element {
  const meta = complaintStatusMeta(status);
  return (
    <span className={`px-2 py-0.5 rounded-full text-label-sm font-label-sm font-semibold ${meta.chipClass}`}>{meta.label}</span>
  );
}

export function PriorityBadge({ priority }: { priority: ComplaintPriority }): JSX.Element {
  const meta = PRIORITY_META[priority];
  return <span className={`px-2 py-0.5 rounded text-label-sm font-bold ${meta.chipClass}`}>{meta.label} priority</span>;
}

export function SeverityBadge({ severity }: { severity: AlertSeverity }): JSX.Element {
  const meta = severityMeta(severity);
  return <span className={`px-2 py-0.5 rounded-full text-label-sm font-label-sm font-bold ${meta.chipClass}`}>{meta.label}</span>;
}

const COMMUNITY_STATUS_META: Record<CommunityIssueStatus, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-slate-100 text-slate-700 border border-slate-300" },
  confirmed: { label: "Confirmed", cls: "bg-amber-100 text-amber-900 border border-amber-300" },
  "action-taken": { label: "Action Taken", cls: "bg-blue-100 text-blue-900 border border-blue-300" },
  resolved: { label: "Resolved", cls: "bg-green-100 text-green-900 border border-green-300" }
};

export function CommunityStatusBadge({ status }: { status: CommunityIssueStatus }): JSX.Element {
  const meta = COMMUNITY_STATUS_META[status] ?? COMMUNITY_STATUS_META.open;
  return <span className={`px-2 py-0.5 rounded-full text-label-sm font-label-sm font-semibold ${meta.cls}`}>{meta.label}</span>;
}
