/**
 * Emotion Theme Settings Component
 *
 * UI for configuring emotion-driven theme preferences.
 * Allows users to enable/disable themes, set manual overrides, and adjust accessibility options.
 *
 * Quantum Enhancement #4: Emotion-Driven UI Themes
 */

'use client'

import { useState } from 'react'
import { useEmotionThemeContext } from './EmotionThemeProvider'
import { Emotion, getEmotionLabel, getEmotionDescription } from '@/lib/emotionClassifier'
import { Settings, Eye, EyeOff, Clock, Palette, Check } from 'lucide-react'

interface EmotionThemeSettingsProps {
  compact?: boolean
  onClose?: () => void
}

const EMOTION_OPTIONS: Array<{ value: Emotion; icon: string }> = [
  { value: 'calm', icon: '🧘' },
  { value: 'energized', icon: '⚡' },
  { value: 'melancholic', icon: '🌙' },
  { value: 'anxious', icon: '🌊' },
  { value: 'balanced', icon: '⚖️' }
]

const TRANSITION_SPEEDS = [
  { value: 500, label: 'Fast' },
  { value: 1500, label: 'Normal' },
  { value: 3000, label: 'Slow' }
]

/**
 * Settings panel for emotion theme system
 *
 * Provides controls for:
 * - Enable/disable emotion themes
 * - Manual emotion override
 * - Transition speed
 * - Accessibility options
 */
export function EmotionThemeSettings({
  compact = false,
  onClose
}: EmotionThemeSettingsProps) {
  const {
    currentEmotion,
    setManualEmotion,
    settings,
    updateSettings,
    isEnabled
  } = useEmotionThemeContext()

  const [expanded, setExpanded] = useState(!compact)

  const handleToggleEnabled = () => {
    updateSettings({ enabled: !settings.enabled })
  }

  const handleSetManualEmotion = (emotion: Emotion | null) => {
    setManualEmotion(emotion)
  }

  const handleTransitionDurationChange = (duration: number) => {
    updateSettings({ transitionDuration: duration })
  }

  const handleToggleHighContrast = () => {
    updateSettings({ highContrast: !settings.highContrast })
  }

  const handleToggleReducedMotion = () => {
    updateSettings({ respectReducedMotion: !settings.respectReducedMotion })
  }

  const handleToggleIndicator = () => {
    updateSettings({ showIndicator: !settings.showIndicator })
  }

  if (compact && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 rounded-2xl border border-orange-500/25 bg-orange-500/10 px-4 py-2 text-sm text-orange-50 transition hover:bg-orange-500/20"
      >
        <Palette className="h-4 w-4" />
        <span>Emotion Theme Settings</span>
      </button>
    )
  }

  return (
    <div className={`space-y-6 ${compact ? 'p-4' : 'p-6'} rounded-3xl border border-orange-500/15 bg-black/50 shadow-[0_20px_80px_rgba(255,115,39,0.12)]`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-orange-50">
            Emotion Theme Settings
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-full p-1 text-orange-100/60 transition hover:bg-orange-500/20 hover:text-orange-50"
          >
            ✕
          </button>
        )}
      </div>

      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-orange-50">
            Enable Emotion Themes
          </h4>
          <p className="text-xs text-orange-100/70">
            Dynamically adapt UI based on your mood
          </p>
        </div>
        <button
          onClick={handleToggleEnabled}
          className={`relative h-8 w-14 rounded-full transition ${
            isEnabled
              ? 'bg-gradient-to-r from-orange-500 to-amber-500'
              : 'bg-slate-600'
          }`}
        >
          <div
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-lg transition-transform ${
              isEnabled ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {isEnabled && (
        <>
          {/* Current Emotion */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-orange-50">
              Current Emotion
            </h4>
            <div className="rounded-2xl border border-orange-500/25 bg-orange-500/5 p-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">
                  {EMOTION_OPTIONS.find(e => e.value === currentEmotion)?.icon}
                </div>
                <div>
                  <p className="font-semibold text-orange-50">
                    {getEmotionLabel(currentEmotion)}
                  </p>
                  <p className="text-xs text-orange-100/70">
                    {getEmotionDescription(currentEmotion)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Override */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-orange-50">
                Manual Override
              </h4>
              {settings.manualOverride && (
                <button
                  onClick={() => handleSetManualEmotion(null)}
                  className="text-xs text-orange-400 hover:text-orange-300"
                >
                  Reset to Auto
                </button>
              )}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {EMOTION_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleSetManualEmotion(option.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition ${
                    settings.manualOverride === option.value
                      ? 'border-orange-400 bg-orange-500/30 text-orange-50'
                      : 'border-orange-500/25 bg-orange-500/5 text-orange-100/80 hover:bg-orange-500/10'
                  }`}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <span className="text-xs capitalize">{option.value}</span>
                  {settings.manualOverride === option.value && (
                    <Check className="h-3 w-3 text-orange-400" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-orange-100/60">
              {settings.manualOverride
                ? 'Theme locked to selected emotion'
                : 'Theme adapts automatically based on your moods'}
            </p>
          </div>

          {/* Transition Speed */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-400" />
              <h4 className="text-sm font-medium text-orange-50">
                Transition Speed
              </h4>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {TRANSITION_SPEEDS.map(speed => (
                <button
                  key={speed.value}
                  onClick={() => handleTransitionDurationChange(speed.value)}
                  className={`rounded-xl border px-3 py-2 text-sm transition ${
                    settings.transitionDuration === speed.value
                      ? 'border-orange-400 bg-orange-500/30 text-orange-50'
                      : 'border-orange-500/25 bg-orange-500/5 text-orange-100/80 hover:bg-orange-500/10'
                  }`}
                >
                  {speed.label}
                </button>
              ))}
            </div>
          </div>

          {/* Accessibility Options */}
          <div className="space-y-3 rounded-2xl border border-indigo-400/30 bg-indigo-950/20 p-4">
            <h4 className="flex items-center gap-2 text-sm font-medium text-orange-50">
              <Eye className="h-4 w-4 text-indigo-400" />
              Accessibility
            </h4>

            {/* High Contrast */}
            <label className="flex cursor-pointer items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm text-orange-50">High Contrast Mode</p>
                <p className="text-xs text-orange-100/60">
                  Increase contrast for better readability
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={handleToggleHighContrast}
                className="h-4 w-4 rounded border-orange-500/30 bg-slate-900 text-orange-500 focus:ring-2 focus:ring-orange-400/50"
              />
            </label>

            {/* Reduced Motion */}
            <label className="flex cursor-pointer items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm text-orange-50">Respect Reduced Motion</p>
                <p className="text-xs text-orange-100/60">
                  Honor system preference for reduced animations
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.respectReducedMotion}
                onChange={handleToggleReducedMotion}
                className="h-4 w-4 rounded border-orange-500/30 bg-slate-900 text-orange-500 focus:ring-2 focus:ring-orange-400/50"
              />
            </label>

            {/* Show Indicator */}
            <label className="flex cursor-pointer items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm text-orange-50">Show Emotion Indicator</p>
                <p className="text-xs text-orange-100/60">
                  Display current emotion badge in UI
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.showIndicator}
                onChange={handleToggleIndicator}
                className="h-4 w-4 rounded border-orange-500/30 bg-slate-900 text-orange-500 focus:ring-2 focus:ring-orange-400/50"
              />
            </label>
          </div>

          {/* Info Box */}
          <div className="rounded-2xl border border-blue-400/30 bg-blue-950/20 p-4">
            <p className="text-xs leading-relaxed text-blue-100/80">
              💡 <strong>How it works:</strong> When you log your mood, Sakha
              analyzes your mood score and tags to determine your emotional state,
              then adapts the entire interface with colors, animations, and ambiance
              designed to support that emotion.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Compact emotion theme toggle button
 *
 * Simple on/off toggle for quick access
 */
export function EmotionThemeToggle() {
  const { isEnabled, updateSettings } = useEmotionThemeContext()

  return (
    <button
      onClick={() => updateSettings({ enabled: !isEnabled })}
      className="flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-3 py-1.5 text-sm text-orange-50 transition hover:bg-orange-500/20"
      title={isEnabled ? 'Disable emotion themes' : 'Enable emotion themes'}
    >
      {isEnabled ? (
        <>
          <Eye className="h-3.5 w-3.5" />
          <span>Emotion Themes On</span>
        </>
      ) : (
        <>
          <EyeOff className="h-3.5 w-3.5" />
          <span>Emotion Themes Off</span>
        </>
      )}
    </button>
  )
}
