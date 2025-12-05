import { Metadata } from 'next'
import ViyogClient from './ViyogClient'

export const metadata: Metadata = {
  title: 'Viyog - Detachment Coach | MindVibe',
  description: 'Shift from result-focused anxiety to grounded action with Viyog, your outcome anxiety reducer.',
}

export default function ViyogPage() {
  return <ViyogClient />
}
