'use client'

import Link from 'next/link'
import { useLanguage } from '@/hooks/useLanguage'

export default function SiteFooter() {
  const { t } = useLanguage()
  
  return (
    <footer className="border-t border-orange-500/10 bg-slate-950/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.24em] text-orange-100/70">{t('common.app.name', 'MindVibe')}</p>
          <p className="max-w-md text-sm text-orange-100/70">
            {t('navigation.footer.description', 'Designed for calm, privacy-first mental health support. Built with a focus on WCAG accessibility, encryption, and a gentle experience.')}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
          <div className="space-y-2 text-sm text-orange-100/80">
            <p className="text-xs uppercase tracking-wide text-orange-100/60">{t('navigation.footer.explore', 'Explore')}</p>
            <div className="flex flex-col gap-2">
              <Link className="hover:text-orange-50" href="/about">
                {t('navigation.mainNav.about', 'About')}
              </Link>
              <Link className="hover:text-orange-50" href="/features">
                {t('navigation.mainNav.features', 'Features')}
              </Link>
              <Link className="hover:text-orange-50" href="/dashboard">
                {t('navigation.mainNav.dashboard', 'Dashboard')}
              </Link>
            </div>
          </div>
          <div className="space-y-2 text-sm text-orange-100/80">
            <p className="text-xs uppercase tracking-wide text-orange-100/60">{t('navigation.footer.support', 'Support')}</p>
            <div className="flex flex-col gap-2">
              <Link className="hover:text-orange-50" href="/contact">
                {t('navigation.mainNav.contact', 'Contact')}
              </Link>
              <Link className="hover:text-orange-50" href="/privacy">
                {t('navigation.footer.privacy', 'Privacy')}
              </Link>
              <a className="hover:text-orange-50" href="mailto:care@mindvibe.app">
                {t('navigation.footer.emailUs', 'Email us')}
              </a>
            </div>
          </div>
          <div className="space-y-2 text-sm text-orange-100/80">
            <p className="text-xs uppercase tracking-wide text-orange-100/60">{t('navigation.footer.safety', 'Safety')}</p>
            <div className="flex flex-col gap-2">
              <span className="rounded-lg border border-orange-500/20 px-2 py-1 text-xs text-orange-100/90">{t('common.privacy.private', 'Private by design')}</span>
              <span className="rounded-lg border border-orange-500/20 px-2 py-1 text-xs text-orange-100/90">{t('navigation.footer.encryptedJournals', 'Encrypted journals')}</span>
              <span className="rounded-lg border border-orange-500/20 px-2 py-1 text-xs text-orange-100/90">{t('navigation.footer.noTracking', 'No tracking ads')}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
