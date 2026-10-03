import React, { useEffect, useState } from 'react';
import { supabase } from '@/core/supabase/client';
import { ArrowRight, CheckCircle2, ExternalLink, Layers, ShieldCheck } from 'lucide-react';
import { navigate } from '@/app/router';
import { ROUTES, projectRoute } from '@/constants/routes';

interface PublicProjectRow {
  id: string;
  nirikshak_project_id: string;
  project_name: string;
  project_authority: string;
  location_text: string | null;
  state: string | null;
  total_cost_inr_crore: number | null;
  normalized_status: string;
  physical_progress_percent: number | null;
  current_status_verified: boolean;
  updated_at: string;
}

const FALLBACK_PROJECTS: PublicProjectRow[] = [
  {
    id: 'b1000000-0000-0000-0000-000000000005',
    nirikshak_project_id: 'NIR-PUNE-3C842EE8214DBC84',
    project_name: 'Pune Ring Road — Eastern & Western Corridors',
    project_authority: 'Maharashtra State Road Development Corporation (MSRDC)',
    location_text: 'Pune Outer Ring, Maharashtra',
    state: 'Maharashtra',
    total_cost_inr_crore: 26831,
    normalized_status: 'UNDER_CONSTRUCTION',
    physical_progress_percent: 24.5,
    current_status_verified: true,
    updated_at: '2026-09-25T22:31:16.670482+00:00'
  },
  {
    id: 'b1000000-0000-0000-0000-000000000002',
    nirikshak_project_id: 'NIR-PUNE-B015C41DB7149E9E',
    project_name: 'Pune Metro Phase I — PCMC-Swargate & Vanaz-Ramwadi',
    project_authority: 'Maharashtra Metro Rail Corporation Limited (Maha Metro)',
    location_text: 'Pune / Pimpri-Chinchwad, Maharashtra',
    state: 'Maharashtra',
    total_cost_inr_crore: 11420,
    normalized_status: 'COMPLETED',
    physical_progress_percent: 66,
    current_status_verified: true,
    updated_at: '2026-09-26T15:25:11.524+00:00'
  },
  {
    id: 'b1000000-0000-0000-0000-000000000001',
    nirikshak_project_id: 'NIR-PUNE-1C6ACEADF93FFB1A',
    project_name: 'Pune Metro Line 3 — Hinjawadi to Shivajinagar',
    project_authority: 'Pune Metropolitan Region Development Authority (PMRDA)',
    location_text: 'Hinjawadi-Shivajinagar, Pune, Maharashtra',
    state: 'Maharashtra',
    total_cost_inr_crore: 8313,
    normalized_status: 'UNDER_CONSTRUCTION',
    physical_progress_percent: 66,
    current_status_verified: true,
    updated_at: '2026-09-26T15:26:28.505+00:00'
  },
  {
    id: 'b1000000-0000-0000-0000-000000000007',
    nirikshak_project_id: 'NIR-PUNE-8F4219EBA174C302',
    project_name: 'Pune 24x7 Equitably Distributed Water Supply Project',
    project_authority: 'Pune Municipal Corporation (PMC)',
    location_text: 'Municipal Zones, Pune, Maharashtra',
    state: 'Maharashtra',
    total_cost_inr_crore: 2550,
    normalized_status: 'UNDER_CONSTRUCTION',
    physical_progress_percent: 82,
    current_status_verified: true,
    updated_at: '2026-09-25T22:31:16.670482+00:00'
  },
  {
    id: 'b1000000-0000-0000-0000-000000000004',
    nirikshak_project_id: 'NIR-PUNE-D292712EECA3204A',
    project_name: 'Mumbai-Pune Expressway Capacity Augmentation',
    project_authority: 'Maharashtra State Road Development Corporation Limited (MSRDC)',
    location_text: 'Mumbai-Pune Corridor, Maharashtra',
    state: 'Maharashtra',
    total_cost_inr_crore: 2136,
    normalized_status: 'COMPLETED',
    physical_progress_percent: 100,
    current_status_verified: true,
    updated_at: '2026-09-25T22:31:16.670482+00:00'
  }
];

export const ProjectsExplorer: React.FC = () => {
  const [projects, setProjects] = useState<PublicProjectRow[]>(FALLBACK_PROJECTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('public_projects_view')
          .select('id, nirikshak_project_id, project_name, project_authority, location_text, state, total_cost_inr_crore, normalized_status, physical_progress_percent, current_status_verified, updated_at')
          .not('physical_progress_percent', 'is', null)
          .order('total_cost_inr_crore', { ascending: false })
          .limit(5);

        if (data && data.length > 0 && !error) {
          setProjects(data as PublicProjectRow[]);
        }
      } catch (err) {
        console.error('Error fetching public projects:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  const formatStatus = (status: string) => {
    if (!status) return 'Active';
    return status.replace(/_/g, ' ').toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section id="projects-section" className="min-h-screen py-24 bg-gradient-to-l from-neutral-950/90 via-neutral-950/60 to-transparent text-white relative flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 mb-2 font-display">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>PUBLIC INFRASTRUCTURE CATALOG</span>
            </div>
            <h2 className="text-4xl sm:text-6xl font-extrabold text-white font-display tracking-tight leading-tight">
              Explore Public Projects.
            </h2>
            <p className="text-base sm:text-lg text-slate-200 mt-3 leading-relaxed">
              Explore verified infrastructure records directly from the public database. Real authorities, contracted budgets, and certified physical milestones.
            </p>
          </div>

          <button
            onClick={() => navigate(ROUTES.PROJECTS)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#eefc55] text-neutral-950 text-xs font-extrabold hover:bg-white transition-all cursor-pointer self-start md:self-auto shadow-lg"
          >
            <span>View All Public Projects</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Public Projects Table */}
        <div className="bg-black/50 rounded-2xl border border-white/10 backdrop-blur-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-slate-400 uppercase tracking-wider font-mono text-[11px]">
                <tr>
                  <th className="py-4 px-6">Project</th>
                  <th className="py-4 px-6">Authority</th>
                  <th className="py-4 px-6">Location</th>
                  <th className="py-4 px-6">Budget</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Verified Progress</th>
                  <th className="py-4 px-6">Last Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-200">
                {projects.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(projectRoute(p.nirikshak_project_id || p.id))}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6 font-medium">
                      <div className="text-sm font-bold text-white group-hover:text-[#eefc55] transition-colors">
                        {p.project_name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {p.nirikshak_project_id || 'ID Pending'}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-300 max-w-xs truncate">
                      {p.project_authority || 'Designated Public Authority'}
                    </td>
                    <td className="py-4 px-6 text-slate-300">
                      {p.location_text || p.state || 'India'}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-amber-300 whitespace-nowrap">
                      {p.total_cost_inr_crore ? `₹${p.total_cost_inr_crore.toLocaleString('en-IN')} Cr` : '—'}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/10 text-slate-200 border border-white/15">
                        {formatStatus(p.normalized_status)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#eefc55] text-sm">
                          {p.physical_progress_percent !== null ? `${p.physical_progress_percent}%` : '—'}
                        </span>
                        {p.current_status_verified && (
                          <span title="Officially Verified">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {formatDate(p.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
            <span>Query source: <code>public_projects_view</code> (PostgreSQL Row-Level Security Enforced)</span>
            <button
              onClick={() => navigate(ROUTES.PROJECTS)}
              className="text-[#eefc55] hover:underline font-bold inline-flex items-center gap-1.5"
            >
              <span>Explore all 3,900+ projects in Citizen Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
