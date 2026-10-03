import { Icon } from "@/components/common/Icon";
import { EmptyState } from "@/components/common/EmptyState";
import { relativeTime, shortDate } from "@/utils/formatDate";
import type { Project } from "@/types/project";

export function DocumentsTable({ project }: { project: Project }): JSX.Element {
  if (project.docs.length === 0) {
    return (
      <EmptyState
        icon="folder_off"
        title="No documents published yet"
        text="Tender documents, work orders and inspection reports appear here after each audit cycle."
      />
    );
  }
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/60 shadow-sm overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse text-body-sm">
          <thead>
            <tr className="bg-primary-container text-on-primary text-label-sm">
              <th className="p-3">Document</th>
              <th className="p-3">Details</th>
              <th className="p-3">Size</th>
              <th className="p-3">Type</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {project.docs.map((d) => {
              const isPdf = /\.pdf$/i.test(d.name) || /pdf/i.test(d.note);
              return (
                <tr key={d.name} className="hover:bg-surface-container-low transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2 font-semibold text-primary">
                      <Icon name={isPdf ? "picture_as_pdf" : "description"} className="text-[18px] text-primary" />
                      {d.name}
                    </div>
                  </td>
                  <td className="p-3 text-on-surface-variant">{d.note}</td>
                  <td className="p-3 text-outline whitespace-nowrap">{d.size}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-surface-container text-primary text-label-sm font-bold">{isPdf ? "PDF" : "DOC"}</span>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button
                      className="text-primary font-bold hover:underline mr-3"
                      onClick={() => toastDoc(d.name)}
                    >
                      View
                    </button>
                    <button className="text-secondary font-bold hover:underline" onClick={() => toastDoc(d.name)}>
                      Download
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { toast as showToast } from "@/hooks/useToast";
function toastDoc(name: string): void {
  showToast(`Downloading ${name} — public record copy.`, "info");
}

export function PhotoLog({ project }: { project: Project }): JSX.Element {
  if (project.photos.length === 0) {
    return (
      <div className="lg:col-span-7 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/60 space-y-3">
        <h2 className="text-headline-sm font-bold text-primary">Geotagged Inspection Photo Log</h2>
        <div className="p-6 rounded-lg border border-dashed border-outline-variant text-center text-body-sm text-on-surface-variant">
          <Icon name="photo_camera" className="text-[28px] block mx-auto mb-1 text-outline" />
          First engineer inspection photos will appear here.
          <br />
          <span className="text-label-sm text-outline">Photos are GPS and timestamp verified before publishing.</span>
        </div>
      </div>
    );
  }
  return (
    <div className="lg:col-span-7 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/60 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-headline-sm font-bold text-primary">Geotagged Inspection Photo Log</h2>
        <span className="text-label-sm text-outline">Updated {relativeTime(project.latestUpdate.date)}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {project.photos.map((ph) => (
          <figure key={ph.caption} className="relative rounded overflow-hidden h-40 bg-surface-container">
            <img
              className="w-full h-full object-cover"
              loading="lazy"
              alt={ph.caption}
              src={ph.src}
              onError={(e) => {
                e.currentTarget.remove();
              }}
            />
            <figcaption className="absolute bottom-0 inset-x-0 bg-primary/80 text-surface-container-lowest p-1.5 text-label-sm font-label-sm">
              {ph.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

export function ImportantDates({ project }: { project: Project }): JSX.Element {
  const d = project.dates;
  const rows: Array<[string, string]> = [
    ["Tender Published", d.tender],
    ["Tender Awarded", d.awarded],
    ["Work Started", d.started],
    [d.originalExpected && d.revisedExpected ? "Expected Completion (Revised)" : "Expected Completion", d.revisedExpected ?? d.expected]
  ];
  if (d.actual) rows.push(["Actual Completion", d.actual]);
  return (
    <div className="grid grid-cols-2 gap-3">
      {rows.map(([label, date]) => (
        <div key={label} className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/60">
          <div className="text-label-sm font-label-sm text-on-surface-variant">{label}</div>
          <div className="text-body-lg font-semibold text-primary mt-1 font-mono">{shortDate(date)}</div>
        </div>
      ))}
    </div>
  );
}
