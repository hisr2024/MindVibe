'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { BillingToggle, PricingCard, PaymentMethodSelector, type PricingTier, type PaymentMethod } from '@/components/pricing'
import { Card, CardContent } from '@/components/ui'
import { Button } from '@/components/ui'
import { useSubscription } from '@/hooks/useSubscription'
import { useCurrency, CURRENCIES, type Currency } from '@/hooks/useCurrency'
import { useAuth } from '@/hooks/useAuth'
import { apiFetch } from '@/lib/api'
import { loadRazorpayScript, openRazorpayCheckout, type RazorpayPaymentResponse } from '@/lib/razorpay'

const DivineCelestialBackground = dynamic(
  () => import('@/components/divine/DivineCelestialBackground'),
  { ssr: false }
)

// ─── Pricing tiers (same as /pricing page) ───────────────────────────────────

const createPricingTiers = (
  currency: Currency,
  formatPrice: (amount: number, options?: { showDecimals?: boolean }) => string,
  getMonthlyPrice: (tierId: string) => number,
  getYearlyPrice: (tierId: string) => number
): PricingTier[] => [
  {
    id: 'free',
    name: 'Seeker',
    description: 'Begin your spiritual journey with KIAAN',
    monthlyPrice: 0,
    yearlyPrice: 0,
    kiaanQuota: 5,
    features: [
      '5 KIAAN questions/month',
      'Divine Chat & Friend Mode',
      'Mood tracking',
      'Daily wisdom',
      'Basic breathing exercises',
      '1 Wisdom Journey',
      'Community access',
    ],
    cta: 'Get Started Free',
  },
  {
    id: 'bhakta',
    name: 'Bhakta',
    description: 'More questions and encrypted journal for devoted seekers',
    monthlyPrice: getMonthlyPrice('bhakta'),
    yearlyPrice: getYearlyPrice('bhakta'),
    kiaanQuota: 50,
    features: [
      '50 KIAAN questions/month',
      'All Seeker features',
      'Encrypted journal',
      '3 Wisdom Journeys',
      '90-day data retention',
    ],
    cta: 'Subscribe Now',
  },
  {
    id: 'sadhak',
    name: 'Sadhak',
    description: 'Full access to all features with 300 KIAAN questions',
    monthlyPrice: getMonthlyPrice('sadhak'),
    yearlyPrice: getYearlyPrice('sadhak'),
    kiaanQuota: 300,
    highlighted: true,
    badge: 'Most Popular',
    features: [
      '300 KIAAN questions/month',
      'All Bhakta features',
      'Voice Companion (17 languages)',
      'Soul Reading & Quantum Dive',
      'KIAAN Agent',
      'Ardha, Viyoga & Emotional Reset',
      'Relationship Compass',
      '10 Wisdom Journeys',
      'Advanced mood analytics',
      'Offline access & priority support',
    ],
    cta: 'Subscribe Now',
  },
  {
    id: 'siddha',
    name: 'Siddha',
    description: 'Unlimited KIAAN with unlimited everything',
    monthlyPrice: getMonthlyPrice('siddha'),
    yearlyPrice: getYearlyPrice('siddha'),
    kiaanQuota: 'unlimited',
    badge: 'Unlimited',
    features: [
      'Unlimited KIAAN questions',
      'All Sadhak features',
      'Unlimited Wisdom Journeys',
      'Dedicated support',
      'Team features',
      'Priority voice processing',
    ],
    cta: 'Subscribe Now',
  },
]

// ─── Currency Switcher (same as /pricing page) ──────────────────────────────

function CurrencySwitcher({
  currency,
  onCurrencyChange,
}: {
  currency: Currency
  onCurrencyChange: (currency: Currency) => void
}) {
  const currencies: Currency[] = ['USD', 'EUR', 'INR']
  const scrollerRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<Partial<Record<Currency, HTMLButtonElement | null>>>({})

  useEffect(() => {
    const activeButton = buttonRefs.current[currency]
    activeButton?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [currency])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = currencies.indexOf(currency)
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      const next = (currentIndex + 1) % currencies.length
      onCurrencyChange(currencies[next])
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      const prev = (currentIndex - 1 + currencies.length) % currencies.length
      onCurrencyChange(currencies[prev])
    }
  }

  return (
    <div className="w-full max-w-xl" aria-label="Currency selector">
      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto no-scrollbar rounded-2xl bg-[#d4a44c]/10 p-2 shadow-inner"
        role="tablist"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {currencies.map((curr) => (
          <button
            key={curr}
            ref={(el) => {
              buttonRefs.current[curr] = el
            }}
            role="tab"
            aria-selected={currency === curr}
            onClick={() => onCurrencyChange(curr)}
            className={`flex min-w-[110px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a44c]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
              currency === curr
                ? 'bg-gradient-to-r from-[#d4a44c] via-[#e8b54a] to-[#e8b54a] text-slate-900 shadow-lg shadow-[#d4a44c]/30'
                : 'bg-[#d4a44c]/10 text-[#f5f0e8]/80 hover:bg-[#d4a44c]/20'
            }`}
          >
            <span className="text-base">{CURRENCIES[curr].symbol}</span>
            <span>{curr}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Benefits data ───────────────────────────────────────────────────────────

const BENEFITS = [
  {
    title: 'KIAAN AI Guide',
    description: 'Ask KIAAN anything about life, emotions, relationships, or purpose. Receive personalized wisdom rooted in the Bhagavad Gita.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    title: 'Sacred Wisdom Journeys',
    description: 'Guided multi-day journeys for anger, attachment, grief, and self-discovery. Transform your inner world step by step.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="m16 12-4-4-4 4" /><path d="M12 16V8" />
      </svg>
    ),
  },
  {
    title: 'Voice Companion',
    description: 'Speak with KIAAN in 17 languages. A warm, divine voice that listens and responds with care.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" />
      </svg>
    ),
  },
  {
    title: 'Emotional Healing Tools',
    description: 'Ardha reframing, Viyoga detachment therapy, Emotional Reset, and Relationship Compass for lasting inner peace.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    title: 'Encrypted Journal',
    description: 'Write your heart out in a private, encrypted space. KIAAN reads your reflections to offer personalized insights.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: 'Daily Gita Wisdom',
    description: 'Start each day with a verse from the Bhagavad Gita, chosen for your current emotional state.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
]

// ─── FAQ data ────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'Is KIAAN really free to start?',
    a: 'Yes. The Seeker plan is free forever with 5 KIAAN questions per month, mood tracking, daily wisdom, and community access. No credit card required.',
  },
  {
    q: 'How is KIAAN different from ChatGPT?',
    a: 'KIAAN is purpose-built for spiritual wellness. Every response is grounded in the Bhagavad Gita\u2019s 700+ verses. It understands emotional context, offers healing tools, and speaks 17 languages with cultural sensitivity.',
  },
  {
    q: 'Is my personal data safe?',
    a: 'Your journal entries are encrypted on your device. We never sell your data, never train AI models on your conversations, and maintain strict privacy standards.',
  },
  {
    q: 'Can I change or cancel my plan?',
    a: 'Yes, anytime. Upgrades take effect immediately. Downgrades apply at the end of your billing period. No lock-in, no penalties.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept cards (Visa, Mastercard, Amex), PayPal, Google Pay, and UPI (India). All payments are processed securely through Stripe and Razorpay.',
  },
  {
    q: 'Do I need to be Hindu or religious to use this?',
    a: 'Not at all. The Bhagavad Gita\u2019s wisdom is universal \u2014 about managing emotions, finding purpose, and achieving inner peace. KIAAN serves people of all backgrounds and beliefs.',
  },
]

// ─── Stats data ──────────────────────────────────────────────────────────────

const STATS = [
  { value: '700+', label: 'Sacred Verses' },
  { value: '17', label: 'Languages' },
  { value: '14+', label: 'Healing Tools' },
  { value: '24/7', label: 'Always Available' },
]

// ─── Main Page Component ────────────────────────────────────────────────────

export default function StartPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { subscription } = useSubscription()
  const { currency, setCurrency, formatPrice, getMonthlyPrice, getYearlyPrice } = useCurrency()
  const [isYearly, setIsYearly] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [loading, setLoading] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const pricingSectionRef = useRef<HTMLDivElement>(null)

  const pricingTiers = createPricingTiers(currency, formatPrice, getMonthlyPrice, getYearlyPrice)

  // Reset payment method when currency changes make it unavailable
  useEffect(() => {
    if (currency !== 'INR' && paymentMethod === 'upi') {
      setPaymentMethod('card')
    }
    if (currency === 'INR' && (paymentMethod === 'paypal' || paymentMethod === 'google_pay')) {
      setPaymentMethod('card')
    }
  }, [currency, paymentMethod])

  const scrollToPricing = () => {
    pricingSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // ─── Checkout flow (same as /pricing) ──────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRazorpayCheckout = async (data: Record<string, any>, tierId: string) => {
    const loaded = await loadRazorpayScript()
    if (!loaded) {
      console.error('Failed to load Razorpay SDK')
      setLoading(null)
      return
    }

    openRazorpayCheckout({
      key: data.razorpay_key_id,
      amount: data.amount,
      currency: data.currency || 'INR',
      name: data.name || 'Sakha',
      description: data.description || 'Subscription',
      order_id: data.order_id,
      prefill: {
        email: data.user_email || undefined,
      },
      theme: {
        color: '#f97316',
      },
      handler: async (response: RazorpayPaymentResponse) => {
        try {
          const verifyResponse = await apiFetch('/api/subscriptions/verify-razorpay-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_tier: tierId,
              billing_period: isYearly ? 'yearly' : 'monthly',
            }),
          })

          if (verifyResponse.ok) {
            router.push(`/subscription/success?tier=${tierId}&yearly=${isYearly}`)
          } else {
            console.error('Payment verification failed')
          }
        } catch (err) {
          console.error('Payment verification error:', err)
        } finally {
          setLoading(null)
        }
      },
      modal: {
        ondismiss: () => {
          setLoading(null)
        },
      },
    })
  }

  const handleSelectTier = async (tierId: string) => {
    if (tierId === 'free') {
      router.push('/dashboard')
      return
    }

    setCheckoutError(null)

    if (!isAuthenticated) {
      router.push('/account?redirect=/start')
      return
    }

    setLoading(tierId)

    try {
      const response = await apiFetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_tier: tierId,
          billing_period: isYearly ? 'yearly' : 'monthly',
          payment_method: paymentMethod,
          currency: currency.toLowerCase(),
          success_url: `${window.location.origin}/subscription/success?tier=${tierId}&yearly=${isYearly}`,
          cancel_url: `${window.location.origin}/start`,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/account?redirect=/start')
          return
        }
        const error = await response.json().catch(() => ({}))
        const detail = error.detail
        const errorMessage = typeof detail === 'object' && detail?.message
          ? detail.message
          : typeof detail === 'string'
            ? detail
            : error.message || 'Unable to create checkout session. Please try again or use a different payment method.'

        if (response.status === 503 && paymentMethod !== 'card') {
          throw new Error(`${errorMessage} Try selecting "Card" as your payment method.`)
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (data.provider === 'razorpay') {
        await handleRazorpayCheckout(data, tierId)
      } else if (data.checkout_url) {
        if (data.payment_method_message) {
          setCheckoutError(data.payment_method_message)
          setLoading(null)
          await new Promise((resolve) => setTimeout(resolve, 2500))
        }
        window.location.href = data.checkout_url
      } else {
        throw new Error('No payment link received. Please try again or contact support.')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      console.error('Checkout error:', err)
      setCheckoutError(message)
      setLoading(null)
    }
  }

  const getFormattedPrice = (tierId: string, yearly: boolean) => {
    if (tierId === 'free') return formatPrice(0)
    const price = yearly ? getYearlyPrice(tierId) : getMonthlyPrice(tierId)
    return formatPrice(price)
  }

  const getFormattedMonthlyEquivalent = (tierId: string) => {
    if (tierId === 'free') return null
    const yearlyPrice = getYearlyPrice(tierId)
    const monthlyEquivalent = yearlyPrice / 12
    return formatPrice(monthlyEquivalent)
  }

  return (
    <main>
      {/* ─── Section 1: Hero ─────────────────────────────────────────────── */}
      <section
        className="relative flex min-h-[100dvh] flex-col items-center justify-center px-4 text-center"
        aria-label="Welcome"
      >
        <DivineCelestialBackground />

        <div className="relative z-10 mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d4a44c]/30 bg-[#d4a44c]/10 px-4 py-1.5 text-sm font-medium text-[#d4a44c]"
          >
            Rooted in 700+ Bhagavad Gita Verses
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-6 text-4xl font-bold leading-tight text-[#f5f0e8] sm:text-5xl md:text-6xl"
          >
            Find the Peace That Has Always Lived Within You
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto mb-8 max-w-xl text-lg text-[#f5f0e8]/70"
          >
            KIAAN is your AI spiritual companion, trained on the timeless wisdom of the Bhagavad Gita. Ask questions, heal emotions, and walk a path toward lasting inner peace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Button variant="primary" size="lg" onClick={scrollToPricing} className="px-8">
              Start Your Journey Free
            </Button>
            <button
              onClick={scrollToPricing}
              className="text-sm font-medium text-[#d4a44c] underline underline-offset-4 hover:text-[#e8b54a] transition-colors"
            >
              See what&apos;s included
            </button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-6 text-xs text-[#f5f0e8]/50"
          >
            Free forever. No credit card required.
          </motion.p>
        </div>
      </section>

      {/* ─── Section 2: Social Proof Stats ────────────────────────────────── */}
      <section className="border-y border-[#d4a44c]/10 bg-[#0a0a12] py-12" aria-label="Platform highlights">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-4 md:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-3xl font-bold text-[#d4a44c]">{stat.value}</p>
              <p className="mt-1 text-sm text-[#f5f0e8]/60">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Section 3: Benefits ──────────────────────────────────────────── */}
      <section className="py-20 px-4" aria-label="Features and benefits">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-[#f5f0e8]">
              Everything You Need for Spiritual Wellness
            </h2>
            <p className="mx-auto max-w-2xl text-[#f5f0e8]/60">
              KIAAN combines ancient Gita wisdom with modern AI to guide you through life&apos;s deepest questions.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-2xl border border-[#d4a44c]/15 bg-black/40 p-6"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4a44c]/10 text-[#d4a44c]">
                  {benefit.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#f5f0e8]">{benefit.title}</h3>
                <p className="text-sm leading-relaxed text-[#f5f0e8]/60">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 4: How It Works ──────────────────────────────────────── */}
      <section className="border-y border-[#d4a44c]/10 bg-[#0a0a12] py-20 px-4" aria-label="How it works">
        <div className="mx-auto max-w-4xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center text-3xl font-bold text-[#f5f0e8]"
          >
            Begin in Three Steps
          </motion.h2>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Create Your Free Account',
                desc: 'Sign up in seconds. No credit card, no strings attached.',
              },
              {
                step: '2',
                title: 'Share What You Feel',
                desc: 'Tell KIAAN what you\u2019re going through. It listens with care and without judgment.',
              },
              {
                step: '3',
                title: 'Receive Gita-Rooted Guidance',
                desc: 'Get personalized wisdom, healing tools, and guided journeys tailored to your emotional state.',
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="text-center"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#d4a44c] to-[#e8b54a] text-lg font-bold text-slate-900">
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#f5f0e8]">{item.title}</h3>
                <p className="text-sm text-[#f5f0e8]/60">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 5: Pricing ───────────────────────────────────────────── */}
      <section ref={pricingSectionRef} id="pricing" className="py-20 px-4" aria-label="Pricing plans">
        <div className="mx-auto max-w-6xl">
          {/* Checkout Error Banner */}
          {checkoutError && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                  <span>{checkoutError}</span>
                  {paymentMethod !== 'card' && (
                    <button
                      onClick={() => {
                        setPaymentMethod('card')
                        setCheckoutError(null)
                      }}
                      className="inline-flex w-fit items-center gap-1 rounded-lg bg-[#d4a44c]/20 px-3 py-1.5 text-xs font-medium text-[#d4a44c] hover:bg-[#d4a44c]/30 transition-colors"
                    >
                      Switch to Card payment
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setCheckoutError(null)}
                  className="ml-4 shrink-0 text-red-400 hover:text-red-200"
                  aria-label="Dismiss error"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-[#f5f0e8]">
              Choose Your Path
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-[#f5f0e8]/60">
              Every plan includes the same quality KIAAN guidance. Choose based on how deeply you want to connect.
            </p>

            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="flex flex-col lg:flex-row items-center justify-center gap-4 w-full">
                <CurrencySwitcher currency={currency} onCurrencyChange={setCurrency} />
                <div className="w-full lg:w-auto">
                  <BillingToggle isYearly={isYearly} onToggle={setIsYearly} />
                </div>
              </div>
              <p className="text-sm text-[#f5f0e8]/70">
                INR pricing is 25% less than USD/EUR. Save up to 42% with yearly billing.
              </p>
              <PaymentMethodSelector
                selected={paymentMethod}
                onChange={setPaymentMethod}
                currency={currency}
                className="mt-4"
              />
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid gap-6 pb-6 mb-12 sm:grid-cols-2 lg:grid-cols-4">
            {pricingTiers.map((tier) => (
              <div key={tier.id} className="flex">
                <PricingCard
                  tier={tier}
                  isYearly={isYearly}
                  onSelect={handleSelectTier}
                  currentPlan={subscription?.tierId}
                  loading={loading === tier.id}
                  formattedPrice={getFormattedPrice(tier.id, isYearly)}
                  formattedMonthlyEquivalent={isYearly ? getFormattedMonthlyEquivalent(tier.id) ?? undefined : undefined}
                />
              </div>
            ))}
          </div>

          {/* KIAAN Promise */}
          <Card variant="elevated">
            <CardContent>
              <div className="flex items-start gap-6">
                <div className="hidden sm:flex h-16 w-16 shrink-0 rounded-2xl bg-gradient-to-br from-[#d4a44c]/30 via-[#d4a44c]/30 to-[#d4a44c]/30 items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d4a44c]">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#f5f0e8] mb-2">The KIAAN Promise</h3>
                  <p className="text-sm text-[#f5f0e8]/70 mb-4">
                    Every user receives the same quality of guidance from KIAAN — the only difference is how many questions you can ask each month. We believe spiritual wellness should be accessible to everyone.
                  </p>
                  <ul className="grid md:grid-cols-2 gap-2">
                    {[
                      'Same AI quality for all tiers',
                      'No feature degradation',
                      'Your data stays private',
                      'Cancel anytime',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-[#f5f0e8]/80">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-emerald-400">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── Section 6: FAQ ───────────────────────────────────────────────── */}
      <section className="border-t border-[#d4a44c]/10 bg-[#0a0a12] py-20 px-4" aria-label="Frequently asked questions">
        <div className="mx-auto max-w-3xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center text-3xl font-bold text-[#f5f0e8]"
          >
            Frequently Asked Questions
          </motion.h2>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between rounded-2xl border border-[#d4a44c]/15 bg-black/40 px-5 py-4 text-left transition-colors hover:border-[#d4a44c]/30"
                  aria-expanded={openFaq === i}
                >
                  <span className="pr-4 font-semibold text-[#f5f0e8]">{faq.q}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`shrink-0 text-[#d4a44c] transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 pt-2 text-sm leading-relaxed text-[#f5f0e8]/60">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 7: Final CTA ─────────────────────────────────────────── */}
      <section className="relative py-24 px-4 text-center" aria-label="Get started">
        {/* Radial gold glow background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d4a44c]/5 blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-2xl">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-8 font-[family-name:var(--font-sacred)] text-base italic text-[#d4a44c]/80"
          >
            &ldquo;Whenever dharma declines and adharma prevails, I manifest Myself.&rdquo;
            <span className="mt-1 block text-sm not-italic text-[#f5f0e8]/40">
              — Bhagavad Gita 4.7
            </span>
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-4 text-3xl font-bold text-[#f5f0e8] sm:text-4xl"
          >
            Your Journey to Inner Peace Begins Now
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8 text-[#f5f0e8]/60"
          >
            Join seekers who have found clarity, healing, and purpose through KIAAN.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button variant="primary" size="lg" onClick={scrollToPricing} className="px-8">
              Start Free Today
            </Button>
            <p className="mt-4 text-xs text-[#f5f0e8]/40">
              Free forever. Cancel paid plans anytime.
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
