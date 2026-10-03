/**
 * Formatting utilities — all monetary values use ₹ Crore / Lakh with tabular
 * figures; dates render as "15 Nov 2026" style (Stitch convention); personal
 * identifiers are masked per the "do not expose unnecessary personal
 * information" rule.
 */

/* ---------- Money (₹ Crore / Lakh) ---------- */

/**
 * Format an amount given in Crore. Preserves the Stitch convention of exactly
 * two decimals: 24.8 → "₹ 24.80 Cr", 1842.5 → "₹ 1,842.50 Cr".
 */
export function formatCr(amountCr: number | null | undefined): string {
  if (amountCr == null || Number.isNaN(amountCr)) return '—'
  return `₹ ${formatIndianNumber(amountCr)} Cr`
}

/** Compact variant for tight UI: 24.8 → "₹24.80 Cr" (no space). */
export function formatCrCompact(amountCr: number | null | undefined): string {
  if (amountCr == null || Number.isNaN(amountCr)) return '—'
  return `₹${formatIndianNumber(amountCr)} Cr`
}

/**
 * Format an amount given in Lakh. Amounts below 1 Cr are shown in Lakh
 * (standard PWD style): 85 → "₹ 85.00 L", 150 → "₹ 1.50 Cr".
 */
export function formatLakh(amountLakh: number | null | undefined): string {
  if (amountLakh == null || Number.isNaN(amountLakh)) return '—'
  if (Math.abs(amountLakh) >= 100) return formatCr(amountLakh / 100)
  return `₹ ${formatIndianNumber(amountLakh)} L`
}

/** Indian digit grouping: 1842500 → "18,42,500". */
export function formatIndianNumber(value: number, decimals = 2): string {
  const neg = value < 0
  const abs = Math.abs(value)
  const fixed = abs.toFixed(decimals)
  const [intPart, decPart] = fixed.split('.')
  let grouped: string
  if (intPart.length > 3) {
    const last3 = intPart.slice(-3)
    const rest = intPart.slice(0, -3)
    grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3
  } else {
    grouped = intPart
  }
  const out = decPart ? `${grouped}.${decPart}` : grouped
  return neg ? `-${out}` : out
}

/* ---------- Numbers & percentages ---------- */

export function formatPct(value: number | null | undefined, decimals = 1): string {
  if (value == null || Number.isNaN(value)) return '—'
  return `${value.toFixed(decimals)}%`
}

export function formatCount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-IN').format(value)
}

/* ---------- Dates (Stitch convention: "15 Nov 2026") ---------- */

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Parse an ISO date string (yyyy-mm-dd or full ISO) to a local Date, or null. */
export function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

/** "15 Nov 2026" — the Stitch date convention. */
export function formatDate(iso: string | null | undefined): string {
  const d = parseDate(iso)
  if (!d) return '—'
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

/** "15 Nov" (no year, for dense tables). */
export function formatDateShort(iso: string | null | undefined): string {
  const d = parseDate(iso)
  if (!d) return '—'
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

/** Full month name year: "November 2026" (for budget heads). */
export function formatMonthYear(iso: string | null | undefined): string {
  const d = parseDate(iso)
  if (!d) return '—'
  return `${d.toLocaleString('en-IN', { month: 'long' })} ${d.getFullYear()}`
}

/** Days between an ISO date and now (positive = future). */
export function daysFromToday(iso: string | null | undefined): number | null {
  const d = parseDate(iso)
  if (!d) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86_400_000)
}

/**
 * SLA countdown label: "Due in 3 days" / "Overdue by 2 days" / "Due today".
 * Spec: grievances show an explicit SLA countdown.
 */
export function formatSlaCountdown(deadlineIso: string): string {
  const days = daysFromToday(deadlineIso)
  if (days == null) return '—'
  if (days === 0) return 'Due today'
  if (days > 0) return `Due in ${days} day${days === 1 ? '' : 's'}`
  return `Overdue by ${Math.abs(days)} day${days === -1 ? '' : 's'}`
}

/** Relative time for alerts: "2 hours ago" style against a provided "now". */
export function formatRelative(iso: string, now: Date = new Date()): string {
  const d = parseDate(iso)
  if (!d) return '—'
  const diffMs = now.getTime() - d.getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return formatDate(iso)
}

/** Time-of-day: "10:42 AM" */
export function formatTime(d: Date): string {
  let h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${m} ${ampm}`
}

/* ---------- Privacy masking ---------- */

/** Mask a citizen name: "Rahul S. Patil" → "Rahul S. P." (keeps initials only). */
export function maskPersonName(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length <= 1) return parts[0]
  const last = parts[parts.length - 1]
  return `${parts.slice(0, -1).join(' ')} ${last[0]}.`
}

/** Mask a phone number: "9876543210" → "98765*****0". */
export function maskPhone(phone: string): string {
  if (phone.length < 6) return '*'.repeat(phone.length)
  return `${phone.slice(0, 2)}${'*'.repeat(phone.length - 4)}${phone.slice(-2)}`
}

/** Mask an email: "officer@pwd.gov.in" → "o*****@pwd.gov.in". */
export function maskEmail(email: string): string {
  const at = email.indexOf('@')
  if (at <= 0) return email
  return `${email[0]}*****${email.slice(at)}`
}

/* ---------- File sizes ---------- */

export function formatFileSizeKb(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${kb} KB`
}
