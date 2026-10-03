import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertItem } from '@/types'
import { ALERTS } from '@/data/alerts'

/**
 * Notification context — alerts feed powering the header bell and drawer.
 * Mock data source; wired to the alerts API surface so a real backend can
 * replace it without UI changes.
 */

interface NotificationsContextValue {
  alerts: AlertItem[]
  unreadCount: number
  markRead: (id: string) => void
  markAllRead: () => void
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AlertItem[]>(ALERTS)

  useEffect(() => {
    // Placeholder for a real subscription (websocket / polling) — mock data
    // is static, so nothing to subscribe to yet.
  }, [])

  const markRead = (id: string) =>
    setAlerts((list) => list.map((a) => (a.id === id ? { ...a, read: true } : a)))

  const markAllRead = () => setAlerts((list) => list.map((a) => ({ ...a, read: true })))

  const unreadCount = alerts.filter((a) => !a.read).length
  const value = useMemo(
    () => ({ alerts, unreadCount, markRead, markAllRead }),
    [alerts, unreadCount, markRead, markAllRead],
  )
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}
