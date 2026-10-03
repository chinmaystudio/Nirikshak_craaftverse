import { MapLegend, ProjectMap } from "@/components/projects/ProjectMap";
import { Icon } from "@/components/common/Icon";
import { useLocation } from "@/hooks/useLocation";
import { formatGps } from "@/utils/location";
import { WARDS } from "@/constants/issueCategories";
import type { ReportDraft, ReportPin } from "@/types/report";

interface LocationPickerProps {
  draft: ReportDraft;
  onChange: (patch: Partial<ReportDraft>) => void;
}

function toPin(point: { x: number; y: number }): ReportPin {
  return {
    x: point.x,
    y: point.y,
    lat: (18.46 + (100 - point.y) * 0.0022).toFixed(4),
    lng: (73.74 + point.x * 0.0013).toFixed(4)
  };
}

export function LocationPicker({ draft, onChange }: LocationPickerProps): JSX.Element {
  const { locating, locate } = useLocation();

  const useCurrent = (): void => {
    void locate().then((pos) => {
      if (!pos) return;
      onChange({ gps: formatGps(pos.lat, pos.lng), address: draft.address || "Kothrud, Paud Road (approximate location)" });
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="f-address" className="block text-label-md font-label-md text-primary mb-1">
          Address / landmark <span className="text-error">*</span>
        </label>
        <input
          id="f-address"
          value={draft.address}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder="e.g. Near Vitthalwadi bridge, Sinhagad Road"
          className="w-full px-3 py-2 border border-outline-variant rounded text-body-md focus:ring-2 focus:ring-primary-container focus:border-transparent"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="f-ward" className="block text-label-md font-label-md text-primary mb-1">
            Ward <span className="text-error">*</span>
          </label>
          <select
            id="f-ward"
            value={draft.ward}
            onChange={(e) => onChange({ ward: e.target.value })}
            className="w-full px-3 py-2 border border-outline-variant rounded text-body-md bg-surface-container-lowest"
          >
            {WARDS.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
        </div>
        <div>
          <span className="block text-label-md font-label-md text-primary mb-1">GPS location</span>
          <div className="flex gap-2">
            <input
              id="f-gps"
              readOnly
              value={draft.gps ?? (draft.pin ? `${draft.pin.lat}, ${draft.pin.lng}` : "")}
              placeholder="Not set"
              className="flex-1 px-3 py-2 border border-outline-variant rounded text-body-sm font-mono bg-surface-container-low"
            />
            <button
              type="button"
              onClick={useCurrent}
              disabled={locating}
              className="px-3 py-2 rounded border border-primary text-primary text-label-md font-label-md hover:bg-surface-container flex items-center gap-1 flex-shrink-0 disabled:opacity-50"
            >
              <Icon name={locating ? "hourglass_top" : "my_location"} className="text-[18px]" />
              {locating ? "Locating…" : "Use Current"}
            </button>
          </div>
        </div>
      </div>
      <div>
        <span className="block text-label-md font-label-md text-primary mb-2">Or pin it on the map</span>
        <div className="rounded-lg border border-outline-variant/60 overflow-hidden">
          <div className="relative w-full aspect-[16/9] bg-surface-container">
            <ProjectMap projects={[]} pinMode selectedId={null} onPinSelect={(point) => onChange({ pin: toPin(point) })} />
            {draft.pin ? (
              <div
                className="absolute -translate-x-1/2 -translate-y-full z-30 pointer-events-none"
                style={{ left: `${draft.pin.x}%`, top: `${draft.pin.y}%` }}
              >
                <Icon name="location_on" className="text-[34px] text-error drop-shadow" />
              </div>
            ) : null}
          </div>
        </div>
        <p className="text-label-sm text-outline mt-1.5 flex items-center gap-1">
          <Icon name="info" className="text-[14px]" />
          {draft.pin ? "Pin placed. Click again to adjust." : "Click anywhere on the map to drop the location pin."}
        </p>
      </div>
      <div className="hidden">
        <MapLegend />
      </div>
    </div>
  );
}
