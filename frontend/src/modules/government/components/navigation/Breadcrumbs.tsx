import { cn } from '@/utils/cn'
import { Link } from 'react-router-dom'

/** Breadcrumb trail with nav semantics — used across detail pages. */
export function Breadcrumbs({
  items,
  className,
}: {
  items: { label: string; to?: string }[]
  className?: string
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn('mb-3', className)}>
      <ol className="flex flex-wrap items-center gap-1 text-caption text-fg-subtle">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && (
                <span className="material-symbols-outlined text-[14px] text-fg-subtle" aria-hidden="true">
                  chevron_right
                </span>
              )}
              {item.to && !isLast ? (
                <Link to={item.to} className="rounded-[2px] hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className={cn(isLast && 'font-medium text-fg-muted')}>
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
