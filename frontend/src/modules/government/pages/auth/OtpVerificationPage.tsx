import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

/**
 * OtpVerificationPage — 6-digit OTP entry (demo; code accepted is 000000-999999,
 * any 6 digits proceed). No real SMS/SSO integration is claimed.
 */
export function OtpVerificationPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const refs = useRef<(HTMLInputElement | null)[]>([])

  function setDigit(i: number, v: string) {
    const c = v.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = c
    setDigits(next)
    if (c && i < 5) refs.current[i + 1]?.focus()
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const complete = digits.every((d) => d !== '')

  return (
    <Card className="p-6">
      <h1 className="text-heading-1 text-fg">{t('auth.otpTitle')}</h1>
      <p className="mt-1 text-body-small text-fg-muted">{t('auth.otpSubtitle')}</p>

      <form
        className="mt-5 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (complete) navigate('/government/dashboard')
        }}
      >
        <div className="flex justify-between gap-2" role="group" aria-label="6-digit verification code">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              aria-label={`Digit ${i + 1}`}
              className="h-12 w-12 rounded-control border border-border-strong bg-surface text-center text-heading-2 tabular-nums text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            />
          ))}
        </div>
        <Button type="submit" size="lg" block disabled={!complete} icon="verified">
          {t('auth.continue')}
        </Button>
        <button
          type="button"
          className="self-center rounded-[2px] text-body-small text-primary-strong hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          {t('auth.otpResend')}
        </button>
      </form>

      <p className="mt-4 rounded-control bg-surface-2 p-3 text-caption text-fg-muted">
        {t('auth.securityNote')}
      </p>
    </Card>
  )
}
