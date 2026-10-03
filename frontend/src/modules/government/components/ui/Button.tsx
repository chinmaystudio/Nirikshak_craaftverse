import { cn } from '@/utils/cn'
import { nkControlBase } from '@/utils/focus'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Material Symbols ligature name (icon-only when no children given). */
  icon?: string
  iconPosition?: 'start' | 'end'
  /** Render as full-width block. */
  block?: boolean
}

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-on hover:bg-primary-strong border border-primary-border',
  secondary: 'bg-secondary text-secondary-fg hover:opacity-90 border border-secondary',
  outline: 'border border-border-strong bg-surface text-fg hover:bg-surface-2',
  ghost: 'text-fg hover:bg-surface-2 border border-transparent',
  danger: 'bg-danger text-white hover:opacity-90 border border-danger',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'min-h-8 px-3 text-body-small',
  md: 'min-h-10 px-4 text-button',
  lg: 'min-h-12 px-5 text-button',
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'start',
  block,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const iconEl = icon ? (
    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
      {icon}
    </span>
  ) : null
  return (
    <button
      type={type}
      className={cn(
        nkControlBase,
        VARIANT[variant],
        SIZE[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {iconPosition === 'start' && iconEl}
      {children}
      {iconPosition === 'end' && iconEl}
    </button>
  )
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string
  /** Accessible label — REQUIRED (icon-only control). */
  label: string
  variant?: 'ghost' | 'outline'
  size?: 'sm' | 'md'
}

export function IconButton({ icon, label, variant = 'ghost', size = 'md', className, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        nkControlBase,
        variant === 'ghost' ? 'border border-transparent text-fg-muted hover:bg-surface-2 hover:text-fg' : 'border border-border-strong bg-surface text-fg hover:bg-surface-2',
        size === 'sm' ? 'min-h-8 min-w-8 p-1' : 'min-h-10 min-w-10 p-2',
        className,
      )}
      {...rest}
    >
      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
        {icon}
      </span>
    </button>
  )
}
