'use client'

/**
 * AuthHeader — OM symbol + title + subtitle for auth screens
 *
 * The OM circle breathes with the sacred-divine-breath animation,
 * setting the spiritual tone before the user enters credentials.
 */

interface AuthHeaderProps {
  title?: string
  subtitle?: string
}

export function AuthHeader({
  title = 'Welcome to Kiaanverse',
  subtitle = 'Your divine companion awaits',
}: AuthHeaderProps) {
  return (
    <div className="flex flex-col items-center pt-12 pb-8">
      {/* OM Circle with divine-breath animation */}
      <div className="sacred-divine-breath w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-[rgba(22,26,66,0.9)] to-[rgba(17,20,53,0.95)] border border-[rgba(212,160,23,0.4)] mb-6">
        <span className="text-4xl text-[var(--sacred-divine-gold)] sacred-text-divine select-none">
          ॐ
        </span>
      </div>

      <h1 className="sacred-text-divine text-2xl text-[var(--sacred-text-primary)] tracking-wide text-center">
        {title}
      </h1>
      <p className="sacred-text-ui text-sm text-[var(--sacred-text-muted)] mt-2 text-center">
        {subtitle}
      </p>
    </div>
  )
}

export default AuthHeader
