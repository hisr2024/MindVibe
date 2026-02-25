'use client'

/**
 * AdvancedInsightsPanel Component
 *
 * A comprehensive dashboard for advanced mood analytics, displaying:
 * - Emotion Circumplex visualization
 * - Cognitive distortion alerts
 * - Guna balance meter
 * - Personalized Gita wisdom
 * - Recommended practices
 */

import React, { useState } from 'react'
import { EmotionCircumplex } from './EmotionCircumplex'
import type {
  MoodAnalysis,
  PsychologicalBridge,
  YogaPathGuidance,
  GunaTransformationPlan,
} from '@/types/advanced-analytics.types'

interface AdvancedInsightsPanelProps {
  analysis: MoodAnalysis
  distortionGuidance?: PsychologicalBridge[]
  yogaGuidance?: YogaPathGuidance
  gunaTransformation?: GunaTransformationPlan
  dailyIntention?: string
  className?: string
}

/** Distortion severity colors */
const getSeverityColor = (severity: number): string => {
  if (severity < 0.3) return 'text-green-600'
  if (severity < 0.6) return 'text-yellow-600'
  return 'text-red-600'
}

/** Intensity descriptors */
const getIntensityLabel = (intensity: number): string => {
  if (intensity < 0.3) return 'Mild'
  if (intensity < 0.6) return 'Moderate'
  if (intensity < 0.8) return 'Strong'
  return 'Intense'
}

export function AdvancedInsightsPanel({
  analysis,
  distortionGuidance = [],
  yogaGuidance,
  gunaTransformation: _gunaTransformation,
  dailyIntention,
  className = '',
}: AdvancedInsightsPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Advanced Insights</h2>
        <p className="text-sm text-gray-500 mt-1">
          Deep analysis powered by behavioral science + Gita wisdom
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Row 1: Circumplex + Primary Emotion */}
        <div className="flex gap-6">
          {/* Emotion Circumplex */}
          <div className="flex-shrink-0">
            <EmotionCircumplex
              vector={analysis.emotion_vector}
              gunaBalance={analysis.guna_balance}
              size={200}
              showLabels={false}
            />
          </div>

          {/* Primary Emotion Details */}
          <div className="flex-1 space-y-3">
            <div>
              <div className="text-sm text-gray-500">Primary Emotion</div>
              <div className="text-2xl font-semibold text-gray-900 capitalize">
                {analysis.primary_emotion.replace(/_/g, ' ')}
              </div>
              {analysis.secondary_emotions.length > 0 && (
                <div className="text-sm text-gray-500 mt-1">
                  Also sensing: {analysis.secondary_emotions.slice(0, 3).join(', ')}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Valence */}
              <div>
                <div className="text-xs text-gray-500 uppercase">Valence</div>
                <div className={`text-lg font-medium ${
                  analysis.emotion_vector.valence > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {analysis.emotion_vector.valence > 0 ? '+' : ''}
                  {(analysis.emotion_vector.valence * 100).toFixed(0)}%
                </div>
              </div>

              {/* Arousal */}
              <div>
                <div className="text-xs text-gray-500 uppercase">Arousal</div>
                <div className={`text-lg font-medium ${
                  analysis.emotion_vector.arousal > 0.3 ? 'text-[#c8943a]' : 'text-blue-600'
                }`}>
                  {analysis.emotion_vector.arousal > 0 ? 'High' : 'Low'}
                </div>
              </div>

              {/* Intensity */}
              <div>
                <div className="text-xs text-gray-500 uppercase">Intensity</div>
                <div className="text-lg font-medium text-gray-900">
                  {getIntensityLabel(analysis.emotion_vector.intensity)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Cognitive Distortions */}
        {analysis.distortions_detected.length > 0 && (
          <div className="bg-[#f5f0e8] rounded-lg p-4">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('distortions')}
            >
              <div className="flex items-center gap-2">
                <span className="text-[#c8943a]">⚠️</span>
                <span className="font-medium text-amber-800">
                  Thinking Patterns Detected
                </span>
                <span className={`text-sm ${getSeverityColor(analysis.distortion_severity)}`}>
                  ({(analysis.distortion_severity * 100).toFixed(0)}% severity)
                </span>
              </div>
              <span className="text-[#c8943a]">
                {expandedSection === 'distortions' ? '−' : '+'}
              </span>
            </div>

            {expandedSection === 'distortions' && (
              <div className="mt-4 space-y-3">
                {analysis.distortions_detected.map((distortion, _index) => {
                  const guidance = distortionGuidance.find(
                    g => g.psychological_concept.toLowerCase().includes(
                      distortion.replace(/_/g, ' ')
                    )
                  )

                  return (
                    <div
                      key={distortion}
                      className="bg-white rounded-lg p-3 border border-[#f0c96d]"
                    >
                      <div className="font-medium text-gray-900 capitalize">
                        {distortion.replace(/_/g, ' ')}
                      </div>
                      {guidance && (
                        <>
                          <p className="text-sm text-gray-600 mt-1">
                            {guidance.integration_insight}
                          </p>
                          <p className="text-sm text-amber-700 mt-2 italic">
                            Practice: {guidance.practical_technique}
                          </p>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Row 3: Guna Balance */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Guna Balance</div>
          <div className="space-y-2">
            {/* Sattva */}
            <div className="flex items-center gap-3">
              <div className="w-20 text-sm text-gray-600">Sattva</div>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${analysis.guna_balance.sattva * 100}%` }}
                />
              </div>
              <div className="w-12 text-sm text-gray-600 text-right">
                {(analysis.guna_balance.sattva * 100).toFixed(0)}%
              </div>
            </div>

            {/* Rajas */}
            <div className="flex items-center gap-3">
              <div className="w-20 text-sm text-gray-600">Rajas</div>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#d4a44c] rounded-full transition-all"
                  style={{ width: `${analysis.guna_balance.rajas * 100}%` }}
                />
              </div>
              <div className="w-12 text-sm text-gray-600 text-right">
                {(analysis.guna_balance.rajas * 100).toFixed(0)}%
              </div>
            </div>

            {/* Tamas */}
            <div className="flex items-center gap-3">
              <div className="w-20 text-sm text-gray-600">Tamas</div>
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-500 rounded-full transition-all"
                  style={{ width: `${analysis.guna_balance.tamas * 100}%` }}
                />
              </div>
              <div className="w-12 text-sm text-gray-600 text-right">
                {(analysis.guna_balance.tamas * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* Row 4: Yoga Path Recommendation */}
        {yogaGuidance && (
          <div className="bg-indigo-50 rounded-lg p-4">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('yoga')}
            >
              <div className="flex items-center gap-2">
                <span className="text-indigo-600">🧘</span>
                <span className="font-medium text-indigo-800">
                  Recommended Path: {yogaGuidance.primary_path.charAt(0).toUpperCase() + yogaGuidance.primary_path.slice(1)} Yoga
                </span>
              </div>
              <span className="text-indigo-600">
                {expandedSection === 'yoga' ? '−' : '+'}
              </span>
            </div>

            {expandedSection === 'yoga' && (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-gray-700">{yogaGuidance.rationale}</p>

                <div className="bg-white rounded-lg p-3 border border-indigo-200">
                  <div className="text-sm font-medium text-gray-900">
                    Immediate Practice
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {yogaGuidance.immediate_practice}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-3 border border-indigo-200">
                  <div className="text-sm font-medium text-gray-900">Daily Practice</div>
                  <p className="text-sm text-gray-600 mt-1">
                    {yogaGuidance.daily_practice}
                  </p>
                </div>

                <div className="text-center">
                  <div className="inline-block bg-indigo-100 px-4 py-2 rounded-full">
                    <span className="text-sm text-indigo-800 italic">
                      &quot;{yogaGuidance.mantra}&quot;
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Row 5: Daily Intention */}
        {dailyIntention && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Today&apos;s Intention
            </div>
            <p className="text-lg text-gray-800 italic">
              &quot;{dailyIntention}&quot;
            </p>
          </div>
        )}

        {/* Row 6: Confidence Indicator */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            Analysis confidence: {(analysis.analysis_confidence * 100).toFixed(0)}%
          </span>
          <span>
            Temporal focus: {analysis.temporal_orientation}
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Compact version for embedding in other views
 */
export function AdvancedInsightsCompact({
  analysis,
}: {
  analysis: MoodAnalysis
}) {
  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
      {/* Mini circumplex */}
      <EmotionCircumplex
        vector={analysis.emotion_vector}
        size={60}
        showLabels={false}
      />

      {/* Key metrics */}
      <div className="flex-1">
        <div className="font-medium text-gray-900 capitalize">
          {analysis.primary_emotion.replace(/_/g, ' ')}
        </div>
        <div className="text-sm text-gray-500">
          {analysis.recommended_yoga_path.charAt(0).toUpperCase() +
            analysis.recommended_yoga_path.slice(1)}{' '}
          Yoga recommended
        </div>
      </div>

      {/* Distortion alert */}
      {analysis.distortions_detected.length > 0 && (
        <div className="text-[#c8943a] text-sm">
          ⚠️ {analysis.distortions_detected.length} pattern{analysis.distortions_detected.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

export default AdvancedInsightsPanel
