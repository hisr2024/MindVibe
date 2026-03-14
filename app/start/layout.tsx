import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Begin Your Spiritual Journey | Sakha',
  description:
    'KIAAN is your AI spiritual companion, trained on 700+ Bhagavad Gita verses. Find inner peace, heal emotions, and discover your purpose. Start free today.',
  openGraph: {
    title: 'Begin Your Spiritual Journey | Sakha',
    description:
      'Meet KIAAN — your AI guide to inner peace, rooted in the timeless wisdom of the Bhagavad Gita. Free to start, no credit card required.',
    url: '/start',
    type: 'website',
  },
}

export default function StartLayout({ children }: { children: React.ReactNode }) {
  return children
}
