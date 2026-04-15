/**
 * app/(marketing)/privacy/page.tsx
 *
 * Desktop privacy policy route — /privacy
 *
 * Shell: 220px navigation rail on the left, a 280px sticky TOC column, and
 * the main article constrained to a 68ch sacred reading measure.
 *
 * Rendering: fully static (SSG). MDX is parsed at build time inside
 * lib/mdx/privacy.ts; no runtime data fetch occurs.
 *
 * SEO: canonical self-reference; paired with /m/privacy which points its
 * canonical tag back to /privacy (see app/(marketing)/m/privacy/page.tsx).
 */

import type { Metadata } from 'next'
import { formatLastUpdated, getPrivacyDocument } from '@/lib/mdx/privacy'
import { PrivacyBadgeRow } from '@/components/legal/PrivacySectionBadge'
import { PrivacyContent } from '@/components/legal/PrivacyContent'
import { PrivacySidebar } from '@/components/legal/PrivacySidebar'
import {
  BackToTopFab,
  DownloadPdfButton,
} from '@/components/legal/PrivacyActions'

// Force fully-static generation — no runtime data fetch.
export const dynamic = 'force-static'
export const revalidate = false

export function generateMetadata(): Metadata {
  const meta = getPrivacyDocument().frontmatter
  const canonical = '/privacy'
  return {
    title: `${meta.title} · Sakha`,
    description: meta.description,
    alternates: {
      canonical,
      languages: {
        'x-default': canonical,
      },
    },
    openGraph: {
      type: 'article',
      url: canonical,
      title: `${meta.title} · Sakha`,
      description: meta.description,
      siteName: 'Sakha',
      publishedTime: meta.effectiveDate,
      modifiedTime: meta.lastUpdated,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${meta.title} · Sakha`,
      description: meta.description,
    },
    robots: { index: true, follow: true },
    other: {
      'article:modified_time': meta.lastUpdated,
      'article:section': 'Legal',
    },
  }
}

export default function PrivacyDesktopPage() {
  const { frontmatter, sections } = getPrivacyDocument()

  return (
    <div className="min-h-screen bg-[#0A0A14] text-[#E8DCC8]">
      {/* Skip link — keyboard/screen-reader users bypass the nav and TOC. */}
      <a
        href="#main-content"
        className={[
          'sr-only focus:not-sr-only',
          'focus:fixed focus:top-3 focus:left-3 focus:z-50',
          'focus:rounded-lg focus:bg-[#C8A84B] focus:px-4 focus:py-2',
          'focus:text-sm focus:font-semibold focus:text-[#0A0A14]',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8A84B]',
        ].join(' ')}
      >
        Skip to content
      </a>

      <div className="mx-auto flex max-w-[1440px] gap-8 px-6 pb-20 pt-10 lg:pl-[calc(220px+2rem)] lg:pr-10">
        {/* Desktop: sticky TOC lives to the left of the article. */}
        <PrivacySidebar sections={sections} />

        <main
          id="main-content"
          className="flex-1 min-w-0 scroll-smooth motion-reduce:scroll-auto"
        >
          {/* --- Page header ------------------------------------------------- */}
          <header className="mb-10 flex flex-col gap-5">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[rgba(232,220,200,0.55)]">
              Legal
            </p>
            <h1 className="font-divine text-4xl md:text-5xl leading-tight tracking-tight text-[#E8DCC8]">
              {frontmatter.title}
            </h1>
            <p className="max-w-[68ch] font-sans text-base leading-relaxed text-[#E8DCC8]/85">
              {frontmatter.description}
            </p>

            {/* Compliance trust row. */}
            <PrivacyBadgeRow tags={frontmatter.compliance} className="mt-2" />

            {/* Meta strip: last updated + version + download */}
            <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-[rgba(200,168,75,0.15)] pt-5">
              <div className="flex flex-col">
                <span className="text-[0.7rem] uppercase tracking-[0.18em] text-[rgba(232,220,200,0.55)]">
                  Last updated
                </span>
                <time
                  dateTime={frontmatter.lastUpdated}
                  className="font-sans text-sm text-[#E8DCC8]"
                >
                  {formatLastUpdated(frontmatter.lastUpdated)}
                </time>
              </div>
              <div className="flex flex-col">
                <span className="text-[0.7rem] uppercase tracking-[0.18em] text-[rgba(232,220,200,0.55)]">
                  Version
                </span>
                <span className="font-sans text-sm text-[#E8DCC8]">
                  v{frontmatter.version}
                </span>
              </div>
              <div className="ml-auto">
                <DownloadPdfButton
                  version={frontmatter.version}
                  variant="outline"
                />
              </div>
            </div>
          </header>

          {/* --- Article body with MDX overrides ----------------------------- */}
          <article
            lang="en"
            aria-labelledby="privacy-article-title"
            className="max-w-[68ch]"
          >
            <span id="privacy-article-title" className="sr-only">
              {frontmatter.title}
            </span>
            <PrivacyContent sections={sections} />
          </article>

          {/* --- Contact callout --------------------------------------------- */}
          <aside
            aria-label="Privacy contact"
            className="mt-14 max-w-[68ch] rounded-2xl border border-[rgba(200,168,75,0.2)] bg-[rgba(200,168,75,0.05)] p-6"
          >
            <h2 className="mb-2 font-divine text-xl text-[#E8DCC8]">
              Questions? We&rsquo;re listening.
            </h2>
            <p className="font-sans text-sm leading-relaxed text-[#E8DCC8]/85">
              Reach our Data Protection Officer at{' '}
              <a
                href={`mailto:${frontmatter.contact.dpo}`}
                className="font-medium text-[#E8DCC8] underline decoration-[#C8A84B]/60 underline-offset-4 hover:decoration-[#C8A84B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8A84B]"
              >
                {frontmatter.contact.dpo}
              </a>{' '}
              or the privacy team at{' '}
              <a
                href={`mailto:${frontmatter.contact.email}`}
                className="font-medium text-[#E8DCC8] underline decoration-[#C8A84B]/60 underline-offset-4 hover:decoration-[#C8A84B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8A84B]"
              >
                {frontmatter.contact.email}
              </a>
              . Postal address: {frontmatter.contact.address}.
            </p>
          </aside>
        </main>
      </div>

      <BackToTopFab threshold={400} />
    </div>
  )
}
