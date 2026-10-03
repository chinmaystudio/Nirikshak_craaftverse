import type { ProjectStatus, ProjectCategory } from "@/types/project";

export interface StatusMeta {
  label: string;
  chipClass: string;
  barClass: string;
  dotClass: string;
}

export const PROJECT_STATUS_META: Record<ProjectStatus, StatusMeta> = {
  "on-track": {
    label: "On Track",
    chipClass: "bg-amber-100 text-amber-900 border border-amber-300",
    barClass: "bg-secondary",
    dotClass: "bg-secondary"
  },
  delayed: {
    label: "Delayed",
    chipClass: "bg-red-100 text-red-900 border border-red-300",
    barClass: "bg-error",
    dotClass: "bg-error"
  },
  completed: {
    label: "Completed",
    chipClass: "bg-green-100 text-green-900 border border-green-300",
    barClass: "bg-green-600",
    dotClass: "bg-green-600"
  },
  "under-review": {
    label: "Under Review",
    chipClass: "bg-blue-100 text-blue-900 border border-blue-300",
    barClass: "bg-info",
    dotClass: "bg-info"
  },
  tendering: {
    label: "Tendering",
    chipClass: "bg-slate-100 text-slate-700 border border-slate-300",
    barClass: "bg-slate-400",
    dotClass: "bg-slate-400"
  }
};

export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, string> = {
  roads: "Roads",
  bridges: "Bridges & Flyovers",
  "metro-transit": "Metro & Transit",
  "water-supply": "Water Supply",
  drainage: "Drainage",
  schools: "Schools & Education",
  hospitals: "Hospitals & Health",
  parks: "Parks & Riversides",
  "smart-infrastructure": "Smart Infrastructure",
  "public-buildings": "Public Buildings"
};

export const PROJECT_CATEGORY_ICONS: Record<ProjectCategory, string> = {
  roads: "edit_road",
  bridges: "construction",
  "metro-transit": "tram",
  "water-supply": "water_drop",
  drainage: "water",
  schools: "school",
  hospitals: "local_hospital",
  parks: "park",
  "smart-infrastructure": "traffic",
  "public-buildings": "apartment"
};

export const PROJECT_CATEGORY_ORDER: ProjectCategory[] = [
  "roads",
  "bridges",
  "metro-transit",
  "water-supply",
  "drainage",
  "schools",
  "hospitals",
  "parks",
  "smart-infrastructure",
  "public-buildings"
];

export const PROJECT_STATUS_ORDER: ProjectStatus[] = ["on-track", "delayed", "completed", "under-review"];

export function statusMeta(status: ProjectStatus): StatusMeta {
  return PROJECT_STATUS_META[status] ?? PROJECT_STATUS_META["on-track"];
}
