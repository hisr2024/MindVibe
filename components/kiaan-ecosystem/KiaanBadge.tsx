/**
 * KIAAN Badge Component
 * 
 * Displays a badge showing "Powered by KIAAN" with verse usage
 * and validation status information.
 */

'use client'

import { useState } from 'react'
import { KiaanBadgeProps } from '@/types/kiaan-ecosystem.types'

export default function KiaanBadge({
  versesUsed,
  validationPassed,
  validationScore,
  className = '',
  showDetails = true
}: KiaanBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  
  // Determine badge color based on validation - black & golden cosmic theme
  const badgeColor = validationPassed
    ? 'bg-[#d4a44c]/10 border-[#d4a44c]/25'
    : 'bg-[#0a0a0f] border-[#d4a44c]/10'

  const textColor = validationPassed
    ? 'text-[#e8dcc8]'
    : 'text-[#e8dcc8]/70'

  const iconColor = validationPassed
    ? 'text-[#d4a44c]'
    : 'text-[#d4a44c]/50'

  return (
    <div className={`relative inline-flex ${className}`}>
      {/* Main badge */}
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${badgeColor} ${textColor} text-sm font-medium transition-all duration-200`}
        onMouseEnter={() => showDetails && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* KIAAN icon */}
        <span className={iconColor} aria-label="KIAAN Wisdom Engine">🕉️</span>

        {/* Text */}
        <span>Powered by KIAAN</span>

        {/* Verse count badge */}
        {versesUsed > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-[#d4a44c] text-[#0a0a0f]">
            {versesUsed}
          </span>
        )}

        {/* Validation indicator */}
        {validationPassed && (
          <span className="text-[#d4a44c]" title="Wisdom validated">
            ✓
          </span>
        )}
      </div>

      {/* Tooltip with details */}
      {showDetails && showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 w-64">
          <div className="kiaan-cosmic-card text-[#e8dcc8] text-xs rounded-lg shadow-lg p-3">
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
              <div className="border-8 border-transparent border-t-[#0a0a10]"></div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <div>
                <div className="kiaan-text-golden font-semibold mb-1">KIAAN Wisdom Engine</div>
                <div className="text-[#e8dcc8]/60">
                  Ancient wisdom adapted for modern life.
                </div>
              </div>

              {versesUsed > 0 && (
                <div className="pt-2 border-t border-[#d4a44c]/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[#d4a44c]/50">Verses used:</span>
                    <span className="font-semibold text-[#d4a44c]">{versesUsed}</span>
                  </div>
                </div>
              )}

              {validationScore !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-[#d4a44c]/50">Wisdom score:</span>
                  <span className="font-semibold text-[#d4a44c]">
                    {Math.round(validationScore * 100)}%
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[#d4a44c]/50">Validation:</span>
                <span className={validationPassed ? 'text-[#d4a44c]' : 'text-[#d4a44c]/40'}>
                  {validationPassed ? '✓ Passed' : '○ Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
