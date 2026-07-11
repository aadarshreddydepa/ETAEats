'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Wallet,
} from 'lucide-react'
import { isAxiosError } from 'axios'
import { Button, Card, Input, Spinner } from '@/components/ui'
import { TopBar } from '@/components/layout/TopBar'
import { useCartStore } from '@/stores/cart.store'
import { useAuthStore } from '@/stores/auth.store'
import { useJourneyStore } from '@/stores/journey.store'
import { useOrderTrackingStore } from '@/stores/orderTracking.store'
import { loadRazorpay } from '@/lib/razorpay'
import api from '@/lib/api'
import type { Order, RazorpayOrderPayload } from '@/lib/api.types'

interface RpResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

const UPI_APPS = [
  { id: 'gpay',    label: 'Google Pay', pkg: 'com.google.android.apps.nbu.paisa.user', emoji: '🟦' },
  { id: 'phonepe', label: 'PhonePe',    pkg: 'com.phonepe.app',                         emoji: '🟪' },
  { id: 'paytm',   label: 'Paytm',      pkg: 'net.one97.paytm',                         emoji: '🔵' },
  { id: 'bhim',    label: 'BHIM',       pkg: 'in.org.npci.upiapp',                      emoji: '🇮🇳' },
] as const

function isValidUpi(id: string): boolean {
  if (id.includes(' ')) return false
  const parts = id.split('@')
  return parts.length === 2 && (parts[0]?.length ?? 0) > 0 && (parts[1]?.length ?? 0) > 0
}

export default function PaymentPage() {
  const router = useRouter()
  const { cartId, busId, items, totalPrice, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const { activeJourney } = useJourneyStore()
  const { setActiveOrder } = useOrderTrackingStore()

  const [scriptReady, setScriptReady]   = useState(false)
  const [rpPayload, setRpPayload]       = useState<RazorpayOrderPayload | null>(null)
  const [orderId, setOrderId]           = useState<string | null>(null)
  const [initError, setInitError]       = useState<string | null>(null)
  const [initLoading, setInitLoading]   = useState(true)
  const [paying, setPaying]             = useState(false)
  const [verifyError, setVerifyError]   = useState<string | null>(null)
  const [upiId, setUpiId]               = useState('')
  const [upiVerified, setUpiVerified]   = useState(false)
  const [upiError, setUpiError]         = useState<string | null>(null)
  const [selectedApp, setSelectedApp]   = useState<string | null>(null)
  const initFired = useRef(false)

  const bus        = activeJourney?.bus        ?? null
  const restaurant = activeJourney?.restaurant ?? null
  const total      = totalPrice()

  useEffect(() => {
    if (initFired.current) return
    initFired.current = true
    runInit()
  }, [])

  async function runInit() {
    setInitLoading(true)
    setInitError(null)
    try {
      await loadRazorpay()
      setScriptReady(true)

      const effectiveBusId = busId ?? bus?.id ?? null
      const { data: order } = await api.post<Order>('/orders/checkout/', {
        cart_id:    cartId,
        bus_id:     effectiveBusId,
        promo_code: '',
      })
      setOrderId(order.id)

      const { data: payload } = await api.post<RazorpayOrderPayload>('/payments/razorpay/order/', {
        order_id: order.id,
      })
      setRpPayload(payload)
    } catch (err) {
      const msg = isAxiosError(err)
        ? (err.response?.data?.error?.message ?? 'Failed to initialise payment.')
        : 'Razorpay script failed to load.'
      setInitError(msg)
    } finally {
      setInitLoading(false)
    }
  }

  async function handleConfirm(rpRes: RpResponse) {
    setPaying(true)
    setVerifyError(null)
    try {
      const { data: confirmed } = await api.post<Order>('/payments/razorpay/confirm/', {
        order_id:            orderId,
        razorpay_order_id:   rpRes.razorpay_order_id,
        razorpay_payment_id: rpRes.razorpay_payment_id,
        razorpay_signature:  rpRes.razorpay_signature,
      })
      setActiveOrder({
        id:             confirmed.id,
        restaurantName: confirmed.restaurant_name,
        totalAmount:    confirmed.total_amount,
        createdAt:      confirmed.created_at,
        status:         'CONFIRMED',
      })
      clearCart()
      router.replace(`/order/${orderId}`)
    } catch {
      setVerifyError(
        `Payment received but verification failed — contact support with order ID ${orderId?.slice(0, 8)}`
      )
      setPaying(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function openWith(extra: Record<string, any>) {
    if (!rpPayload || !scriptReady) return
    setPaying(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rzp = new (window.Razorpay as any)({
      key:         rpPayload.key_id,
      amount:      rpPayload.amount,
      currency:    rpPayload.currency,
      order_id:    rpPayload.razorpay_order_id,
      name:        'ETA Eats',
      description: 'Highway food pre-order',
      prefill:     { contact: user?.phone_number ?? '' },
      theme:       { color: '#0d0d0d' },
      handler:     (r: RpResponse) => handleConfirm(r),
      modal:       { ondismiss: () => setPaying(false) },
      ...extra,
    })
    rzp.open()
  }

  function handlePrimaryPay() {
    openWith({
      config: {
        display: {
          blocks: {
            upi:   { name: 'Pay via UPI',   instruments: [{ method: 'upi' }] },
            other: { name: 'Other methods', instruments: [{ method: 'card' }, { method: 'netbanking' }] },
          },
          sequence:    ['block.upi', 'block.other'],
          preferences: { show_default_blocks: false },
        },
      },
    })
  }

  function verifyUpiId() {
    setUpiError(null)
    setUpiVerified(false)
    if (!isValidUpi(upiId)) {
      setUpiError('Enter a valid UPI ID — e.g. name@upi')
      return
    }
    setUpiVerified(true)
  }

  function handleUpiIdPay() {
    openWith({
      prefill: { contact: user?.phone_number ?? '', method: 'upi', vpa: upiId },
    })
  }

  function handleAppTilePay() {
    const app = UPI_APPS.find((a) => a.id === selectedApp)
    if (!app) return
    openWith({
      config: {
        display: {
          blocks: {
            upi: {
              name:        `Pay via ${app.label}`,
              instruments: [{ method: 'upi', flows: ['intent', 'qr'] }],
            },
          },
          sequence:    ['block.upi'],
          preferences: { show_default_blocks: false },
        },
      },
    })
  }

  const isReady = scriptReady && !!rpPayload && !paying

  if (items.length === 0) {
    return (
      <div className="app-shell">
        <div className="app-shell-inner flex items-center justify-center pt-20">
          <p className="text-body text-text-muted">Your cart is empty.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="app-shell-inner lg:pt-10">
        <TopBar title="Payment" onBack={() => router.back()} />

        <div className="pb-10 space-y-4">

          {/* Order summary */}
          <Card tone="powder" padding="md" radius="card" bordered={false} shadow="e1">
            <p className="text-label text-accent-ink-powder-blue">Your order</p>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-body-sm">
                <span className="text-text-secondary">
                  {items.length} item{items.length > 1 ? 's' : ''}
                </span>
                <span className="text-text-primary font-semibold tabular-nums">
                  ₹{total.toFixed(0)}
                </span>
              </div>
              {restaurant && (
                <p className="text-body-sm text-text-tertiary">Stop: {restaurant.name}</p>
              )}
              {bus && (
                <p className="text-body-sm text-text-tertiary">
                  Bus: {bus.name} · {bus.numberPlate}
                </p>
              )}
            </div>
          </Card>

          {/* Init loading */}
          {initLoading && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <Spinner className="h-6 w-6" />
              <span className="text-body-sm text-text-muted">Setting up payment…</span>
            </div>
          )}

          {/* Init error */}
          {!initLoading && initError && (
            <Card tone="default" padding="md" radius="card" shadow="e1">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-error mt-0.5 flex-shrink-0" strokeWidth={1.8} />
                <div className="flex-1">
                  <p className="text-body-sm text-error">{initError}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 -ml-2"
                    onClick={() => {
                      initFired.current = false
                      runInit()
                    }}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Retry
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Verification error (stays visible after payment failure) */}
          {verifyError && (
            <Card tone="default" padding="md" radius="card" shadow="e1">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-error mt-0.5 flex-shrink-0" strokeWidth={1.8} />
                <p className="text-body-sm text-error">{verifyError}</p>
              </div>
            </Card>
          )}

          {!initLoading && !initError && (
            <>
              {/* ── Section 1: Primary Razorpay button ── */}
              <Card tone="default" padding="md" radius="card" shadow="e1">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-4 w-4 text-text-muted" strokeWidth={1.8} />
                  <p className="text-label text-text-muted">Pay securely</p>
                </div>
                <Button
                  fullWidth
                  size="lg"
                  onClick={handlePrimaryPay}
                  disabled={!isReady}
                  loading={paying}
                >
                  Pay ₹{total.toFixed(0)} · All methods
                </Button>
                <div className="mt-3 flex items-center gap-1.5 text-caption text-text-muted">
                  <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.9} />
                  <span>UPI, cards, and netbanking via Razorpay</span>
                </div>
              </Card>

              {/* ── Divider ── */}
              <div className="flex items-center gap-3 px-1">
                <div className="flex-1 border-t border-border-subtle" />
                <span className="text-label text-text-muted">OR PAY WITH UPI</span>
                <div className="flex-1 border-t border-border-subtle" />
              </div>

              {/* ── Section 2a: UPI ID ── */}
              <Card tone="default" padding="md" radius="card" shadow="e1">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="h-4 w-4 text-text-muted" strokeWidth={1.8} />
                  <p className="text-label text-text-muted">UPI ID</p>
                </div>
                <div className="flex gap-2 items-start">
                  <div className="flex-1 min-w-0">
                    <Input
                      placeholder="yourname@upi"
                      value={upiId}
                      onChange={(e) => {
                        setUpiId(e.target.value)
                        setUpiVerified(false)
                        setUpiError(null)
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && verifyUpiId()}
                      className="!mb-0"
                    />
                    {upiVerified && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" strokeWidth={2} />
                        <span className="text-caption text-success">Verified</span>
                      </div>
                    )}
                    {upiError && (
                      <p className="text-caption text-error mt-1.5">{upiError}</p>
                    )}
                  </div>
                  {!upiVerified ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-shrink-0 mt-0"
                      onClick={verifyUpiId}
                      disabled={!upiId}
                    >
                      Verify
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="flex-shrink-0 mt-0"
                      onClick={handleUpiIdPay}
                      disabled={!isReady}
                      loading={paying}
                    >
                      Pay
                    </Button>
                  )}
                </div>
              </Card>

              {/* ── Section 2b: UPI app tiles ── */}
              <Card tone="default" padding="md" radius="card" shadow="e1">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="h-4 w-4 text-text-muted" strokeWidth={1.8} />
                  <p className="text-label text-text-muted">UPI apps</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {UPI_APPS.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => setSelectedApp(app.id === selectedApp ? null : app.id)}
                      className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-colors ${
                        selectedApp === app.id
                          ? 'border-primary bg-surface2 ring-1 ring-primary'
                          : 'border-border-subtle bg-surface hover:bg-surface2'
                      }`}
                    >
                      <span className="text-xl leading-none">{app.emoji}</span>
                      <span className="text-body-sm font-medium text-text-primary">{app.label}</span>
                    </button>
                  ))}
                </div>
                {selectedApp && (
                  <Button
                    fullWidth
                    size="md"
                    className="mt-3"
                    onClick={handleAppTilePay}
                    disabled={!isReady}
                    loading={paying}
                  >
                    Pay with {UPI_APPS.find((a) => a.id === selectedApp)?.label}
                  </Button>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
