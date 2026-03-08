/**
 * Voice-to-Text Settings Panel
 *
 * User-facing toggle and preferences for VTT features.
 * Integrates with VoiceToTextContext for persisted state.
 *
 * Features:
 * - Master enable/disable toggle
 * - Live transcription display toggle
 * - Auto-send toggle
 * - Punctuation assist toggle
 * - Consent management (grant/revoke)
 * - Privacy information
 */

'use client'

import { useVoiceToTextContext } from '@/contexts/VoiceToTextContext'
import { isSpeechRecognitionSupported } from '@/utils/speech/languageMapping'

export interface VoiceToTextSettingsProps {
  /** Additional CSS classes */
  className?: string
  /** Compact mode for embedding in sidebars */
  compact?: boolean
}

export function VoiceToTextSettings({
  className = '',
  compact = false,
}: VoiceToTextSettingsProps) {
  const {
    settings,
    setEnabled,
    giveConsent,
    revokeConsent,
    setShowLiveTranscription,
    setAutoSend,
    setPunctuationAssist,
  } = useVoiceToTextContext()

  const isSupported = isSpeechRecognitionSupported()

  return (
    <div className={`space-y-4 ${className}`}>
      {!compact && (
        <div>
          <h3 className="text-base font-semibold text-[#f5f0e8]">
            Voice-to-Text
          </h3>
          <p className="text-xs text-[#f5f0e8]/70 mt-0.5">
            Speak your thoughts instead of typing
          </p>
        </div>
      )}

      {/* Browser support warning */}
      {!isSupported && (
        <div className="rounded-lg bg-amber-900/20 border border-amber-500/20 px-3 py-2 text-xs text-amber-200/70">
          Your browser does not support speech recognition. Please use Chrome, Edge, or Safari for voice features.
        </div>
      )}

      {/* Master Toggle */}
      <ToggleRow
        label="Enable Voice Input"
        description="Show microphone button in chat inputs"
        checked={settings.enabled}
        onChange={setEnabled}
        disabled={!isSupported}
      />

      {settings.enabled && isSupported && (
        <>
          {/* Live Transcription */}
          <ToggleRow
            label="Show Live Transcription"
            description="Display words as you speak"
            checked={settings.showLiveTranscription}
            onChange={setShowLiveTranscription}
          />

          {/* Auto Send */}
          <ToggleRow
            label="Auto-Send on Finish"
            description="Send message automatically when you stop speaking"
            checked={settings.autoSend}
            onChange={setAutoSend}
          />

          {/* Punctuation Assist */}
          <ToggleRow
            label="Punctuation Assist"
            description="Add basic punctuation to transcribed text"
            checked={settings.punctuationAssist}
            onChange={setPunctuationAssist}
          />

          {/* Consent Section */}
          <div className="rounded-lg border border-[#d4a44c]/10 bg-[#0a0a12]/50 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#d4a44c]/60 mt-0.5 flex-shrink-0"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <div className="flex-1">
                <p className="text-xs text-[#f5f0e8]/75 leading-relaxed">
                  Voice is processed locally by your browser. Audio is never sent to or stored on our servers — only the final text transcript is used.
                </p>
              </div>
            </div>

            {settings.consentGiven ? (
              <button
                type="button"
                onClick={revokeConsent}
                className="text-[11px] text-red-400/70 hover:text-red-400 transition-colors underline underline-offset-2"
              >
                Revoke voice consent & disable
              </button>
            ) : (
              <button
                type="button"
                onClick={giveConsent}
                className="text-[11px] text-[#d4a44c] hover:text-[#e8b54a] transition-colors underline underline-offset-2"
              >
                I understand — enable voice features
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/** Reusable toggle row for settings */
function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <label
      className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/[0.02]'
      }`}
    >
      <div className="flex-1 min-w-0">
        <span className="text-sm text-[#f5f0e8]/90 block">{label}</span>
        <span className="text-[11px] text-[#f5f0e8]/70 block mt-0.5">{description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a44c]/50 ${
          checked
            ? 'bg-[#d4a44c] border-[#d4a44c]'
            : 'bg-slate-700 border-slate-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          } mt-[1px]`}
        />
      </button>
    </label>
  )
}
