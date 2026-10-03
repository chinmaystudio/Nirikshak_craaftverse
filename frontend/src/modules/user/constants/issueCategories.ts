import type { IssueCategory } from "@/types/community";
import type { ComplaintPriority } from "@/types/complaint";

export interface IssueCategoryMeta {
  id: IssueCategory;
  label: string;
  icon: string;
  department: string;
  priority: ComplaintPriority;
}

export const ISSUE_CATEGORIES: readonly IssueCategoryMeta[] = [
  { id: "pothole", label: "Pothole", icon: "warning", department: "PMC Road Department", priority: "medium" },
  { id: "road-damage", label: "Road Damage", icon: "edit_road", department: "PMC Road Department", priority: "medium" },
  { id: "construction-quality", label: "Poor Construction Quality", icon: "handyman", department: "Quality Control Cell", priority: "high" },
  { id: "project-delay", label: "Project Delay", icon: "schedule", department: "Project Monitoring Unit", priority: "low" },
  { id: "work-stopped", label: "Work Stopped", icon: "pause_circle", department: "Project Monitoring Unit", priority: "low" },
  { id: "drainage", label: "Drainage Problem", icon: "water", department: "Storm Water Department", priority: "high" },
  { id: "water-leakage", label: "Water Leakage", icon: "water_drop", department: "Water Supply Department", priority: "high" },
  { id: "safety-hazard", label: "Safety Hazard", icon: "health_and_safety", department: "Safety & Enforcement Cell", priority: "high" },
  { id: "environmental", label: "Environmental Issue", icon: "eco", department: "Environment Cell", priority: "medium" },
  { id: "other", label: "Other", icon: "more_horiz", department: "Municipal Commissioner Office", priority: "low" }
];

export function issueCategoryMeta(id: IssueCategory): IssueCategoryMeta {
  return ISSUE_CATEGORIES.find((c) => c.id === id) ?? ISSUE_CATEGORIES[ISSUE_CATEGORIES.length - 1];
}

export const WARDS: readonly string[] = [
  "Ward 12 — Kothrud West",
  "Ward 14 — Warje",
  "Ward 9 — Aundh–Bhosari",
  "Ward 23 — Hadapsar",
  "All Pune"
];

export const DEPARTMENTS: readonly string[] = [
  "PMC Road Department",
  "PMRDA",
  "PMC Water Supply Department",
  "Storm Water Department",
  "PMC Education Department",
  "PWD Maharashtra",
  "PMC Gardens Department",
  "MahaMetro",
  "Smart City Mission (PSCDCL)"
];
