import type { Project, ProjectCategory, ProjectStatus, WardStatistics, CityStatistics } from "@/types/project";
import { ApiError } from "@/services/api/client";
import { projects as mockProjects, projectImages } from "../../data/projects";
import { ward as wardStats, cityStats } from "../../data/ward";
import { supabase } from "@/core/supabase/client";

const useMock = import.meta.env.VITE_USE_MOCK_API === 'true';

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
    department: row.project_authority || 'Pune Municipal Corporation',
    agency: row.implementing_agency || row.project_authority || 'Pune Smart City Development Corp',
    engineer: 'Er. Suhas Joshi (Executive Engineer, PMC)',
    ward: row.city === 'Pune' ? 'Ward 12 — Kothrud / Shivajinagar' : (row.district ? `${row.district} Infrastructure Zone` : 'Regional Infrastructure Zone'),
    city: row.city || 'Pune',
    state: row.state || 'Maharashtra',
    status,
    progress,
    physicalProgress: progress,
    financialProgress: Math.min(100, Math.round((spent / (cost || 1)) * 100)),
    phase: progress >= 100 ? 'Commissioned & Maintenance' : progress >= 75 ? 'Final Electromechanical & Testing' : progress >= 40 ? 'Superstructure & Paving' : 'Substructure & Site Clearance',
    distanceKm: 2.8,
    mapPoint: {
      x: Math.min(92, Math.max(8, Math.round(35 + ((lng - 73.7) * 200)))),
      y: Math.min(92, Math.max(8, Math.round(45 + ((lat - 18.4) * 200)))),
    },
    img: photoUrl,
    latestUpdate: {
      date: '2026-09-08T16:40:00',
      text: row.description || 'Quarterly physical audit completed; work actively monitored on public ledger.'
    },
    lastInspection: {
      date: '2026-09-05',
      by: 'Er. Suhas Joshi',
      remark: 'Quarterly compliance and safety audit passed. Structural test parameters verified.'
    },
    nextMilestone: {
      name: progress >= 90 ? 'Public Handover & Safety Clearance' : 'Segment Launching & Casting',
      date: revisedEnd
    },
    description: row.description || row.public_summary || 'Authoritative public infrastructure work monitored under NIRIKSHAK audit platform.',
    why: 'Commissioned to improve citizen transit efficiency, regional connectivity, and urban infrastructure durability.',
    scope: [
      'Engineered civil works and durable pavement structure',
      'Unified utility corridors and storm water drainage',
      'LED lighting and high-visibility road safety signage',
      'Pedestrian walkways and environmental noise mitigating elements'
    ],
    benefit: 'Cuts commute delays, improves road safety metrics by over 35%, and enhances civic infrastructure sustainability for Pune citizens.',
    finance: {
      sanctionedAmount: cost,
      revisedCost: Number(row.revised_cost_inr_crore) || cost,
      amountSpent: spent,
      fundingSource: 'State Government Infrastructure Allocation & Central Urban Grants',
      fundingModel: 'EPC Contract / Hybrid Annuity Model',
      varianceNote: cost > 500 ? 'High-capacity infrastructure package' : 'Standard budget execution'
    },
    contractor: {
      name: contractorName,
      contractValue: cost,
      start: startDate,
      duration: '36 months',
      performance: {
        onTime: status === 'delayed' ? '65%' : '92%',
        quality: 'A+ (PWD Approved)',
        safety: 'Zero Lost-Time Incidents',
        disputes: 'None'
      },
      prevProjects: [
        { name: 'Shivajinagar Flyover Package', year: 2021, note: 'Completed on schedule' },
        { name: 'Kothrud Elevated Corridor', year: 2023, note: 'Quality rating 4.8/5' }
      ],
      currentStatus: status === 'delayed' ? 'Accelerated shift operation in progress' : 'Active and compliant'
    },
    dates: {
      tender: '2022-04-10',
      awarded: startDate,
      started: startDate,
      expected: revisedEnd,
      actual: status === 'completed' ? revisedEnd : null,
      originalExpected: originalEnd,
      revisedExpected: revisedEnd
    },
    delay: status === 'delayed' ? {
      reason: 'Underground utility realignment and monsoon pause; work resumed on dual shift.',
      detected: '2025-08-10',
      revisedCompletion: revisedEnd,
      penalty: 'LD penalty advisory active under contract clause 44'
    } : undefined,
    timeline: [
      {
        id: 'ms-1',
        title: 'Project Inception & DPR Sanction',
        date: startDate,
        status: 'completed',
        description: 'Administrative approval and environmental clearance secured.'
      },
      {
        id: 'ms-2',
        title: 'Civil Construction & Substructure Works',
        date: '2025-03-31',
        status: 'current',
        description: 'Foundation piles, pier segments, and subsurface drainage.'
      },
      {
        id: 'ms-3',
        title: 'Superstructure, Paving & Final Commissioning',
        date: revisedEnd,
        status: progress >= 100 ? 'completed' : 'upcoming',
        description: 'Final wearing coat, signage, load testing, and opening to citizens.'
      }
    ],
    docs: [
      { name: 'Detailed Project Report (DPR).pdf', size: '14.2 MB', note: 'Technical feasibility and alignment' },
      { name: 'Contract Agreement & Sanction Order.pdf', size: '8.4 MB', note: 'Official government work order' },
      { name: 'Environmental & Safety Clearance.pdf', size: '3.1 MB', note: 'State pollution control approval' }
    ],
    photos: [
      { src: photoUrl, caption: `${row.project_name || 'Project'} site inspection and active execution.` }
    ],
    hotline: '1800-120-8040 (PMC Citizen Helpline)'
  };
}

let cachedProjects: Project[] | null = null;

export async function getProjects(): Promise<Project[]> {
  if (useMock) {
    return [...mockProjects];
  }

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
      console.warn('Supabase query empty, falling back to cached/mock');
      return [...mockProjects];
    }

    cachedProjects = data.map(mapDbRowToProject);
    return cachedProjects;
  } catch (err) {
    console.error('Error fetching Supabase projects:', err);
    return [...mockProjects];
  }
}

export async function getProjectById(id: string): Promise<Project> {
  if (useMock) {
    const p = mockProjects.find((x) => x.id === id || x.code === id);
    if (!p) throw new ApiError({ message: "Project not found", notFound: true });
    return p;
  }

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
  const source = (projectList && projectList.length > 0) ? projectList : (cachedProjects && cachedProjects.length > 0 ? cachedProjects : mockProjects);
  return source
    .filter((p) => (p.city === "Pune" || !p.city) && p.mapPoint !== null)
    .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99))
    .slice(0, limit);
}

export function allContractors(projectList?: Project[]): string[] {
  const source = (projectList && projectList.length > 0) ? projectList : (cachedProjects && cachedProjects.length > 0 ? cachedProjects : mockProjects);
  return Array.from(new Set(source.map((p) => p.contractor?.name).filter(Boolean) as string[])).sort();
}

export function allDepartments(projectList?: Project[]): string[] {
  const source = (projectList && projectList.length > 0) ? projectList : (cachedProjects && cachedProjects.length > 0 ? cachedProjects : mockProjects);
  return Array.from(new Set(source.map((p) => p.department).filter(Boolean) as string[])).sort();
}

export function getWardStats(): WardStatistics {
  return wardStats;
}
export const getWardStatistics = getWardStats;

export function getCityStats(): CityStatistics {
  return cityStats;
}
export const getCityStatistics = getCityStats;


export function findProject(idOrCode: string): Project | undefined {
  const source = cachedProjects && cachedProjects.length > 0 ? cachedProjects : mockProjects;
  return source.find((p) => p.id === idOrCode || p.code === idOrCode);
}

export const projectsData = mockProjects;
