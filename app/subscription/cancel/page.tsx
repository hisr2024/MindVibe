'use client'

import Link from 'next/link'
import { Button, Card, CardContent } from '@/components/ui'

export default function SubscriptionCancelPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Card variant="elevated" className="max-w-md w-full">
        <CardContent className="text-center py-8">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-amber-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-orange-50 mb-2">
            Checkout Canceled
          </h1>
          <p className="text-sm text-orange-100/70 mb-6">
            No worries! Your checkout was canceled and you haven't been charged. You can try again whenever you're ready.
          </p>

          <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 mb-6">
            <p className="text-sm text-orange-100/80">
              You're currently on the <span className="font-semibold text-orange-50">Free</span> plan with 20 KIAAN questions per month.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/pricing">
              <Button className="w-full">
                View Plans Again
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Continue with Free
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
