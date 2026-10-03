import { useId } from 'react'
import { cn } from '@/utils/cn'
import { nkFocus } from '@/utils/focus'

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** Helper text shown below the field. */
  helper?: string
  error?: string
  /** Material Symbols leading icon. */
  startIcon?: string
  endAdornment?: React.ReactNode
  block?: boolean
}

export function TextField({
  label,
  helper,
  error,
  startIcon,
  endAdornment,
  block,
  className,
  id,
  required,
  ...rest
}: TextFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const helperId = `${fieldId}-helper`
  const invalid = Boolean(error)
  return (
    <div className={cn(block && 'w-full', 'flex flex-col gap-1')}>
      <label className="nk-label" htmlFor={fieldId}>
        {label}
        {required && (
          <span className="ml-1 text-danger-strong" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="relative">
        {startIcon && (
          <span
            className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-fg-subtle"
            aria-hidden="true"
          >
            {startIcon}
          </span>
        )}
        <input
          id={fieldId}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={helper || error ? helperId : undefined}
          className={cn(
            'h-10 w-full rounded-control border bg-surface px-3 text-body text-fg placeholder:text-fg-subtle',
            startIcon ? 'pl-9' : '',
            endAdornment ? 'pr-10' : '',
            invalid ? 'border-danger' : 'border-border-strong',
            nkFocus,
            className,
          )}
          {...rest}
        />
        {endAdornment && (
          <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">{endAdornment}</div>
        )}
      </div>
      {(helper || error) && (
        <p
          id={helperId}
          className={cn('text-caption', invalid ? 'text-danger-strong' : 'text-fg-subtle')}
          role={invalid ? 'alert' : undefined}
        >
          {error ?? helper}
        </p>
      )}
    </div>
  )
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  helper?: string
  error?: string
  block?: boolean
}

export function TextArea({ label, helper, error, block, className, id, required, rows = 4, ...rest }: TextAreaProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const helperId = `${fieldId}-helper`
  const invalid = Boolean(error)
  return (
    <div className={cn(block && 'w-full', 'flex flex-col gap-1')}>
      <label className="nk-label" htmlFor={fieldId}>
        {label}
        {required && (
          <span className="ml-1 text-danger-strong" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <textarea
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={helper || error ? helperId : undefined}
        className={cn(
          'w-full rounded-control border bg-surface p-3 text-body text-fg placeholder:text-fg-subtle',
          invalid ? 'border-danger' : 'border-border-strong',
          nkFocus,
          className,
        )}
        {...rest}
      />
      {(helper || error) && (
        <p
          id={helperId}
          className={cn('text-caption', invalid ? 'text-danger-strong' : 'text-fg-subtle')}
          role={invalid ? 'alert' : undefined}
        >
          {error ?? helper}
        </p>
      )}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  helper?: string
  block?: boolean
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ label, helper, block, options, placeholder, className, id, required, ...rest }: SelectProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className={cn(block && 'w-full', 'flex flex-col gap-1')}>
      <label className="nk-label" htmlFor={fieldId}>
        {label}
        {required && (
          <span className="ml-1 text-danger-strong" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="relative">
        <select
          id={fieldId}
          required={required}
          className={cn(
            'h-10 w-full appearance-none rounded-control border border-border-strong bg-surface px-3 pr-9 text-body text-fg',
            nkFocus,
            className,
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span
          className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[20px] text-fg-subtle"
          aria-hidden="true"
        >
          expand_more
        </span>
      </div>
      {helper && <p className="text-caption text-fg-subtle">{helper}</p>}
    </div>
  )
}

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function Checkbox({ label, className, id, ...rest }: CheckboxProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className="flex items-center gap-2">
      <input
        id={fieldId}
        type="checkbox"
        className={cn(
          'h-4 w-4 rounded-[3px] border-border-strong accent-primary',
          nkFocus,
          className,
        )}
        {...rest}
      />
      <label htmlFor={fieldId} className="text-body-small text-fg">
        {label}
      </label>
    </div>
  )
}
