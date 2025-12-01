'use client'

import Link from 'next/link'

type BrandLogoProps = {
  className?: string
  showWordmark?: boolean
}

export default function BrandLogo({ className = '', showWordmark = true }: BrandLogoProps) {
  const sparkles = [
    { top: '10%', left: '18%', size: 'w-2 h-2', delay: '0s' },
    { top: '18%', left: '68%', size: 'w-2.5 h-2.5', delay: '0.8s' },
    { top: '42%', left: '28%', size: 'w-1.5 h-1.5', delay: '1.6s' },
    { top: '60%', left: '70%', size: 'w-2 h-2', delay: '0.3s' },
    { top: '72%', left: '36%', size: 'w-2.5 h-2.5', delay: '1.1s' },
  ]

  return (
    <Link
      href="/"
      className={`group relative flex items-center gap-3 text-orange-50 transition hover:text-orange-50 ${className}`}
      aria-label="MindVibe home"
    >
      <div className="relative isolate">
        <div className="brand-logo-aurora" aria-hidden />
        <div className="brand-logo-shine" aria-hidden />

        <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-orange-300/50 bg-gradient-to-br from-orange-500 via-pink-400 to-amber-200 text-slate-900 shadow-[0_16px_70px_rgba(255,153,51,0.32)] transition duration-300 group-hover:scale-105 group-hover:rotate-1">
          <span className="brand-logo-glyph">MV</span>
          <div className="brand-logo-sparkles" aria-hidden>
            {sparkles.map((sparkle, index) => (
              <span
                key={`${sparkle.top}-${sparkle.left}-${sparkle.delay}`}
                className={`brand-logo-sparkle ${sparkle.size}`}
                style={{ top: sparkle.top, left: sparkle.left, animationDelay: sparkle.delay, animationDuration: `${2.8 + index * 0.3}s` }}
              />
            ))}
          </div>
        </div>
      </div>

      {showWordmark && (
        <div className="leading-tight">
          <p className="text-[10px] uppercase tracking-[0.28em] text-orange-100/70 transition duration-300 group-hover:text-orange-50/95">
            MindVibe
          </p>
          <p className="text-base font-bold text-orange-50 drop-shadow-[0_6px_30px_rgba(255,153,51,0.35)]">Companion</p>
        </div>
      )}
    </Link>
  )
}
