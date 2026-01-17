'use client'

/**
 * Voice Settings Component
 *
 * User interface for managing voice preferences including language selection,
 * voice persona, playback speed, and offline download options.
 *
 * Quantum Coherence: User preferences create personalized auditory experience,
 * resonating with their unique learning style and accessibility needs.
 */

import { useState, useEffect } from 'react'
import { Volume2, Download, Settings as SettingsIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import voiceService, { VoiceSettings, SupportedLanguage } from '@/services/voiceService'

interface VoiceSettingsProps {
  userId: string
  onSettingsChange?: (settings: VoiceSettings) => void
  showTitle?: boolean
  compact?: boolean
}

export function VoiceSettings({
  userId,
  onSettingsChange,
  showTitle = true,
  compact = false
}: VoiceSettingsProps) {
  const [settings, setSettings] = useState<VoiceSettings>({
    enabled: true,
    autoPlay: false,
    speed: 0.9,
    voiceGender: 'female',
    offlineDownload: false,
    downloadQuality: 'medium'
  })

  const [languages, setLanguages] = useState<SupportedLanguage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  // Load settings and languages on mount
  useEffect(() => {
    loadSettings()
    loadLanguages()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    setError(null)

    try {
      const userSettings = await voiceService.getSettings(userId)
      setSettings(userSettings)
    } catch (err) {
      console.error('Failed to load voice settings:', err)
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const loadLanguages = async () => {
    try {
      const supportedLangs = await voiceService.getSupportedLanguages()
      setLanguages(supportedLangs)
    } catch (err) {
      console.error('Failed to load languages:', err)
    }
  }

  const handleSettingChange = <K extends keyof VoiceSettings>(
    key: K,
    value: VoiceSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    setSaveStatus('idle')
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus('idle')
    setError(null)

    try {
      await voiceService.updateSettings(settings, userId)
      setSaveStatus('success')

      if (onSettingsChange) {
        onSettingsChange(settings)
      }

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      console.error('Failed to save settings:', err)
      setError('Failed to save settings')
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${compact ? 'p-6' : 'p-8'}`}>
        <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${compact ? 'p-4' : 'p-6 md:p-8'} rounded-3xl border border-purple-500/15 bg-black/50 shadow-[0_20px_80px_rgba(168,85,247,0.12)]`}>
      {/* Header */}
      {showTitle && (
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-purple-50 flex items-center gap-2">
            <Volume2 className="h-6 w-6" />
            Voice Settings
          </h2>
          <p className="text-sm text-purple-100/80">
            Customize your audio experience across all {languages.length} supported languages
          </p>
        </div>
      )}

      {/* Enable Voice */}
      <div className="space-y-2">
        <label className="flex items-center justify-between">
          <span className="text-sm font-medium text-purple-50">Enable Voice Features</span>
          <button
            onClick={() => handleSettingChange('enabled', !settings.enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              settings.enabled ? 'bg-purple-500' : 'bg-purple-500/20'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                settings.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
        <p className="text-xs text-purple-100/60">
          Enable text-to-speech for verses, messages, and meditations
        </p>
      </div>

      {settings.enabled && (
        <>
          {/* Auto Play */}
          <div className="space-y-2">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-purple-50">Auto-Play Audio</span>
              <button
                onClick={() => handleSettingChange('autoPlay', !settings.autoPlay)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  settings.autoPlay ? 'bg-purple-500' : 'bg-purple-500/20'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.autoPlay ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
            <p className="text-xs text-purple-100/60">
              Automatically play audio when content loads
            </p>
          </div>

          {/* Playback Speed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-purple-50">Playback Speed</label>
              <span className="text-sm text-purple-300">{settings.speed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.speed}
              onChange={(e) => handleSettingChange('speed', parseFloat(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-purple-100/60">
              <span>0.5x (Slower)</span>
              <span>1.0x (Normal)</span>
              <span>2.0x (Faster)</span>
            </div>
          </div>

          {/* Voice Gender Preference */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-purple-50">Preferred Voice Gender</label>
            <div className="grid grid-cols-3 gap-2">
              {(['female', 'male', 'neutral'] as const).map((gender) => (
                <button
                  key={gender}
                  onClick={() => handleSettingChange('voiceGender', gender)}
                  className={`rounded-2xl border px-4 py-2 text-sm font-medium capitalize transition ${
                    settings.voiceGender === gender
                      ? 'border-purple-400 bg-purple-500/30 text-purple-50 ring-2 ring-purple-400/50'
                      : 'border-purple-500/25 bg-purple-500/10 text-purple-100/80 hover:bg-purple-500/20'
                  }`}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>

          {/* Offline Download */}
          <div className="space-y-2">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-purple-50 flex items-center gap-2">
                <Download className="h-4 w-4" />
                Enable Offline Downloads
              </span>
              <button
                onClick={() => handleSettingChange('offlineDownload', !settings.offlineDownload)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  settings.offlineDownload ? 'bg-purple-500' : 'bg-purple-500/20'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.offlineDownload ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
            <p className="text-xs text-purple-100/60">
              Download audio for offline playback (uses device storage)
            </p>
          </div>

          {/* Download Quality (only if offline enabled) */}
          {settings.offlineDownload && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-purple-50">Download Quality</label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((quality) => (
                  <button
                    key={quality}
                    onClick={() => handleSettingChange('downloadQuality', quality)}
                    className={`rounded-2xl border px-4 py-2 text-sm font-medium capitalize transition ${
                      settings.downloadQuality === quality
                        ? 'border-purple-400 bg-purple-500/30 text-purple-50 ring-2 ring-purple-400/50'
                        : 'border-purple-500/25 bg-purple-500/10 text-purple-100/80 hover:bg-purple-500/20'
                    }`}
                  >
                    {quality}
                  </button>
                ))}
              </div>
              <div className="rounded-2xl border border-purple-500/20 bg-purple-950/20 p-3 text-xs text-purple-100/70">
                <p>
                  <strong>Low:</strong> ~1MB/10min (good for limited data)
                </p>
                <p>
                  <strong>Medium:</strong> ~2MB/10min (balanced quality & size)
                </p>
                <p>
                  <strong>High:</strong> ~4MB/10min (best quality)
                </p>
              </div>
            </div>
          )}

          {/* Supported Languages Info */}
          <div className="rounded-2xl border border-purple-500/20 bg-purple-950/20 p-4">
            <h3 className="text-sm font-medium text-purple-50 mb-2">Supported Languages ({languages.length})</h3>
            <div className="flex flex-wrap gap-2">
              {languages.map((lang) => (
                <span
                  key={lang.code}
                  className="rounded-full border border-purple-500/25 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-100/80"
                >
                  {lang.name}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-3 font-semibold text-white transition hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving...</span>
          </>
        ) : (
          <>
            <SettingsIcon className="h-4 w-4" />
            <span>Save Settings</span>
          </>
        )}
      </button>

      {/* Status Messages */}
      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 rounded-2xl border border-green-400/30 bg-green-950/30 p-3 text-sm text-green-50">
          <CheckCircle2 className="h-4 w-4" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {saveStatus === 'error' && error && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-50">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
