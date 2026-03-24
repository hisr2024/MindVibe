'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, CardContent } from '@/components/ui'
import { updateSubscription, type Subscription } from '@/hooks/useSubscription'

const tierNames: Record<string, string> = {
  free: 'Seeker',
  bhakta: 'Bhakta',
  sadhak: 'Sadhak',
  siddha: 'Siddha',
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const _router = useRouter()
  const tier = searchParams.get('tier') || 'bhakta'
  const yearly = searchParams.get('yearly') === 'true'
  const sessionId = searchParams.get('session_id')
  const provider = searchParams.get('provider')
  const paypalToken = searchParams.get('token') // PayPal returns ?token=ORDER_ID
  const [validating, setValidating] = useState(true)
  const [captureError, setCaptureError] = useState<string | null>(null)
  const capturedRef = useRef(false)

  useEffect(() => {
    async function handlePayPalCapture() {
      // PayPal redirect flow: capture the payment first, then validate
      if ((provider === 'paypal' || paypalToken) && !capturedRef.current) {
        capturedRef.current = true
        const orderId = paypalToken
        if (!orderId) {
          setCaptureError('Missing PayPal order token. Please contact support.')
          setValidating(false)
          return
        }

        try {
          const captureResponse = await fetch('/api/subscriptions/capture-paypal-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ paypal_order_id: orderId }),
          })

          if (!captureResponse.ok) {
            const error = await captureResponse.json().catch(() => ({}))
            const detail = error.detail
            const message =
              typeof detail === 'object' && detail?.message
                ? detail.message
                : typeof detail === 'string'
                  ? detail
                  : 'Payment capture failed. Please contact support if you were charged.'
            setCaptureError(message)
            setValidating(false)
            return
          }
        } catch (err) {
          console.error('PayPal capture error:', err)
          setCaptureError('Unable to finalize payment. Please contact support.')
          setValidating(false)
          return
        }
      }

      // Validate subscription (works for all providers: Stripe, Razorpay, PayPal)
      await validateSubscription()
    }

    async function validateSubscription() {
      try {
        const response = await fetch('/api/subscriptions/current', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          const subscription: Subscription = {
            id: String(data.id ?? `sub_${tier}`),
            tierId: data.effective_tier ?? data.plan?.tier ?? tier,
            tierName: data.plan?.name ?? tierNames[tier] ?? 'Bhakta',
            status: (data.status as Subscription['status']) ?? 'active',
            currentPeriodEnd: data.current_period_end
              ? new Date(data.current_period_end).toISOString()
              : new Date(Date.now() + (yearly ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
            cancelAtPeriodEnd: Boolean(data.cancel_at_period_end),
            isYearly: yearly,
            isDeveloper: Boolean(data.is_developer),
          }
          updateSubscription(subscription)
        }
      } catch (err) {
        console.warn('Could not validate subscription from server, using tier from URL', err)
      } finally {
        setValidating(false)
      }
    }

    handlePayPalCapture()
  }, [tier, yearly, sessionId, provider, paypalToken])

  if (validating) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d4a44c] border-t-transparent mx-auto" />
          <p className="text-[#f5f0e8]">
            {paypalToken ? 'Finalizing PayPal payment...' : 'Confirming your subscription...'}
          </p>
        </div>
      </main>
    )
  }

  if (captureError) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <Card variant="elevated" className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Payment Issue</h1>
            <p className="text-sm text-[#f5f0e8]/70 mb-6">{captureError}</p>
            <div className="flex flex-col gap-3">
              <Link href="/pricing">
                <Button className="w-full">Try Again</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">Go to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Card variant="elevated" className="max-w-md w-full">
        <CardContent className="text-center py-8">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold mb-2">
            Welcome to {tierNames[tier] || 'Bhakta'}!
          </h1>
          <p className="text-sm text-[#f5f0e8]/70 mb-6">
            Your subscription is now active. You have access to all {tierNames[tier] || 'Bhakta'} features.
          </p>

          <div className="rounded-xl bg-[#d4a44c]/10 border border-[#d4a44c]/20 p-4 mb-6 text-left">
            <h2 className="font-semibold mb-2">What&apos;s next?</h2>
            <ul className="space-y-2 text-sm text-[#f5f0e8]/80">
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 mt-0.5 shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Start chatting with KIAAN
              </li>
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 mt-0.5 shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Explore your new features
              </li>
              <li className="flex items-start gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 mt-0.5 shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Check your subscription dashboard
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/">
              <Button className="w-full">
                Start Using KIAAN
              </Button>
            </Link>
            <Link href="/dashboard/subscription">
              <Button variant="outline" className="w-full">
                View Subscription
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-[#f5f0e8]">Loading...</div>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  )
}
