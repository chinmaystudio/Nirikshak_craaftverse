import { useCallback, useEffect, useMemo } from "react";
import type { Project, ProjectCategory, ProjectStatus } from "@/types/project";
import { useAsync } from "./useAsync";
import { getProjects, nearbyProjects, invalidateProjectsCache } from "@/services/projects/projectsService";
import { realtimeService } from "@/core/realtime/realtime.service";

export interface ProjectQuery {
  q: string;
  categories: ProjectCategory[];
  statuses: ProjectStatus[];
  departments: string[];
  contractor: string;
  distanceKm: number | null;
  scope: "ward" | "pune" | "all";
}

export function useProjects() {
  const state = useAsync(() => getProjects(), []);
  const projects = state.data ?? [];

  useEffect(() => {
    const refresh = () => { invalidateProjectsCache(); state.reload(); };
    const unsubs = [
      realtimeService.subscribeToTable('projects', refresh),
      realtimeService.subscribeToTable('progress_updates', refresh),
      realtimeService.subscribeToTable('payment_claims', refresh),
      realtimeService.subscribeToTable('payments', refresh),
      realtimeService.subscribeToTable('contracts', refresh),
    ];
    return () => unsubs.forEach((unsubscribe) => unsubscribe());
  }, [state.reload]);

  const filterProjects = useCallback(
    (list: Project[], query: ProjectQuery): Project[] => {
      return list.filter((p) => {
        if (query.q) {
          const q = query.q.toLowerCase();
          const hay = `${p.name || ''} ${p.code || ''} ${p.city || ''} ${p.contractor?.name || ''} ${p.department || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (query.categories.length > 0 && !query.categories.includes(p.category)) return false;
        if (query.statuses.length > 0 && !query.statuses.includes(p.status)) return false;
        if (query.departments.length > 0 && !query.departments.includes(p.department)) return false;
        if (query.contractor !== "all" && !(p.contractor?.name || '').includes(query.contractor)) return false;
        if (query.distanceKm != null && !(p.distanceKm != null && p.distanceKm <= query.distanceKm)) return false;
        if (query.scope === "ward" && !(p.ward || '').includes("Ward 12")) return false;
        if (query.scope === "pune" && p.city !== "Pune") return false;
        return true;
      });
    },
    []
  );

  return { ...state, projects, filterProjects, nearby: useMemo(() => nearbyProjects(8, projects), [projects]) };
}
