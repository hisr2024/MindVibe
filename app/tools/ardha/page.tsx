import { Metadata } from 'next'
import ArdhaClient from './ArdhaClient'

export const metadata: Metadata = {
  title: 'Ardha - Reframing Assistant | MindVibe',
  description: 'Transform negative thoughts into balanced, empowering perspectives with Gita-inspired wisdom.',
}

export default function ArdhaPage() {
  return <ArdhaClient />
}
