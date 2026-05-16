import { Metadata } from 'next'
import SambandhDharmaClient from './SambandhDharmaClient'

export const metadata: Metadata = {
  title: 'Sambandh Dharma (Relationship Compass) | Sakha',
  description: 'Navigate relationship challenges with clarity, fairness, and compassion.',
  alternates: {
    canonical: '/tools/sambandh-dharma',
  },
}

export default function SambandhDharmaPage() {
  return <SambandhDharmaClient />
}
