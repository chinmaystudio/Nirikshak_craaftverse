import { useEffect, useRef } from 'react'
import { cn } from '@/utils/cn'
import { nkFocus } from '@/utils/focus'

/**
 * Tabs — accessible tab list (roving tabindex, arrow-key navigation).
 * Prescribed by the spec for the project-detail 13-tab suite.
 */
export interface TabItem {
  id: string
  label: string
  icon?: string
  badge?: number
}

export function Tabs({
  items,
  active,
  onChange,
  ariaLabel,
  className,
}: {
  items: TabItem[]
  active: string
  onChange: (id: string) => void
  ariaLabel: string
  className?: string
}) {
  const listRef = useRef<HTMLDivElement>(null)

  const onKey = (e: React.KeyboardEvent) => {
    const idx = items.findIndex((i) => i.id === active)
    let next = idx
    if (e.key === 'ArrowRight') next = (idx + 1) % items.length
    else if (e.key === 'ArrowLeft') next = (idx - 1 + items.length) % items.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    else return
    e.preventDefault()
    onChange(items[next].id)
    const btns = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    btns?.[next]?.focus()
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKey}
      className={cn(
        'flex gap-1 overflow-x-auto border-b border-border',
        className,
      )}
    >
      {items.map((item) => {
        const selected = item.id === active
        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            id={`tab-${item.id}`}
            aria-selected={selected}
            aria-controls={`panel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cn(
              'relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-button transition-colors duration-fast',
              selected
                ? 'border-primary text-primary-strong'
                : 'border-transparent text-fg-muted hover:bg-surface-2 hover:text-fg',
              nkFocus,
            )}
          >
            {item.icon && (
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                {item.icon}
              </span>
            )}
            {item.label}
            {item.badge != null && item.badge > 0 && (
              <span className="inline-flex min-w-4 justify-center rounded-badge bg-primary-soft px-1 text-[11px] tabular-nums text-primary-strong">
                {item.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function TabPanel({
  id,
  active,
  children,
}: {
  id: string
  active: string
  children: React.ReactNode
}) {
  if (id !== active) return null
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} tabIndex={0} className="pt-4 focus-visible:outline-2 focus-visible:outline-primary">
      {children}
    </div>
  )
}
