/**
 * Dynamic Sitemap Generator
 *
 * Generates a comprehensive sitemap for search engines covering all public-facing
 * pages on Sakha. Uses the Next.js Metadata API (app/sitemap.ts convention).
 *
 * Private/authenticated routes (dashboard, account, admin, settings, profile,
 * onboarding, subscription) are intentionally excluded because they require
 * login and should not be indexed by crawlers.
 */

import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://mindvibe.life'
  const now = new Date()

  // ── Core marketing & informational pages ─────────────────────────────
  const corePages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/introduction`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ]

  // ── Product feature pages ────────────────────────────────────────────
  const featurePages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/companion`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/kiaan`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/journeys`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/deep-insights`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/sacred-reflections`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/wisdom-rooms`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  // ── KIAAN Vibe (music/meditation player) pages ───────────────────────
  const kiaanVibePages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/kiaan-vibe`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/kiaan-vibe/gita`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/kiaan-vibe/library`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/kiaan-vibe/playlists`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ]

  // ── Spiritual wellness tools ─────────────────────────────────────────
  const tools = [
    'ardha',
    'viyog',
    'karmic-tree',
    'emotional-reset',
    'karma-footprint',
    'relationship-compass',
    'karma-reset',
  ] as const

  const toolPages: MetadataRoute.Sitemap = tools.map((tool) => ({
    url: `${baseUrl}/tools/${tool}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // ── Bhagavad Gita chapters (1-18) ───────────────────────────────────
  const gitaChapterPages: MetadataRoute.Sitemap = Array.from(
    { length: 18 },
    (_, i) => ({
      url: `${baseUrl}/kiaan-vibe/gita/${i + 1}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })
  )

  // ── Guided flows ─────────────────────────────────────────────────────
  const flowPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/flows`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  return [
    ...corePages,
    ...featurePages,
    ...kiaanVibePages,
    ...toolPages,
    ...gitaChapterPages,
    ...flowPages,
  ]
}
