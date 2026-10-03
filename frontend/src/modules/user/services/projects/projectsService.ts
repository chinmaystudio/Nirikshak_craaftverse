import type { Project, ProjectCategory, ProjectStatus, WardStatistics, CityStatistics } from "@/types/project";
import { ApiError } from "@/services/api/client";
import { projectImages } from "../../data/projects";
import { ward as wardStats, cityStats } from "../../data/ward";
import { isDemoMode } from "@/lib/config/dataMode";
import { supabase } from "@/core/supabase/client";


export type ProjectFilters = {
  q?: string;
  categories?: ProjectCategory[];
  statuses?: ProjectStatus[];
  departments?: string[];
  contractor?: string;
  distanceKm?: number | null;
  scope?: "ward" | "pune" | "all";
};

// Map DB row to Citizen Project interface
function mapDbRowToProject(row: any): Project {
  const normStatus = String(row.normalized_status || '').toUpperCase();
  let status: ProjectStatus = 'on-track';
  if (normStatus === 'COMPLETED') status = 'completed';
  else if (normStatus === 'DELAYED') status = 'delayed';
  else if (normStatus === 'TENDERED' || normStatus === 'PROPOSED') status = 'tendering';
  else if (normStatus === 'STALLED' || normStatus === 'SUSPENDED') status = 'under-review';

  const sector = String(row.sector || '').toLowerCase();
  const subsector = String(row.subsector || '').toLowerCase();
  let category: ProjectCategory = 'roads';
  if (sector.includes('metro') || subsector.includes('metro') || subsector.includes('rail')) category = 'metro-transit';
  else if (sector.includes('water') || subsector.includes('water') || subsector.includes('sewage') || subsector.includes('drainage')) category = 'water-supply';
  else if (subsector.includes('bridge') || subsector.includes('flyover')) category = 'bridges';
  else if (sector.includes('energy') || subsector.includes('power')) category = 'smart-infrastructure';

  const cost = Number(row.total_cost_inr_crore) || 75;
  const progress = Number(row.physical_progress_percent) || (status === 'completed' ? 100 : 45);
  const spent = Math.round((Number(row.amount_spent_inr_crore) || (cost * (progress / 100))) * 10) / 10;

  // Pick suitable photo
  let photoUrl = projectImages.pier;
  if (category === 'metro-transit') photoUrl = projectImages.metro;
  else if (category === 'bridges') photoUrl = projectImages.gantry;
  else if (category === 'roads') photoUrl = projectImages.ring;

  const lat = Number(row.latitude) || (18.5204 + (Math.sin(cost) * 0.05));
  const lng = Number(row.longitude) || (73.8567 + (Math.cos(cost) * 0.05));

  const contractorName = row.contractor_concessionaire || 'Tata Projects / L&T Consortium';
  const projCode = row.nirikshak_project_id || `PUN-${category.toUpperCase().slice(0, 2)}-${Math.floor(100 + Math.random() * 900)}`;
  const projId = row.nirikshak_project_id || row.id || projCode;
  const originalEnd = row.original_completion_date || '2026-06-30';
  const revisedEnd = row.revised_completion_date || originalEnd;
  const startDate = row.award_date || row.planned_start_date || '2023-01-15';

  return {
    id: projId,
    code: projCode,
    name: row.project_name || 'Infrastructure Development Project',
    category,
    department: row.project_authority || 'Municipal Authority',
    agency: row.implementing_agency || row.project_authority || 'Public Works Agency',
    engineer: 'Executive Engineer (Assigned)',
    ward: row.city || (row.district ? `${row.district} Infrastructure Zone` : 'Regional Infrastructure Zone'),
    city: row.city || 'Not specified',
    state: row.state || 'Maharashtra',
    status,
    progress,
    physicalProgress: progress,
    financialProgress: Math.min(100, Math.round((spent / (cost || 1)) * 100)),
    phase: progress >= 100 ? 'Commissioned & Maintenance' : progress >= 75 ? 'Final Electromechanical & Testing' : progress >= 40 ? 'Superstructure & Paving' : 'Substructure & Site Clearance',
    distanceKm: null,
    mapPoint: {
      x: Math.min(92, Math.max(8, Math.round(35 + ((lng - 73.7) * 200)))),
      y: Math.min(92, Math.max(8, Math.round(45 + ((lat - 18.4) * 200)))),
    },
    img: photoUrl,
    latestUpdate: {
      date: (row.updated_at || '').slice(0, 19) || 'Recent',
      text: row.description || 'Project monitored under NIRIKSHAK transparency platform.'
    },
    lastInspection: undefined,
    nextMilestone: undefined,
    description: row.description || row.public_summary || 'Public works project monitored under NIRIKSHAK platform.',
    why: 'Commissioned to improve regional public infrastructure.',
    scope: [],
    benefit: 'Public utility and infrastructure improvement.',
    finance: {
      sanctionedAmount: cost,
      revisedCost: Number(row.revised_cost_inr_crore) || cost,
      amountSpent: spent,
      fundingSource: 'Government Infrastructure Budget',
      fundingModel: 'Government EPC Contract',
      varianceNote: ''
    },
    contractor: {
      name: contractorName,
      contractValue: cost,
      start: startDate,
      duration: '',
      performance: {
        onTime: 'Verified on ledger',
        quality: 'Standard',
        safety: 'Compliant',
        disputes: 'None reported'
      },
      prevProjects: [],
      currentStatus: status === 'delayed' ? 'Behind schedule' : 'Under execution'
    },
    dates: {
      tender: '',
      awarded: startDate,
      started: startDate,
      expected: revisedEnd,
      actual: status === 'completed' ? revisedEnd : null,
      originalExpected: originalEnd,
      revisedExpected: revisedEnd
    },
    delay: status === 'delayed' ? {
      reason: 'Schedule delay recorded during review.',
      detected: '',
      revisedCompletion: revisedEnd,
      penalty: ''
    } : undefined,
    timeline: [],
    docs: [],
    photos: [
      { src: photoUrl, caption: `${row.project_name || 'Project'} site inspection and active execution.` }
    ],
    hotline: '1800-120-8040 (Citizen Helpline)'
  };
}

let cachedProjects: Project[] | null = null;

export async function getProjects(): Promise<Project[]> {
  if (cachedProjects && cachedProjects.length > 0) {
    return cachedProjects;
  }

  try {
    const { data, error } = await supabase
      .from('public_projects_view')
      .select('*')
      .order('total_cost_inr_crore', { ascending: false, nullsFirst: false })
      .limit(4000);

    if (error || !data || data.length === 0) {
      return [];
    }

    cachedProjects = data.map(mapDbRowToProject);
    return cachedProjects;
  } catch (err) {
    console.error('Error fetching Supabase projects:', err);
    return [];
  }
}

export async function getProjectById(id: string): Promise<Project> {
  const all = await getProjects();
  const found = all.find((p) => p.id === id || p.code === id);
  if (found) return found;

  // Try direct query
  const { data, error } = await supabase
    .from('public_projects_view')
    .select('*')
    .or(`id.eq.${id},nirikshak_project_id.eq.${id}`)
    .single();

  if (error || !data) {
    throw new ApiError({ message: "Project not found in registry", notFound: true });
  }

  return mapDbRowToProject(data);
}


export function applyFilters(list: Project[], f: ProjectFilters): Project[] {
  return list.filter((p) => {
    if (f.q) {
      const q = f.q.toLowerCase();
      const hay = `${p.name || ''} ${p.code || ''} ${p.city || ''} ${p.contractor?.name || ''} ${p.department || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.categories && f.categories.length > 0 && !f.categories.includes(p.category)) return false;
    if (f.statuses && f.statuses.length > 0 && !f.statuses.includes(p.status)) return false;
    if (f.departments && f.departments.length > 0 && !f.departments.includes(p.department)) return false;
    if (f.contractor && f.contractor !== "all" && !(p.contractor?.name || '').includes(f.contractor)) return false;
    if (f.distanceKm != null && !(p.distanceKm != null && p.distanceKm <= f.distanceKm)) return false;
    if (f.scope === "ward" && !(p.ward || '').includes("Ward 12")) return false;
    if (f.scope === "pune" && p.city !== "Pune") return false;
    return true;
  });
}

export function nearbyProjects(limit = 8, projectList?: Project[]): Project[] {
  const source = (projectList && projectList.length > 0) ? projectList : (cachedProjects ?? []);
  return source
    .filter((p) => (p.city === "Pune" || !p.city) && p.mapPoint !== null)
    .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99))
    .slice(0, limit);
}

export function allContractors(projectList?: Project[]): string[] {
  const source = (projectList && projectList.length > 0) ? projectList : (cachedProjects ?? []);
  return Array.from(new Set(source.map((p) => p.contractor?.name).filter(Boolean) as string[])).sort();
}

export function allDepartments(projectList?: Project[]): string[] {
  const source = (projectList && projectList.length > 0) ? projectList : (cachedProjects ?? []);
  return Array.from(new Set(source.map((p) => p.department).filter(Boolean) as string[])).sort();
}

export function getWardStats(): WardStatistics {
  if (isDemoMode()) {
    return wardStats;
  }
  const source = cachedProjects ?? [];
  const onTrack = source.filter((p) => p.status === 'on-track').length;
  const delayed = source.filter((p) => p.status === 'delayed').length;
  const critical = source.filter((p) => p.status === 'under-review').length;
  const completed = source.filter((p) => p.status === 'completed').length;
  const totalValue = Math.round(source.reduce((sum, p) => sum + (p.finance?.sanctionedAmount || 0), 0) * 10) / 10;
  const spent = Math.round(source.reduce((sum, p) => sum + (p.finance?.amountSpent || 0), 0) * 10) / 10;

  return {
    id: "ward-live",
    name: "Live Infrastructure Zone",
    projects: source.length,
    onTrack,
    delayed,
    critical,
    completed,
    totalValueCr: totalValue,
    spentFYCr: spent,
    expenditurePct: totalValue > 0 ? Math.round((spent / totalValue) * 100) : 0,
    complaints: 0,
    resolved: 0,
    resolutionRate: 100,
    avgDays: 0,
    activeComplaints: 0,
    contractors: [],
    statusSplit: [
      { label: "On Track", value: onTrack, className: "bg-secondary" },
      { label: "Completed", value: completed, className: "bg-green-600" },
      { label: "Delayed", value: delayed, className: "bg-error" },
      { label: "Critical Review", value: critical, className: "bg-info" },
    ]
  };
}
export const getWardStatistics = getWardStats;

export function getCityStats(): CityStatistics {
  if (isDemoMode()) {
    return cityStats;
  }
  const source = cachedProjects ?? [];
  const activeProjects = source.filter((p) => p.status !== 'completed').length;
  const completed = source.filter((p) => p.status === 'completed').length;
  const underReview = source.filter((p) => p.status === 'under-review').length;

  return {
    activeProjects,
    completed,
    underReview,
    issuesResolved: 0,
    avgRedressalDays: 0
  };
}
export const getCityStatistics = getCityStats;

export function findProject(idOrCode: string): Project | undefined {
  const source = cachedProjects ?? [];
  return source.find((p) => p.id === idOrCode || p.code === idOrCode);
}

export const projectsData: Project[] = [];

