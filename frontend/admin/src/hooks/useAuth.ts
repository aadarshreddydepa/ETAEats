import { useState } from 'react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth.store'
import type { AuthResponse } from '@/lib/api.types'

type VerifyResult = { ok: true } | { ok: false; reason: 'not_admin' | 'invalid_otp' }

export function useAuth() {
  const { setAuth, clearAuth, isAuthenticated, user } = useAuthStore()
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

  async function verifyOTP(phoneNumber: string, code: string): Promise<VerifyResult> {
    setLoading(true)
    try {
      const { data } = await api.post<AuthResponse>('/auth/otp/verify/', {
        phone_number: phoneNumber,
        code,
        app_type: 'admin',
      })
      if (data.user.role !== 'ADMIN') {
        return { ok: false, reason: 'not_admin' }
      }
      setAuth(data.user, data.tokens.access, data.tokens.refresh)
      return { ok: true }
    } catch {
      return { ok: false, reason: 'invalid_otp' }
    } finally {
      setLoading(false)
    }
  }

  async function logout(refreshToken: string | null) {
    if (refreshToken) {
      try { await api.post('/auth/logout/', { refresh: refreshToken }) } catch { /* ignore */ }
    }
    clearAuth()
  }

  return { requestOTP, verifyOTP, logout, loading, isAuthenticated, user }
}
