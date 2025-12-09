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
  
  // Determine badge color based on validation
  const badgeColor = validationPassed
    ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700'
    : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
  
  const textColor = validationPassed
    ? 'text-purple-900 dark:text-purple-100'
    : 'text-gray-900 dark:text-gray-100'
  
  const iconColor = validationPassed
    ? 'text-purple-600 dark:text-purple-400'
    : 'text-gray-600 dark:text-gray-400'
  
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
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-purple-600 dark:bg-purple-500 text-white">
            {versesUsed}
          </span>
        )}
        
        {/* Validation indicator */}
        {validationPassed && (
          <span className="text-green-600 dark:text-green-400" title="Wisdom validated">
            ✓
          </span>
        )}
      </div>
      
      {/* Tooltip with details */}
      {showDetails && showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 w-64">
          <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-lg p-3 border border-gray-700">
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
              <div className="border-8 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
            </div>
            
            {/* Content */}
            <div className="space-y-2">
              <div>
                <div className="font-semibold mb-1">KIAAN Wisdom Engine</div>
                <div className="text-gray-300">
                  Ancient wisdom from the Bhagavad Gita, adapted for modern life.
                </div>
              </div>
              
              {versesUsed > 0 && (
                <div className="pt-2 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Verses used:</span>
                    <span className="font-semibold">{versesUsed}</span>
                  </div>
                </div>
              )}
              
              {validationScore !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Wisdom score:</span>
                  <span className="font-semibold">
                    {Math.round(validationScore * 100)}%
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Validation:</span>
                <span className={validationPassed ? 'text-green-400' : 'text-yellow-400'}>
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
