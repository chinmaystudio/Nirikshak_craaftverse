import type { Project, Milestone } from '@/types'

/**
 * Demo project register (mock data). IDs follow the Stitch convention
 * NIR-<DEPT>-2026-NNNN; names, amounts and places are realistic Maharashtra
 * public-works records invented for demonstration only.
 */

function ms(id: string, projectId: string, title: string, status: Milestone['status'], plannedStart: string, plannedEnd: string, physicalProgressPct: number, extra?: Partial<Milestone>): Milestone {
  return { id, projectId, title, status, plannedStart, plannedEnd, physicalProgressPct, ...extra }
}

export const PROJECTS: Project[] = [];

/** Quick lookup by ID (case-sensitive as rendered). */
export function findProject(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}
