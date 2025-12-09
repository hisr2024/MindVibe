import { Metadata } from 'next'
import ArdhaClient from './ArdhaClient'

export const metadata: Metadata = {
  title: 'Ardha - Reframing Assistant | MindVibe',
  description: 'Transform negative thoughts into balanced, empowering perspectives with ancient wisdom.',
}

export default function ArdhaPage() {
  return <ArdhaClient />
}
