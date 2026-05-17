import { Metadata } from 'next'
import RelationshipCompassClient from './RelationshipCompassClient'

export const metadata: Metadata = {
  title: 'Relationship Compass | Sakha',
  description: 'Navigate relationship challenges with clarity, fairness, and compassion.',
  alternates: {
    canonical: '/tools/relationship-compass',
  },
}

export default function RelationshipCompassPage() {
  return <RelationshipCompassClient />
}
