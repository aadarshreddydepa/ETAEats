'use client'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepperProps {
  value: number
  onIncrement: () => void
  onDecrement: () => void
  size?: 'sm' | 'md'
  min?: number
  max?: number
  className?: string
}

export function Stepper({ value, onIncrement, onDecrement, size = 'md', min = 0, max, className }: StepperProps) {
  const atMin = value <= min
  const atMax = max !== undefined && value >= max

  return (
    <div
      className={cn(
        'inline-flex items-center select-none rounded-pill bg-primary text-text-on-dark',
        size === 'sm' ? 'h-9' : 'h-11',
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease"
        onClick={onDecrement}
        disabled={atMin}
        className={cn(
          'flex items-center justify-center transition-opacity disabled:opacity-40',
          size === 'sm' ? 'w-9 h-9' : 'w-11 h-11',
        )}
      >
        <Minus className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </button>
      <span className={cn('tabular-nums font-semibold', size === 'sm' ? 'min-w-[20px] text-[13px]' : 'min-w-[24px] text-[14px]', 'text-center')}>
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase"
        onClick={onIncrement}
        disabled={atMax}
        className={cn(
          'flex items-center justify-center transition-opacity disabled:opacity-40',
          size === 'sm' ? 'w-9 h-9' : 'w-11 h-11',
        )}
      >
        <Plus className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </button>
    </div>
  )
}
