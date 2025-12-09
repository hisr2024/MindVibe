'use client'

import { MindVibeIcon } from './MindVibeIcon'
import { MindVibeWordmark } from './MindVibeWordmark'
import { MindVibeLockup } from './MindVibeLockup'

export interface MindVibeLogoProps {
  size?: number
  animated?: boolean
  showTagline?: boolean
  theme?: 'sunrise' | 'ocean' | 'aurora'
  lockup?: boolean
  stacked?: boolean
  className?: string
}

/**
 * Premium MindVibe logo wrapper.
 * - lockup=true renders icon + wordmark
 * - lockup=false renders icon only (legacy usage)
 */
export function MindVibeLogo({
  size = 56,
  animated = true,
  showTagline = true,
  theme = 'sunrise',
  lockup = true,
  stacked = false,
  className = '',
}: MindVibeLogoProps) {
  if (!lockup) {
    return <MindVibeIcon size={size} animated={animated} theme={theme} className={className} />
  }

  return (
    <MindVibeLockup
      theme={theme}
      animated={animated}
      showTagline={showTagline}
      layout={stacked ? 'stacked' : 'horizontal'}
      className={className}
    />
  )
}

export { MindVibeIcon, MindVibeWordmark, MindVibeLockup }
