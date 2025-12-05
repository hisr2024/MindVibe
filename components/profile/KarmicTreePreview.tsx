'use client'

import Link from 'next/link'
import { FadeIn, Button } from '@/components/ui'

interface KarmicTreePreviewProps {
  healthScore?: number
  className?: string
}

export function KarmicTreePreview({ healthScore = 75, className = '' }: KarmicTreePreviewProps) {
  // Get health level based on score
  const getHealthLevel = (score: number) => {
    if (score >= 80) return { level: 'Flourishing', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' }
    if (score >= 60) return { level: 'Growing', color: 'text-green-400', bgColor: 'bg-green-500/20' }
    if (score >= 40) return { level: 'Developing', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' }
    if (score >= 20) return { level: 'Recovering', color: 'text-orange-400', bgColor: 'bg-orange-500/20' }
    return { level: 'Needs Care', color: 'text-red-400', bgColor: 'bg-red-500/20' }
  }

  const { level, color, bgColor } = getHealthLevel(healthScore)

  return (
    <FadeIn className={className}>
      <div className="rounded-2xl border border-orange-500/15 bg-black/40 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-orange-50 mb-1">Karmic Tree</h3>
            <p className="text-xs text-orange-100/60">Your spiritual growth visualization</p>
          </div>
          <Link href="/karmic-tree">
            <Button variant="ghost" size="sm">
              View Full Tree
            </Button>
          </Link>
        </div>

        {/* Mini Tree Visualization */}
        <div className="flex items-center gap-6">
          {/* Tree Icon */}
          <div className={`h-20 w-20 rounded-2xl ${bgColor} flex items-center justify-center`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={color}
            >
              <path d="M12 22v-7" />
              <path d="M9 22h6" />
              <path d="M12 15c-4 0-6-3-6-3s2-3 6-3 6 3 6 3-2 3-6 3z" />
              <path d="M12 9c-2.5 0-4-2-4-2s1.5-2 4-2 4 2 4 2-1.5 2-4 2z" />
              <path d="M12 5l0-3" />
            </svg>
          </div>

          {/* Health Score */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-orange-100/70">Health Score</span>
              <span className={`text-sm font-semibold ${color}`}>{level}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-3 rounded-full bg-orange-500/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  healthScore >= 80
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                    : healthScore >= 60
                      ? 'bg-gradient-to-r from-green-500 to-green-400'
                      : healthScore >= 40
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                        : healthScore >= 20
                          ? 'bg-gradient-to-r from-orange-500 to-orange-400'
                          : 'bg-gradient-to-r from-red-500 to-red-400'
                }`}
                style={{ width: `${healthScore}%` }}
              />
            </div>

            <p className="text-2xl font-bold text-orange-50 mt-2">{healthScore}%</p>
          </div>
        </div>

        <p className="text-xs text-orange-100/50 mt-4">
          Your Karmic Tree grows with each journal entry, meditation, and positive action.
        </p>
      </div>
    </FadeIn>
  )
}

export default KarmicTreePreview
