'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type IconButtonTone = 'ghost' | 'surface' | 'soft'
type IconButtonSize = 'sm' | 'md' | 'lg'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: IconButtonTone
  size?: IconButtonSize
  'aria-label': string
}

const tones: Record<IconButtonTone, string> = {
  ghost:   'bg-transparent text-text-secondary hover:bg-surface2 hover:text-text-primary',
  surface: 'bg-surface text-text-primary border border-border hover:shadow-e2 hover:-translate-y-0.5',
  soft:    'bg-accent-powder-blue text-accent-ink-powder-blue hover:shadow-e1',
}

const sizes: Record<IconButtonSize, string> = {
  sm: 'h-9  w-9  rounded-full',
  md: 'h-11 w-11 rounded-full',
  lg: 'h-14 w-14 rounded-full',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { tone = 'ghost', size = 'md', className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center transition-all duration-base ease-standard',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border-strong',
        'active:scale-[0.96]',
        tones[tone],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
})
