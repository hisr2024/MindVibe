'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TriangleOfEnergy, type GuidanceMode } from '@/components/guidance'

/**
 * Flowing Energy Triangle Wrapper for Home Page
 * 
 * Displays the Triangle of Energy with descriptions and navigation
 */

const guidanceModeInfo: Record<GuidanceMode, { title: string; description: string; link: string }> = {
  'inner-peace': {
    title: 'Inner Peace',
    description: 'Find stillness through breath-focused exercises and gentle grounding techniques. Perfect for moments when you need to calm your mind and reconnect with tranquility.',
    link: '/kiaan/features#inner-peace'
  },
  'mind-control': {
    title: 'Mind Control',
    description: 'Develop focused clarity through structured mindfulness practices. Ideal for decision-making, concentration, and maintaining mental discipline.',
    link: '/kiaan/features#mind-control'
  },
  'self-kindness': {
    title: 'Self Kindness',
    description: 'Cultivate compassion for yourself through warm, supportive exercises. Essential for healing, self-acceptance, and nurturing your emotional well-being.',
    link: '/kiaan/features#self-kindness'
  }
}

export function FlowingEnergyTriangle() {
  const [selectedMode, setSelectedMode] = useState<GuidanceMode | null>(null)

  return (
    <div className="space-y-6 rounded-3xl border border-orange-500/15 bg-gradient-to-br from-[#0d0d0f]/90 via-[#0b0b0f]/80 to-[#120a07]/90 p-6 shadow-[0_30px_120px_rgba(255,115,39,0.18)] backdrop-blur md:p-8">
      {/* Header */}
      <div className="space-y-3 text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-200 via-[#ffb347] to-rose-200 bg-clip-text text-transparent md:text-4xl">
          KIAAN Experience Hub
        </h2>
        <p className="mx-auto max-w-2xl text-base text-orange-100/80 md:text-lg">
          Three interconnected paths to wellness, flowing together in harmony
        </p>
      </div>

      {/* Triangle and Info */}
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Triangle */}
        <div className="flex-shrink-0">
          <TriangleOfEnergy
            selectedMode={selectedMode}
            onSelectMode={setSelectedMode}
            size={280}
          />
        </div>

        {/* Mode Info */}
        <div className="flex-1 space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-orange-100/70">Guidance Modes</p>
          
          {selectedMode ? (
            <div className="animate-fadeIn rounded-2xl border border-orange-400/25 bg-black/40 p-6">
              <h3 className="text-xl font-semibold text-orange-50 flex items-center gap-2 mb-3">
                <span 
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: selectedMode === 'inner-peace' ? '#4fd1c5' 
                      : selectedMode === 'mind-control' ? '#3b82f6' 
                      : '#ec4899'
                  }}
                />
                {guidanceModeInfo[selectedMode].title}
              </h3>
              <p className="text-sm text-orange-100/80 leading-relaxed mb-4">
                {guidanceModeInfo[selectedMode].description}
              </p>
              <Link
                href={guidanceModeInfo[selectedMode].link}
                className="inline-flex items-center gap-2 text-sm font-semibold text-orange-300 hover:text-orange-100 transition-colors"
              >
                Explore this mode
                <span aria-hidden>→</span>
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-orange-500/20 bg-white/5 p-6">
              <p className="text-sm text-orange-100/70 italic">
                Click on a node in the triangle to learn more about each guidance mode.
              </p>
            </div>
          )}

          {/* Quick Access */}
          <div className="pt-2">
            <Link
              href="/kiaan"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-[#ff9933] to-orange-300 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/25 transition-all hover:scale-105"
            >
              Explore Full KIAAN Hub
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
