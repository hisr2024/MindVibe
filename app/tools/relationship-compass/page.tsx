import { Metadata } from 'next'
import RelationshipCompassClient from './RelationshipCompassClient'

export const metadata: Metadata = {
  title: 'Relationship Compass | MindVibe',
  description: 'Navigate relationship challenges with clarity, fairness, and compassion.',
}

export default function RelationshipCompassPage() {
  return <RelationshipCompassClient />
}
