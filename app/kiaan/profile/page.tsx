'use client'

import { useEffect, useState, type FormEvent } from 'react'

const STORAGE_KEY = 'kiaan_profile_card'

type ProfileDraft = {
  name: string
  focus: string
  roomPreference: string
  intention: string
  privacy: 'private' | 'anonymous'
  reminders: boolean
}

type StoredProfile = {
  profile: ProfileDraft
  savedAt: string
}

const emptyProfile: ProfileDraft = {
  name: '',
  focus: '',
  roomPreference: '',
  intention: '',
  privacy: 'private',
  reminders: false
}

export default function PersonalProfile() {
  const [draft, setDraft] = useState<ProfileDraft>(emptyProfile)
  const [saved, setSaved] = useState<StoredProfile | null>(null)
  const [status, setStatus] = useState<string>('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const cached = window.localStorage.getItem(STORAGE_KEY)
    if (cached) {
      try {
        const parsed: StoredProfile = JSON.parse(cached)
        setDraft(parsed.profile)
        setSaved(parsed)
      } catch {
        setDraft(emptyProfile)
      }
    }
  }, [])

  const updateDraft = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed: ProfileDraft = {
      ...draft,
      name: draft.name.trim(),
      focus: draft.focus.trim(),
      roomPreference: draft.roomPreference.trim(),
      intention: draft.intention.trim()
    }

    const payload: StoredProfile = {
      profile: trimmed,
      savedAt: new Date().toISOString()
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    setSaved(payload)
    setStatus('Profile saved locally. Ready for personal sessions.')
  }

  const clearProfile = () => {
    window.localStorage.removeItem(STORAGE_KEY)
    setDraft(emptyProfile)
    setSaved(null)
    setStatus('Profile cleared from this device.')
  }

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-orange-500/15 bg-[#0b0b0f]/80 p-6 md:p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Personal profile</p>
        <h2 className="mt-2 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-[#ffb347] to-orange-100">
          Create your account-free profile
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-orange-100/85">
          Store your focus areas and intentions locally to personalize sessions without altering any backend systems or the KIAAN chat itself.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-orange-500/15 bg-[#0d0d10]/85 p-6 md:p-8 shadow-[0_15px_60px_rgba(255,115,39,0.14)]">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-orange-100/80">
            <span className="font-semibold text-orange-50">Name or alias</span>
            <input
              value={draft.name}
              onChange={event => updateDraft('name', event.target.value)}
              placeholder="Kiaan companion"
              className="w-full rounded-2xl border border-orange-500/25 bg-black/50 p-3 text-orange-50 placeholder:text-orange-100/60 focus:ring-2 focus:ring-orange-400/70 outline-none"
              required
            />
          </label>

          <label className="space-y-2 text-sm text-orange-100/80">
            <span className="font-semibold text-orange-50">Focus areas</span>
            <input
              value={draft.focus}
              onChange={event => updateDraft('focus', event.target.value)}
              placeholder="Calm focus, better sleep, relationship repair"
              className="w-full rounded-2xl border border-orange-500/25 bg-black/50 p-3 text-orange-50 placeholder:text-orange-100/60 focus:ring-2 focus:ring-orange-400/70 outline-none"
            />
          </label>

          <label className="space-y-2 text-sm text-orange-100/80">
            <span className="font-semibold text-orange-50">Preferred room or suite</span>
            <input
              value={draft.roomPreference}
              onChange={event => updateDraft('roomPreference', event.target.value)}
              placeholder="Clarity pause suite, Relationship compass, Journal"
              className="w-full rounded-2xl border border-orange-500/25 bg-black/50 p-3 text-orange-50 placeholder:text-orange-100/60 focus:ring-2 focus:ring-orange-400/70 outline-none"
            />
          </label>

          <label className="space-y-2 text-sm text-orange-100/80">
            <span className="font-semibold text-orange-50">Session intention</span>
            <input
              value={draft.intention}
              onChange={event => updateDraft('intention', event.target.value)}
              placeholder="Stay steady before big decisions"
              className="w-full rounded-2xl border border-orange-500/25 bg-black/50 p-3 text-orange-50 placeholder:text-orange-100/60 focus:ring-2 focus:ring-orange-400/70 outline-none"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex items-center gap-3 rounded-2xl border border-orange-500/25 bg-black/50 p-4 text-sm text-orange-100/80">
            <input
              type="radio"
              checked={draft.privacy === 'private'}
              onChange={() => updateDraft('privacy', 'private')}
              className="h-4 w-4 accent-orange-400"
            />
            <div>
              <p className="font-semibold text-orange-50">Keep it private</p>
              <p className="text-xs text-orange-100/70">Profile stays local to this device.</p>
            </div>
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-orange-500/25 bg-black/50 p-4 text-sm text-orange-100/80">
            <input
              type="radio"
              checked={draft.privacy === 'anonymous'}
              onChange={() => updateDraft('privacy', 'anonymous')}
              className="h-4 w-4 accent-orange-400"
            />
            <div>
              <p className="font-semibold text-orange-50">Anonymous mode</p>
              <p className="text-xs text-orange-100/70">Use an alias and keep identifying details out.</p>
            </div>
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-orange-500/25 bg-black/50 p-4 text-sm text-orange-100/80">
            <input
              type="checkbox"
              checked={draft.reminders}
              onChange={event => updateDraft('reminders', event.target.checked)}
              className="h-4 w-4 accent-orange-400"
            />
            <div>
              <p className="font-semibold text-orange-50">Session reminders</p>
              <p className="text-xs text-orange-100/70">Keep gentle nudges on this device only.</p>
            </div>
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-2xl bg-gradient-to-r from-orange-400 via-[#ffb347] to-orange-200 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/20 transition hover:scale-[1.01]"
          >
            Save profile locally
          </button>
          <button
            type="button"
            onClick={clearProfile}
            className="rounded-2xl border border-orange-400/40 bg-white/5 px-5 py-3 text-sm font-semibold text-orange-50 transition hover:border-orange-300/80"
          >
            Clear profile
          </button>
          {status && <span className="text-sm text-orange-100/80">{status}</span>}
        </div>
      </form>

      <div className="rounded-3xl border border-orange-500/15 bg-[#0b0b0f]/80 p-6 md:p-8 shadow-[0_15px_60px_rgba(255,115,39,0.14)]">
        <h3 className="text-lg font-semibold text-orange-50">Saved profile snapshot</h3>
        <p className="mt-2 text-sm text-orange-100/80">
          Data never leaves your browser. Use this summary to pick the right KIAAN room before opening the main chat.
        </p>

        {saved ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-orange-400/25 bg-black/50 p-4 text-sm text-orange-100/80">
              <p className="text-xs uppercase tracking-[0.18em] text-orange-100/70">Name or alias</p>
              <p className="text-base font-semibold text-orange-50">{saved.profile.name || 'Not set'}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/25 bg-black/50 p-4 text-sm text-orange-100/80">
              <p className="text-xs uppercase tracking-[0.18em] text-orange-100/70">Focus areas</p>
              <p className="text-base font-semibold text-orange-50">{saved.profile.focus || 'Not set'}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/25 bg-black/50 p-4 text-sm text-orange-100/80">
              <p className="text-xs uppercase tracking-[0.18em] text-orange-100/70">Preferred room</p>
              <p className="text-base font-semibold text-orange-50">{saved.profile.roomPreference || 'Not set'}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/25 bg-black/50 p-4 text-sm text-orange-100/80">
              <p className="text-xs uppercase tracking-[0.18em] text-orange-100/70">Intention</p>
              <p className="text-base font-semibold text-orange-50">{saved.profile.intention || 'Not set'}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/25 bg-black/50 p-4 text-sm text-orange-100/80">
              <p className="text-xs uppercase tracking-[0.18em] text-orange-100/70">Privacy</p>
              <p className="text-base font-semibold text-orange-50">{saved.profile.privacy === 'private' ? 'Private to this device' : 'Anonymous alias'}</p>
            </div>
            <div className="rounded-2xl border border-orange-400/25 bg-black/50 p-4 text-sm text-orange-100/80">
              <p className="text-xs uppercase tracking-[0.18em] text-orange-100/70">Reminders</p>
              <p className="text-base font-semibold text-orange-50">{saved.profile.reminders ? 'Enabled locally' : 'Off'}</p>
            </div>
            <div className="md:col-span-2 rounded-2xl border border-orange-400/25 bg-black/50 p-4 text-xs text-orange-100/70">
              Saved at: {new Date(saved.savedAt).toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-orange-400/20 bg-black/40 p-4 text-sm text-orange-100/80">
            No profile saved yet. Use the form above to create a personal, device-only setup.
          </div>
        )}
      </div>
    </section>
  )
}
