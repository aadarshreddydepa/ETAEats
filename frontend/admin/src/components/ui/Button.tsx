'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'soft' | 'danger' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
}

const base =
  'relative inline-flex items-center justify-center gap-2 font-semibold tracking-[-0.005em] ' +
  'select-none transition-all duration-base ease-standard ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border-strong ' +
  'disabled:cursor-not-allowed disabled:opacity-50 ' +
  'active:scale-[0.985]'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-text-on-dark shadow-cta ' +
    'hover:bg-primary-hover hover:-translate-y-0.5 ' +
    'disabled:bg-gray-400 disabled:text-white disabled:shadow-e1 disabled:translate-y-0',
  secondary:
    'bg-surface text-text-primary border border-border shadow-e1 ' +
    'hover:bg-surface2 hover:border-border-strong hover:shadow-e2 ' +
    'disabled:bg-gray-100 disabled:text-text-muted',
  outline:
    'bg-transparent text-text-primary border border-border ' +
    'hover:border-border-strong hover:bg-surface ' +
    'disabled:text-text-muted disabled:border-border',
  ghost:
    'bg-transparent text-text-secondary ' +
    'hover:bg-surface2 hover:text-text-primary',
  soft:
    'bg-accent-powder-blue text-accent-ink-powder-blue border border-transparent ' +
    'hover:shadow-e1',
  danger:
    'bg-error-bg text-error border border-error-border ' +
    'hover:bg-error hover:text-white',
  success:
    'bg-success-bg text-success border border-success-border ' +
    'hover:bg-success hover:text-white',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9  px-3.5 text-[13px] rounded-sm',
  md: 'h-11 px-5   text-[15px] rounded-sm',
  lg: 'h-13 px-6   text-[15px] rounded-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span
            className={cn(
              'h-4 w-4 rounded-full border-2 animate-spin',
              variant === 'primary'
                ? 'border-white/35 border-t-white'
                : 'border-current/30 border-t-current',
            )}
          />
        )}
        <span className={cn('inline-flex items-center gap-2', loading && 'opacity-90')}>
          {children}
        </span>
      </button>
    )
  },
)
Button.displayName = 'Button'
