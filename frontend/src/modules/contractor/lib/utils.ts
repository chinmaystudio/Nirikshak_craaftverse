export function cls(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

export const NOW = new Date(2026, 8, 11, 10, 30); // 11 Sep 2026 10:30 IST — demo clock

export function inr(n: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);
}

export function money(n: number): string {
  if (n >= 1e7) return `₹ ${inr(n / 1e7)} Cr`;
  if (n >= 1e5) return `₹ ${inr(n / 1e5)} L`;
  return `₹ ${inr(n)}`;
}

export const cr = (n: number) => `₹ ${inr(n)} Cr`;

export function parseSafeDate(d: string | Date | null | undefined): Date | null {
  if (!d) return null;
  if (d instanceof Date) return Number.isNaN(d.getTime()) ? null : d;
  const s = String(d).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const dt = new Date(s + 'T00:00:00');
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(s);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function fmtDate(d: string | Date | null | undefined): string {
  const dt = parseSafeDate(d);
  if (!dt) return '—';
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtDateShort(d: string | Date | null | undefined): string {
  const dt = parseSafeDate(d);
  if (!dt) return '—';
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function fmtDateCompact(d: string | Date | null | undefined): string {
  const dt = parseSafeDate(d);
  if (!dt) return '—';
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

export function fmtDateTime(d: string | Date | null | undefined): string {
  const dt = parseSafeDate(d);
  if (!dt) return '—';
  return dt.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function daysUntil(d: string | null | undefined): number {
  const dt = parseSafeDate(d);
  if (!dt) return 0;
  const now = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
  const target = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

export function daysLeftLabel(d: string | null | undefined): string {
  if (!d) return '—';
  const n = daysUntil(d);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n < 0) return `${Math.abs(n)}d overdue`;
  return `${n}d left`;
}

export function timeAgo(d: string | Date): string {
  const dt = typeof d === 'string' ? new Date(d) : d;
  const diff = NOW.getTime() - dt.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(dt);
}

export function uid(prefix = ''): string {
  return prefix + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function downloadFile(name: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadCSV(name: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
  downloadFile(name, csv, 'text/csv;charset=utf-8');
}

export function initials(name: string): string {
  return name
    .replace(/(Pvt\.?|Ltd\.?|LLP|&)/gi, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}
