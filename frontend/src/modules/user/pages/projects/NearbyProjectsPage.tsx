import { useState } from "react";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { StatCard, PageHeader } from "@/components/common/StatCard";
import { LoadingSkeleton } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { Drawer } from "@/components/common/Drawer";
import { ProjectCard, ProjectMiniRow } from "@/components/projects/ProjectCard";
import { ProjectMap, MapLegend } from "@/components/projects/ProjectMap";
import { useNavigate } from "@/app/router";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/useToast";
import { projectsToCsv } from "@/utils/csv";
import { downloadCsv } from "@/utils/download";
import { ROUTES } from "@/constants/routes";
import { PROJECT_CATEGORY_LABELS, PROJECT_CATEGORY_ORDER, PROJECT_STATUS_ORDER, statusMeta } from "@/constants/projectStatuses";
import type { ProjectCategory, ProjectStatus } from "@/types/project";
import type { Project } from "@/types/project";

export function NearbyProjectsPage(): JSX.Element {
  const navigate = useNavigate();
  const auth = useAuth();
  const { loading, error, projects, filterProjects, reload } = useProjects();
  const { user } = auth;

  const [query, setQuery] = useState<{ q: string; contractor: string; distanceKm: number | null; scope: "ward" | "pune" | "all" }>({
    q: "",
    contractor: "all",
    distanceKm: null,
    scope: "pune"
  });
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [view, setView] = useState<"map" | "list">("map");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);

  const departmentOptions = Array.from(new Set(projects.map((p) => p.department).filter(Boolean) as string[])).sort();
  const contractors = ["all", ...Array.from(new Set(projects.map((p) => p.contractor?.name).filter(Boolean) as string[])).sort()];

  const filtered = filterProjects(projects, {
    q: query.q,
    categories,
    statuses,
    departments,
    contractor: query.contractor,
    distanceKm: query.distanceKm,
    scope: query.scope
  });
  const sorted = [...filtered].sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99));
  const selected = sorted.find((p) => p.id === selectedId) ?? null;

  const toggle = <T,>(list: T[], value: T): T[] => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const resetFilters = (): void => {
    setQuery({ q: "", contractor: "all", distanceKm: null, scope: query.scope });
    setCategories([]);
    setStatuses([]);
    setDepartments([]);
    setSelectedId(null);
  };

  const openProject = (p: Project): void => {
    setSelectedId(p.id);
    navigate(`/projects/${p.id}`);
  };

  const filtersContent = (
    <div className="space-y-4">
      <FilterGroup label="Project Type">
        {PROJECT_CATEGORY_ORDER.map((c) => (
          <Chip key={c} label={PROJECT_CATEGORY_LABELS[c]} checked={categories.includes(c)} onToggle={() => setCategories(toggle(categories, c))} />
        ))}
      </FilterGroup>
      <FilterGroup label="Status">
        {PROJECT_STATUS_ORDER.map((s) => (
          <Chip key={s} label={statusMeta(s).label} checked={statuses.includes(s)} onToggle={() => setStatuses(toggle(statuses, s))} />
        ))}
      </FilterGroup>
      <FilterGroup label="Department">
        {departmentOptions.map((d) => (
          <Chip
            key={d}
            label={d.length > 26 ? `${d.slice(0, 26)}…` : d}
            checked={departments.includes(d)}
            onToggle={() => setDepartments(toggle(departments, d))}
          />
        ))}
      </FilterGroup>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-outline-variant/40">
        <div>
          <label htmlFor="f-contractor" className="block text-label-sm font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
            Contractor
          </label>
          <select
            id="f-contractor"
            value={query.contractor}
            onChange={(e) => setQuery({ ...query, contractor: e.target.value })}
            className="w-full px-2.5 py-1.5 text-body-sm border border-outline-variant rounded bg-surface-container-lowest"
          >
            {contractors.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All contractors" : c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-distance" className="block text-label-sm font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
            Distance
          </label>
          <select
            id="f-distance"
            value={query.distanceKm == null ? "all" : String(query.distanceKm)}
            onChange={(e) => setQuery({ ...query, distanceKm: e.target.value === "all" ? null : Number(e.target.value) })}
            className="w-full px-2.5 py-1.5 text-body-sm border border-outline-variant rounded bg-surface-container-lowest"
          >
            <option value="all">Any distance</option>
            <option value="2">Within 2 km</option>
            <option value="5">Within 5 km</option>
            <option value="10">Within 10 km</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="soft" icon="restart_alt" className="flex-1" onClick={resetFilters}>
          Clear Filters
        </Button>
        <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
          Apply Filters
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Nearby Projects"
        sub="Discover public works around you with complete transparency — budgets, contractors, progress and timelines."
        actions={
          <Button
            variant="outline"
            icon="download"
            onClick={() => {
              downloadCsv("nirikshan-projects.csv", projectsToCsv(filtered));
              toast("CSV transparency report downloaded.", "success");
            }}
          >
            Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Projects" value={projects.length} sub="Across registered agencies" icon="construction" />
        <StatCard label="In Your Ward" value={projects.filter((p) => p.ward.includes("Ward 12")).length} sub={user?.ward ?? "Ward 12 — Kothrud West"} icon="near_me" />
        <StatCard label="On Track" value={projects.filter((p) => p.status === "on-track").length} sub="Meeting schedule" icon="task_alt" />
        <StatCard
          label="Delayed"
          value={projects.filter((p) => p.status === "delayed").length}
          sub="Under corrective action"
          icon="running_with_errors"
          subTone="text-error"
          circleClass="bg-error-container/40 text-error"
        />
      </div>

      <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/60 shadow-sm flex flex-col md:flex-row md:items-center gap-2.5">
        <div className="relative flex-1">
          <Icon name="search" className="absolute left-2.5 top-2.5 text-on-surface-variant text-[20px]" />
          <input
            value={query.q}
            onChange={(e) => setQuery({ ...query, q: e.target.value })}
            placeholder="Search projects…"
            className="w-full pl-9 pr-3 py-2 rounded bg-surface border border-outline-variant text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={query.scope}
            onChange={(e) => setQuery({ ...query, scope: e.target.value as "ward" | "pune" | "all" })}
            className="px-2.5 py-2 rounded border border-outline-variant bg-surface-container-lowest text-body-sm"
            aria-label="Location scope"
          >
            <option value="ward">My Ward (12)</option>
            <option value="pune">All Pune</option>
            <option value="all">All India</option>
          </select>
          <div className="flex rounded border border-outline-variant overflow-hidden" role="group" aria-label="View mode">
            <button
              onClick={() => setView("map")}
              className={`px-3.5 py-2 text-label-md font-bold flex items-center gap-1 ${view === "map" ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"}`}
            >
              <Icon name="map" className="text-[16px]" /> Map
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3.5 py-2 text-label-md font-bold flex items-center gap-1 ${view === "list" ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"}`}
            >
              <Icon name="view_list" className="text-[16px]" /> List
            </button>
          </div>
          <Button variant="outline" icon="tune" onClick={() => setFiltersOpen(true)}>
            Filters <span className="text-outline font-normal">({sorted.length})</span>
          </Button>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/60 shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-body-sm text-on-surface-variant flex items-center gap-2">
          <Icon name="photo_camera" className="text-[19px] text-secondary" />
          <span>
            <strong className="text-primary">Looking at infrastructure around you?</strong> Identify any road, bridge or site with your camera.
          </span>
        </span>
        <Button variant="primary" icon="photo_camera" size="sm" onClick={() => navigate(ROUTES.VISION)}>
          Identify with Camera
        </Button>
      </div>

      {loading ? (
        <LoadingSkeleton kind="cards" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : view === "map" ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          <div className="xl:col-span-7 order-2 xl:order-1 bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-outline-variant/40">
              <div className="text-label-md font-bold text-primary flex items-center gap-2">
                <Icon name="map" className="text-[20px] text-secondary" /> Pune Ward Map — Project Locations
              </div>
              <span className="text-label-sm text-outline">{sorted.filter((p) => p.mapPoint).length} pinned projects</span>
            </div>
            <div id="city-map" className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-surface-container">
              <ProjectMap
                projects={sorted}
                selectedId={selectedId}
                userLabel={user?.ward.split("—")[0].trim() ?? "Ward 12"}
                onSelect={(id) => {
                  setSelectedId(id);
                  if (window.innerWidth < 1280) {
                    document.getElementById("map-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
              />
            </div>
            <MapLegend />
          </div>
          <div className="xl:col-span-5 order-1 xl:order-2 space-y-3">
            {selected ? (
              <div id="map-detail" className="bg-surface-container-lowest rounded-xl border-2 border-secondary/50 shadow-sm overflow-hidden">
                <ProjectCard project={selected} onOpen={openProject} />
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant p-5 text-center text-body-sm text-on-surface-variant">
                <Icon name="touch_app" className="text-[26px] block mx-auto mb-1 text-outline" />
                <strong className="text-primary">Select a pin</strong>
                <br />
                Tap any project marker to inspect its transparency dossier.
              </div>
            )}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 p-3 max-h-[26rem] overflow-y-auto custom-scrollbar space-y-2.5">
              <div className="flex items-center justify-between pb-1.5">
                <div className="text-label-md font-bold text-primary">Nearby list ({sorted.length})</div>
                <button
                  onClick={() => document.getElementById("city-map")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="xl:hidden text-label-md font-bold text-secondary flex items-center gap-1"
                >
                  <Icon name="map" className="text-[15px]" /> View Map
                </button>
              </div>
              {sorted.length > 0 ? (
                sorted.map((p) => <ProjectMiniRow key={p.id} project={p} onOpen={openProject} />)
              ) : (
                <p className="text-body-sm text-on-surface-variant p-3">No projects match your filters in this area.</p>
              )}
            </div>
          </div>
        </div>
      ) : sorted.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sorted.slice(0, visibleCount).map((p) => (
              <ProjectCard key={p.id} project={p} onOpen={openProject} />
            ))}
          </div>
          {visibleCount < sorted.length && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((c) => c + 24)}
              >
                Load More Projects (Showing {Math.min(visibleCount, sorted.length)} of {sorted.length})
              </Button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon="search_off"
          title="No projects match your filters"
          text="Try widening the distance, clearing a filter, or switching the location scope."
          ctaLabel="Clear Filters"
          ctaRoute={ROUTES.PROJECTS}
        />
      )}

      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
        {filtersContent}
      </Drawer>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div>
      <div className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }): JSX.Element {
  return (
    <label className="cursor-pointer select-none">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onToggle} />
      <span
        className={`inline-flex items-center px-3 py-1.5 rounded-full border text-label-md transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 ${
          checked ? "bg-primary text-on-primary border-primary" : "border-outline-variant text-on-surface-variant"
        }`}
      >
        {label}
      </span>
    </label>
  );
}
