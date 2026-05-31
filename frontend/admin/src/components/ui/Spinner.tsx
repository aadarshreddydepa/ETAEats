import { cn } from '@/lib/utils'

interface SpinnerProps {
  className?: string
  tone?: 'primary' | 'light' | 'tonal'
  size?: 'sm' | 'md' | 'lg'
}

const sizes: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
}

export function Spinner({ className, tone = 'primary', size = 'md' }: SpinnerProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-full border-2 animate-spin',
        tone === 'primary'
          ? 'border-gray-300 border-t-primary'
          : tone === 'light'
            ? 'border-white/30 border-t-white'
            : 'border-gray-200 border-t-gray-500',
        sizes[size],
        className,
      )}
    />
  )
}
