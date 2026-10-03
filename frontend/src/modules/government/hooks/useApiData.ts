import { useEffect, useState } from 'react'
import type { ListQuery } from '@/types'

/**
 * Simple data-fetch hook over the mock API — mirrors what a react-query style
 * loader would provide so pages do not hand-roll effect plumbing.
 */
export function useApiData<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetcher()
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setError(null)
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}

/** Debounced value helper for search inputs. */
export function useDebounced<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

/** Build a ListQuery from common page state. */
export function toListQuery(search: string, page = 1, pageSize = 20): ListQuery {
  return { search: search || undefined, page, pageSize }
}
