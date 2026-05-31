'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { ShoppingBag, ChevronRight } from 'lucide-react'
import { useCartStore } from '@/stores/cart.store'

interface CartBarProps {
  // kept for caller compatibility — bubble visibility is driven by item count + route
  visible?: boolean
}

export function CartBar({ visible: _visible = true }: CartBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const totalItems = useCartStore((s) => s.totalItems())
  const totalPrice = useCartStore((s) => s.totalPrice())

  const shouldShow = totalItems > 0 && pathname !== '/cart'

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.button
          key="cart-bubble"
          initial={{ x: 64, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 64, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ scale: 1.05 }}
          onClick={() => router.push('/cart')}
          aria-label={`View cart — ${totalItems} item${totalItems > 1 ? 's' : ''}, ₹${totalPrice.toFixed(0)}`}
          className="fixed z-40 cursor-pointer
                     top-4 right-4
                     flex items-center gap-2.5 rounded-full
                     bg-primary text-text-on-dark
                     px-4 py-2.5
                     shadow-lg hover:shadow-xl
                     transition-shadow duration-base ease-standard"
        >
          {/* Bag icon with red count badge */}
          <span className="relative flex-shrink-0">
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={2} />
            <span
              aria-hidden="true"
              className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full
                         bg-red-500 text-white text-[9px] font-bold
                         flex items-center justify-center leading-none"
            >
              {totalItems > 9 ? '9+' : totalItems}
            </span>
          </span>

          {/* Price — always visible */}
          <span className="text-[15px] font-semibold tracking-[-0.005em]">
            ₹{totalPrice.toFixed(0)}
          </span>

          {/* Label + chevron — desktop only */}
          <span className="hidden lg:inline text-[13px] font-medium text-white/75">
            View cart
          </span>
          <ChevronRight
            className="hidden lg:block h-4 w-4 text-white/60"
            strokeWidth={2}
          />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
