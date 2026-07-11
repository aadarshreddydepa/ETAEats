'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useAnimation } from 'framer-motion'
import { Bus, Check, MapPin, Receipt, ShieldCheck, Tag, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Card, IconButton, Input } from '@/components/ui'
import { TopBar } from '@/components/layout/TopBar'
import { useCartStore } from '@/stores/cart.store'
import { useAuthStore } from '@/stores/auth.store'
import { useJourneyStore } from '@/stores/journey.store'
import { useOrderTrackingStore } from '@/stores/orderTracking.store'
import { openRazorpay } from '@/lib/razorpay'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Cart, Order, RazorpayOrderPayload, ValidatePromoResponse } from '@/lib/api.types'

const SHAKE_KEYFRAMES = [0, -8, 8, -6, 6, -4, 4, 0]

export default function CheckoutPage() {
  const router = useRouter()
  const { cartId, busId, restaurantId, items, totalPrice, clearCart, setCart } = useCartStore()
  const { user } = useAuthStore()
  const { activeJourney } = useJourneyStore()
  const { setActiveOrder } = useOrderTrackingStore()
  const bus = activeJourney?.bus ?? null
  const restaurant = activeJourney?.restaurant ?? null
  const [loading, setLoading] = useState(false)

  const [promoDraft, setPromoDraft] = useState('')
  const [appliedCode, setAppliedCode] = useState<string | null>(null)
  const [appliedMessage, setAppliedMessage] = useState<string | null>(null)
  const [payableTotal, setPayableTotal] = useState<number | null>(null)
  const [promoDiscount, setPromoDiscount] = useState<number | null>(null)
  const [validateLoading, setValidateLoading] = useState(false)
  const [promoCardFlash, setPromoCardFlash] = useState(false)
  const [inputDangerFlash, setInputDangerFlash] = useState(false)

  const inputShakeControls = useAnimation()
  const lockedSubtotalRef = useRef<number | null>(null)
  const subtotal = totalPrice()
  const displayTotal = payableTotal != null ? payableTotal : subtotal
  const restaurantIdForApi = restaurantId ?? restaurant?.id ?? null

  function clearPromo() {
    lockedSubtotalRef.current = null
    setAppliedCode(null)
    setAppliedMessage(null)
    setPayableTotal(null)
    setPromoDiscount(null)
    setPromoDraft('')
  }

  async function applyPromo() {
    const code = promoDraft.trim()
    if (!code) {
      toast.error('Enter a promo code')
      return
    }
    setValidateLoading(true)
    try {
      const { data } = await api.post<ValidatePromoResponse>('/promos/validate/', {
        code,
        cart_total: subtotal.toFixed(2),
        restaurant_id: restaurantIdForApi,
      })
      if (!data.valid) {
        await inputShakeControls.start({
          x: SHAKE_KEYFRAMES,
          transition: { duration: 0.4, ease: 'easeInOut' },
        })
        inputShakeControls.set({ x: 0 })
        setInputDangerFlash(true)
        window.setTimeout(() => setInputDangerFlash(false), 600)
        toast.error(data.message)
        return
      }
      const discount = parseFloat(data.discount_amount)
      const finalNum = parseFloat(data.final_total)
      lockedSubtotalRef.current = subtotal
      setAppliedCode(code.toUpperCase())
      setAppliedMessage(data.message)
      setPromoDiscount(discount)
      setPayableTotal(finalNum)
      setPromoCardFlash(true)
      window.setTimeout(() => setPromoCardFlash(false), 700)
    } catch {
      toast.error('Could not validate promo. Try again.')
    } finally {
      setValidateLoading(false)
    }
  }

  useEffect(() => {
    if (appliedCode == null) return
    const locked = lockedSubtotalRef.current
    if (locked == null) return
    if (Math.abs(subtotal - locked) > 0.005) {
      lockedSubtotalRef.current = null
      setAppliedCode(null)
      setAppliedMessage(null)
      setPayableTotal(null)
      setPromoDiscount(null)
      setPromoDraft('')
    }
  }, [subtotal, appliedCode])

  async function handlePay() {
    let effectiveCartId = cartId
    let effectiveBusId = busId ?? bus?.id ?? null

    if (!effectiveCartId || !effectiveBusId) {
      try {
        const { data: serverCart } = await api.get<Cart>('/orders/cart/')
        if (serverCart.id && serverCart.items.length > 0) {
          const recoveredBusId = serverCart.bus ?? bus?.id ?? null
          setCart(serverCart.id, serverCart.bus, serverCart.restaurant, serverCart.items)
          effectiveCartId = serverCart.id
          effectiveBusId = recoveredBusId
        }
      } catch { /* fall through */ }
    }

    if (!effectiveCartId || !effectiveBusId) {
      toast.error('Cart session expired. Please go back and try again.')
      return
    }
    setLoading(true)
    try {
      const { data: order } = await api.post<Order>('/orders/checkout/', {
        cart_id: effectiveCartId,
        bus_id: effectiveBusId,
        promo_code: appliedCode ?? '',
      })
      const { data: rpPayload } = await api.post<RazorpayOrderPayload>('/payments/razorpay/order/', { order_id: order.id })
      await openRazorpay(
        rpPayload,
        user?.phone_number ?? '',
        async (rpResponse) => {
          try {
            await api.post('/payments/razorpay/confirm/', {
              order_id: order.id,
              razorpay_order_id: rpResponse.razorpay_order_id,
              razorpay_payment_id: rpResponse.razorpay_payment_id,
              razorpay_signature: rpResponse.razorpay_signature,
            })
            setActiveOrder({
              id: order.id,
              restaurantName: order.restaurant_name,
              totalAmount: order.total_amount,
              createdAt: order.created_at,
              status: 'CONFIRMED',
            })
            clearCart()
            router.replace('/home')
          } catch {
            toast.error('Payment confirmation failed. Your order ID is: ' + order.id.slice(0, 8))
            router.replace(`/order/${order.id}`)
          }
        },
        () => {
          toast('Payment cancelled.')
          setLoading(false)
          // Best-effort cleanup — marks order as FAILED so it doesn't float on home
          api.post('/payments/razorpay/cancel/', { order_id: order.id }).catch(() => {})
        } 
      )
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
      toast.error(axiosErr?.response?.data?.error?.message ?? 'Checkout failed. Please try again.')
      setLoading(false)
    }
  }

  const discountRowRef = useRef<HTMLDivElement>(null)
  const [discountInnerHeight, setDiscountInnerHeight] = useState(0)

  useEffect(() => {
    if (!appliedCode || !discountRowRef.current) {
      setDiscountInnerHeight(0)
      return
    }
    const el = discountRowRef.current
    setDiscountInnerHeight(el.scrollHeight)
  }, [appliedCode, appliedMessage, promoDiscount, subtotal])

  return (
    <div className="app-shell">
      <div className="app-shell-inner lg:pt-10">
        <TopBar title="Review & pay" onBack={() => router.back()} />

        <div className="pb-44 space-y-4">
          <Card tone="powder" padding="md" radius="card" bordered={false} shadow="e1">
            <p className="text-label text-accent-ink-powder-blue">Pickup from</p>
            <div className="mt-3 flex items-start gap-3">
              <span className="h-10 w-10 rounded-lg bg-white/70 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-accent-ink-powder-blue" strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <p className="text-h4 text-text-primary truncate">{restaurant?.name}</p>
                <p className="text-body-sm text-text-tertiary mt-0.5 line-clamp-2">{restaurant?.address}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/40 flex items-center gap-3">
              <span className="h-10 w-10 rounded-lg bg-white/70 flex items-center justify-center flex-shrink-0">
                <Bus className="h-4 w-4 text-accent-ink-powder-blue" strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <p className="text-label text-accent-ink-powder-blue">Your bus</p>
                <p className="text-body text-text-primary mt-0.5">
                  <span className="font-semibold">{bus?.name}</span> · {bus?.numberPlate}
                </p>
              </div>
            </div>
          </Card>

          <Card tone="default" padding="md" radius="card" shadow="e1">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-text-muted" strokeWidth={1.8} />
              <p className="text-label text-text-muted">Your order</p>
            </div>
            <div className="mt-4 space-y-2.5">
              {items.map((item) => (
                <div key={item.id} className="flex items-baseline justify-between text-body-sm">
                  <span className="text-text-secondary truncate pr-3">
                    {item.menu_item_name} <span className="text-text-muted">× {item.quantity}</span>
                  </span>
                  <span className="text-text-primary font-medium tabular-nums flex-shrink-0">₹{item.line_total}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border-subtle space-y-2">
              <div className="flex items-baseline justify-between text-body-sm">
                <span className="text-text-secondary">Subtotal</span>
                <span className="text-text-primary font-medium tabular-nums">₹{subtotal.toFixed(2)}</span>
              </div>

              <motion.div
                className="overflow-hidden"
                initial={false}
                animate={{ height: appliedCode ? discountInnerHeight : 0 }}
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              >
                <div ref={discountRowRef} className="flex items-baseline justify-between text-body-sm pt-1">
                  <span className="text-success font-medium">
                    Promo ({appliedCode}){' '}
                    <span className="tabular-nums">−₹{(promoDiscount ?? 0).toFixed(2)}</span>
                  </span>
                </div>
              </motion.div>

              <div className="border-t border-border-subtle pt-3 flex items-baseline justify-between">
                <span className="text-h4 text-text-primary">Total</span>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={displayTotal.toFixed(2)}
                    className="text-h2 text-text-primary tabular-nums"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    ₹{displayTotal.toFixed(2)}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </Card>

          <motion.div
            animate={
              promoCardFlash
                ? { backgroundColor: ['rgba(34, 197, 94, 0.14)', 'rgba(34, 197, 94, 0)', 'transparent'] }
                : { backgroundColor: 'transparent' }
            }
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="rounded-2xl"
          >
            <Card tone="default" padding="md" radius="card" shadow="e1" className="border border-border-subtle">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-text-muted" strokeWidth={1.8} />
                <p className="text-label text-text-muted tracking-wide">Promo code</p>
              </div>

              {!appliedCode ? (
                <motion.div animate={inputShakeControls} initial={false} className="flex gap-2 items-start">
                  <div className={cn('flex-1 min-w-0 rounded-lg transition-[box-shadow] duration-300', inputDangerFlash && 'ring-2 ring-error')}>
                    <Input
                      placeholder="Enter promo code…"
                      value={promoDraft}
                      onChange={(e) => setPromoDraft(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyPromo())}
                      className="!mb-0"
                    />
                  </div>
                  <Button type="button" variant="secondary" className="flex-shrink-0 mt-0" onClick={applyPromo} loading={validateLoading}>
                    Apply
                  </Button>
                </motion.div>
              ) : (
                <div className="flex items-start gap-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                    className="h-9 w-9 rounded-full bg-success-bg flex items-center justify-center flex-shrink-0 mt-0.5"
                  >
                    <Check className="h-4 w-4 text-success" strokeWidth={2.2} />
                  </motion.div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-body-sm text-text-primary">
                      <span className="font-semibold tabular-nums">{appliedCode}</span> applied — save ₹{(promoDiscount ?? 0).toFixed(0)}!
                    </p>
                    {appliedMessage && (
                      <p className="text-caption text-text-muted mt-1">{appliedMessage}</p>
                    )}
                  </div>
                  <IconButton
                    type="button"
                    aria-label="Remove promo"
                    tone="ghost"
                    size="sm"
                    className="flex-shrink-0"
                    onClick={clearPromo}
                  >
                    <X className="h-4 w-4" />
                  </IconButton>
                </div>
              )}
            </Card>
          </motion.div>

          <div className="flex items-start gap-2 text-caption text-text-muted px-1">
            <ShieldCheck className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" strokeWidth={1.9} />
            <p>Payments are encrypted and processed by Razorpay. Your card details never touch our servers.</p>
          </div>
        </div>
      </div>

      <div className="mobile-floating-cta px-4 lg:pr-10 lg:pl-[calc(var(--rail-width,18rem)+4rem)] xl:pl-[calc(var(--rail-width,18rem)+5rem)]">
        <div className="mx-auto w-full max-w-md lg:max-w-3xl">
          <Button fullWidth size="lg" onClick={handlePay} loading={loading}>
            Pay ₹{displayTotal.toFixed(0)} securely
          </Button>
        </div>
      </div>
    </div>
  )
}
