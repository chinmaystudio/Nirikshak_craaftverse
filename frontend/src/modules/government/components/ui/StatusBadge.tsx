import { useI18n } from '@/context/I18nContext'
import type { StatusDescriptor } from '@/types'
import { TONE_CLASS } from '@/utils/status'
import { cn } from '@/utils/cn'

/**
 * StatusBadge — the spec's core status rule: NEVER color alone. Renders the
 * tone tint + a distinct Material Symbols icon + the translated text label.
 */
export function StatusBadge({
  descriptor,
  className,
  size = 'md',
}: {
  descriptor?: StatusDescriptor
  className?: string
  size?: 'sm' | 'md'
}) {
  const { t } = useI18n()
  const desc = descriptor || { key: 'status.inExecution', tone: 'info' as const, icon: 'progress_activity' }
  const tone = TONE_CLASS[desc.tone] || TONE_CLASS.neutral
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-badge border font-caption',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5',
        tone.bg,
        tone.text,
        tone.border,
        className,
      )}
    >
      <span
        className={cn('material-symbols-outlined', size === 'sm' ? 'text-[13px]' : 'text-[15px]')}
        aria-hidden="true"
      >
        {desc.icon || 'info'}
      </span>
      {desc.key ? t(desc.key) : 'In Execution'}
    </span>
  )
}

/** Plain tinted text (no border) for dense tables — still icon+text. */
export function StatusText({ descriptor, className }: { descriptor?: StatusDescriptor; className?: string }) {
  const { t } = useI18n()
  const desc = descriptor || { key: 'status.inExecution', tone: 'info' as const, icon: 'progress_activity' }
  const tone = TONE_CLASS[desc.tone] || TONE_CLASS.neutral
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap text-caption', tone.text, className)}>
      <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
        {desc.icon || 'info'}
      </span>
      {desc.key ? t(desc.key) : 'In Execution'}
    </span>
  )
}
