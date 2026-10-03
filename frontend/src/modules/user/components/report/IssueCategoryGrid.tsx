import { Icon } from "@/components/common/Icon";
import { ISSUE_CATEGORIES } from "@/constants/issueCategories";
import type { IssueCategory } from "@/types/community";

interface IssueCategoryGridProps {
  selected: IssueCategory | null;
  onSelect: (id: IssueCategory) => void;
}

export function IssueCategoryGrid({ selected, onSelect }: IssueCategoryGridProps): JSX.Element {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3" role="radiogroup" aria-label="Issue category">
      {ISSUE_CATEGORIES.map((c) => {
        const active = selected === c.id;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(c.id)}
            className={`p-4 rounded-lg border text-left transition-all ${
              active ? "border-secondary bg-amber-50 ring-2 ring-secondary/30" : "border-outline-variant/50 hover:border-primary/40 hover:bg-surface-container-low"
            }`}
          >
            <span
              className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                active ? "bg-secondary text-on-secondary" : "bg-surface-container text-primary"
              }`}
            >
              <Icon name={c.icon} className="text-[22px]" />
            </span>
            <span className="block text-label-md font-bold text-primary leading-tight">{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function FieldLabel({ htmlFor, label, required, hint }: { htmlFor: string; label: string; required?: boolean; hint?: string }): JSX.Element {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-label-md font-label-md text-primary mb-1">
        {label}
        {required ? <span className="text-error"> *</span> : null}
      </label>
      {hint ? <p className="text-label-sm text-outline mt-1">{hint}</p> : null}
    </div>
  );
}
