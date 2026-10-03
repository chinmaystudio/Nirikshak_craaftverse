import type { CityStatistics, WardStatistics } from "@/types/project";

export const ward: WardStatistics = {
  id: "ward-12",
  name: "Ward 12 — Kothrud West",
  projects: 24,
  onTrack: 17,
  delayed: 4,
  critical: 3,
  completed: 11,
  totalValueCr: 184,
  spentFYCr: 96,
  expenditurePct: 52,
  complaints: 312,
  resolved: 271,
  resolutionRate: 87,
  avgDays: 6.4,
  activeComplaints: 41,
  contractors: [
    { name: "J. Kumar Infra Projects Ltd.", projects: 4, onTime: "88%", quality: "A", safety: "95/100" },
    { name: "R. B. Infrastructure Pvt. Ltd.", projects: 3, onTime: "81%", quality: "A-", safety: "91/100" },
    { name: "NCC Infra Projects Ltd.", projects: 3, onTime: "62%", quality: "B+", safety: "88/100" },
    { name: "GreenScape Environments LLP", projects: 2, onTime: "92%", quality: "A", safety: "99/100" },
    { name: "Ravi Constructions & Interiors", projects: 2, onTime: "90%", quality: "A-", safety: "98/100" }
  ],
  statusSplit: [
    { label: "On Track", value: 17, className: "bg-secondary" },
    { label: "Completed", value: 11, className: "bg-green-600" },
    { label: "Delayed", value: 4, className: "bg-error" },
    { label: "Critical Review", value: 3, className: "bg-info" }
  ]
};

export const cityStats: CityStatistics = {
  activeProjects: 1428,
  completed: 892,
  underReview: 215,
  issuesResolved: 12490,
  avgRedressalDays: 6.4
};
