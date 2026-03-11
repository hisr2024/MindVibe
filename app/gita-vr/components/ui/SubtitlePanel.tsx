/**
 * SubtitlePanel — Divine floating subtitles for Krishna's speech
 *
 * Golden text on semi-transparent dark panel.
 * Shows Krishna's speech in real-time during TTS playback or text-only mode.
 * Positioned as regular DOM element (no Three.js Html wrapper).
 */

'use client'

import { useGitaVRStore } from '@/stores/gitaVRStore'

export default function SubtitlePanel() {
  const subtitleText = useGitaVRStore((s) => s.subtitleText)
  const subtitlesEnabled = useGitaVRStore((s) => s.subtitlesEnabled)
  const krishnaState = useGitaVRStore((s) => s.krishnaState)

  // Show subtitles when Krishna is speaking (with or without TTS audio)
  if (!subtitlesEnabled || !subtitleText || krishnaState === 'idle') return null

  return (
    <div className="max-w-md rounded-lg border border-[#d4a44c]/10 bg-black/70 px-6 py-3 text-center backdrop-blur-md">
      <p className="text-sm leading-relaxed text-[#d4a44c]/90">
        {subtitleText}
      </p>
    </div>
  )
}
