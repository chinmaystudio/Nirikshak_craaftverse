import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'
import { IconButton } from '@/components/ui/Button'

/**
 * Modal — dialog with scrim, focus trap, Escape close, and aria-modal.
 * Reduced-motion aware (no transform animations under reduced-motion).
 */
export function Modal({
  open,
  onClose,
  title,
  titleIcon,
  children,
  footer,
  size = 'md',
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  titleIcon?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const id = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'

    const panel = panelRef.current
    const focusables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => !el.hasAttribute('disabled'))

    focusables()[0]?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const list = focusables()
        if (list.length === 0) return
        const first = list[0]
        const last = list[list.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previouslyFocused?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-end justify-center bg-[var(--scrim)] p-0 sm:items-center sm:p-4">
      {/* Scrim click-to-close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        className={cn(
          'nk-card relative flex max-h-[90vh] w-full flex-col shadow-modal sm:rounded-panel',
          'rounded-t-panel',
          widths[size],
          className,
        )}
      >
        <div className="nk-panel-header">
          <h2 id={`${id}-title`} className="nk-panel-title">
            {titleIcon && (
              <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">
                {titleIcon}
              </span>
            )}
            {title}
          </h2>
          <IconButton icon="close" label="Close dialog" onClick={onClose} size="sm" />
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-border p-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/** Right-side drawer (notifications, detail panes). */
export function Drawer({
  open,
  onClose,
  title,
  titleIcon,
  children,
  width = 'max-w-md',
}: {
  open: boolean
  onClose: () => void
  title: string
  titleIcon?: string
  children: React.ReactNode
  width?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-drawer bg-[var(--scrim)]">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'absolute inset-y-0 right-0 flex w-full flex-col border-l border-border bg-surface shadow-modal',
          width,
        )}
      >
        <div className="nk-panel-header">
          <h2 className="nk-panel-title">
            {titleIcon && (
              <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">
                {titleIcon}
              </span>
            )}
            {title}
          </h2>
          <IconButton icon="close" label="Close panel" onClick={onClose} size="sm" />
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
