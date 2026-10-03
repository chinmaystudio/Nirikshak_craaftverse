import { Icon } from "@/components/common/Icon";
import { ProgressBar } from "@/components/common/ProgressBar";
import { ProjectStatusBadge } from "@/components/common/StatusBadge";
import { statusMeta, PROJECT_CATEGORY_ICONS } from "@/constants/projectStatuses";
import { formatCr } from "@/utils/formatCurrency";
import { shortDate } from "@/utils/formatDate";
import { projectRoute } from "@/constants/routes";
import type { Project } from "@/types/project";
import { navigate } from "@/app/router";

interface ProjectCardProps {
  project: Project;
  onOpen?: (project: Project) => void;
}

function HeaderMedia({ project }: { project: Project }): JSX.Element {
  const overlays = (
    <>
      <div className="absolute top-2.5 left-2.5">
        <ProjectStatusBadge status={project.status} />
      </div>
      <span className="absolute top-2.5 right-2.5 bg-primary-container/95 text-surface-container-lowest px-2 py-0.5 rounded text-label-sm font-label-sm font-mono">
        #{project.code}
      </span>
      {project.distanceKm != null ? (
        <span className="absolute bottom-2.5 left-2.5 bg-primary/85 text-on-primary px-2 py-0.5 rounded text-label-sm font-label-sm font-semibold">
          {project.distanceKm} km away
        </span>
      ) : null}
    </>
  );

  if (project.img) {
    return (
      <div className="relative h-44 bg-surface-container">
        <img
          className="w-full h-full object-cover"
          loading="lazy"
          alt={project.name}
          src={project.img}
          onError={(e) => {
            e.currentTarget.remove();
          }}
        />
        {overlays}
      </div>
    );
  }
  const icon = PROJECT_CATEGORY_ICONS[project.category] ?? "construction";
  return (
    <div className="relative h-44 bg-gradient-to-br from-primary-container to-tertiary flex items-center justify-center">
      <span className="absolute inset-0 opacity-10 flex items-center justify-center">
        <Icon name={icon} className="text-[130px] text-surface-container-lowest" />
      </span>
      <div className="relative flex items-center gap-2 text-secondary-fixed">
        <Icon name={icon} className="text-[28px]" />
        <span className="text-label-md font-label-md font-bold uppercase tracking-widest">{project.category}</span>
      </div>
      {overlays}
    </div>
  );
}

export function ProjectCard({ project, onOpen }: ProjectCardProps): JSX.Element {
  const meta = statusMeta(project.status);
  const open = (): void => {
    if (onOpen) onOpen(project);
    else navigate(projectRoute(project.id));
  };
  return (
    <article className="bg-surface-container-lowest border border-outline-variant/60 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <HeaderMedia project={project} />
      <div className="p-4 space-y-2.5 flex-1">
        <div className="text-label-sm font-label-sm text-secondary font-semibold">
          {project.category} • {project.city}
        </div>
        <h3 className="text-headline-sm font-headline-sm font-bold text-primary leading-snug">{project.name}</h3>
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <ProjectStatusBadge status={project.status} />
          <span className="text-label-md font-bold text-primary tabular-nums">{project.progress}% complete</span>
        </div>
        <div className="pt-1">
          <ProgressBar pct={project.progress} toneClass={meta.barClass} />
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2 mt-1 border-t border-outline-variant/30">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-outline font-bold">Budget</div>
            <div className="text-body-md font-bold text-primary">{formatCr(project.finance?.sanctionedAmount ?? 0)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-outline font-bold">Expected</div>
            <div className="text-body-md font-semibold text-primary">
              {shortDate(project.dates?.actual ?? project.dates?.revisedExpected ?? project.dates?.expected ?? '')}
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 pt-0">
        <button
          onClick={open}
          data-open-project={project.id}
          className="w-full py-2 text-center rounded border border-primary text-primary font-label-md text-label-md hover:bg-surface-container transition-colors"
        >
          View Project
        </button>
      </div>
    </article>
  );
}

export function ProjectMiniRow({ project, onOpen }: { project: Project; onOpen?: (project: Project) => void }): JSX.Element {
  const meta = statusMeta(project.status);
  const icon = PROJECT_CATEGORY_ICONS[project.category] ?? "construction";
  return (
    <button
      data-open-project={project.id}
      onClick={() => onOpen?.(project)}
      className="w-full text-left bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/50 hover:border-primary/40 hover:shadow-sm transition-all flex items-center gap-4"
    >
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-white flex-shrink-0 ${meta.dotClass}`}>
        <Icon name={icon} className="text-[22px]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-label-sm font-label-sm text-outline font-mono">#{project.code}</div>
        <div className="text-body-md font-semibold text-primary truncate">{project.name}</div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-24 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
            <div className={`${meta.barClass} h-full`} style={{ width: `${project.progress}%` }} />
          </div>
          <span className="text-label-sm text-on-surface-variant">{project.progress}%</span>
          {project.distanceKm != null ? <span className="text-label-sm text-outline">• {project.distanceKm} km</span> : null}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className={`text-label-sm font-bold ${project.status === "delayed" ? "text-error" : "text-secondary"}`}>{meta.label}</div>
        <div className="text-label-sm text-outline">{formatCr(project.finance?.sanctionedAmount ?? 0)}</div>
      </div>
    </button>
  );
}
