interface ProgressBarProps {
  pct: number;
  toneClass?: string;
  heightClass?: string;
}

export function ProgressBar({ pct, toneClass = "bg-secondary", heightClass = "h-2" }: ProgressBarProps): JSX.Element {
  return (
    <div className={`w-full bg-surface-container-high ${heightClass} rounded-full overflow-hidden`}>
      <div
        className={`${toneClass} h-full rounded-full transition-all duration-700`}
        style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
      />
    </div>
  );
}

interface ProgressRingProps {
  pct: number;
  tone?: string;
}

export function ProgressRing({ pct, tone = "#fe932c" }: ProgressRingProps): JSX.Element {
  const deg = Math.round((360 * Math.min(100, pct)) / 100);
  return (
    <div
      className="relative w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: `conic-gradient(${tone} ${deg}deg, #e2e8f0 0deg)` }}
    >
      <div className="w-[78%] h-[78%] bg-surface-container-lowest rounded-full flex items-center justify-center">
        <span className="text-headline-sm font-bold text-primary">{pct}%</span>
      </div>
    </div>
  );
}
