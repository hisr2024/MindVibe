/**
 * Voice-to-Text Context Provider
 *
 * Provides unified VTT state management across all MindVibe modules:
 * KIAAN Chat, Ardha, Viyog, Emotional Compass, Karma Reset, Emotional Reset.
 *
 * Manages:
 * - VTT enabled/disabled preference (persisted to localStorage)
 * - Active language for speech recognition
 * - Consent state for microphone access
 * - Global VTT feature flags
 */

'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'

export interface VoiceToTextSettings {
  /** Whether VTT is enabled globally */
  enabled: boolean
  /** Whether user has acknowledged the privacy/consent prompt */
  consentGiven: boolean
  /** Preferred language for speech recognition */
  language: string
  /** Whether to show live interim transcription */
  showLiveTranscription: boolean
  /** Whether to auto-send on final transcript (vs. fill input) */
  autoSend: boolean
  /** Whether to add punctuation post-processing for languages that need it */
  punctuationAssist: boolean
}

interface VoiceToTextContextValue {
  settings: VoiceToTextSettings
  /** Toggle VTT on/off globally */
  setEnabled: (enabled: boolean) => void
  /** Record that user has given consent */
  giveConsent: () => void
  /** Revoke consent and disable VTT */
  revokeConsent: () => void
  /** Update the recognition language */
  setLanguage: (language: string) => void
  /** Toggle live transcription display */
  setShowLiveTranscription: (show: boolean) => void
  /** Toggle auto-send behavior */
  setAutoSend: (auto: boolean) => void
  /** Toggle punctuation assist */
  setPunctuationAssist: (enabled: boolean) => void
  /** Update multiple settings at once */
  updateSettings: (partial: Partial<VoiceToTextSettings>) => void
}

const STORAGE_KEY = 'mindvibe_vtt_settings'

const DEFAULT_SETTINGS: VoiceToTextSettings = {
  enabled: true,
  consentGiven: false,
  language: 'en',
  showLiveTranscription: true,
  autoSend: false,
  punctuationAssist: true,
}

const VoiceToTextContext = createContext<VoiceToTextContextValue | null>(null)

function loadSettings(): VoiceToTextSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch {
    // Fall through to defaults
  }
  return DEFAULT_SETTINGS
}

function saveSettings(settings: VoiceToTextSettings): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Silent fail — localStorage may be full or disabled
  }
}

export function VoiceToTextProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<VoiceToTextSettings>(loadSettings)

  // Persist settings changes
  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const setEnabled = useCallback((enabled: boolean) => {
    setSettings((prev) => ({ ...prev, enabled }))
  }, [])

  const giveConsent = useCallback(() => {
    setSettings((prev) => ({ ...prev, consentGiven: true }))
  }, [])

  const revokeConsent = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      consentGiven: false,
      enabled: false,
    }))
  }, [])

  const setLanguage = useCallback((language: string) => {
    setSettings((prev) => ({ ...prev, language }))
  }, [])

  const setShowLiveTranscription = useCallback((showLiveTranscription: boolean) => {
    setSettings((prev) => ({ ...prev, showLiveTranscription }))
  }, [])

  const setAutoSend = useCallback((autoSend: boolean) => {
    setSettings((prev) => ({ ...prev, autoSend }))
  }, [])

  const setPunctuationAssist = useCallback((punctuationAssist: boolean) => {
    setSettings((prev) => ({ ...prev, punctuationAssist }))
  }, [])

  const updateSettings = useCallback((partial: Partial<VoiceToTextSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }))
  }, [])

  return (
    <VoiceToTextContext.Provider
      value={{
        settings,
        setEnabled,
        giveConsent,
        revokeConsent,
        setLanguage,
        setShowLiveTranscription,
        setAutoSend,
        setPunctuationAssist,
        updateSettings,
      }}
    >
      {children}
    </VoiceToTextContext.Provider>
  )
}

/**
 * Access the VTT context. Throws if used outside VoiceToTextProvider.
 */
export function useVoiceToTextContext(): VoiceToTextContextValue {
  const ctx = useContext(VoiceToTextContext)
  if (!ctx) {
    throw new Error(
      'useVoiceToTextContext must be used within a VoiceToTextProvider'
    )
  }
  return ctx
}
