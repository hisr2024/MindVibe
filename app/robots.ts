import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/account/',
          '/profile/',
          '/onboarding/',
          '/ardha',
          '/karmic-tree',
          '/emotional-reset',
          '/karma-footprint',
          '/relationship-compass',
          '/viyog',
        ],
      },
    ],
    sitemap: 'https://mindvibe.life/sitemap.xml',
  }
}
