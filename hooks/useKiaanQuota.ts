'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

const _KIAAN_QUOTA_STORAGE_KEY = 'mindvibe_kiaan_quota'
const KIAAN_USAGE_STORAGE_KEY = 'mindvibe_kiaan_usage'

interface QuotaData {
  used: number
  limit: number
  resetDate: string
  tier: string
}

interface UseKiaanQuotaResult {
  used: number
  limit: number
  remaining: number
  percentage: number
  resetDate: Date
  isExceeded: boolean
  isWarning: boolean
  loading: boolean
  incrementUsage: () => void
  resetQuota: () => void
  daysUntilReset: number
}

const tierQuotas: Record<string, number> = {
  free: 15,
  basic: 150,
  premium: 300,
  enterprise: 800,
  premier: -1, // unlimited
}

export function useKiaanQuota(tier: string = 'free'): UseKiaanQuotaResult {
  const [quotaData, setQuotaData] = useState<QuotaData>({
    used: 0,
    limit: tierQuotas[tier] ?? 20,
    resetDate: getNextResetDate().toISOString(),
    tier,
  })
  const [loading, setLoading] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(KIAAN_USAGE_STORAGE_KEY)
      if (stored) {
        let data: QuotaData
        try {
          data = JSON.parse(stored) as QuotaData
        } catch {
          // Corrupted localStorage data — reset
          localStorage.removeItem(KIAAN_USAGE_STORAGE_KEY)
          const freshData: QuotaData = {
            used: 0,
            limit: tierQuotas[tier] ?? 20,
            resetDate: getNextResetDate().toISOString(),
            tier,
          }
          setQuotaData(freshData)
          localStorage.setItem(KIAAN_USAGE_STORAGE_KEY, JSON.stringify(freshData))
          setLoading(false)
          return
        }

        const resetDate = new Date(data.resetDate)

        // Check if quota should be reset
        if (resetDate <= new Date()) {
          const newData: QuotaData = {
            used: 0,
            limit: tierQuotas[tier] ?? 20,
            resetDate: getNextResetDate().toISOString(),
            tier,
          }
          setQuotaData(newData)
          localStorage.setItem(KIAAN_USAGE_STORAGE_KEY, JSON.stringify(newData))
        } else {
          // Update limit if tier changed
          setQuotaData({
            ...data,
            used: Number.isFinite(data.used) ? data.used : 0,
            limit: tierQuotas[tier] ?? data.limit,
            tier,
          })
        }
      } else {
        const newData: QuotaData = {
          used: 0,
          limit: tierQuotas[tier] ?? 20,
          resetDate: getNextResetDate().toISOString(),
          tier,
        }
        setQuotaData(newData)
        localStorage.setItem(KIAAN_USAGE_STORAGE_KEY, JSON.stringify(newData))
      }
    } catch (e) {
      console.warn('Failed to load KIAAN quota from localStorage', e)
    }
    setLoading(false)
  }, [tier])

  const incrementUsage = useCallback(() => {
    setQuotaData(prev => {
      // Don't increment if unlimited
      if (prev.limit === -1) return prev
      
      const newData = {
        ...prev,
        used: prev.used + 1,
      }
      localStorage.setItem(KIAAN_USAGE_STORAGE_KEY, JSON.stringify(newData))
      return newData
    })
  }, [])

  const resetQuota = useCallback(() => {
    const newData: QuotaData = {
      used: 0,
      limit: tierQuotas[tier] ?? 20,
      resetDate: getNextResetDate().toISOString(),
      tier,
    }
    setQuotaData(newData)
    localStorage.setItem(KIAAN_USAGE_STORAGE_KEY, JSON.stringify(newData))
  }, [tier])

  const isUnlimited = quotaData.limit === -1
  const remaining = isUnlimited ? Infinity : Math.max(0, quotaData.limit - quotaData.used)
  const percentage = isUnlimited || quotaData.limit <= 0
    ? 0
    : Math.min(100, (quotaData.used / quotaData.limit) * 100)
  const resetDate = new Date(quotaData.resetDate)
  const daysUntilReset = useMemo(
    // eslint-disable-next-line react-hooks/purity
    () => Math.max(0, Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
    [resetDate]
  )

  return {
    used: quotaData.used,
    limit: quotaData.limit,
    remaining,
    percentage,
    resetDate,
    isExceeded: !isUnlimited && quotaData.used >= quotaData.limit,
    isWarning: !isUnlimited && percentage >= 80,
    loading,
    incrementUsage,
    resetQuota,
    daysUntilReset,
  }
}

function getNextResetDate(): Date {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return nextMonth
}

export default useKiaanQuota
