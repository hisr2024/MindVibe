'use client'

import Link from 'next/link'
import { useLanguage } from '@/hooks/useLanguage'
import { KrishnaSymbol } from '@/components/branding/KrishnaSymbol'

export default function SiteFooter() {
  const { t } = useLanguage()

  return (
    <footer className="border-t border-white/[0.06] bg-gradient-to-b from-slate-950 to-[#050507]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between lg:px-8">
        <div className="space-y-3 md:max-w-xs">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-100/80">{t('common.app.name', 'MindVibe')}</p>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em]">
            <span className="text-orange-100/60">{t('common.app.taglinePrefix', 'Your')}</span>
            <KrishnaSymbol size={12} animated={false} glow={false} />
            <span
              className="bg-clip-text text-transparent font-bold"
              style={{ backgroundImage: 'linear-gradient(135deg, #ea580c 0%, #f59e0b 35%, #fbbf24 60%, #fcd34d 100%)' }}
            >
              {t('common.app.taglineSpiritual', 'Spiritual')}
            </span>
            <span className="text-orange-100/60">{t('common.app.taglineSuffix', 'Companion')}</span>
          </p>
          <p className="text-sm leading-relaxed text-white/50">
            {t('navigation.footer.description', 'Your spiritual companion and divine friend — rooted in the Bhagavad Gita. Walk with Krishna through sacred wisdom, guided journeys, and inner peace.')}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
          <nav className="space-y-3 text-sm" aria-label="Footer explore links">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">{t('navigation.footer.explore', 'Explore')}</p>
            <div className="flex flex-col gap-2.5">
              <Link className="text-white/60 transition hover:text-orange-200" href="/about">
                {t('navigation.mainNav.about', 'About')}
              </Link>
              <Link className="text-white/60 transition hover:text-orange-200" href="/features">
                {t('navigation.mainNav.features', 'Features')}
              </Link>
              <Link className="text-white/60 transition hover:text-orange-200" href="/dashboard">
                {t('navigation.mainNav.dashboard', 'Dashboard')}
              </Link>
            </div>
          </nav>
          <nav className="space-y-3 text-sm" aria-label="Footer support links">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">{t('navigation.footer.support', 'Support')}</p>
            <div className="flex flex-col gap-2.5">
              <Link className="text-white/60 transition hover:text-orange-200" href="/contact">
                {t('navigation.mainNav.contact', 'Contact')}
              </Link>
              <Link className="text-white/60 transition hover:text-orange-200" href="/privacy">
                {t('navigation.footer.privacy', 'Privacy')}
              </Link>
              <Link className="text-white/60 transition hover:text-orange-200" href="/terms">
                {t('navigation.footer.terms', 'Terms of Service')}
              </Link>
              <a className="text-white/60 transition hover:text-orange-200" href="mailto:care@mindvibe.life">
                {t('navigation.footer.emailUs', 'Email us')}
              </a>
            </div>
          </nav>
          <div className="space-y-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">{t('navigation.footer.safety', 'Sacred Trust')}</p>
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4a44c]/10 bg-[#d4a44c]/[0.03] px-2.5 py-1 text-xs text-white/70">
                <svg className="h-3 w-3 text-[#d4a44c]/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                {t('common.privacy.private', 'Sacred and private')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4a44c]/10 bg-[#d4a44c]/[0.03] px-2.5 py-1 text-xs text-white/70">
                <svg className="h-3 w-3 text-[#d4a44c]/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                {t('navigation.footer.encryptedJournals', 'Encrypted reflections')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4a44c]/10 bg-[#d4a44c]/[0.03] px-2.5 py-1 text-xs text-white/70">
                <svg className="h-3 w-3 text-[#d4a44c]/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                {t('navigation.footer.noTracking', 'Your journey, your privacy')}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Copyright bar */}
      <div className="border-t border-white/[0.04] py-4">
        <p className="text-center text-xs text-white/30">
          {new Date().getFullYear()} MindVibe. Crafted with reverence for inner peace.
        </p>
      </div>
    </footer>
  )
}
