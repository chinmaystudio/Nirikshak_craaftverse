import { shortDate } from "@/utils/formatDate";
import type { Project } from "@/types/project";

function PerfCell({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="p-2.5 bg-surface-container-low rounded border border-outline-variant/30">
      <div className="text-label-sm text-outline">{label}</div>
      <div className="text-headline-sm font-bold text-primary">{value}</div>
    </div>
  );
}

export function ContractorInfo({ project }: { project: Project }): JSX.Element {
  const c = project.contractor;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-7 bg-surface-container-lowest p-5 rounded-lg border border-outline-variant/60 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-label-sm font-label-sm text-secondary font-semibold uppercase tracking-wide">Works Contractor</div>
            <h3 className="text-headline-sm font-bold text-primary mt-0.5">{c.name}</h3>
          </div>
          <div className="text-right">
            <div className="text-label-sm text-outline">Contract Value</div>
            <div className="text-label-md font-bold text-primary">₹{c.contractValue} Cr</div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <PerfCell label="On-Time Record" value={c.performance.onTime} />
          <PerfCell label="Quality Rating" value={c.performance.quality} />
          <PerfCell label="Safety Score" value={c.performance.safety} />
          <PerfCell label="Disputes" value={c.performance.disputes} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-body-sm">
          <div className="p-3 bg-surface-container-low rounded border border-outline-variant/30">
            <span className="text-on-surface-variant">Contract Start: </span>
            <strong className="text-primary">{shortDate(c.start)}</strong>
          </div>
          <div className="p-3 bg-surface-container-low rounded border border-outline-variant/30">
            <span className="text-on-surface-variant">Duration: </span>
            <strong className="text-primary">{c.duration}</strong>
          </div>
        </div>
        <div className="p-3 rounded bg-amber-50 border border-amber-200 text-body-sm text-amber-900">
          <span className="font-bold">Current status: </span>
          {c.currentStatus}
        </div>
      </div>
      <div className="lg:col-span-5 bg-surface-container-lowest p-5 rounded-lg border border-outline-variant/60 space-y-3">
        <h3 className="text-headline-sm font-bold text-primary">Previous Public Projects</h3>
        {c.prevProjects.length > 0 ? (
          <div className="space-y-2">
            {c.prevProjects.map((x) => (
              <div key={x.name} className="p-3 rounded bg-surface-container-low border border-outline-variant/30 flex items-center justify-between gap-2">
                <div>
                  <div className="text-label-md font-semibold text-primary">{x.name}</div>
                  <div className="text-label-sm text-outline">Completed {x.year}</div>
                </div>
                <span className="text-label-sm font-semibold text-secondary whitespace-nowrap">{x.note}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-body-sm text-on-surface-variant">First major public contract — performance tracked from this project.</p>
        )}
        <p className="text-label-sm font-label-sm text-outline pt-1 border-t border-outline-variant/30">
          Public-facing contractor data only. Financial and personnel details are governed by the disclosure policy.
        </p>
      </div>
    </div>
  );
}
