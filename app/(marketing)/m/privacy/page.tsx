/**
 * app/(marketing)/m/privacy/page.tsx
 *
 * Mobile privacy policy route — /m/privacy
 *
 * Shell: 64px sticky header + single-column content + 88px bottom tab safe-area.
 * Uses the shared <PrivacyContent /> so any content change to the MDX file
 * updates both this route and the desktop one automatically.
 *
 * Rendering: fully static (SSG). See lib/mdx/privacy.ts.
 *
 * SEO: canonical points back to /privacy so the desktop URL is the single
 * indexable source. This is the standard pattern for "m-dot" mobile variants.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { formatLastUpdated, getPrivacyDocument } from '@/lib/mdx/privacy'
import { PrivacyBadgeRow } from '@/components/legal/PrivacySectionBadge'
import { PrivacyContent } from '@/components/legal/PrivacyContent'
import { PrivacyMobileTOC } from '@/components/legal/PrivacyMobileTOC'
import { DownloadPdfButton } from '@/components/legal/PrivacyActions'

export const dynamic = 'force-static'
export const revalidate = false

export function generateMetadata(): Metadata {
  const meta = getPrivacyDocument().frontmatter
  const canonical = '/privacy' // mobile variant — canonical points to desktop.
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

export default function PrivacyMobilePage() {
  const { frontmatter, sections } = getPrivacyDocument()

  return (
    <div className="min-h-screen bg-[#0A0A14] text-[#E8DCC8]">
      {/* Skip link */}
      <a
        href="#mobile-main"
        className={[
          'sr-only focus:not-sr-only',
          'focus:fixed focus:top-2 focus:left-2 focus:z-[60]',
          'focus:rounded-lg focus:bg-[#C8A84B] focus:px-4 focus:py-2',
          'focus:text-sm focus:font-semibold focus:text-[#0A0A14]',
        ].join(' ')}
      >
        Skip to content
      </a>

      {/* 64px sticky header */}
      <header
        className={[
          'sticky top-0 z-40 h-16',
          'flex items-center justify-between gap-2',
          'border-b border-[rgba(200,168,75,0.15)]',
          'bg-[rgba(10,10,20,0.88)] backdrop-blur-md',
          'px-4',
        ].join(' ')}
      >
        <Link
          href="/m"
          aria-label="Back to home"
          className={[
            'inline-flex h-11 w-11 items-center justify-center',
            'rounded-full text-[#E8DCC8]',
            'hover:bg-[rgba(200,168,75,0.1)]',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C8A84B]',
          ].join(' ')}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <span className="flex flex-col text-center leading-tight">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[rgba(232,220,200,0.55)]">
            Legal
          </span>
          <span className="font-divine text-sm text-[#E8DCC8]">
            Privacy Policy
          </span>
        </span>
        <DownloadPdfButton
          version={frontmatter.version}
          variant="outline"
          className="!px-3 !py-1 !text-xs"
        />
      </header>

      {/* Content area with bottom padding for 88px nav + safe-area */}
      <main
        id="mobile-main"
        className={[
          'pb-[calc(88px+env(safe-area-inset-bottom,0px))]',
          'scroll-smooth motion-reduce:scroll-auto',
        ].join(' ')}
      >
        {/* --- Hero ---------------------------------------------------------- */}
        <section className="px-4 pb-6 pt-6">
          <h1 className="font-divine text-[2rem] leading-tight tracking-tight text-[#E8DCC8]">
            {frontmatter.title}
          </h1>
          <p className="mt-3 font-sans text-[0.95rem] leading-relaxed text-[#E8DCC8]/85">
            {frontmatter.description}
          </p>
          <div className="mt-4">
            <PrivacyBadgeRow tags={frontmatter.compliance} />
          </div>
          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-[rgba(200,168,75,0.15)] bg-[rgba(200,168,75,0.05)] px-4 py-3">
            <div className="flex flex-col">
              <span className="text-[0.65rem] uppercase tracking-[0.2em] text-[rgba(232,220,200,0.55)]">
                Last updated
              </span>
              <time
                dateTime={frontmatter.lastUpdated}
                className="font-sans text-sm text-[#E8DCC8]"
              >
                {formatLastUpdated(frontmatter.lastUpdated)}
              </time>
            </div>
            <span className="font-sans text-xs text-[rgba(232,220,200,0.65)]">
              v{frontmatter.version}
            </span>
          </div>
        </section>

        {/* --- Collapsible TOC ---------------------------------------------- */}
        <PrivacyMobileTOC sections={sections} topOffset={72} />

        {/* --- Article body ------------------------------------------------- */}
        <article
          lang="en"
          aria-labelledby="privacy-article-title-mobile"
          className="mobile-privacy-article px-4 pb-14 pt-8"
        >
          <span id="privacy-article-title-mobile" className="sr-only">
            {frontmatter.title}
          </span>
          <PrivacyContent sections={sections} withoutDividers />
        </article>

        {/* --- Contact callout --------------------------------------------- */}
        <aside
          aria-label="Privacy contact"
          className="mx-4 rounded-2xl border border-[rgba(200,168,75,0.2)] bg-[rgba(200,168,75,0.05)] p-5"
        >
          <h2 className="mb-2 font-divine text-lg text-[#E8DCC8]">
            Questions? We&rsquo;re listening.
          </h2>
          <p className="font-sans text-[0.9rem] leading-relaxed text-[#E8DCC8]/85">
            Email{' '}
            <a
              href={`mailto:${frontmatter.contact.dpo}`}
              className="font-medium text-[#E8DCC8] underline decoration-[#C8A84B]/60 underline-offset-4 hover:decoration-[#C8A84B]"
            >
              {frontmatter.contact.dpo}
            </a>{' '}
            or{' '}
            <a
              href={`mailto:${frontmatter.contact.email}`}
              className="font-medium text-[#E8DCC8] underline decoration-[#C8A84B]/60 underline-offset-4 hover:decoration-[#C8A84B]"
            >
              {frontmatter.contact.email}
            </a>
            .
          </p>
        </aside>

        {/* --- Mobile-specific sticky-heading CSS --------------------------- */}
        <style
          // Scoped to this article only: while a section is in view, its h2
          // becomes sticky under the 64px app header.
          dangerouslySetInnerHTML={{
            __html: `
              .mobile-privacy-article .privacy-section h2 {
                position: sticky;
                top: 64px;
                z-index: 10;
                margin-inline: -1rem;
                padding: 0.75rem 1rem;
                background: linear-gradient(
                  180deg,
                  rgba(10, 10, 20, 0.96) 0%,
                  rgba(10, 10, 20, 0.88) 100%
                );
                backdrop-filter: blur(8px);
                border-bottom: 1px solid rgba(200, 168, 75, 0.12);
              }
              @media (prefers-reduced-motion: reduce) {
                .mobile-privacy-article { scroll-behavior: auto; }
              }
            `,
          }}
        />
      </main>
    </div>
  )
}
