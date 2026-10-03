import { Icon } from "./Icon";

export interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  subTone?: string;
  icon: string;
  circleClass?: string;
}

export function StatCard({ label, value, sub, subTone = "text-secondary", icon, circleClass = "bg-surface-container text-primary" }: StatCardProps): JSX.Element {
  return (
    <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/60 shadow-sm flex items-start gap-3">
      <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${circleClass}`}>
        <Icon name={icon} className="text-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant leading-tight">{label}</div>
        <div className="text-[26px] leading-tight font-bold text-primary tabular-nums mt-1">{value}</div>
        {sub ? <div className={`text-label-sm font-semibold mt-1 leading-tight ${subTone}`}>{sub}</div> : null}
      </div>
    </div>
  );
}

export interface PageHeaderProps {
  title: string;
  sub?: string;
  back?: boolean;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export function PageHeader({ title, sub, back, onBack, actions }: PageHeaderProps): JSX.Element {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/50 pb-4">
      <div className="flex items-start gap-3">
        {back ? (
          <button
            onClick={onBack}
            className="mt-1 w-9 h-9 rounded-full border border-outline-variant flex items-center justify-center text-primary hover:bg-surface-container transition-colors"
            aria-label="Go back"
          >
            <Icon name="arrow_back" className="text-[20px]" />
          </button>
        ) : null}
        <div>
          <h1 className="text-headline-lg font-headline-lg font-bold text-primary">{title}</h1>
          {sub ? <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">{sub}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
