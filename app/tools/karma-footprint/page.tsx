import { Metadata } from 'next'
import KarmaFootprintClient from './KarmaFootprintClient'

export const metadata: Metadata = {
  title: 'Karma Footprint Analyzer | Sakha',
  description: 'Reflect on your daily actions and visualize your karma footprint to cultivate mindful living.',
  alternates: {
    canonical: '/tools/karma-footprint',
  },
}

export default function KarmaFootprintPage() {
  return <KarmaFootprintClient />
}
