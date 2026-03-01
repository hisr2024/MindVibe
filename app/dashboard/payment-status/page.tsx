'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, Button, Badge, Skeleton } from '@/components/ui'
import { apiFetch } from '@/lib/api'

/**
 * Payment record from the backend /api/subscriptions/payments endpoint.
 */
interface PaymentRecord {
  id: number
  payment_provider: string
  amount: string | number
  currency: string
  status: string
  description: string | null
  stripe_payment_intent_id: string | null
  stripe_invoice_id: string | null
  razorpay_payment_id: string | null
  razorpay_order_id: string | null
  paypal_order_id: string | null
  created_at: string
}

interface PaymentHistoryResponse {
  payments: PaymentRecord[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

// ---------------------------------------------------------------------------
// Provider display helpers
// ---------------------------------------------------------------------------

const PROVIDER_LABELS: Record<string, string> = {
  stripe_card: 'Card',
  stripe_paypal: 'PayPal',
  razorpay_upi: 'UPI',
  free: 'Free',
}

const PROVIDER_COLORS: Record<string, string> = {
  stripe_card: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-200',
  stripe_paypal: 'bg-blue-500/15 border-blue-500/30 text-blue-200',
  razorpay_upi: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200',
  free: 'bg-[#d4a44c]/10 border-[#d4a44c]/30 text-[#f5f0e8]/70',
}

function getProviderLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? provider.replace(/_/g, ' ')
}

function getProviderBadgeClass(provider: string): string {
  return PROVIDER_COLORS[provider] ?? 'bg-[#d4a44c]/10 border-[#d4a44c]/30 text-[#f5f0e8]'
}

// ---------------------------------------------------------------------------
// Status display helpers
// ---------------------------------------------------------------------------

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'default'

const STATUS_MAP: Record<string, { label: string; variant: StatusVariant }> = {
  succeeded: { label: 'Succeeded', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  failed: { label: 'Failed', variant: 'danger' },
  refunded: { label: 'Refunded', variant: 'info' },
}

function getStatusInfo(status: string): { label: string; variant: StatusVariant } {
  return STATUS_MAP[status] ?? { label: status, variant: 'default' as StatusVariant }
}

// ---------------------------------------------------------------------------
// Currency formatting
// ---------------------------------------------------------------------------

function formatAmount(amount: string | number, currency: string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  const upper = currency.toUpperCase()
  const symbols: Record<string, string> = { USD: '$', EUR: '\u20AC', INR: '\u20B9' }
  const symbol = symbols[upper] ?? `${upper} `
  return `${symbol}${num.toFixed(2)}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ---------------------------------------------------------------------------
// Provider SVG icons (inline, no external deps)
// ---------------------------------------------------------------------------

function CardIcon({ className = '' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
}

function PayPalIcon({ className = '' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797H9.1c-.549 0-1.014.398-1.1.94L7.076 21.337z" />
    </svg>
  )
}

function UpiIcon({ className = '' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2v20M2 12h20" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
}

function ProviderIcon({ provider }: { provider: string }) {
  const iconClass = 'shrink-0'
  switch (provider) {
    case 'stripe_card':
      return <CardIcon className={`${iconClass} text-indigo-400`} />
    case 'stripe_paypal':
      return <PayPalIcon className={`${iconClass} text-blue-400`} />
    case 'razorpay_upi':
      return <UpiIcon className={`${iconClass} text-emerald-400`} />
    default:
      return <CardIcon className={`${iconClass} text-[#d4a44c]`} />
  }
}

// ---------------------------------------------------------------------------
// Payment Row Component
// ---------------------------------------------------------------------------

function PaymentRow({ payment }: { payment: PaymentRecord }) {
  const statusInfo = getStatusInfo(payment.status)

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[#d4a44c]/10 bg-[#0d0d10]/60 p-4 transition-colors hover:border-[#d4a44c]/20">
      {/* Left: Icon + details */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d4a44c]/10">
          <ProviderIcon provider={payment.payment_provider} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#f5f0e8] truncate">
            {payment.description || 'Payment'}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-[#f5f0e8]/50">{formatDate(payment.created_at)}</span>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getProviderBadgeClass(payment.payment_provider)}`}>
              {getProviderLabel(payment.payment_provider)}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Amount + status */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-semibold text-[#f5f0e8] tabular-nums">
          {formatAmount(payment.amount, payment.currency)}
        </span>
        <Badge variant={statusInfo.variant} size="sm" dot>
          {statusInfo.label}
        </Badge>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton Loader
// ---------------------------------------------------------------------------

function PaymentRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[#d4a44c]/10 bg-[#0d0d10]/60 p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function PaymentStatusPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const PAGE_SIZE = 15

  const fetchPayments = useCallback(async (pageNum: number) => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiFetch(
        `/api/subscriptions/payments?page=${pageNum}&page_size=${PAGE_SIZE}`,
        { method: 'GET' }
      )

      if (response.status === 401) {
        router.push('/auth/login')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to load payment history')
      }

      const data: PaymentHistoryResponse = await response.json()
      setPayments(data.payments)
      setTotal(data.total)
      setHasMore(data.has_more)
      setPage(pageNum)
    } catch (err) {
      console.error('Failed to fetch payment history:', err)
      setError(err instanceof Error ? err.message : 'Unable to load payment history')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchPayments(1)
  }, [fetchPayments])

  // Summary statistics
  const succeededPayments = payments.filter((p) => p.status === 'succeeded')
  const totalPaid = succeededPayments.reduce(
    (sum, p) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount),
    0
  )
  const mainCurrency = succeededPayments.length > 0 ? succeededPayments[0].currency : 'usd'

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.push('/dashboard/subscription')}
            className="rounded-lg p-2 text-[#f5f0e8]/60 hover:text-[#f5f0e8] hover:bg-[#d4a44c]/10 transition-colors"
            aria-label="Back to subscription"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-[#f5f0e8]">Payment History</h1>
        </div>
        <p className="text-[#f5f0e8]/60 ml-11">
          View all your transactions across Stripe, PayPal, and UPI.
        </p>
      </div>

      {/* Summary Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-[#f5f0e8]/50 mb-1">Total Payments</p>
              <p className="text-2xl font-bold text-[#f5f0e8]">{total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-[#f5f0e8]/50 mb-1">Total Paid</p>
              <p className="text-2xl font-bold text-emerald-400">
                {formatAmount(totalPaid, mainCurrency)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-[#f5f0e8]/50 mb-1">Succeeded</p>
              <p className="text-2xl font-bold text-emerald-400">{succeededPayments.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-[#f5f0e8]/50 mb-1">Failed</p>
              <p className="text-2xl font-bold text-red-400">
                {payments.filter((p) => p.status === 'failed').length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Provider Legend */}
      {!loading && !error && payments.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2 text-xs text-[#f5f0e8]/60">
            <CardIcon className="text-indigo-400" />
            <span>Card (Stripe)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#f5f0e8]/60">
            <PayPalIcon className="text-blue-400" />
            <span>PayPal (Stripe)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#f5f0e8]/60">
            <UpiIcon className="text-emerald-400" />
            <span>UPI (Razorpay)</span>
          </div>
        </div>
      )}

      {/* Payment List */}
      <div className="space-y-3">
        {loading && (
          <>
            <PaymentRowSkeleton />
            <PaymentRowSkeleton />
            <PaymentRowSkeleton />
            <PaymentRowSkeleton />
            <PaymentRowSkeleton />
          </>
        )}

        {error && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-red-400 mb-4">{error}</p>
              <Button onClick={() => fetchPayments(1)} variant="outline" size="sm">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && payments.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-[#d4a44c]/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d4a44c]/60">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#f5f0e8] mb-2">No Payments Yet</h3>
              <p className="text-sm text-[#f5f0e8]/60 mb-6">
                Your payment history will appear here after your first transaction.
              </p>
              <Button onClick={() => router.push('/pricing')}>View Plans</Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && payments.map((payment) => (
          <PaymentRow key={payment.id} payment={payment} />
        ))}
      </div>

      {/* Pagination */}
      {!loading && !error && total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-8">
          <p className="text-xs text-[#f5f0e8]/50">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} payments
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => fetchPayments(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore}
              onClick={() => fetchPayments(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Transaction Detail Tooltip (hover info) */}
      {!loading && !error && payments.length > 0 && (
        <div className="mt-8">
          <Card variant="bordered">
            <CardContent>
              <h3 className="text-sm font-semibold text-[#f5f0e8] mb-2">Payment Status Guide</h3>
              <div className="grid grid-cols-2 gap-3 text-xs text-[#f5f0e8]/70">
                <div className="flex items-center gap-2">
                  <Badge variant="success" size="sm" dot>Succeeded</Badge>
                  <span>Payment completed successfully</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning" size="sm" dot>Pending</Badge>
                  <span>Payment is being processed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="danger" size="sm" dot>Failed</Badge>
                  <span>Payment was declined or failed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="info" size="sm" dot>Refunded</Badge>
                  <span>Payment was refunded to you</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}
