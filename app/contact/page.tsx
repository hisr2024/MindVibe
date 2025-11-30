export const metadata = {
  title: 'Contact | MindVibe',
  description: 'Reach the MindVibe team for support, accessibility requests, or privacy questions.'
}

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 pb-16">
      <section className="rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d10]/90 via-[#0b0b0f]/80 to-[#0f0a08]/90 p-8 shadow-[0_20px_80px_rgba(255,115,39,0.12)]">
        <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Contact</p>
        <h1 className="text-3xl font-bold text-orange-50">We are here to support</h1>
        <p className="mt-4 text-orange-100/80">
          Share feedback, request accessibility accommodations, or report a concern. We respond with care and keep your
          information confidential.
        </p>
      </section>

      <section className="rounded-3xl border border-orange-500/15 bg-black/40 p-6">
        <form className="space-y-4" action="mailto:care@mindvibe.app" method="post" encType="text/plain">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-orange-100/80">
              <span className="font-semibold text-orange-50">Name</span>
              <input
                name="name"
                type="text"
                required
                className="w-full rounded-2xl border border-orange-500/25 bg-slate-950/60 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400/70"
              />
            </label>
            <label className="space-y-2 text-sm text-orange-100/80">
              <span className="font-semibold text-orange-50">Email</span>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-2xl border border-orange-500/25 bg-slate-950/60 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400/70"
              />
            </label>
          </div>
          <label className="space-y-2 text-sm text-orange-100/80">
            <span className="font-semibold text-orange-50">Topic</span>
            <select
              name="topic"
              className="w-full rounded-2xl border border-orange-500/25 bg-slate-950/60 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400/70"
            >
              <option>Accessibility</option>
              <option>Feedback</option>
              <option>Privacy</option>
              <option>Partnerships</option>
            </select>
          </label>
          <label className="space-y-2 text-sm text-orange-100/80">
            <span className="font-semibold text-orange-50">Message</span>
            <textarea
              name="message"
              required
              className="min-h-[140px] w-full rounded-2xl border border-orange-500/25 bg-slate-950/60 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400/70"
              placeholder="Share details (please avoid personal health information)."
            />
          </label>
          <button
            type="submit"
            className="rounded-2xl bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/25 transition hover:scale-[1.01]"
          >
            Send securely
          </button>
        </form>
        <p className="mt-4 text-xs text-orange-100/70">
          By sharing, you agree not to include medical emergencies or protected health information. For urgent needs, contact
          local emergency services.
        </p>
      </section>
    </main>
  )
}
