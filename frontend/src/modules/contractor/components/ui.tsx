import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown, Search, X, CheckCircle2, AlertTriangle, Info, XCircle, Loader2,
  FileUp, Sparkles, Trash2, ClipboardList, CircleDot, CheckCircle,
} from 'lucide-react';
import { cls, initials as initialsOf } from '../lib/utils';

// ─── Card & section ──────────────────────────────────────────────────────────

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cls('card', className)}>{children}</div>;
}

export function SectionTitle({
  icon: Icon,
  title,
  right,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cls('flex items-center justify-between gap-3 mb-5', className)}>
      <div className="section-title">
        {Icon && <Icon className="w-5 h-5 shrink-0" />}
        <h3 className="font-bold text-[15px]">{title}</h3>
      </div>
      {right}
    </div>
  );
}

// ─── Badges ──────────────────────────────────────────────────────────────────

type Tone = 'green' | 'amber' | 'red' | 'blue' | 'slate';

const TONE_CLASSES: Record<Tone, string> = {
  green: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800',
  amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800',
  red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800',
  blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
  slate: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

const STATUS_TONES: Record<string, Tone> = {
  Active: 'green', 'On Track': 'green', Passed: 'green', Paid: 'green', Approved: 'green', Completed: 'green',
  Eligible: 'green', Awarded: 'green', Available: 'green', GOOD: 'green', Read: 'green',
  'At Risk': 'amber', 'Under Verification': 'amber', 'Changes Requested': 'amber', 'Low Stock': 'amber',
  Medium: 'amber', Review: 'amber', Warn: 'amber', 'In Use': 'green', 'Under Government Review': 'blue',
  Delayed: 'red', Rejected: 'red', High: 'red', 'Not Eligible': 'red', Overdue: 'red',
  'Defects Noted': 'red', 'Action Required': 'red',
  Draft: 'slate', 'On Leave': 'slate', Idle: 'slate', Low: 'slate', Open: 'blue', Scheduled: 'blue',
  'Under Evaluation': 'blue', Submitted: 'blue', Sent: 'slate', 'Passed with Remarks': 'amber', Transferred: 'slate',
  FAIR: 'amber', POOR: 'red', 'In Progress': 'blue',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = STATUS_TONES[status] ?? 'slate';
  return (
    <span className={cls('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', TONE_CLASSES[tone], className)}>
      {status}
    </span>
  );
}

export function RiskBadge({ risk, className }: { risk: string; className?: string }) {
  const tone: Tone = risk === 'High' ? 'red' : risk === 'Medium' ? 'amber' : 'green';
  return (
    <span className={cls('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', TONE_CLASSES[tone], className)}>
      <span className={cls('w-1.5 h-1.5 rounded-full', risk === 'High' ? 'bg-red-600' : risk === 'Medium' ? 'bg-amber-500' : 'bg-green-600')} />
      {risk}
    </span>
  );
}

// ─── Progress ────────────────────────────────────────────────────────────────

export function ProgressBar({
  value,
  marker,
  className,
  color = 'bg-blue-800 dark:bg-blue-600',
  height = 'h-3.5',
}: {
  value: number;
  marker?: number;
  className?: string;
  color?: string;
  height?: string;
}) {
  return (
    <div className={cls('relative bg-slate-100 rounded-sm overflow-hidden dark:bg-slate-800', height, className)}>
      <div className={cls('h-full rounded-sm transition-all', color)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      {marker !== undefined && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-slate-500 dark:bg-slate-300"
          style={{ left: `${Math.min(100, Math.max(0, marker))}%` }}
          title={`Planned: ${marker}%`}
        />
      )}
    </div>
  );
}

// ─── Tabs / pills / inputs ───────────────────────────────────────────────────

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cls(
            'flex items-center gap-2 px-4 py-2.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer',
            active === t.key
              ? 'border-blue-600 text-blue-700 bg-blue-50/50 dark:border-blue-500 dark:text-blue-400 dark:bg-blue-950/30'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
          )}
        >
          <span className="text-sm font-semibold">{t.label}</span>
          {t.count !== undefined && (
            <span className={cls('px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm', active === t.key ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300')}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Pills({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} className={cls('pill', value === o ? 'pill-active' : 'pill-idle')} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cls('relative w-full flex items-center bg-slate-50 rounded-md px-3 py-2 border border-slate-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-sm dark:bg-slate-800 dark:border-slate-700', className)}>
      <Search className="text-slate-400 w-4 h-4 mr-2 shrink-0" />
      <input
        className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-200"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button onClick={() => onChange('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" aria-label="Clear search">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function Select({
  value,
  onChange,
  options,
  className,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  label?: string;
}) {
  return (
    <div className={cls('relative', className)}>
      {label && <span className="sr-only">{label}</span>}
      <select className={cls('input appearance-none pr-8 cursor-pointer')} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

export function Field({ label, required, children, error, hint }: { label: string; required?: boolean; children: ReactNode; error?: string; hint?: string }) {
  return (
    <div className="flex flex-col">
      <label className="label">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      {children}
      {error ? (
        <span className="text-[11px] text-red-600 font-semibold mt-1">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-slate-500 mt-1">{hint}</span>
      ) : null}
    </div>
  );
}

// ─── States ──────────────────────────────────────────────────────────────────

export function EmptyState({ icon: Icon = ClipboardList, title, msg, action }: { icon?: React.ComponentType<{ className?: string }>; title: string; msg?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 border-2 border-dashed border-slate-200 rounded-xl dark:border-slate-700">
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{title}</p>
      {msg && <p className="text-xs text-slate-500 mt-1 max-w-sm dark:text-slate-400">{msg}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Loading({ label = 'Analyzing…', className }: { label?: string; className?: string }) {
  return (
    <div className={cls('flex flex-col items-center justify-center py-14 gap-3', className)}>
      <Loader2 className="w-6 h-6 text-blue-700 animate-spin dark:text-blue-400" />
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cls('w-4 h-4 animate-spin', className)} />;
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] bg-slate-900/50 dark:bg-black/70 flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        tabIndex={-1}
        className={cls('bg-white border border-slate-200 rounded-xl shadow-xl w-full flex flex-col max-h-[90vh] dark:bg-slate-800 dark:border-slate-700', width)}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-display font-bold text-slate-800 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close dialog">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-slate-200 flex justify-end gap-2 dark:border-slate-800">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  danger,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width="max-w-md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className={cls('btn', danger ? 'btn-danger' : 'btn-primary')}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        {danger ? <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" /> : <Info className="w-5 h-5 text-blue-700 shrink-0" />}
        <p className="text-sm text-slate-700 leading-relaxed dark:text-slate-300">{message}</p>
      </div>
    </Modal>
  );
}

// ─── Dropdown ────────────────────────────────────────────────────────────────

export function Dropdown({
  button,
  children,
  align = 'right',
  width = 'w-64',
  buttonClass,
}: {
  button: ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'left' | 'right';
  width?: string;
  buttonClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: globalThis.MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button className={buttonClass} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {button}
      </button>
      {open && (
        <div
          className={cls(
            'absolute top-full mt-2 z-[80] shadow-lg overflow-hidden bg-white border border-slate-200 rounded-xl dark:bg-slate-800 dark:border-slate-700',
            width,
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

// ─── Page header ─────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  subtitle,
  actions,
  backTo,
  backLabel,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  backTo?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        {backTo && (
          <a href={`#${backTo}`} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 dark:text-slate-400 mb-1 w-max">
            ← {backLabel ?? 'Back'}
          </a>
        )}
        <h1 className="font-display text-2xl lg:text-[28px] text-slate-800 tracking-tight font-bold dark:text-slate-100">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5 font-medium dark:text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

// ─── KPI section ─────────────────────────────────────────────────────────────

export interface KPIItem {
  label: string;
  value: string;
  sub?: ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  iconClass?: string;
  onClick?: () => void;
  wide?: boolean;
}

export function KPISection({ items }: { items: KPIItem[] }) {
  const cols = items.length >= 7 ? 'grid-cols-2 md:grid-cols-4 2xl:grid-cols-8' : items.length >= 5 ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6' : 'grid-cols-2 md:grid-cols-4';
  return (
    <div className={cls('grid gap-4', cols)}>
      {items.map((it) => (
        <div
          key={it.label}
          className={cls('kpi', it.onClick && 'cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all')}
          onClick={it.onClick}
          role={it.onClick ? 'button' : undefined}
        >
          <div className="flex items-center justify-between mb-1 gap-2">
            <span className={cls('kpi-label', it.wide ? 'max-w-[110px]' : 'max-w-[96px]')}>{it.label}</span>
            <it.icon className={cls('w-4 h-4 shrink-0', it.iconClass ?? 'text-blue-600')} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="kpi-value truncate">{it.value}</span>
            {it.sub && <span className="text-[11px] font-semibold mt-1 text-slate-500 dark:text-slate-400 truncate">{it.sub}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Timeline ────────────────────────────────────────────────────────────────

export function Timeline({ items }: { items: { label: string; date?: string; state: 'done' | 'current' | 'pending'; note?: string }[] }) {
  return (
    <ol className="relative">
      {items.map((it, i) => (
        <li key={it.label} className="relative flex gap-3.5 pb-5 last:pb-0">
          {i < items.length - 1 && <div className="absolute left-[11px] top-6 bottom-0 w-px bg-slate-200 dark:bg-slate-700" aria-hidden />}
          {it.state === 'done' ? (
            <CheckCircle className="w-6 h-6 text-green-600 shrink-0 z-10 bg-white dark:bg-slate-900 rounded-full" />
          ) : it.state === 'current' ? (
            <span className="w-6 h-6 rounded-full bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-900 shrink-0 flex items-center justify-center z-10">
              <CircleDot className="w-3.5 h-3.5 text-white" />
            </span>
          ) : (
            <span className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 shrink-0 z-10" />
          )}
          <div className="flex-1 min-w-0 -mt-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className={cls('text-sm font-semibold', it.state === 'pending' ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100')}>{it.label}</p>
              {it.state === 'current' && <StatusBadge status="In Progress" />}
            </div>
            {it.date && <p className="text-xs text-slate-500 font-medium mt-0.5 dark:text-slate-400">{it.date}</p>}
            {it.note && <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">{it.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

// ─── Document uploader ───────────────────────────────────────────────────────

export interface UploadDoc {
  name: string;
  size: string;
}

export function DocumentUploader({
  label,
  multiple = true,
  docs,
  onChange,
  accept,
}: {
  label: string;
  multiple?: boolean;
  docs: UploadDoc[];
  onChange: (docs: UploadDoc[]) => void;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const add = (files: FileList | null) => {
    if (!files) return;
    const next = [...docs];
    for (const f of Array.from(files)) {
      next.push({ name: f.name, size: f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB` });
    }
    onChange(multiple ? next : [next[next.length - 1]]);
  };
  return (
    <div>
      <label className="label">{label}</label>
      <div
        className={cls(
          'border-2 border-dashed rounded-lg px-4 py-5 text-center transition-colors cursor-pointer',
          drag ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          add(e.dataTransfer.files);
        }}
        role="button"
        aria-label={`Upload ${label}`}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <FileUp className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Click to upload or drag &amp; drop
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">PDF, JPG, PNG, DOCX, XLSX — max 25 MB each</p>
        <input ref={inputRef} type="file" className="hidden" multiple={multiple} accept={accept} onChange={(e) => add(e.target.files)} />
      </div>
      {docs.length > 0 && (
        <ul className="mt-2.5 flex flex-col gap-1.5">
          {docs.map((d, i) => (
            <li key={`${d.name}-${i}`} className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 dark:bg-slate-800 dark:border-slate-700">
              <div className="flex items-center gap-2 min-w-0">
                <FileUp className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 truncate dark:text-slate-200">{d.name}</span>
                <span className="text-[10px] text-slate-400 shrink-0">{d.size}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(docs.filter((_, j) => j !== i));
                }}
                className="text-slate-400 hover:text-red-600 shrink-0"
                aria-label={`Remove ${d.name}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── AI components ───────────────────────────────────────────────────────────

export function AIInsight({ title = 'AI Insight', children, dense }: { title?: string; children: ReactNode; dense?: boolean }) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/30">
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
        <Sparkles className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">{title}</span>
      </div>
      <div className={cls('px-4 text-sm text-slate-700 dark:text-slate-300', dense ? 'pb-3' : 'pb-3.5')}>{children}</div>
      <div className="px-4 pb-3">
        <p className="text-[10px] text-slate-500 dark:text-slate-500 italic">AI-generated insight from current project data. Verify with site records before acting.</p>
      </div>
    </div>
  );
}

export function AIRecommendation({
  intro,
  actions,
  recovery,
  footer,
}: {
  intro: string;
  actions: { label: string; impact?: string }[];
  recovery?: string;
  footer?: string;
}) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/30 p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <Sparkles className="w-4 h-4 text-blue-700 dark:text-blue-400" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">AI Recommendation</span>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed mb-4 dark:text-slate-300">{intro}</p>
      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2.5">Recommended Actions</p>
      <ol className="flex flex-col gap-2.5">
        {actions.map((a, i) => (
          <li key={a.label} className="flex items-start gap-3">
            <span className="text-[10px] font-bold text-blue-700 bg-white border border-blue-200 rounded-md px-1.5 py-0.5 mt-0.5 dark:bg-slate-900 dark:border-blue-900 dark:text-blue-400">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex-1">{a.label}</span>
            {a.impact && <span className="text-xs font-bold text-green-700 dark:text-green-400 whitespace-nowrap">{a.impact}</span>}
          </li>
        ))}
      </ol>
      {recovery && (
        <div className="mt-4 border-t border-blue-200 pt-3 dark:border-blue-900">
          <p className="text-xs text-slate-500 font-medium">{recovery}</p>
        </div>
      )}
      {footer && <p className="text-[10px] text-slate-500 italic mt-2">{footer}</p>}
    </div>
  );
}

// ─── Toasts ──────────────────────────────────────────────────────────────────

export interface ToastItem {
  id: number;
  type: 'success' | 'info' | 'warn' | 'error';
  title: string;
  msg?: string;
}

const TOAST_STYLE: Record<ToastItem['type'], { border: string; icon: ReactNode }> = {
  success: { border: 'border-l-green-600', icon: <CheckCircle2 className="w-5 h-5 text-green-600" /> },
  info: { border: 'border-l-blue-600', icon: <Info className="w-5 h-5 text-blue-700" /> },
  warn: { border: 'border-l-amber-500', icon: <AlertTriangle className="w-5 h-5 text-amber-600" /> },
  error: { border: 'border-l-red-600', icon: <XCircle className="w-5 h-5 text-red-600" /> },
};

export function Toasts({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: number) => void }) {
  if (items.length === 0) return null;
  return createPortal(
    <div className="fixed bottom-4 right-4 z-[90] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={cls('card shadow-lg border-l-4 px-4 py-3 flex items-start gap-3', TOAST_STYLE[t.type].border)}>
          {TOAST_STYLE[t.type].icon}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{t.title}</p>
            {t.msg && <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">{t.msg}</p>}
          </div>
          <button onClick={() => onDismiss(t.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0" aria-label="Dismiss notification">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <div className={cls('w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-200 text-blue-700 text-[11px] font-bold shrink-0 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300', className)}>
      {initialsOf(name)}
    </div>
  );
}
