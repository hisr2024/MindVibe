'use client'

/**
 * CompanionCTA - "Talk to KIAAN" Call-to-Action for all ecosystem tools.
 *
 * Renders a warm, inviting link to the KIAAN Companion that carries
 * referral context (which tool the user came from). This enables KIAAN
 * to greet the user with awareness of what they were just doing.
 *
 * Usage in any tool page:
 *   <CompanionCTA fromTool="emotional-reset" mood="overwhelmed" />
 */

import Link from 'next/link'

export interface CompanionCTAProps {
  /** Tool ID the user is coming from (for referral context) */
  fromTool?: string
  /** Current detected mood to pass along */
  mood?: string
  /** Optional custom message */
  message?: string
  /** Compact variant for inline use */
  compact?: boolean
  /** Additional className */
  className?: string
}

const TOOL_FRIENDLY_NAMES: Record<string, string> = {
  'emotional-reset': 'Emotional Reset',
  'ardha': 'Ardha',
  'viyog': 'Viyoga',
  'relationship-compass': 'Relationship Compass',
  'karma-reset': 'Karma Reset',
  'karma-footprint': 'Karma Footprint',
  'karmic-tree': 'Karmic Tree',
  'sacred-reflections': 'Sacred Reflections',
  'kiaan-vibe': 'KIAAN Vibe',
  'wisdom-rooms': 'Wisdom Rooms',
  'community': 'Community Circles',
}

export default function CompanionCTA({
  fromTool,
  mood,
  message,
  compact = false,
  className = '',
}: CompanionCTAProps) {
  const params = new URLSearchParams()
  if (fromTool) params.set('from', fromTool)
  if (mood) params.set('mood', mood)
  const query = params.toString()
  const href = `/companion${query ? `?${query}` : ''}`

  const toolName = fromTool ? TOOL_FRIENDLY_NAMES[fromTool] || fromTool : null
  const defaultMessage = toolName
    ? `Need to talk? KIAAN is here after your ${toolName} session.`
    : 'Need someone to talk to? KIAAN is always here.'

  if (compact) {
    return (
      <Link
        href={href}
        className={`inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors ${className}`}
      >
        <span className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">K</span>
        Talk to KIAAN
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className={`group block rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 p-4 transition-all hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/10 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
          <span className="text-white text-sm font-bold">K</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-violet-100 group-hover:text-white transition-colors">
            Talk to KIAAN Companion
          </p>
          <p className="text-xs text-violet-300/70 mt-0.5">
            {message || defaultMessage}
          </p>
        </div>
        <svg className="w-5 h-5 text-violet-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
