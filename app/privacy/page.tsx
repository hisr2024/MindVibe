export const metadata = {
  title: 'Privacy | MindVibe',
  description: 'Understand how MindVibe handles encryption, consent, and confidentiality.'
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 pb-16">
      <section className="rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d10]/90 via-[#0b0b0f]/80 to-[#0f0a08]/90 p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Privacy</p>
        <h1 className="text-3xl font-bold text-orange-50">Confidential by default</h1>
        <p className="mt-4 text-orange-100/80">
          Journals encrypt locally with your passphrase; we do not store or transmit them. Chat requests travel over HTTPS to the
          configured backend and never enter ad networks.
        </p>
      </section>

      <section className="rounded-3xl border border-orange-500/15 bg-black/40 p-6 space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-orange-50">What we store</h2>
          <p className="text-sm text-orange-100/80">Minimal local storage for preferences and encrypted entries. No analytics pixels.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-orange-50">Your control</h2>
          <p className="text-sm text-orange-100/80">Export or delete journal files at any time. Avoid sharing emergency or clinical information.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-orange-50">Compliance posture</h2>
          <p className="text-sm text-orange-100/80">
            Built with HIPAA-like caution—encrypted storage, consent-oriented messaging, and clear disclaimers that this is not a
            medical device.
          </p>
        </div>
      </section>
    </main>
  )
}
