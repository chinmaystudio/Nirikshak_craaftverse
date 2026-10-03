import { Icon } from "@/components/common/Icon";
import { ProgressBar } from "@/components/common/ProgressBar";
import { statusMeta } from "@/constants/projectStatuses";
import { formatCr } from "@/utils/formatCurrency";
import { shortDate } from "@/utils/formatDate";
import type { Project } from "@/types/project";

export function ProjectHero({ project }: { project: Project }): JSX.Element {
  const meta = statusMeta(project.status);
  return (
    <div className="bg-surface-container-lowest p-5 md:p-6 rounded-xl border border-outline-variant/60 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-8 space-y-3 min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-label-sm font-label-sm">
          <span className="text-[11px] font-bold uppercase tracking-widest text-outline">Project</span>
          <span className="font-mono bg-surface-container px-2 py-0.5 rounded text-primary font-bold">#{project.code}</span>
          <span className="text-secondary font-semibold">
            {project.category} • {project.ward.includes("—") ? project.ward : `${project.city}, ${project.state}`}
          </span>
          {project.distanceKm != null ? (
            <span className="text-outline flex items-center gap-1">
              <Icon name="near_me" className="text-[14px]" /> {project.distanceKm} km away
            </span>
          ) : null}
        </div>
        <h1 className="text-[26px] md:text-[30px] leading-tight font-bold text-primary">{project.name}</h1>
        <div className="flex items-center gap-2.5">
          <span className={`${meta.chipClass} px-2.5 py-0.5 rounded-full text-label-md font-bold`}>{meta.label}</span>
          <span className="text-label-md font-semibold text-on-surface-variant tabular-nums">{project.progress}% complete</span>
        </div>
        <p className="text-body-md text-on-surface-variant leading-relaxed max-w-3xl">{project.description}</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-body-sm pt-2 border-t border-outline-variant/30">
          <div>
            <span className="text-on-surface-variant">Nodal Agency: </span>
            <strong className="text-primary">{project.agency}</strong>
          </div>
          <div>
            <span className="text-on-surface-variant">Contractor: </span>
            <strong className="text-primary">{project.contractor.name}</strong>
          </div>
          <div>
            <span className="text-on-surface-variant">Engineer: </span>
            <strong className="text-primary">{project.engineer}</strong>
          </div>
        </div>
      </div>
      <div className="lg:col-span-4">
        <div className="bg-surface-container-low border border-outline-variant/50 rounded-lg p-4 space-y-3 h-full flex flex-col">
          <div className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Project Status</div>
          <div className="flex items-center justify-between gap-3">
            <span className={`${meta.chipClass} px-3 py-1 rounded-full text-label-md font-bold`}>{meta.label}</span>
            <span className="text-[32px] leading-none font-bold text-primary tabular-nums">
              {project.progress}
              <span className="text-body-md text-on-surface-variant font-semibold">%</span>
            </span>
          </div>
          <ProgressBar pct={project.progress} toneClass={meta.barClass} />
          <dl className="space-y-2 text-body-sm pt-1">
            <div className="flex justify-between gap-3">
              <dt className="text-on-surface-variant">Expected Completion</dt>
              <dd className="font-semibold text-primary font-mono">
                {shortDate(project.dates.actual ?? project.dates.revisedExpected ?? project.dates.expected)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-on-surface-variant">Sanctioned</dt>
              <dd className="font-semibold text-primary">{formatCr(project.finance.sanctionedAmount)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-on-surface-variant">Current Phase</dt>
              <dd className="font-semibold text-primary text-right">
                {project.phase.length > 30 ? `${project.phase.slice(0, 30)}…` : project.phase}
              </dd>
            </div>
          </dl>
          <div className="mt-auto pt-3 border-t border-outline-variant/40 text-label-sm text-outline">
            <Icon name="call" className="text-[14px] align-[-3px]" /> Grievance hotline:{" "}
            <span className="font-mono font-semibold text-secondary">{project.hotline}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function IdentityTable({ project }: { project: Project }): JSX.Element {
  const rows: Array<[string, string]> = [
    ["Project ID", `#${project.code}`],
    ["Category", project.category],
    ["Department", project.department],
    ["Nodal Agency", project.agency],
    ["Ward", project.ward],
    ["Location", `${project.city}, ${project.state}`],
    ["Current Status", statusMeta(project.status).label],
    ["Completion", `${project.progress}%`]
  ];
  return (
    <dl className="space-y-2 text-body-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3 py-1.5 border-b border-outline-variant/20 last:border-0">
          <dt className="text-on-surface-variant flex-shrink-0">{k}</dt>
          <dd className="text-primary font-semibold text-right">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function VisionStrip({ projectId }: { projectId: string }): JSX.Element {
  return (
    <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
      <span className="text-body-sm text-on-surface-variant flex items-center gap-2">
        <Icon name="photo_camera" className="text-[19px] text-secondary" />
        <span>
          <strong className="text-primary">Verify what you see.</strong> Have a concern about this infrastructure? Analyze it with NIRIKSHAK Vision.
        </span>
      </span>
      <a
        href={`#/vision?project=${projectId}`}
        className="px-3.5 py-2 rounded bg-primary-container text-on-primary text-label-md font-label-md font-bold flex items-center gap-1.5 hover:bg-primary transition-colors"
      >
        <Icon name="photo_camera" className="text-[17px]" /> Take a Photo
      </a>
    </section>
  );
}
