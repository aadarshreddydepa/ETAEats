import { useState } from 'react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import { useCartStore } from '@/stores/cart.store'
import { useJourneyStore } from '@/stores/journey.store'
import { useOrderTrackingStore } from '@/stores/orderTracking.store'
import type { AuthResponse, Cart } from '@/lib/api.types'

export function useAuth() {
  const { setAuth, clearAuth, isAuthenticated, user } = useAuthStore()
  const clearCart = useCartStore((s) => s.clearCart)
  const clearJourney = useJourneyStore((s) => s.clearJourney)
  const setActiveOrder = useOrderTrackingStore((s) => s.setActiveOrder)
  const setConnectionState = useOrderTrackingStore((s) => s.setConnectionState)
  const [loading, setLoading] = useState(false)

  async function requestOTP(phoneNumber: string): Promise<boolean> {
    setLoading(true)
    try {
      await api.post('/auth/otp/request/', { phone_number: phoneNumber })
      return true
    } catch {
      toast.error('Could not send OTP. Check your number and try again.')
      return false
    } finally {
      setLoading(false)
    }
  }

  async function verifyOTP(phoneNumber: string, code: string): Promise<boolean> {
    setLoading(true)
    try {
      const { data } = await api.post<AuthResponse>('/auth/otp/verify/', {
        phone_number: phoneNumber,
        code,
        app_type: 'passenger',
      })
      setAuth(data.user, data.tokens.access, data.tokens.refresh)
      return true
    } catch {
      toast.error('Invalid OTP. Please try again.')
      return false
    } finally {
      setLoading(false)
    }
  }

  async function clearRemoteCart() {
    try {
      const { data } = await api.get<Cart>('/orders/cart/')
      if (!data.items.length) return
      await Promise.all(
        data.items.map((item) => api.delete(`/orders/cart/items/${item.id}/`))
      )
    } catch {
      // Ignore remote cleanup failures; local cleanup still runs.
    }
  }

  async function logout() {
    try {
      await clearRemoteCart()
    } finally {
      clearAuth()
      clearCart()
      clearJourney()
      setActiveOrder(null)
      setConnectionState('idle')
      if (typeof window !== 'undefined') {
        localStorage.removeItem('eta-auth')
        localStorage.removeItem('eta-auth-state')
        localStorage.removeItem('eta-cart')
        localStorage.removeItem('eta-journey')
        localStorage.removeItem('eta-order-tracking')
      }
    }
  }

  return { requestOTP, verifyOTP, logout, loading, isAuthenticated, user }
}
