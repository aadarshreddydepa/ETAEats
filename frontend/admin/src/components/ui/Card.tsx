import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type CardTone = 'default' | 'elevated' | 'cream' | 'powder' | 'peach' | 'mint' | 'sunk'
type CardPadding = 'none' | 'sm' | 'md' | 'lg'
type CardRadius = 'md' | 'lg' | 'xl' | 'card' | 'hero'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: CardTone
  padding?: CardPadding
  radius?: CardRadius
  interactive?: boolean
  bordered?: boolean
  shadow?: 'none' | 'e1' | 'e2' | 'e3'
  as?: 'div' | 'article' | 'section' | 'li'
}

const tones: Record<CardTone, string> = {
  default:  'bg-surface',
  elevated: 'bg-surface2',
  cream:    'bg-accent-soft-cream',
  powder:   'bg-accent-powder-blue',
  peach:    'bg-accent-peach',
  mint:     'bg-accent-muted-mint',
  sunk:     'bg-sunk',
}

const paddings: Record<CardPadding, string> = {
  none: 'p-0',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-6',
}

const radii: Record<CardRadius, string> = {
  md:   'rounded-md',
  lg:   'rounded-lg',
  xl:   'rounded-xl',
  card: 'rounded-card',
  hero: 'rounded-hero',
}

const shadowMap = {
  none: '',
  e1:   'shadow-e1',
  e2:   'shadow-e2',
  e3:   'shadow-e3',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    tone = 'default',
    padding = 'md',
    radius = 'card',
    bordered = true,
    shadow = 'e1',
    interactive,
    as = 'div',
    className,
    children,
    ...props
  },
  ref,
) {
  const Tag = as as React.ElementType
  return (
    <Tag
      ref={ref}
      className={cn(
        tones[tone],
        radii[radius],
        paddings[padding],
        bordered && tone === 'default' && 'border border-border',
        bordered && (tone === 'sunk' || tone === 'elevated') && 'border border-border-subtle',
        shadowMap[shadow],
        interactive &&
          'cursor-pointer transition-all duration-base ease-standard hover:-translate-y-0.5 hover:shadow-e3 active:translate-y-0 active:scale-[0.99]',
        'text-left',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
})
