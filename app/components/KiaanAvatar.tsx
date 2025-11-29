'use client'

import { Star } from 'lucide-react'

export function KiaanAvatar() {
  return (
    <div className="flex items-center justify-start gap-4">
      <div className="p-3">
        <div className="relative grid place-items-center rounded-full bg-gradient-two p-4 shadow-glow">
          <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-one opacity-40 blur-2xl" aria-hidden />
          <Star className="h-10 w-10 text-ink-100" />
        </div>
      </div>
      <div className="max-w-xl space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-vibrant-blue">KIAAN</p>
        <p className="text-lg font-semibold text-ink-100">Here to steady your breath and focus.</p>
        <p className="text-sm text-ink-300/90">Powered by GPT-4o and guided by Bhagavad Gita wisdom.</p>
      </div>
    </div>
  )
}
