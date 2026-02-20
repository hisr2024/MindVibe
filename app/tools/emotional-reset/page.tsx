import { Metadata } from 'next'
import EmotionalResetClient from './EmotionalResetClient'

export const metadata: Metadata = {
  title: 'Emotional Reset - 7-Step Flow | MindVibe',
  description: 'A calming 7-step flow to process emotions, find inner peace, and reset your mental state with timeless ancient wisdom.',
  alternates: {
    canonical: '/tools/emotional-reset',
  },
}

export default function EmotionalResetPage() {
  return <EmotionalResetClient />
}
