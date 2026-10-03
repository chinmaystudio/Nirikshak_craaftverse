import { Icon } from "@/components/common/Icon";

export function GovernmentBar(): JSX.Element {
  const skipToContent = (): void => {
    document.getElementById("skip-link")?.click();
  };
  return (
    <aside aria-label="Official Federal Utility Bar" className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant/30 py-1 px-4 text-label-sm font-label-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 font-bold text-primary">
            <Icon name="public" className="text-[14px]" />
            <span>NIRIKSHAK</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button type="button" onClick={skipToContent} className="hover:text-primary transition-colors flex items-center gap-0.5">
            <Icon name="accessibility_new" className="text-[14px]" /> Skip to Main Content
          </button>
          <span className="hidden md:inline text-outline-variant">|</span>
          <span className="hidden md:inline text-on-surface-variant">Public Audit Mode: <span className="text-secondary font-semibold">Active (FY 2026-27)</span></span>
        </div>
      </div>
    </aside>
  );
}
