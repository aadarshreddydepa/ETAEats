import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function SectionHeader({ eyebrow, title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-end justify-between gap-4 mb-4', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-label text-text-muted mb-1.5">{eyebrow}</p>}
        <h2 className="text-h3 text-text-primary truncate">{title}</h2>
        {description && <p className="text-body-sm text-text-tertiary mt-1">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
