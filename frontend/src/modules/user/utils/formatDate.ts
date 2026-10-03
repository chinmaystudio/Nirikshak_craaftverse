const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatDate(iso: string | null | undefined, withTime = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  let out = `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  if (withTime) {
    let h = d.getHours();
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    out += `, ${h}:${pad(d.getMinutes())} ${ap}`;
  }
  return out;
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const future = diff < 0;
  const m = Math.floor(Math.abs(diff) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min${future ? " from now" : " ago"}`;
  if (m < 60 * 24) {
    const h = Math.floor(m / 60);
    return `${h} hour${h > 1 ? "s" : ""}${future ? " from now" : " ago"}`;
  }
  const d = Math.floor(m / (60 * 24));
  return `${d} day${d > 1 ? "s" : ""}${future ? " from now" : " ago"}`;
}

export function duration(ms: number): string {
  if (ms <= 0) return "elapsed";
  const m = Math.floor(ms / 60000);
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const mm = m % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${mm}m`;
  return `${mm}m`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export { pad };
