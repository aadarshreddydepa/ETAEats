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
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leading, trailing, className, inputClassName, id, ...props },
  ref,
) {
  const inputId = id ?? props.name
  return (
    <label htmlFor={inputId} className={cn('block', className)}>
      {label && (
        <span className="block text-label text-text-secondary mb-2">{label}</span>
      )}
      <span
        className={cn(
          'group flex items-center gap-2 rounded-sm border bg-surface px-4 py-3 transition-colors duration-base ease-standard',
          error
            ? 'border-error'
            : 'border-border focus-within:border-border-strong focus-within:bg-surface',
        )}
      >
        {leading && <span className="text-text-tertiary text-body-sm">{leading}</span>}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'flex-1 min-w-0 bg-transparent text-body text-text-primary placeholder:text-text-muted ' +
              'appearance-none border-0 outline-none ring-0 shadow-none ' +
              'focus:ring-0 focus:outline-none focus:border-0',
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
