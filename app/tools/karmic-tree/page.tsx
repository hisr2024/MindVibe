import { Metadata } from 'next'
import KarmicTreePageClient from './KarmicTreePageClient'

export const metadata: Metadata = {
  title: 'Karmic Tree Visualization | MindVibe',
  description: 'Track achievements, unlock mindful rewards, and visualize your growth in the Karmic Tree.',
}

export default function KarmicTreePage() {
  return <KarmicTreePageClient />
}
