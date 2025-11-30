'use client'

import Chat from '../components/Chat'
import JournalEncrypted from '../components/JournalEncrypted'

export default function DashboardClient() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 pb-16">
      <section className="rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d10]/90 via-[#0b0b0f]/80 to-[#0f0a08]/90 p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Dashboard</p>
        <h1 className="text-3xl font-bold text-orange-50">Your private space</h1>
        <p className="mt-4 max-w-3xl text-orange-100/80">
          Journal with encryption and chat with KIAAN-inspired guidance. All tools are responsive and designed for confidentiality.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-3xl border border-orange-500/15 bg-black/40 p-5 shadow-[0_10px_40px_rgba(255,115,39,0.12)] lg:col-span-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-orange-50">Flow shortcuts</h2>
              <p className="text-sm text-orange-100/80">Jump into the dedicated pages without changing behaviors.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm font-semibold text-slate-900">
              <a
                href="/flows/access"
                className="rounded-2xl bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-4 py-2 shadow-orange-500/20"
              >
                Access
              </a>
              <a href="/flows/check-in" className="rounded-2xl border border-orange-500/25 px-4 py-2 text-orange-50">
                State check-in
              </a>
              <a href="/flows/kiaan" className="rounded-2xl border border-orange-500/25 px-4 py-2 text-orange-50">
                KIAAN chat
              </a>
              <a href="/flows/viyog" className="rounded-2xl border border-orange-500/25 px-4 py-2 text-orange-50">
                Outcome reducer
              </a>
              <a href="/flows/journal" className="rounded-2xl border border-orange-500/25 px-4 py-2 text-orange-50">
                Private journal
              </a>
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-orange-500/15 bg-black/40 p-5 shadow-[0_10px_40px_rgba(255,115,39,0.12)] lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-orange-50">Guided chat</h2>
              <p className="text-sm text-orange-100/80">Send a message and receive a calm response from the server-backed assistant.</p>
            </div>
            <span className="rounded-xl bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-50">Secure</span>
          </div>
          <div className="mt-4 rounded-2xl border border-orange-500/20 bg-slate-950/50 p-4">
            <Chat />
          </div>
        </article>

        <article className="rounded-3xl border border-orange-500/15 bg-black/40 p-5 shadow-[0_10px_40px_rgba(255,115,39,0.12)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-orange-50">Encrypted journal</h2>
              <p className="text-sm text-orange-100/80">Your entries stay on-device with AES-GCM encryption.</p>
            </div>
            <span className="rounded-xl bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-50">Local only</span>
          </div>
          <div className="mt-4 rounded-2xl border border-orange-500/20 bg-slate-950/50 p-4">
            <JournalEncrypted />
          </div>
        </article>
      </section>
    </main>
  )
}
