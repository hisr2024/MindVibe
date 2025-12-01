'use client'

import Link from 'next/link'

import CrisisResources from '../components/CrisisResources'
import { useI18n } from '../components/LocaleProvider'

const journeys = [
  {
    titleKey: 'onboarding.title',
    href: '/onboarding',
    summary: 'Consent, privacy primer, reduced-motion toggle, demo data, and opt-ins.',
  },
  {
    titleKey: 'onboarding.steps.checkin',
    href: '/flows/check-in',
    summary: 'Daily mood, tone setting, and notification scheduling.',
  },
  {
    titleKey: 'onboarding.steps.journal',
    href: '/flows/journal',
    summary: 'Encrypted offline journal with sync queue and export/import.',
  },
  {
    titleKey: 'onboarding.steps.insights',
    href: '/insights',
    summary: 'Weekly digest from check-ins and journaling, with micro-coaching.',
  },
  {
    titleKey: 'onboarding.steps.coaching',
    href: '/flows/viyog',
    summary: 'Outcome reducer, detachment coaching, crisis guardrails, and accountability.',
  },
]

function JourneyCards() {
  const { t } = useI18n()
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {journeys.map((journey, index) => (
        <Link
          key={journey.href}
          href={journey.href}
          className="group rounded-3xl border border-orange-500/20 bg-black/50 p-5 shadow-[0_12px_48px_rgba(255,115,39,0.12)] transition hover:border-orange-400/60"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-50">Journey {index + 1}</span>
            <span className="text-orange-200 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100">→</span>
          </div>
          <h3 className="mt-3 text-xl font-semibold text-orange-50">{t(journey.titleKey)}</h3>
          <p className="mt-2 text-sm text-orange-100/80">{journey.summary}</p>
        </Link>
      ))}
    </div>
  )
}

export default function JourneysClient() {
  const { t } = useI18n()
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 pb-16 lg:px-6">
      <header className="space-y-3 rounded-3xl border border-orange-500/20 bg-gradient-to-br from-[#0f0a08] via-[#0c0c10] to-[#0a0a0f] p-8 shadow-[0_25px_100px_rgba(255,115,39,0.14)]">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Architecture</p>
        <h1 className="text-3xl font-bold text-orange-50 md:text-4xl">{t('journeys.title')}</h1>
        <p className="max-w-3xl text-sm text-orange-100/80">{t('journeys.subtitle')}</p>
      </header>

      <JourneyCards />

      <section className="rounded-3xl border border-orange-500/20 bg-slate-950/60 p-6 shadow-[0_12px_48px_rgba(255,115,39,0.12)]">
        <h2 className="text-lg font-semibold text-orange-50">Empty states & supportive microcopy</h2>
        <p className="text-sm text-orange-100/80">When there is no data, we provide grounded guidance instead of blanks.</p>
        <ul className="mt-3 grid gap-2 text-sm text-orange-100/80 md:grid-cols-2">
          {[
            'Daily check-in: prompt for mood, breathing, and gratitude with a clear CTA.',
            'Journal: explain encryption, offline cache, and demo entries users can load safely.',
            'Insights: show a compassionate message and suggest running a check-in to seed data.',
            'Coaching: remind users to set goals and add crisis contacts before relying on advice.',
          ].map(item => (
            <li key={item} className="flex gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-orange-400 to-[#ffb347]" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <CrisisResources />
    </main>
  )
}
