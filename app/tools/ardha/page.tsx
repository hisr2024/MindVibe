import { Metadata } from 'next'
import ArdhaClient from './ArdhaClient'

export const metadata: Metadata = {
  title: 'ARDHA - Gita-Compliant Reframing | MindVibe',
  description: 'Atma-Reframing through Dharma and Higher Awareness. Correct mistaken identity through 5 Gita pillars: Atma Distinction, Raga-Dvesha Diagnosis, Dharma Alignment, Hrdaya Samatvam, and Arpana.',
  alternates: {
    canonical: '/tools/ardha',
  },
}

export default function ArdhaPage() {
  return <ArdhaClient />
}
