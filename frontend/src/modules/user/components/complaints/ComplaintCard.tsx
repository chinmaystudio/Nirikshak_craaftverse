import { Icon } from "@/components/common/Icon";
import { ComplaintStatusBadge, PriorityBadge } from "@/components/common/StatusBadge";
import { SlaPill } from "./SLAIndicator";
import { Modal } from "@/components/common/Modal";
import { shortDate } from "@/utils/formatDate";
import { projectRoute } from "@/constants/routes";
import type { Complaint, EvidenceItem } from "@/types/complaint";

function findProjectName(projectId: string | null): string | null {
  if (!projectId) return null;
  return projectId;
}

export function ComplaintTableRow({ complaint }: { complaint: Complaint }): JSX.Element {
  const projectName = findProjectName(complaint.projectId);
  return (
    <tr className="hover:bg-surface-container-low transition-colors">
      <td className="p-3 font-mono font-bold text-primary whitespace-nowrap">{complaint.id}</td>
      <td className="p-3">
        <div className="font-semibold text-primary">{complaint.title.length > 52 ? `${complaint.title.slice(0, 52)}…` : complaint.title}</div>
        <div className="text-label-sm text-outline">{complaint.categoryLabel}</div>
      </td>
      <td className="p-3 whitespace-nowrap">
        {complaint.projectId ? (
          <a href={projectRoute(complaint.projectId)} className="text-secondary font-semibold hover:underline">
            {projectName ?? "Project"}
          </a>
        ) : (
          <span className="text-outline">—</span>
        )}
      </td>
      <td className="p-3">
        <ComplaintStatusBadge status={complaint.status} />
      </td>
      <td className="p-3 whitespace-nowrap">
        <SlaPill complaint={complaint} />
      </td>
      <td className="p-3 text-outline whitespace-nowrap">{shortDate(complaint.submittedAt)}</td>
      <td className="p-3 text-right">
        <a href={`#/complaints/${complaint.id}`} className="text-secondary font-bold hover:underline whitespace-nowrap">
          Inspect →
        </a>
      </td>
    </tr>
  );
}

export function ComplaintMobileCard({ complaint }: { complaint: Complaint }): JSX.Element {
  return (
    <a href={`#/complaints/${complaint.id}`} className="block bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/50 hover:border-primary/40 transition-colors">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-mono text-label-md font-bold text-primary">{complaint.id}</span>
        <ComplaintStatusBadge status={complaint.status} />
      </div>
      <div className="text-body-md font-semibold text-primary">{complaint.title.length > 80 ? `${complaint.title.slice(0, 80)}…` : complaint.title}</div>
      <div className="flex flex-wrap items-center gap-2 mt-2 text-label-sm text-on-surface-variant">
        <span>{complaint.categoryLabel}</span>
        <span className="text-outline">•</span>
        <span>Filed {shortDate(complaint.submittedAt)}</span>
        <span className="ml-auto">
          <SlaPill complaint={complaint} />
        </span>
      </div>
    </a>
  );
}

const TONES: Record<string, string> = {
  "safety-hazard": "from-red-200 to-red-50",
  "water-leakage": "from-blue-200 to-blue-50",
  environmental: "from-green-200 to-green-50",
  pothole: "from-amber-200 to-amber-50",
  "road-damage": "from-amber-200 to-amber-50",
  drainage: "from-cyan-200 to-cyan-50",
  other: "from-slate-200 to-slate-50",
  "construction-quality": "from-violet-200 to-violet-50"
};

interface EvidenceGalleryProps {
  items: EvidenceItem[];
}

export function EvidenceGallery({ items }: EvidenceGalleryProps): JSX.Element {
  const [selected, setSelected] = useEvidenceSelection(items);
  if (items.length === 0) {
    return (
      <div className="p-5 rounded-lg border border-dashed border-outline-variant text-center text-body-sm text-on-surface-variant">
        <Icon name="folder_off" className="text-[24px] block mx-auto mb-1 text-outline" />
        No evidence attached to this complaint.
      </div>
    );
  }
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((e, i) => {
          const tone = TONES[e.tone ?? "other"] ?? TONES.other;
          return (
            <button
              key={e.id}
              onClick={() => setSelected(i)}
              className="relative rounded-lg overflow-hidden h-32 border border-outline-variant/50 hover:ring-2 hover:ring-secondary/50 transition-all text-left"
              aria-label={`View evidence ${e.name}`}
            >
              {e.thumb ? (
                <img className="w-full h-full object-cover" alt={e.name} src={e.thumb} />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${tone} flex flex-col items-center justify-center gap-1 p-2 text-center`}>
                  <Icon name={e.kind === "video" ? "videocam" : "image"} className="text-[30px] text-primary-container/70" />
                  <span className="text-[11px] font-mono text-primary font-semibold break-all leading-tight">{e.name}</span>
                </div>
              )}
              <span className="absolute bottom-0 inset-x-0 bg-primary/85 text-surface-container-lowest px-2 py-1 text-[10px] font-medium truncate">{e.meta}</span>
            </button>
          );
        })}
      </div>
      <Modal open={selected !== null} onClose={() => setSelected(null)} title={selected !== null ? items[selected].name : undefined}>
        <div className="p-6">
          <div className="rounded-lg border border-outline-variant bg-gradient-to-br from-surface-container-high to-surface-container-low h-64 flex flex-col items-center justify-center gap-2">
            {selected !== null && items[selected].thumb ? (
              <img className="w-full h-full object-cover" alt={items[selected].name} src={items[selected].thumb} />
            ) : (
              <>
                <Icon name="image" className="text-[56px] text-primary-container/50" />
                <span className="font-mono text-label-md text-primary">{selected !== null ? items[selected].name : ""}</span>
                <span className="text-label-sm text-on-surface-variant text-center px-4">
                  {selected !== null ? items[selected].meta : ""}
                </span>
              </>
            )}
          </div>
          <p className="text-label-sm font-label-sm text-outline mt-3 text-center">
            Evidence files render as full previews in the production build. GPS stamp and timestamp are verified server-side.
          </p>
        </div>
      </Modal>
    </>
  );
}

import { useState } from "react";
function useEvidenceSelection(items: EvidenceItem[]): [number | null, (i: number | null) => void] {
  const [selected, setSelected] = useState<number | null>(null);
  void items;
  return [selected, setSelected];
}

export function OfficerCard({ complaint }: { complaint: Complaint }): JSX.Element {
  if (!complaint.officer) {
    return (
      <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/40 text-body-sm text-on-surface-variant">
        <Icon name="hourglass_empty" className="text-[18px] align-[-4px] text-secondary" /> An officer will be assigned when the department picks up
        this complaint (within SLA).
      </div>
    );
  }
  const o = complaint.officer;
  return (
    <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/40 flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center flex-shrink-0">
        <Icon name="engineering" className="text-[20px]" />
      </div>
      <div>
        <div className="text-label-md font-bold text-primary">{o.name}</div>
        <div className="text-body-sm text-on-surface-variant">{o.role}</div>
        <div className="text-label-sm text-outline mt-0.5 font-mono">{o.phone}</div>
      </div>
    </div>
  );
}

export function ResolutionPanel({ complaint }: { complaint: Complaint }): JSX.Element | null {
  if (!complaint.resolution) return null;
  const r = complaint.resolution;
  return (
    <div className="bg-green-50 border border-green-200 border-l-4 border-l-green-600 p-5 rounded-lg space-y-3">
      <div className="flex items-center gap-2 text-green-800 font-bold text-headline-sm">
        <Icon name="verified" className="text-[22px]" /> Resolution Recorded
      </div>
      <p className="text-body-sm text-on-surface">{r.note}</p>
      <div className="text-label-sm text-green-800 font-semibold">
        Closed {shortDate(r.closedAt)} by {complaint.department}
      </div>
      {r.evidence.length > 0 ? <EvidenceGallery items={r.evidence} /> : null}
    </div>
  );
}

export function FeedbackPanel({ complaint }: { complaint: Complaint }): JSX.Element | null {
  if (!complaint.feedback) return null;
  const fb = complaint.feedback;
  return (
    <section className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/60 space-y-2">
      <h2 className="text-headline-sm font-bold text-primary">Your Feedback</h2>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Icon key={i} name="star" className={`text-[20px] ${i < fb.rating ? "text-secondary" : "text-outline-variant"}`} />
        ))}
      </div>
      {fb.comment ? <p className="text-body-sm text-on-surface-variant">"{fb.comment}"</p> : null}
      <p className="text-label-sm text-outline">Submitted {shortDate(fb.at)} • Complaint closed</p>
    </section>
  );
}

export function PriorityChips({ complaint }: { complaint: Complaint }): JSX.Element {
  return (
    <div className="flex items-center gap-2 flex-wrap text-label-sm">
      <span className="px-2 py-0.5 rounded bg-surface-container text-primary font-mono font-bold">{complaint.categoryLabel}</span>
      <PriorityBadge priority={complaint.priority} />
    </div>
  );
}

export function RelatedProjectLink({ complaint }: { complaint: Complaint }): JSX.Element | null {
  if (!complaint.projectId) return null;
  return (
    <a href={projectRoute(complaint.projectId)} className="inline-flex items-center gap-1.5 text-secondary font-label-md font-bold hover:underline">
      <Icon name="link" className="text-[17px]" /> Related project on transparency record →
    </a>
  );
}
