'use client'

import { usePathname } from 'next/navigation'

const ROUTE_LABELS: Record<string, string> = {
  introduction: 'Introduction',
  about: 'About',
  pricing: 'Pricing',
  features: 'Features',
  contact: 'Contact',
  privacy: 'Privacy',
  companion: 'KIAAN Companion',
  kiaan: 'KIAAN',
  'kiaan-vibe': 'KIAAN Vibe',
  journeys: 'Journeys',
  community: 'Community',
  'deep-insights': 'Deep Insights',
  'sacred-reflections': 'Sacred Reflections',
  'wisdom-rooms': 'Wisdom Rooms',
  tools: 'Tools',
  flows: 'Guided Flows',
  dashboard: 'Dashboard',
  gita: 'Bhagavad Gita',
  library: 'Library',
  playlists: 'Playlists',
  chat: 'Chat',
  ardha: 'Ardha',
  viyog: 'Viyog',
  'karmic-tree': 'Karmic Tree',
  'emotional-reset': 'Emotional Reset',
  'karma-footprint': 'Karma Footprint',
  'relationship-compass': 'Relationship Compass',
  'karma-reset': 'Karma Reset',
}

export function BreadcrumbSchema() {
  const pathname = usePathname()

  if (!pathname || pathname === '/') return null

  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return null

  const baseUrl = 'https://kiaanverse.com'

  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: baseUrl,
    },
    ...segments.map((segment, index) => ({
      '@type': 'ListItem',
      position: index + 2,
      name: ROUTE_LABELS[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      item: `${baseUrl}/${segments.slice(0, index + 1).join('/')}`,
    })),
  ]

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
