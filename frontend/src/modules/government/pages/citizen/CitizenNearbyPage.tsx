import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { formatPct } from '@/utils/format'
import { PROJECT_STATUS } from '@/utils/status'
import { CITIZEN_GEO } from '@/data/modules'
import { useToast } from '@/context/ToastContext'

/** Haversine distance in km between two coordinates. */
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/**
 * CitizenNearbyPage — "Projects Near Me". Geolocation is requested ONLY on
 * the citizen's explicit action; nothing is stored. Falls back to a district
 * picker when location is unavailable.
 */
export function CitizenNearbyPage() {
  const { t } = useI18n()
  const { showToast } = useToast()
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [district, setDistrict] = useState('')

  const locate = () => {
    if (!('geolocation' in navigator)) {
      showToast('Geolocation is not available in this browser.', 'warning')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      () => {
        showToast('Location unavailable — pick your district instead.', 'warning')
        setLocating(false)
      },
      { timeout: 8000 },
    )
  }

  const center = origin ?? (district ? CITIZEN_GEO[district] : undefined)

  const nearby = center
    ? Object.entries(CITIZEN_GEO)
        .map(([name, geo]) => ({ name, km: distanceKm(center, geo) }))
        .sort((a, b) => a.km - b.km)
        .slice(0, 6)
    : []

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-heading-1 text-fg">{t('citizen.nearbyTitle')}</h1>
        <p className="mt-1 text-body-small text-fg-muted">{t('citizen.nearbyNote')}</p>
      </div>

      <Card className="flex flex-wrap items-end gap-3 p-4">
        <Button icon="my_location" onClick={locate} disabled={locating}>
          {locating ? 'Locating…' : t('citizen.useMyLocation')}
        </Button>
        <span className="text-caption text-fg-subtle">— or —</span>
        <label className="flex flex-col gap-1">
          <span className="nk-label">District</span>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="h-10 rounded-control border border-border-strong bg-surface px-3 text-body text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <option value="">Select district</option>
            {Object.keys(CITIZEN_GEO).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>
      </Card>

      {!center && (
        <p className="rounded-control bg-surface-2 p-3 text-caption text-fg-muted">
          Your location is used only in this page view and is never stored or sent anywhere.
        </p>
      )}

      {nearby.length > 0 && (
        <ul className="flex flex-col gap-2">
          {nearby.map((n) => (
            <li key={n.name}>
              <Card className="flex flex-wrap items-center gap-3 p-3">
                <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">near_me</span>
                <span className="text-label text-fg">{n.name}</span>
                <Badge tone="neutral" icon="straighten">{n.km.toFixed(0)} km</Badge>
                <Link
                  to={`/citizen/projects?district=${encodeURIComponent(n.name)}`}
                  className="ml-auto text-body-small text-primary-strong hover:underline"
                >
                  {t('citizen.browseProjects')}
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Card className="p-4">
        <h2 className="text-heading-3 text-fg">Why transparency near you matters</h2>
        <p className="mt-1 text-body-small text-fg-muted">
          Works within 25 km typically share one division office, so localized tracking improves accountability on
          everyday infrastructure — approach roads, water supply, public buildings.
        </p>
        <ul className="mt-3 flex flex-col gap-2 text-body-small text-fg">
          <li className="flex items-center gap-2">
            <StatusBadge descriptor={PROJECT_STATUS.in_execution} size="sm" />
            Most works near a town centre are in execution phase.
          </li>
          <li className="flex items-center gap-2">
            <Progress value={62.4} label="Sample average progress" size="sm" className="min-w-40" showValue={false} />
            <span className="text-caption text-fg-subtle">{formatPct(62.4)} average across demo portfolio</span>
          </li>
        </ul>
      </Card>
      <p className="text-caption text-fg-subtle">{t('common.mockDataNote')}</p>
    </div>
  )
}
