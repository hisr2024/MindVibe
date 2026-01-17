/**
 * Voice Settings Panel Component
 * User preferences for voice features
 */

'use client'

import { useState, useEffect } from 'react'

export interface VoiceSettings {
  enabled: boolean
  autoPlay: boolean
  wakeWordEnabled: boolean
  playbackRate: number
}

export interface VoiceSettingsPanelProps {
  onSettingsChange?: (settings: VoiceSettings) => void
  className?: string
}

const STORAGE_KEY = 'mindvibe_voice_settings'

const DEFAULT_SETTINGS: VoiceSettings = {
  enabled: true,
  autoPlay: false,
  wakeWordEnabled: false,
  playbackRate: 1.0,
}

export function VoiceSettingsPanel({
  onSettingsChange,
  className = '',
}: VoiceSettingsPanelProps) {
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULT_SETTINGS)
  const [isOpen, setIsOpen] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as VoiceSettings
          setSettings(parsed)
          onSettingsChange?.(parsed)
        } catch (error) {
          console.error('Failed to parse voice settings:', error)
        }
      }
    }
  }, [onSettingsChange])

  // Save settings to localStorage when changed
  const updateSettings = (updates: Partial<VoiceSettings>) => {
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
    }
    
    onSettingsChange?.(newSettings)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Settings toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-orange-500/25 bg-orange-500/10 px-3 py-2 text-xs font-medium text-orange-200 transition-all hover:border-orange-500/40 hover:bg-orange-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50"
        aria-label="Voice settings"
        title="Configure voice features"
      >
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
          className="text-orange-400"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span>Voice Settings</span>
      </button>

      {/* Settings panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-2xl bg-slate-900/95 p-4 shadow-2xl border border-orange-500/30 backdrop-blur-sm animate-fadeIn">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-orange-500/20">
                <h3 className="text-lg font-semibold text-orange-50">Voice Settings</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-orange-200/60 hover:text-orange-200 transition-colors"
                  aria-label="Close settings"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Enable voice features */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-orange-50">Enable Voice Features</div>
                  <div className="text-xs text-orange-200/60 mt-0.5">
                    Show microphone and speaker buttons
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => updateSettings({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-400/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              {/* Auto-play responses */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-orange-50">Auto-play Responses</div>
                  <div className="text-xs text-orange-200/60 mt-0.5">
                    Automatically read KIAAN responses aloud
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoPlay}
                    onChange={(e) => updateSettings({ autoPlay: e.target.checked })}
                    disabled={!settings.enabled}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-400/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                </label>
              </div>

              {/* Wake word */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-orange-50">Wake Word (&quot;Hey KIAAN&quot;)</div>
                  <div className="text-xs text-orange-200/60 mt-0.5">
                    Activate voice input with wake word
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.wakeWordEnabled}
                    onChange={(e) => updateSettings({ wakeWordEnabled: e.target.checked })}
                    disabled={!settings.enabled}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-400/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                </label>
              </div>

              {/* Playback speed */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-orange-50">Playback Speed</div>
                  <div className="text-sm font-mono text-orange-300">{settings.playbackRate}x</div>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.25"
                  value={settings.playbackRate}
                  onChange={(e) => updateSettings({ playbackRate: parseFloat(e.target.value) })}
                  disabled={!settings.enabled}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between text-xs text-orange-200/50 mt-1">
                  <span>0.5x</span>
                  <span>1.0x</span>
                  <span>2.0x</span>
                </div>
              </div>

              {/* Privacy note */}
              <div className="pt-3 border-t border-orange-500/20">
                <div className="flex items-start gap-2 text-xs text-orange-200/60">
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
                    className="text-orange-400/60 flex-shrink-0 mt-0.5"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <div>
                    <strong className="text-orange-300">Privacy:</strong> Audio is processed locally in your browser.
                    Only text is sent to KIAAN (same as typing).
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
