import { useEffect, useRef, useState } from 'react'
import { cn } from '@/utils/cn'
import { nkFocus } from '@/utils/focus'

/**
 * Dropdown — click-outside + Escape closed menu; trigger keeps focus.
 */
export function Dropdown({
  trigger,
  children,
  align = 'end',
  menuLabel,
  className,
  width = 'w-56',
}: {
  trigger: (props: { open: boolean; toggle: () => void; id: string }) => React.ReactNode
  children: React.ReactNode | ((close: () => void) => React.ReactNode)
  align?: 'start' | 'end'
  menuLabel: string
  className?: string
  width?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const id = useRef(`dd-${Math.random().toString(36).slice(2, 8)}`).current

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {trigger({ open, toggle: () => setOpen((o) => !o), id })}
      {open && (
        <div
          role="menu"
          aria-label={menuLabel}
          className={cn(
            'nk-card absolute top-[calc(100%+4px)] z-sticky flex flex-col p-1 shadow-raised',
            width,
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  )
}

export function MenuItem({
  icon,
  children,
  onClick,
  danger,
}: {
  icon?: string
  children: React.ReactNode
  onClick?: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-control px-3 py-2 text-left text-body-small text-fg transition-colors duration-fast hover:bg-surface-2',
        danger && 'text-danger-strong hover:bg-danger-tint',
        nkFocus,
      )}
    >
      {icon && (
        <span className="material-symbols-outlined text-[18px] text-fg-muted" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </button>
  )
}

export function MenuDivider() {
  return <hr className="my-1 border-border" />
}
