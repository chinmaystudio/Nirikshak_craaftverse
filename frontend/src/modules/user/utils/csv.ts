import type { Project } from "@/types/project";

export function projectsToCsv(list: Project[]): string {
  const head = ["Code", "Project", "Category", "Department", "City", "Ward", "Status", "Progress %", "Sanctioned (Cr)", "Revised (Cr)", "Spent (Cr)", "Contractor"];
  const rows = list.map((p) => [
    p.code,
    p.name,
    p.category,
    p.department,
    p.city,
    p.ward,
    p.status,
    String(p.progress),
    String(p.finance.sanctionedAmount),
    String(p.finance.revisedCost),
    String(p.finance.amountSpent),
    p.contractor.name
  ]);
  return [head, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\r\n");
}
