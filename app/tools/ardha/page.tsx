import { Metadata } from 'next'
import ArdhaClient from './ArdhaClient'

export const metadata: Metadata = {
  title: 'Ardha - Cognitive Reframing | MindVibe',
  description: 'Transform distorted, reactive thoughts into balanced, steady clarity with Gita-aligned CBT precision.',
}

export default function ArdhaPage() {
  return <ArdhaClient />
}
