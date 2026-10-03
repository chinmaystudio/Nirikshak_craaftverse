import { useRef } from "react";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { toast } from "@/hooks/useToast";
import { validateImageFile, formatFileSize } from "@/utils/validation";
import { readFileAsDataUrl } from "@/utils/download";
import { ROUTES } from "@/constants/routes";
import type { ReportDraft, EvidenceDraftItem } from "@/types/report";

interface EvidenceUploaderProps {
  draft: ReportDraft;
  onChange: (patch: Partial<ReportDraft>) => void;
}

export function EvidenceUploader({ draft, onChange }: EvidenceUploaderProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  let seq = draft.evidence.length;

  const handleFiles = (files: FileList | null): void => {
    if (!files) return;
    void (async () => {
      const added: EvidenceDraftItem[] = [];
      for (const file of Array.from(files)) {
        const validation = validateImageFile(file);
        if (!validation.ok) {
          toast(validation.error ?? "File not accepted.", "error");
          continue;
        }
        const dataUrl = await readFileAsDataUrl(file);
        seq += 1;
        added.push({
          id: `ev-draft-${Date.now()}-${seq}`,
          name: file.name,
          size: formatFileSize(file.size),
          kind: "image",
          thumb: dataUrl,
        });
      }
      if (added.length > 0) {
        onChange({ evidence: [...draft.evidence, ...added] });
        toast(`${added.length} evidence file(s) attached.`, "success");
      }
    })();
  };

  const remove = (id: string): void => {
    onChange({ evidence: draft.evidence.filter((e) => e.id !== id) });
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full border-2 border-dashed border-outline-variant rounded-lg p-6 text-center hover:bg-surface-container-low transition-colors cursor-pointer"
      >
        <Icon name="cloud_upload" className="text-[34px] text-secondary" />
        <p className="text-body-md font-semibold text-primary mt-1">Click to add photos or videos</p>
        <p className="text-label-sm text-outline">JPG / PNG / MP4 • up to 10 MB each • geotag preferred (GIGW 3.0 compliant)</p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/40 flex flex-wrap items-center justify-between gap-2">
        <span className="text-label-sm text-on-surface-variant flex items-center gap-1.5">
          <Icon name="auto_awesome" className="text-[16px] text-secondary" /> Want help identifying the problem?
        </span>
        <Button variant="primary" size="sm" icon="photo_camera" onClick={() => window.location.assign(`${ROUTES.VISION}?next=report`)}>
          Analyze with NIRIKSHAK Vision
        </Button>
      </div>
      <div id="evidence-grid" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {draft.evidence.map((e) => (
          <div key={e.id} className="relative rounded-lg overflow-hidden border border-outline-variant/50 h-28 bg-gradient-to-br from-surface-container-high to-surface-container-low">
            {e.thumb ? (
              <img className="w-full h-full object-cover" alt={e.name} src={e.thumb} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-1.5 text-center">
                <Icon name="image" className="text-[24px] text-primary-container/60" />
                <span className="text-[10px] font-mono text-primary break-all leading-tight px-1">{e.name}</span>
              </div>
            )}
            {e.fromVision ? (
              <span className="absolute bottom-0 inset-x-0 bg-primary/85 text-surface-container-lowest text-[9px] font-bold px-1.5 py-0.5 text-center">
                FROM NIRIKSHAK VISION
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => remove(e.id)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-error text-on-error flex items-center justify-center"
              aria-label={`Remove ${e.name}`}
            >
              <Icon name="close" className="text-[14px]" />
            </button>
          </div>
        ))}
      </div>
      <div className="bg-surface-container-low p-3 rounded text-label-sm text-on-surface-variant flex items-start gap-2">
        <Icon name="verified_user" className="text-[18px] text-secondary flex-shrink-0" />
        <span>
          Evidence with GPS and timestamp is verified automatically and carries more weight in departmental review. Do not upload personal or
          sensitive information — faces and number plates are auto-blurred for privacy.
        </span>
      </div>
    </div>
  );
}
