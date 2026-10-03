export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}

export function Tabs({ items, activeId, onChange, ariaLabel }: TabsProps): JSX.Element {
  return (
    <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar border-b border-outline-variant/40 pb-px" role="tablist" aria-label={ariaLabel}>
      {items.map((it) => {
        const active = it.id === activeId;
        return (
          <button
            key={it.id}
            role="tab"
            aria-selected={active}
            data-tab={it.id}
            onClick={() => onChange(it.id)}
            className={`px-4 py-2.5 text-label-md font-label-md whitespace-nowrap border-b-2 transition-colors ${
              active ? "border-secondary text-secondary font-bold" : "border-transparent text-on-surface-variant hover:text-primary"
            }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
