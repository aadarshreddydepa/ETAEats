import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'neutral'
  | 'powder'
  | 'cream'
  | 'peach'
  | 'mint'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'muted'
  | 'primary'

type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  className?: string
  children: React.ReactNode
}

const variants: Record<BadgeVariant, string> = {
  neutral: 'bg-surface2 text-text-tertiary border-border',
  muted:   'bg-surface2 text-text-tertiary border-border',
  powder:  'bg-accent-powder-blue text-accent-ink-powder-blue border-transparent',
  cream:   'bg-accent-soft-cream text-accent-ink-soft-cream border-transparent',
  peach:   'bg-accent-peach text-accent-ink-peach border-transparent',
  mint:    'bg-accent-muted-mint text-accent-ink-muted-mint border-transparent',
  success: 'bg-success-bg text-success border-success-border',
  warning: 'bg-warning-bg text-warning border-warning-border',
  error:   'bg-error-bg text-error border-error-border',
  info:    'bg-info-bg text-info border-info-border',
  primary: 'bg-accent-powder-blue text-accent-ink-powder-blue border-transparent',
}

const sizes: Record<BadgeSize, string> = {
  sm: 'h-5 px-2 text-[10.5px] tracking-[0.04em]',
  md: 'h-6 px-2.5 text-[11.5px] tracking-[0.03em]',
}

export function Badge({ variant = 'neutral', size = 'md', dot, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill border font-semibold uppercase',
        sizes[size],
        variants[variant],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
