/**
 * Emotion Theme Provider
 *
 * Context provider for emotion-driven theming system.
 * Wraps the application and makes theme state available to all components.
 *
 * Quantum Enhancement #4: Emotion-Driven UI Themes
 */

'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useEmotionTheme, UseEmotionThemeReturn } from '@/hooks/useEmotionTheme'
import { EmotionBackground } from './EmotionBackground'

// Create context
const EmotionThemeContext = createContext<UseEmotionThemeReturn | null>(null)

interface EmotionThemeProviderProps {
  children: ReactNode
  showBackground?: boolean  // Show ambient particle background
  showIndicator?: boolean   // Show emotion indicator
}

/**
 * Provider component for emotion theme system
 *
 * Wrap your app with this component to enable emotion-driven themes.
 * Provides theme context to all child components.
 *
 * @example
 * ```tsx
 * // In your root layout:
 * <EmotionThemeProvider showBackground showIndicator>
 *   <App />
 * </EmotionThemeProvider>
 * ```
 */
export function EmotionThemeProvider({
  children,
  showBackground = true,
  showIndicator = false
}: EmotionThemeProviderProps) {
  const emotionTheme = useEmotionTheme()

  return (
    <EmotionThemeContext.Provider value={emotionTheme}>
      {/* Ambient background animation */}
      {showBackground && emotionTheme.isEnabled && (
        <EmotionBackground />
      )}

      {/* Main content */}
      {children}
    </EmotionThemeContext.Provider>
  )
}

/**
 * Hook to access emotion theme context
 *
 * Must be used within EmotionThemeProvider.
 *
 * @example
 * ```tsx
 * const { currentEmotion, updateFromMood, setManualEmotion } = useEmotionThemeContext()
 *
 * // Update theme when user logs mood
 * const handleMoodSaved = (mood: MoodData) => {
 *   updateFromMood(mood)
 * }
 * ```
 */
export function useEmotionThemeContext(): UseEmotionThemeReturn {
  const context = useContext(EmotionThemeContext)

  if (!context) {
    throw new Error(
      'useEmotionThemeContext must be used within EmotionThemeProvider'
    )
  }

  return context
}
