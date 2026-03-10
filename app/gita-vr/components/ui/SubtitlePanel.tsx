/**
 * SubtitlePanel — Divine floating subtitles below Krishna
 *
 * Golden text on semi-transparent dark panel.
 * Shows Krishna's speech in real-time during TTS playback.
 */

'use client'

import { Html } from '@react-three/drei'
import { useGitaVRStore } from '@/stores/gitaVRStore'

export default function SubtitlePanel() {
  const subtitleText = useGitaVRStore((s) => s.subtitleText)
  const subtitlesEnabled = useGitaVRStore((s) => s.subtitlesEnabled)
  const audioPlaying = useGitaVRStore((s) => s.audioPlaying)

  if (!subtitlesEnabled || !subtitleText || !audioPlaying) return null

  return (
    <Html
      position={[0, -0.5, 2]}
      center
      distanceFactor={6}
    >
      <div className="max-w-md rounded-lg border border-[#d4a44c]/10 bg-black/70 px-6 py-3 text-center backdrop-blur-md">
        <p className="text-sm leading-relaxed text-[#d4a44c]/90">
          {subtitleText}
        </p>
      </div>
    </Html>
  )
}
