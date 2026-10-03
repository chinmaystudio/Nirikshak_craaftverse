import { cn } from '@/utils/cn'

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'secondary'

const TONE: Record<BadgeTone, string> = {
  success: 'bg-success-tint text-success-strong border-success-border',
  warning: 'bg-warning-tint text-warning-strong border-warning-border',
  danger: 'bg-danger-tint text-danger-strong border-danger-border',
  info: 'bg-info-tint text-info-strong border-info-border',
  neutral: 'bg-surface-2 text-fg-muted border-border',
  secondary: 'bg-primary-soft text-primary-strong border-primary-border',
}

interface BadgeProps {
  tone?: BadgeTone
  /** Material Symbols ligature — status is never color-only: pair icon+text. */
  icon?: string
  children: React.ReactNode
  className?: string
  /** Dot indicator instead of icon (compact contexts). */
  dot?: boolean
}

export function Badge({ tone = 'neutral', icon, children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-badge border px-2 py-0.5 text-caption whitespace-nowrap',
        TONE[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {icon && (
        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  )
}

/** Numeric count badge (sidebar / bell). */
export function CountBadge({
  count,
  tone = 'neutral',
  className,
}: {
  count: number
  tone?: BadgeTone
  className?: string
}) {
  if (count <= 0) return null
  return (
    <span
      className={cn(
        'inline-flex min-w-5 items-center justify-center rounded-badge border px-1 py-0.5 text-caption tabular-nums',
        TONE[tone],
        className,
      )}
    >
      {count}
    </span>
  )
}
