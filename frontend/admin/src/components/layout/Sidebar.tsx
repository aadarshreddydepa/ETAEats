'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ShieldCheck,
  LayoutDashboard,
  Store,
  Building2,
  Route as RouteIcon,
  Bus as BusIcon,
  Link2,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard',             label: 'Overview',    icon: LayoutDashboard },
  { href: '/dashboard/restaurants', label: 'Restaurants', icon: Store },
  { href: '/dashboard/operators',   label: 'Operators',   icon: Building2 },
  { href: '/dashboard/routes',      label: 'Routes',      icon: RouteIcon },
  { href: '/dashboard/buses',       label: 'Buses',       icon: BusIcon },
  { href: '/dashboard/assignments', label: 'Assignments', icon: Link2 },
  { href: '/dashboard/profile',     label: 'Profile',     icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-72 bg-bg border-r border-border flex flex-col px-6 py-8">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-lg bg-accent-powder-blue flex items-center justify-center shadow-e1 ring-1 ring-inset ring-white/40 flex-shrink-0">
          <ShieldCheck className="h-5 w-5 text-accent-ink-powder-blue" />
        </div>
        <div className="min-w-0">
          <p className="text-[18px] font-semibold tracking-[-0.02em] text-text-primary leading-none">ETAEats</p>
          <p className="mt-1.5 text-[11px] tracking-[0.06em] uppercase text-text-muted font-semibold">
            Admin Platform
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 h-12 px-4 rounded-lg transition-all duration-base ease-standard',
                active
                  ? 'bg-primary text-text-on-dark shadow-e1'
                  : 'text-text-secondary hover:bg-surface hover:text-text-primary',
              )}
            >
              <Icon
                className="h-[18px] w-[18px] flex-shrink-0"
                strokeWidth={active ? 2.1 : 1.8}
              />
              <span className="text-[14px] font-semibold">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Tip card */}
      <div className="mt-auto rounded-card bg-accent-soft-cream p-5">
        <p className="text-label text-accent-ink-soft-cream">Tip</p>
        <p className="mt-2 text-body-sm text-text-primary leading-snug">
          Keep the platform healthy — review unassigned buses and pending restaurant activations regularly.
        </p>
      </div>
    </aside>
  )
}
