import { Metadata } from 'next'
import ViyogClient from './ViyogClient'

export const metadata: Metadata = {
  title: 'Viyoga - Detachment Coach | MindVibe',
  description: 'Shift from result-focused anxiety to grounded action with Viyoga, your outcome anxiety reducer.',
  alternates: {
    canonical: '/tools/viyog',
  },
}

export default function ViyogPage() {
  return <ViyogClient />
}
