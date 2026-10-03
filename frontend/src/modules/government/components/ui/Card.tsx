import { cn } from '@/utils/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return <div className={cn('nk-card', className)}>{children}</div>
}

interface PanelHeaderProps {
  title: React.ReactNode
  /** Material Symbols ligature shown before the title. */
  icon?: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export function PanelHeader({ title, icon, subtitle, actions, className }: PanelHeaderProps) {
  return (
    <div className={cn('nk-panel-header', className)}>
      <div className="min-w-0">
        <h2 className="nk-panel-title">
          {icon && (
            <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">
              {icon}
            </span>
          )}
          <span className="truncate">{title}</span>
        </h2>
        {subtitle && <p className="mt-0.5 text-caption text-fg-subtle">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Section wrapper: Card + PanelHeader + padded body. */
export function Panel({
  title,
  icon,
  subtitle,
  actions,
  children,
  bodyClassName,
  className,
}: {
  title: React.ReactNode
  icon?: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
  bodyClassName?: string
  className?: string
}) {
  return (
    <Card className={className}>
      <PanelHeader title={title} icon={icon} subtitle={subtitle} actions={actions} />
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </Card>
  )
}
