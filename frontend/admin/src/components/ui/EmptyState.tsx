import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  tone?: 'neutral' | 'powder' | 'cream' | 'peach' | 'mint'
  className?: string
}

const bubbleTones: Record<NonNullable<EmptyStateProps['tone']>, string> = {
  neutral: 'bg-surface2 text-text-tertiary border-border',
  powder:  'bg-accent-powder-blue text-accent-ink-powder-blue border-transparent',
  cream:   'bg-accent-soft-cream text-accent-ink-soft-cream border-transparent',
  peach:   'bg-accent-peach text-accent-ink-peach border-transparent',
  mint:    'bg-accent-muted-mint text-accent-ink-muted-mint border-transparent',
}

export function EmptyState({ icon, title, description, action, tone = 'neutral', className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center text-center px-6 py-10', className)}>
      {icon && (
        <div
          className={cn(
            'mb-5 h-[72px] w-[72px] rounded-hero border flex items-center justify-center',
            bubbleTones[tone],
          )}
        >
          {icon}
        </div>
      )}
      <h2 className="text-h3 text-text-primary">{title}</h2>
      {description && (
        <p className="mt-2 max-w-xs text-body-sm text-text-tertiary">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
