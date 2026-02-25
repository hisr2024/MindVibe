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
    link: '/kiaan/chat'
  },
  'mind-control': {
    title: 'Mind Control',
    description: 'Develop focused clarity through structured mindfulness practices. Ideal for decision-making, concentration, and maintaining mental discipline.',
    link: '/kiaan/chat'
  },
  'self-kindness': {
    title: 'Self Kindness',
    description: 'Cultivate compassion for yourself through warm, supportive exercises. Essential for healing, self-acceptance, and nurturing your emotional well-being.',
    link: '/kiaan/chat'
  }
}

export function FlowingEnergyTriangle() {
  const [selectedMode, setSelectedMode] = useState<GuidanceMode | null>(null)

  return (
    <div className="space-y-6 rounded-3xl border border-[#d4a44c]/15 bg-gradient-to-br from-[#0d0d0f]/90 via-[#050507]/80 to-[#120a07]/90 p-6 shadow-[0_30px_120px_rgba(212,164,76,0.18)] backdrop-blur md:p-8">
      {/* Header */}
      <div className="space-y-3 text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-[#e8b54a] via-[#ffb347] to-rose-200 bg-clip-text text-transparent md:text-4xl">
          KIAAN Guidance Modes
        </h2>
        <p className="mx-auto max-w-2xl text-base text-[#f5f0e8]/80 md:text-lg">
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
          <p className="text-xs uppercase tracking-[0.22em] text-[#f5f0e8]/70">Guidance Modes</p>
          
          {selectedMode ? (
            <div className="animate-fadeIn rounded-2xl border border-[#d4a44c]/25 bg-black/40 p-6">
              <h3 className="text-xl font-semibold text-[#f5f0e8] flex items-center gap-2 mb-3">
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
              <p className="text-sm text-[#f5f0e8]/80 leading-relaxed mb-4">
                {guidanceModeInfo[selectedMode].description}
              </p>
              <Link
                href={guidanceModeInfo[selectedMode].link}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#e8b54a] hover:text-[#f5f0e8] transition-colors"
              >
                Explore this mode
                <span aria-hidden>→</span>
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#d4a44c]/20 bg-white/5 p-6">
              <p className="text-sm text-[#f5f0e8]/70 italic">
                Click on a node in the triangle to learn more about each guidance mode.
              </p>
            </div>
          )}

          {/* Quick Access */}
          <div className="pt-2">
            <Link
              href="/kiaan/chat"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d4a44c] via-[#ff9933] to-[#d4a44c] px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-[#d4a44c]/25 transition-all hover:scale-105"
            >
              Talk to KIAAN
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
