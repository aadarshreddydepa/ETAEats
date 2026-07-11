import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'sm' | 'md' | 'lg' | 'card' | 'hero' | 'pill' | 'full'
}

const roundedMap: Record<NonNullable<SkeletonProps['rounded']>, string> = {
  sm:   'rounded-sm',
  md:   'rounded-md',
  lg:   'rounded-lg',
  card: 'rounded-card',
  hero: 'rounded-hero',
  pill: 'rounded-pill',
  full: 'rounded-full',
}

export function Skeleton({ className, width, height, rounded = 'sm' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('slux-shimmer', roundedMap[rounded], className)}
      style={{
        width:  width  !== undefined ? (typeof width  === 'number' ? `${width}px`  : width)  : undefined,
        height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      }}
    />
  )
}
