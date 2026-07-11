'use client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Trash2, Plus } from 'lucide-react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import { Button, Card, EmptyState, IconButton, Stepper } from '@/components/ui'
import { TopBar } from '@/components/layout/TopBar'
import { useCartStore } from '@/stores/cart.store'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/lib/api'
import type { Cart } from '@/lib/api.types'

export default function CartPage() {
  const router = useRouter()
  const { cartId, items, setCart, totalPrice } = useCartStore()
  const { isAuthenticated } = useAuthStore()

  async function refreshCartFromServer() {
    try {
      const { data } = await api.get<Cart>('/orders/cart/')
      setCart(data.id, data.bus, data.restaurant, data.items)
    } catch {
      // Ignore here; caller handles user-facing toast.
    }
  }

  async function handleRemove(cartItemId: number) {
    if (!cartId) return
    try {
      const { data } = await api.delete<Cart>(`/orders/cart/items/${cartItemId}/`)
      setCart(cartId, data.bus, data.restaurant, data.items)
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        await refreshCartFromServer()
        toast.message('Cart refreshed.')
        return
      }
      toast.error('Could not remove item.')
    }
  }

  async function handleUpdate(cartItemId: number, quantity: number) {
    if (!cartId) return
    try {
      const { data } = await api.patch<Cart>(`/orders/cart/items/${cartItemId}/`, { quantity })
      setCart(cartId, data.bus, data.restaurant, data.items)
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        await refreshCartFromServer()
        toast.message('Cart refreshed. Please try again.')
        return
      }
      toast.error('Could not update quantity.')
    }
  }

  function handleCheckout() {
    if (!isAuthenticated) return router.push('/auth/login')
    router.push('/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="app-shell">
        <div className="app-shell-inner pt-12">
          <EmptyState
            icon={<ShoppingBag className="h-6 w-6" strokeWidth={1.7} />}
            tone="cream"
            title="Your cart is empty"
            description="Add something you love from the menu to get started."
            action={<Button variant="secondary" onClick={() => router.back()}>Back to menu</Button>}
          />
        </div>
      </div>
    )
  }

  const subtotal = totalPrice()

  return (
    <div className="app-shell">
      <div className="app-shell-inner lg:pt-10">
        <TopBar
          title="Your cart"
          subtitle={`${items.length} item${items.length > 1 ? 's' : ''}`}
          onBack={() => router.back()}
        />

        {/* Two-column on desktop, stacked on mobile */}
        <div className="pb-36 lg:pb-12 lg:flex lg:gap-8 lg:items-start mt-2">

          {/* ── Left column: item list ── */}
          <div className="flex-1 min-w-0">
            <Card tone="default" padding="none" radius="card" shadow="e1" className="px-5 py-2">
              <AnimatePresence initial={false}>
                {items.map((item, index) => {
                  const lineTotal = parseFloat(item.unit_price) * item.quantity
                  const letter = item.menu_item_name.charAt(0).toUpperCase()
                  const isLast = index === items.length - 1

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div
                        className={`flex items-center gap-3 py-4 ${
                          isLast ? '' : 'border-b border-border-subtle'
                        }`}
                      >
                        {/* Letter avatar */}
                        <div className="h-11 w-11 flex-shrink-0 rounded-xl bg-surface2 border border-border-subtle flex items-center justify-center">
                          <span className="text-h4 text-text-muted leading-none">{letter}</span>
                        </div>

                        {/* Name + unit price */}
                        <div className="flex-1 min-w-0">
                          <p className="text-body font-semibold text-text-primary truncate">
                            {item.menu_item_name}
                          </p>
                          <p className="text-body-sm text-text-tertiary mt-0.5">
                            ₹{item.unit_price} each
                          </p>
                        </div>

                        {/* Stepper · line total · remove */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Stepper
                            value={item.quantity}
                            onIncrement={() => handleUpdate(item.id, item.quantity + 1)}
                            onDecrement={() =>
                              item.quantity > 1
                                ? handleUpdate(item.id, item.quantity - 1)
                                : handleRemove(item.id)
                            }
                            size="sm"
                          />
                          <span className="w-16 text-right text-body font-semibold text-text-primary tabular-nums">
                            ₹{lineTotal.toFixed(0)}
                          </span>
                          <IconButton
                            aria-label={`Remove ${item.menu_item_name}`}
                            tone="ghost"
                            size="sm"
                            onClick={() => handleRemove(item.id)}
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.7} />
                          </IconButton>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </Card>

            {/* Add more items */}
            <div className="mt-3 pl-1">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <Plus className="h-4 w-4" />
                Add more items
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* Checkout button — fixed bottom bar on mobile only */}
      <div className="lg:hidden mobile-floating-cta px-4">
        <div className="mx-auto w-full max-w-md">
          <Button fullWidth size="lg" onClick={handleCheckout}>
            Place order · ₹{subtotal.toFixed(0)}
          </Button>
        </div>
      </div>
    </div>
  )
}
