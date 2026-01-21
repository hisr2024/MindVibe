/**
 * Emotion Theme Hook
 *
 * Manages dynamic theme changes based on user's emotional state.
 * Tracks mood changes and applies appropriate themes with smooth transitions.
 *
 * Quantum Enhancement #4: Emotion-Driven UI Themes
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Emotion, classifyEmotion, MoodData } from '@/lib/emotionClassifier'
import {
  EmotionTheme,
  getEmotionTheme,
  applyThemeTransition,
  getHighContrastTheme
} from '@/lib/emotionThemes'

export interface EmotionThemeSettings {
  enabled: boolean                    // Global enable/disable
  manualOverride: Emotion | null      // Force specific emotion
  transitionDuration: number          // Theme transition time (ms)
  highContrast: boolean               // Accessibility mode
  respectReducedMotion: boolean       // Respect prefers-reduced-motion
  showIndicator: boolean              // Show current emotion indicator
}

export interface UseEmotionThemeReturn {
  currentEmotion: Emotion
  currentTheme: EmotionTheme
  setManualEmotion: (emotion: Emotion | null) => void
  updateFromMood: (mood: MoodData) => void
  settings: EmotionThemeSettings
  updateSettings: (updates: Partial<EmotionThemeSettings>) => void
  isEnabled: boolean
}

const DEFAULT_SETTINGS: EmotionThemeSettings = {
  enabled: true,
  manualOverride: null,
  transitionDuration: 1500,
  highContrast: false,
  respectReducedMotion: true,
  showIndicator: true
}

const SETTINGS_KEY = 'mindvibe_emotion_theme_settings'

/**
 * Hook for managing emotion-driven themes
 *
 * Features:
 * - Automatic theme switching based on mood
 * - Manual emotion override
 * - Smooth transitions
 * - Accessibility support
 * - Persistent settings
 *
 * @example
 * ```tsx
 * const { currentEmotion, updateFromMood, setManualEmotion } = useEmotionTheme()
 *
 * // Update theme when user logs mood
 * const handleMoodSaved = (mood: MoodData) => {
 *   updateFromMood(mood)
 * }
 *
 * // Manual override
 * <button onClick={() => setManualEmotion('calm')}>Force Calm Theme</button>
 * ```
 */
export function useEmotionTheme(): UseEmotionThemeReturn {
  // Load settings from localStorage
  const [settings, setSettings] = useState<EmotionThemeSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS

    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.error('Failed to load emotion theme settings:', error)
    }
    return DEFAULT_SETTINGS
  })

  // Current emotion state
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>('balanced')
  const [currentTheme, setCurrentTheme] = useState<EmotionTheme>(
    getEmotionTheme('balanced')
  )

  /**
   * Save settings to localStorage
   */
  const persistSettings = useCallback((newSettings: EmotionThemeSettings) => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings))
    } catch (error) {
      console.error('Failed to save emotion theme settings:', error)
    }
  }, [])

  /**
   * Update settings
   */
  const updateSettings = useCallback((updates: Partial<EmotionThemeSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates }
      persistSettings(newSettings)
      return newSettings
    })
  }, [persistSettings])

  /**
   * Apply theme to DOM
   */
  const applyTheme = useCallback((emotion: Emotion) => {
    let theme = getEmotionTheme(emotion)

    // Apply high-contrast if enabled
    if (settings.highContrast) {
      theme = getHighContrastTheme(theme)
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const shouldAnimate = !prefersReducedMotion || !settings.respectReducedMotion

    // Apply theme with or without transition
    if (shouldAnimate) {
      applyThemeTransition(theme, settings.transitionDuration)
    } else {
      applyThemeTransition(theme, 0)  // Instant
    }

    // Set data attribute for emotion-specific styling
    document.documentElement.setAttribute('data-emotion', emotion)

    setCurrentTheme(theme)
  }, [settings.highContrast, settings.respectReducedMotion, settings.transitionDuration])

  /**
   * Update emotion and apply theme
   */
  const setEmotionAndApply = useCallback((emotion: Emotion) => {
    if (!settings.enabled) return

    setCurrentEmotion(emotion)
    applyTheme(emotion)
  }, [settings.enabled, applyTheme])

  /**
   * Update theme from mood data
   */
  const updateFromMood = useCallback((mood: MoodData) => {
    if (!settings.enabled) return
    if (settings.manualOverride) return  // Don't auto-update if manually overridden

    const emotion = classifyEmotion(mood)
    setEmotionAndApply(emotion)
  }, [settings.enabled, settings.manualOverride, setEmotionAndApply])

  /**
   * Set manual emotion override
   */
  const setManualEmotion = useCallback((emotion: Emotion | null) => {
    updateSettings({ manualOverride: emotion })

    if (emotion) {
      setEmotionAndApply(emotion)
    }
  }, [updateSettings, setEmotionAndApply])

  /**
   * Initialize theme on mount
   */
  useEffect(() => {
    // Apply initial theme
    const initialEmotion = settings.manualOverride || 'balanced'
    setEmotionAndApply(initialEmotion)

    // Listen for system theme preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      // Re-apply current theme (in case system preferences changed)
      applyTheme(currentEmotion)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, []) // Only run on mount

  /**
   * Update theme when settings change
   */
  useEffect(() => {
    if (settings.enabled) {
      applyTheme(currentEmotion)
    }
  }, [settings.highContrast, settings.respectReducedMotion, currentEmotion, applyTheme])

  return {
    currentEmotion,
    currentTheme,
    setManualEmotion,
    updateFromMood,
    settings,
    updateSettings,
    isEnabled: settings.enabled
  }
}

/**
 * Hook for accessing current emotion theme (read-only)
 *
 * Use this in child components that only need to read the current theme,
 * not change it. For full control, use the EmotionThemeProvider context.
 */
export function useCurrentEmotionTheme(): {
  emotion: Emotion
  theme: EmotionTheme
} {
  const [emotion, setEmotion] = useState<Emotion>('balanced')
  const [theme, setTheme] = useState<EmotionTheme>(getEmotionTheme('balanced'))
  // Use ref to track current emotion without causing effect re-runs
  const emotionRef = useRef<Emotion>(emotion)

  // Keep ref in sync with state
  useEffect(() => {
    emotionRef.current = emotion
  }, [emotion])

  useEffect(() => {
    // Read from data attribute
    const currentEmotion = document.documentElement.getAttribute('data-emotion') as Emotion
    if (currentEmotion) {
      setEmotion(currentEmotion)
      setTheme(getEmotionTheme(currentEmotion))
    }

    // Watch for changes
    const observer = new MutationObserver(() => {
      const newEmotion = document.documentElement.getAttribute('data-emotion') as Emotion
      // Use ref to compare, avoiding infinite loop
      if (newEmotion && newEmotion !== emotionRef.current) {
        setEmotion(newEmotion)
        setTheme(getEmotionTheme(newEmotion))
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-emotion']
    })

    return () => observer.disconnect()
  }, []) // Empty dependency array - only run on mount

  return { emotion, theme }
}
