/**
 * Wake Word Settings Panel
 *
 * Provides a user-facing settings interface for the global wake word system.
 * Includes:
 * - Master on/off toggle switch
 * - Sensitivity level selector
 * - Status indicator (listening, error, unsupported)
 *
 * Can be embedded in any settings page or shown as a standalone panel.
 */

'use client'

import { motion } from 'framer-motion'
import { ToggleSwitch } from '@/components/settings/ToggleSwitch'
import { useGlobalWakeWord } from '@/contexts/WakeWordContext'
import type { WakeWordSensitivity } from '@/utils/speech/wakeWord'

const SENSITIVITY_OPTIONS: {
  value: WakeWordSensitivity
  label: string
  description: string
}[] = [
  {
    value: 'ultra',
    label: 'Ultra',
    description: 'Maximum sensitivity - detects even whispers',
  },
  {
    value: 'high',
    label: 'High',
    description: 'Recommended - balanced accuracy',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Requires clearer speech',
  },
  {
    value: 'low',
    label: 'Low',
    description: 'Most strict - fewer false activations',
  },
]

interface WakeWordSettingsProps {
  className?: string
}

export function WakeWordSettings({ className = '' }: WakeWordSettingsProps) {
  const {
    enabled,
    isSupported,
    isListening,
    sensitivity,
    error,
    isPaused,
    setEnabled,
    setSensitivity,
  } = useGlobalWakeWord()

  if (!isSupported) {
    return (
      <div className={`rounded-2xl border border-slate-700/50 bg-slate-900/50 p-5 ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
            <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-400">Wake Word Detection</h3>
            <p className="text-xs text-slate-500">Not supported in this browser</p>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Voice wake word requires Chrome, Edge, or Safari on a secure connection (HTTPS).
        </p>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border border-[#d4a44c]/15 bg-slate-900/60 p-5 space-y-5 ${className}`}>
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
            enabled ? 'bg-[#d4a44c]/20' : 'bg-slate-800'
          }`}>
            <svg
              className={`h-5 w-5 transition-colors ${enabled ? 'text-[#d4a44c]' : 'text-slate-500'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#f5f0e8]">
              &quot;Hey KIAAN&quot; Wake Word
            </h3>
            <p className="text-xs text-[#e8b54a]/50">
              {enabled
                ? isListening
                  ? isPaused ? 'Paused' : 'Listening...'
                  : 'Enabled'
                : 'Activate KIAAN with your voice'}
            </p>
          </div>
        </div>

        <ToggleSwitch
          enabled={enabled}
          onToggle={setEnabled}
          label="Enable wake word detection"
        />
      </div>

      {/* Status indicator */}
      {enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-2 rounded-xl bg-slate-800/50 px-3 py-2"
        >
          <motion.div
            className={`h-2 w-2 rounded-full ${
              error
                ? 'bg-red-400'
                : isListening && !isPaused
                ? 'bg-emerald-400'
                : 'bg-[#d4a44c]/50'
            }`}
            animate={
              isListening && !isPaused && !error
                ? { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }
                : {}
            }
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-xs text-slate-400">
            {error
              ? error
              : isListening && !isPaused
              ? 'Listening for "Hey KIAAN", "Namaste KIAAN", "Hi KIAAN"...'
              : isPaused
              ? 'Paused during active conversation'
              : 'Starting...'}
          </span>
        </motion.div>
      )}

      {/* Sensitivity selector */}
      {enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3"
        >
          <label className="text-xs font-medium text-[#e8b54a]/60 uppercase tracking-wider">
            Sensitivity
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SENSITIVITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSensitivity(option.value)}
                className={`rounded-xl border px-3 py-2.5 text-left transition-all ${
                  sensitivity === option.value
                    ? 'border-[#d4a44c]/40 bg-[#d4a44c]/10 ring-1 ring-[#d4a44c]/20'
                    : 'border-slate-700/50 bg-slate-800/30 hover:border-[#d4a44c]/20 hover:bg-slate-800/50'
                }`}
              >
                <p className={`text-xs font-semibold ${
                  sensitivity === option.value ? 'text-[#e8b54a]' : 'text-slate-300'
                }`}>
                  {option.label}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Wake words info */}
      {enabled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl bg-[#d4a44c]/5 border border-[#d4a44c]/10 px-4 py-3"
        >
          <p className="text-[11px] text-[#e8b54a]/50 leading-relaxed">
            <span className="font-semibold text-[#e8b54a]/70">Supported phrases: </span>
            &quot;Hey KIAAN&quot;, &quot;Hi KIAAN&quot;, &quot;Hello KIAAN&quot;,
            &quot;Namaste KIAAN&quot;, &quot;OK KIAAN&quot;, &quot;Hey MindVibe&quot;
          </p>
        </motion.div>
      )}
    </div>
  )
}

export default WakeWordSettings
