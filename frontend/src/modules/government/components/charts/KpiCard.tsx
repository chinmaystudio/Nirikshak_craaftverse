import { cn } from '@/utils/cn'

/**
 * KpiCard — dashboard KPI tile (Stitch dashboard pattern): label, big tabular
 * figure, unit, delta, and a status icon so the state is never color-only.
 */
export function KpiCard({
  label,
  value,
  unit,
  delta,
  deltaTone = 'neutral',
  icon,
  iconTone = 'primary',
  footer,
  onClick,
  className,
}: {
  label: string
  value: string | number
  unit?: string
  /** e.g. "+4.2% vs last month" */
  delta?: string
  deltaTone?: 'success' | 'warning' | 'danger' | 'neutral'
  icon?: string
  iconTone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
  footer?: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  const iconColor =
    iconTone === 'success'
      ? 'text-success-strong bg-success-tint'
      : iconTone === 'warning'
        ? 'text-warning-strong bg-warning-tint'
        : iconTone === 'danger'
          ? 'text-danger-strong bg-danger-tint'
          : iconTone === 'neutral'
            ? 'text-fg-muted bg-surface-2'
            : 'text-primary-strong bg-primary-soft'
  const deltaColor =
    deltaTone === 'success'
      ? 'text-success-strong'
      : deltaTone === 'warning'
        ? 'text-warning-strong'
        : deltaTone === 'danger'
          ? 'text-danger-strong'
          : 'text-fg-subtle'

  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={cn(
        'nk-card flex flex-col gap-2 p-4 text-left',
        onClick && 'transition-colors duration-fast hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-caption uppercase tracking-[0.05em] text-fg-subtle">{label}</span>
        {icon && (
          <span className={cn('material-symbols-outlined rounded-control p-1 text-[20px]', iconColor)} aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className="text-display tabular-nums text-fg whitespace-nowrap overflow-hidden text-ellipsis max-w-full" title={typeof value === 'string' ? value : undefined}>{value}</span>
        {unit && <span className="text-label text-fg-subtle whitespace-nowrap">{unit}</span>}
      </div>
      {delta && <span className={cn('text-caption tabular-nums', deltaColor)}>{delta}</span>}
      {footer && <div className="mt-1 border-t border-border pt-2 text-caption text-fg-muted">{footer}</div>}
    </Wrapper>
  )
}
