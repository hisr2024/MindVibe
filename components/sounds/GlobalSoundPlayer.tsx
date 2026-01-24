'use client'

/**
 * Global Sound Player Wrapper
 *
 * Renders the FloatingSoundPlayer globally when ambient sounds are playing.
 * This component should be placed in the app layout.
 */

import { useAudio } from '@/contexts/AudioContext'
import { AnimatePresence } from 'framer-motion'
import { FloatingSoundPlayer } from './FloatingSoundPlayer'

export function GlobalSoundPlayer() {
  const { state } = useAudio()

  // Only render when ambient sounds are playing
  if (!state.ambientEnabled) {
    return null
  }

  return (
    <AnimatePresence>
      <FloatingSoundPlayer />
    </AnimatePresence>
  )
}

export default GlobalSoundPlayer
