'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Card, CardContent, FadeIn } from '@/components/ui'

const whatYouMiss = [
  { feature: 'Extended KIAAN Questions', description: 'More conversations with your AI companion' },
  { feature: 'Advanced Analytics', description: 'Deep insights into your mood and patterns' },
  { feature: 'Priority Support', description: 'Faster response times when you need help' },
  { feature: 'Premium Tools', description: 'Ardha, Viyog, Relationship Compass, and more' },
]

const freeFeatures = [
  '20 KIAAN questions per month',
  'Basic mood tracking',
  'Daily wisdom quotes',
  'Simple breathing exercises',
]

export default function SubscriptionCancelPage() {
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmitFeedback = () => {
    // In production, this would send to server
    console.log('Feedback:', feedback)
    setSubmitted(true)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <FadeIn>
        <Card variant="elevated" className="max-w-lg w-full">
          <CardContent className="py-8">
            {/* Illustration */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-amber-500/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="M8 15s1.5 2 4 2 4-2 4-2" />
                    <circle cx="9" cy="10" r="1" fill="currentColor" />
                    <circle cx="15" cy="10" r="1" fill="currentColor" />
                  </svg>
                </div>
                <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <span className="text-lg">👋</span>
                </div>
              </div>
            </div>

            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-orange-50 mb-2">
                Checkout Canceled
              </h1>
              <p className="text-sm text-orange-100/70">
                No worries! Your checkout was canceled and you haven't been charged. You can try again whenever you're ready.
              </p>
            </div>

            {/* What You'll Miss Section */}
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 mb-6">
              <h2 className="font-semibold text-amber-50 mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
                What premium offers
              </h2>
              <ul className="space-y-3">
                {whatYouMiss.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-50">{item.feature}</p>
                      <p className="text-xs text-amber-200/60">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Free Plan Benefits */}
            <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 mb-6">
              <h2 className="font-semibold text-orange-50 mb-2">Free plan includes</h2>
              <ul className="space-y-1">
                {freeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-orange-100/80">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Feedback Form */}
            {!submitted ? (
              <div className="mb-6">
                <p className="text-sm text-orange-100/70 mb-2">
                  Help us improve - what stopped you from upgrading? (Optional)
                </p>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full h-20 rounded-xl border border-orange-500/30 bg-black/40 px-4 py-3 text-sm text-orange-50 placeholder-orange-100/30 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
                  placeholder="Share your thoughts..."
                />
                {feedback && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSubmitFeedback}
                    className="mt-2"
                  >
                    Submit Feedback
                  </Button>
                )}
              </div>
            ) : (
              <div className="mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-50">
                Thank you for your feedback! We appreciate it.
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Link href="/pricing">
                <Button className="w-full">
                  🔥 View Plans Again
                </Button>
              </Link>
              <Link href="/kiaan">
                <Button variant="secondary" className="w-full">
                  Continue with Free
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" className="w-full">
                  Return Home
                </Button>
              </Link>
            </div>

            {/* Support Link */}
            <p className="text-center text-xs text-orange-100/50 mt-6">
              Questions?{' '}
              <Link href="/contact" className="text-orange-400 hover:underline">
                Contact our support team
              </Link>
            </p>
          </CardContent>
        </Card>
      </FadeIn>
    </main>
  )
}
