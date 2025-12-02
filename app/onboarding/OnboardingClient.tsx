'use client'

import { useEffect, useState } from 'react'

import CrisisResources from '../components/CrisisResources'
import { useI18n } from '../components/LocaleProvider'

type Prefs = {
  demoData: boolean
  analytics: boolean
  notifications: boolean
  reducedMotion: boolean
}

const defaultPrefs: Prefs = {
  demoData: true,
  analytics: false,
  notifications: false,
  reducedMotion: false,
}

const steps = ['onboarding.steps.access', 'onboarding.steps.checkin', 'onboarding.steps.journal', 'onboarding.steps.insights', 'onboarding.steps.coaching']

export default function OnboardingClient() {
  const { t } = useI18n()
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs)
  const [status, setStatus] = useState('Preferences are saved locally and can be updated anytime.')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mv-onboarding-preferences')
      if (stored) setPrefs({ ...defaultPrefs, ...JSON.parse(stored) })
    } catch (error) {
      setStatus('Unable to read saved preferences; defaults applied.')
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('mv-onboarding-preferences', JSON.stringify(prefs))
    } catch (error) {
      setStatus('Unable to persist preferences; check storage permissions.')
    }
  }, [prefs])

  useEffect(() => {
    if (prefs.reducedMotion) {
      document.documentElement.classList.add('reduce-motion')
    } else {
      document.documentElement.classList.remove('reduce-motion')
    }
  }, [prefs.reducedMotion])

  function toggle<K extends keyof Prefs>(key: K) {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3 rounded-3xl border border-orange-500/20 bg-gradient-to-br from-[#0f0a08] via-[#0c0c10] to-[#0a0a0f] p-8 shadow-[0_25px_100px_rgba(255,115,39,0.14)]">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Welcome</p>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-orange-50 md:text-4xl">{t('onboarding.title')}</h1>
          <p className="max-w-3xl text-sm text-orange-100/80">{t('onboarding.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-orange-50">
          <span className="rounded-full border border-orange-500/30 px-3 py-1">WCAG 2.2 AA aligned</span>
          <span className="rounded-full border border-orange-500/30 px-3 py-1">Offline-first</span>
          <span className="rounded-full border border-orange-500/30 px-3 py-1">Demo safe mode</span>
        </div>
      </header>

      <section className="rounded-3xl border border-orange-500/20 bg-slate-950/60 p-6 shadow-[0_12px_48px_rgba(255,115,39,0.12)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-orange-100/70">{t('onboarding.privacy')}</p>
            <h2 className="text-2xl font-semibold text-orange-50">{t('onboarding.demo')}</h2>
            <p className="max-w-2xl text-sm text-orange-100/80">{t('onboarding.demoCopy')}</p>
          </div>
          <button
            onClick={() => toggle('demoData')}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 ${
              prefs.demoData
                ? 'bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 text-slate-950 shadow-orange-500/25'
                : 'border border-orange-500/25 text-orange-50'
            }`}
            aria-pressed={prefs.demoData}
          >
            {prefs.demoData ? 'Demo data enabled' : 'Enable demo data'}
          </button>
        </div>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {[t('onboarding.offline'), 'AES-GCM local journal encryption', 'Crisis guardrails and disclaimers', 'Revocable consent anytime'].map(item => (
            <li key={item} className="flex gap-2 text-sm text-orange-100/80">
              <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-orange-400 to-[#ffb347]" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {(
          [
            { key: 'analytics' as const, title: t('onboarding.analytics'), body: 'Anonymous, privacy-safe metrics help improve flows. Nothing personal is sent.' },
            { key: 'notifications' as const, title: t('onboarding.notifications'), body: 'Opt into reminders for daily check-ins, journaling streaks, and crisis guardrails.' },
            { key: 'reducedMotion' as const, title: t('onboarding.motion'), body: 'Reduce animations and transitions for calmer experiences.' },
          ] satisfies { key: keyof Prefs; title: string; body: string }[]
        ).map(pref => (
          <article
            key={pref.key}
            className="flex items-start justify-between gap-3 rounded-3xl border border-orange-500/15 bg-black/50 p-5 text-sm text-orange-100/80 shadow-[0_12px_48px_rgba(255,115,39,0.12)]"
          >
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-orange-50">{pref.title}</h3>
              <p>{pref.body}</p>
            </div>
            <button
              onClick={() => toggle(pref.key)}
              className={`h-10 w-20 rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 ${
                prefs[pref.key] ? 'border-emerald-300 bg-emerald-400/30 text-emerald-950' : 'border-orange-500/30 bg-slate-950 text-orange-50'
              }`}
              aria-pressed={prefs[pref.key]}
            >
              {prefs[pref.key] ? 'On' : 'Off'}
            </button>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-orange-500/20 bg-slate-950/60 p-6 shadow-[0_12px_48px_rgba(255,115,39,0.12)]">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-orange-100/70">Journeys</p>
            <h3 className="text-2xl font-semibold text-orange-50">Map the first week</h3>
            <p className="text-sm text-orange-100/80">Complete these steps to cover onboarding, daily check-ins, journaling, insights, and coaching safety nets.</p>
          </div>
          <div className="rounded-xl border border-orange-500/20 bg-black/50 px-4 py-2 text-xs font-semibold text-orange-50">
            {status}
          </div>
        </div>
        <ol className="mt-4 grid gap-3 md:grid-cols-2" aria-label="Core onboarding steps">
          {steps.map((key, idx) => (
            <li key={key} className="flex gap-3 rounded-2xl border border-orange-500/20 bg-black/40 p-4">
              <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-amber-300 text-sm font-bold text-slate-950">
                {idx + 1}
              </span>
              <div>
                <p className="font-semibold text-orange-50">{t(key)}</p>
                <p className="text-xs text-orange-100/75">Checkpoint complete when toggles are saved above.</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <CrisisResources />
    </div>
  )
}
