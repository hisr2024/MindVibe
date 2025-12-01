'use client'

import Link from 'next/link'

import { useI18n } from './LocaleProvider'

export default function SiteFooter() {
  const { t } = useI18n()

  return (
    <footer className="border-t border-orange-500/10 bg-slate-950/80 backdrop-blur-lg" aria-label="Site footer">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.24em] text-orange-100/70">MindVibe</p>
          <p className="max-w-md text-sm text-orange-100/70">{t('footer.tagline')}</p>
        </div>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3" aria-label="Footer navigation">
          <div className="space-y-2 text-sm text-orange-100/80">
            <p className="text-xs uppercase tracking-wide text-orange-100/60">{t('footer.explore')}</p>
            <div className="flex flex-col gap-2">
              <Link className="hover:text-orange-50" href="/about">
                {t('nav.about')}
              </Link>
              <Link className="hover:text-orange-50" href="/features">
                {t('nav.features')}
              </Link>
              <Link className="hover:text-orange-50" href="/dashboard">
                {t('nav.dashboard')}
              </Link>
            </div>
          </div>
          <div className="space-y-2 text-sm text-orange-100/80">
            <p className="text-xs uppercase tracking-wide text-orange-100/60">{t('footer.support')}</p>
            <div className="flex flex-col gap-2">
              <Link className="hover:text-orange-50" href="/contact">
                {t('nav.contact')}
              </Link>
              <Link className="hover:text-orange-50" href="/privacy">
                Privacy
              </Link>
              <a className="hover:text-orange-50" href="mailto:care@mindvibe.app">
                {t('footer.email')}
              </a>
            </div>
          </div>
          <div className="space-y-2 text-sm text-orange-100/80">
            <p className="text-xs uppercase tracking-wide text-orange-100/60">{t('footer.safety')}</p>
            <div className="flex flex-col gap-2" aria-label="Safety commitments">
              <span className="rounded-lg border border-orange-500/20 px-2 py-1 text-xs text-orange-100/90">Private by design</span>
              <span className="rounded-lg border border-orange-500/20 px-2 py-1 text-xs text-orange-100/90">Encrypted journals</span>
              <span className="rounded-lg border border-orange-500/20 px-2 py-1 text-xs text-orange-100/90">No tracking ads</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
