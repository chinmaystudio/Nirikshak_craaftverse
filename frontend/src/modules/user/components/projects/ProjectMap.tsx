import { Icon } from "@/components/common/Icon";
import { statusMeta, PROJECT_CATEGORY_ICONS } from "@/constants/projectStatuses";
import type { Project, MapPoint } from "@/types/project";

const SVG_BASE = (
  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 640" preserveAspectRatio="none" aria-hidden="true">
    <rect width="1000" height="640" fill="#e8effb" />
    <g stroke="#dbe4f5" strokeWidth="1">
      {Array.from({ length: 19 }, (_, i) => (
        <line key={`v${i}`} x1={i * 55} y1={0} x2={i * 55} y2={640} />
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 55} x2={1000} y2={i * 55} />
      ))}
    </g>
    <ellipse cx={150} cy={140} rx={120} ry={70} fill="#d3e9da" opacity={0.8} />
    <ellipse cx={880} cy={520} rx={140} ry={80} fill="#d3e9da" opacity={0.8} />
    <ellipse cx={820} cy={120} rx={90} ry={55} fill="#d3e9da" opacity={0.6} />
    <path d="M -20 300 C 150 250, 260 380, 420 330 S 700 260, 830 340 S 990 300, 1030 330" fill="none" stroke="#9cc3ec" strokeWidth={22} strokeLinecap="round" opacity={0.85} />
    <path d="M 300 660 C 320 520, 380 430, 430 380" fill="none" stroke="#9cc3ec" strokeWidth={12} strokeLinecap="round" opacity={0.7} />
    <g stroke="#ffffff" strokeWidth={10} strokeLinecap="round" fill="none">
      <path d="M 0 200 L 340 210 L 620 160 L 1000 180" />
      <path d="M 0 430 L 260 420 L 520 470 L 760 440 L 1000 470" />
      <path d="M 480 0 L 470 220 L 520 400 L 500 640" />
      <path d="M 120 640 L 220 470 L 300 330" />
      <path d="M 660 640 L 700 480 L 780 360 L 900 300" />
    </g>
    <g stroke="#c4c6cf" strokeWidth={1.4} strokeDasharray="7 6" fill="none">
      <path d="M 230 90 L 640 70 L 830 200 L 850 430 L 620 570 L 260 560 L 150 380 L 180 180 Z" />
    </g>
    <g fill="#64748b" fontFamily="Inter, sans-serif" fontSize={17} fontWeight={600}>
      <text x={38} y={188}>Paud Rd</text>
      <text x={60} y={418}>Karve Rd</text>
      <text x={492} y={360} transform="rotate(90 492 360)">Katraj–Kondhwa Rd</text>
      <text x={700} y={250}>Baner Rd</text>
      <text x={560} y={322} fill="#4f7fb8" fontSize={15}>Mula–Mutha River</text>
      <text x={250} y={112} fill="#8aa0b8" fontSize={14}>WARD 9</text>
      <text x={330} y={545} fill="#8aa0b8" fontSize={14}>WARD 12</text>
      <text x={640} y={470} fill="#8aa0b8" fontSize={14}>WARD 14</text>
    </g>
  </svg>
);

interface MapMarkerProps {
  project: Project;
  selected: boolean;
  onSelect: (id: string) => void;
}

function MapMarker({ project, selected, onSelect }: MapMarkerProps): JSX.Element {
  const meta = statusMeta(project.status);
  const icon = PROJECT_CATEGORY_ICONS[project.category] ?? "construction";
  const point: MapPoint = project.mapPoint ?? { x: 0, y: 0 };
  return (
    <button
      className={`map-pin group absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white z-10 ${
        selected ? "is-selected ring-4 ring-secondary/40" : ""
      } ${meta.dotClass}`}
      style={{ left: `${point.x}%`, top: `${point.y}%` }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(project.id);
      }}
      aria-label={project.name}
      title={project.name}
    >
      <Icon name={icon} className="text-[18px]" />
      <span className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap bg-primary text-on-primary text-[11px] font-semibold px-2 py-1 rounded shadow-pop z-40">
        {project.name.length > 34 ? `${project.name.slice(0, 34)}…` : project.name}
      </span>
    </button>
  );
}

interface ProjectMapProps {
  projects: Project[];
  selectedId: string | null;
  userLabel?: string;
  pinMode?: boolean;
  onPinSelect?: (point: MapPoint) => void;
  onSelect?: (id: string) => void;
}

export function ProjectMap({ projects, selectedId, userLabel = "Ward 12", pinMode = false, onPinSelect, onSelect }: ProjectMapProps): JSX.Element {
  const pinned = projects.filter((p) => p.mapPoint !== null);
  return (
    <div
      className={`relative w-full h-full select-none ${pinMode ? "cursor-crosshair" : ""}`}
      data-map-canvas
      onClick={(e) => {
        if (!pinMode || !onPinSelect) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
        const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
        onPinSelect({ x: Math.max(2, Math.min(98, x)), y: Math.max(3, Math.min(97, y)) });
      }}
    >
      {SVG_BASE}
      <div className="absolute -translate-x-1/2 -translate-y-1/2 z-20" style={{ left: "38%", top: "55%" }}>
        <div className="relative pulse-ring w-4 h-4 rounded-full bg-info border-2 border-white shadow" />
        <span className="absolute left-5 top-0 whitespace-nowrap text-[11px] font-bold text-info bg-white/90 border border-info/30 rounded px-1.5 py-0.5">
          You • {userLabel}
        </span>
      </div>
      {pinned.map((p) => (
        <MapMarker key={p.id} project={p} selected={p.id === selectedId} onSelect={(id) => onSelect?.(id)} />
      ))}
    </div>
  );
}

export function MapLegend(): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-3 py-2 bg-surface-container-lowest/95 border-t border-outline-variant/40 text-label-sm font-label-sm">
      <span className="font-bold text-primary">Legend:</span>
      {[
        ["bg-secondary", "On Track"],
        ["bg-error", "Delayed"],
        ["bg-green-600", "Completed"],
        ["bg-info", "Under Review"]
      ].map(([cls, label]) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className={`w-3 h-3 rounded-full ${cls}`} /> {label}
        </span>
      ))}
      <span className="ml-auto text-outline hidden sm:inline">Tap a pin to inspect • Blue dot: your location</span>
    </div>
  );
}
