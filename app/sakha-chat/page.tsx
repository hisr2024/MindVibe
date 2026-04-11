'use client'

/**
 * Sakha Chat Page — Full-screen cinematic Gita chat experience.
 *
 * Route: /sakha-chat
 *
 * Renders a divine dark-themed chat interface with Sakha (KIAAN),
 * the Bhagavad Gita-powered AI companion. Features a minimalist header
 * with golden accents and the SakhaChatInterface orchestrator.
 */

import { useRouter } from 'next/navigation'
import { SakhaChatInterface } from '@/components/chat/SakhaChatInterface'
import { SakhaAvatar } from '@/components/chat/SakhaAvatar'

export default function SakhaChatPage() {
  const router = useRouter()

  return (
    <div className="flex h-dvh flex-col bg-gradient-to-b from-[#050714] via-[#0a0a12] to-[#0f0f18]">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-[#e8b54a]/10 px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#a89e8e] transition-colors hover:bg-[#e8b54a]/10 hover:text-[#e8b54a] focus:outline-none focus:ring-2 focus:ring-[#d4a44c]/30"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>

        <SakhaAvatar state="idle" size="sm" />

        <div className="flex flex-col">
          <h1
            className="text-base font-semibold tracking-wide text-[#e8b54a]"
            style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
          >
            Sakha
          </h1>
          <p className="text-[10px] text-[#7a7060]">
            Your divine companion
          </p>
        </div>

        {/* Subtle golden glow accent */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[1px] w-32 -translate-x-1/2"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(228,181,74,0.4), transparent)',
          }}
        />
      </header>

      {/* Chat interface */}
      <SakhaChatInterface />
    </div>
  )
}
