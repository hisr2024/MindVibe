'use client'

import CrisisResources from '../components/CrisisResources'
import { useI18n } from '../components/LocaleProvider'

const insightCards = [
  {
    title: 'Daily check-in adherence',
    body: 'Track streaks, identify missed days, and propose calmer schedules with notification windows.',
  },
  {
    title: 'Journaling depth',
    body: 'Surface themes across encrypted entries using on-device analysis; exportable without servers.',
  },
  {
    title: 'Coaching capsules',
    body: 'Three-bullet summaries paired with breathing cues, detachment prompts, and gratitude anchors.',
  },
  {
    title: 'Crisis safeguards',
    body: 'Warn when entries hint at harm and remind users of region-aware crisis contacts.',
  },
]

const actions = [
  'Schedule a 3-minute tone check every morning with reduced motion.',
  'Run the Viyog outcome reducer when decisions feel sticky.',
  'Use demo data to explore features before sharing anything personal.',
  'Export encrypted journals weekly and sync ciphertext to the secure endpoint.',
]

export default function InsightsClient() {
  const { t } = useI18n()
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 lg:px-6">
      <div className="space-y-8">
        <header className="space-y-3 rounded-3xl border border-orange-500/20 bg-gradient-to-br from-[#0f0a08] via-[#0c0c10] to-[#0a0a0f] p-8 shadow-[0_25px_100px_rgba(255,115,39,0.14)]">
          <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Weekly digest</p>
          <h1 className="text-3xl font-bold text-orange-50 md:text-4xl">{t('insights.title')}</h1>
          <p className="max-w-3xl text-sm text-orange-100/80">{t('insights.subtitle')}</p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {insightCards.map(card => (
            <article
              key={card.title}
              className="rounded-3xl border border-orange-500/20 bg-black/50 p-5 shadow-[0_12px_48px_rgba(255,115,39,0.12)]"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-orange-100/70">Insight</p>
              <h3 className="text-xl font-semibold text-orange-50">{card.title}</h3>
              <p className="mt-2 text-sm text-orange-100/80">{card.body}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-orange-500/20 bg-slate-950/60 p-6 shadow-[0_12px_48px_rgba(255,115,39,0.12)]">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-orange-100/70">Next best actions</p>
              <h2 className="text-2xl font-semibold text-orange-50">Coaching picks for this week</h2>
              <p className="text-sm text-orange-100/80">Generated from your check-ins, journaling cadence, and goal tags.</p>
            </div>
            <div className="rounded-xl border border-orange-500/25 bg-black/50 px-4 py-2 text-xs font-semibold text-orange-50">
              Offline-ready & region-aware
            </div>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-orange-100/80">
            {actions.map(item => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-orange-400 to-[#ffb347]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <CrisisResources />
      </div>
    </main>
  )
}
