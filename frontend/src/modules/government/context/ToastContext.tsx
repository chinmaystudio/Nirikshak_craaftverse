import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export type ToastTone = 'success' | 'warning' | 'danger' | 'info'

export interface ToastItem {
  id: number
  tone: ToastTone
  message: string
}

interface ToastContextValue {
  toasts: ToastItem[]
  showToast: (message: string, tone?: ToastTone) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TONE_ICON: Record<ToastTone, string> = {
  success: 'check_circle',
  warning: 'warning',
  danger: 'error',
  info: 'info',
}

const TONE_CLASS: Record<ToastTone, string> = {
  success: 'border-success-border text-success-strong',
  warning: 'border-warning-border text-warning-strong',
  danger: 'border-danger-border text-danger-strong',
  info: 'border-info-border text-info-strong',
}

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = nextId++
      setToasts((list) => [...list.slice(-4), { id, tone, message }])
      const timer = setTimeout(() => dismiss(id), 5000)
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toasts, showToast, dismiss }), [toasts, showToast, dismiss])
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 right-4 z-toast flex w-full max-w-sm flex-col gap-2 px-2 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`nk-card flex items-start gap-2 border p-3 shadow-raised ${TONE_CLASS[t.tone]}`}
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              {TONE_ICON[t.tone]}
            </span>
            <p className="flex-1 text-body-small text-fg">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="rounded-control p-1 text-fg-subtle hover:bg-surface-2 hover:text-fg focus-visible:nk-focus"
              aria-label="Dismiss notification"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                close
              </span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
