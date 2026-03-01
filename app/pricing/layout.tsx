/**
 * Pricing Page Layout
 *
 * Server component wrapper that provides SEO metadata for the pricing page.
 * The actual pricing UI is a client component (page.tsx) that handles
 * interactive billing toggles and payment method selection.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing | Sakha',
  description:
    'Choose the perfect Sakha plan for your spiritual journey. Free, Plus, Pro, and Elite tiers with KIAAN AI guidance, sacred wisdom journeys, and divine tools.',
  openGraph: {
    title: 'Pricing — Sakha Spiritual Companion Plans',
    description:
      'Start free with 15 KIAAN questions/month. Upgrade for unlimited divine guidance, wisdom journeys, and sacred tools rooted in the Bhagavad Gita.',
    url: 'https://kiaanverse.com/pricing',
  },
  alternates: {
    canonical: 'https://kiaanverse.com/pricing',
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
