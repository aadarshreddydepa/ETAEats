'use client'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

interface TopBarProps {
  title: string
  userPhone?: string
  className?: string
}

export function TopBar({ title, userPhone, className }: TopBarProps) {
  return (
    <header
      className={cn(
        'h-[60px] border-b border-border-subtle bg-bg/90 backdrop-blur-md',
        'flex items-center justify-between px-8',
        className,
      )}
    >
      <h1 className="text-h4 text-text-primary">{title}</h1>
      <div className="flex items-center gap-3">
        <Badge variant="powder">Admin</Badge>
        {userPhone && (
          <span className="text-body-sm text-text-muted">{userPhone}</span>
        )}
      </div>
    </header>
  )
}
