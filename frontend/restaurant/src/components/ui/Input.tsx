'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  hint?: string
  error?: string
  leading?: React.ReactNode
  trailing?: React.ReactNode
  inputClassName?: string
  containerClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leading, trailing, className, inputClassName, containerClassName, id, ...props },
  ref,
) {
  const inputId = id ?? props.name

  // When used standalone (no label/leading/trailing/error), keep className on the
  // container span. When used with extras, keep the user-provided className on the
  // outer label so callers can size/pad it as before.
  const standalone = !label && !leading && !trailing && !error && !hint
  const labelClasses = standalone ? undefined : className
  const containerClasses = standalone ? className : containerClassName

  return (
    <label htmlFor={inputId} className={cn('block', labelClasses)}>
      {label && <span className="block text-label text-text-muted mb-2">{label}</span>}
      <span
        className={cn(
          'group flex items-center gap-2 rounded-sm border bg-surface px-4 py-3 transition-colors duration-base ease-standard',
          error
            ? 'border-error'
            : 'border-border focus-within:border-border-strong focus-within:bg-surface',
          containerClasses,
        )}
      >
        {leading && <span className="text-text-tertiary text-body-sm">{leading}</span>}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'flex-1 bg-transparent text-body text-text-primary placeholder:text-text-muted outline-none min-w-0',
            inputClassName,
          )}
          {...props}
        />
        {trailing}
      </span>
      {(hint || error) && (
        <span className={cn('mt-2 block text-body-sm', error ? 'text-error' : 'text-text-muted')}>
          {error ?? hint}
        </span>
      )}
    </label>
  )
})
