'use client'

/**
 * KIAAN Elite Voice AI Page
 *
 * Siri/Alexa-class voice interface with:
 * - Wake word detection ("Hey KIAAN")
 * - Real-time speech-to-text
 * - Offline-capable AI responses
 * - Neural text-to-speech
 * - Beautiful animated visualizations
 * - Context memory across sessions
 * - Guided meditation mode
 *
 * Best-in-class voice experience for Gita wisdom.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/hooks/useLanguage'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useWakeWord } from '@/hooks/useWakeWord'
import { LanguageSelector } from '@/components/chat/LanguageSelector'
import { getBrowserName, isSecureContext, isSpeechRecognitionSupported } from '@/utils/browserSupport'
import { playSound, playSoundWithHaptic, playOmChime, cleanupAudio } from '@/utils/audio/soundEffects'
import { detectCommand, isBlockingCommand, getCommandResponse, extractLanguage, getAllCommands, type VoiceCommandType } from '@/utils/speech/voiceCommands'
import {
  checkMicrophonePermission as checkMicPermission,
  runMicrophoneDiagnostics as runDiagnostics,
  detectPlatform
} from '@/utils/microphone/UniversalMicrophoneAccess'

// Context Memory & Meditation imports
import {
  contextMemory,
  recordKiaanConversation,
  getPersonalizedKiaanGreeting,
  getKiaanContextForResponse,
  getEmotionalSummary
} from '@/utils/voice/contextMemory'
import {
  generateMeditationSession,
  getMeditationTypes,
  getMeditationDurations,
  type MeditationType,
  type MeditationDuration,
  type MeditationSession,
  type MeditationStep
} from '@/utils/voice/meditationGuide'

// Daily Rituals imports
import {
  generateMorningRitual,
  generateEveningRitual,
  getTimeAppropriateRitual,
  recordRitualCompletion,
  getRitualStreak,
  type DailyRitual,
  type RitualDuration
} from '@/utils/voice/dailyRituals'

// Crisis Detection imports
import {
  detectCrisis,
  formatHelplinesForSpeech,
  getCrisisWisdomResponse,
  getGroundingTechnique,
  needsCrisisPriority,
  type CrisisAssessment
} from '@/utils/voice/crisisDetection'

// Advanced Features imports
import {
  getProactiveCheckIn,
  getEmotionAdaptiveVoice,
  getEmotionalIntro,
  getMantras,
  getMantraByPurpose,
  generateSleepStory,
  generateAffirmations,
  getAffirmationWithWisdom,
  playBellSound,
  playOmSound,
  getAmbienceOptions,
  type Mantra,
  type SleepStory,
  type AmbienceType
} from '@/utils/voice/kiaanAdvancedFeatures'

// Sanskrit Pronunciation imports
import {
  getVersePronunciation,
  getAvailableVerses,
  generatePronunciationLesson,
  savePronunciationProgress,
  type VersePronunciation
} from '@/utils/voice/sanskritPronunciation'

// Verse Memorization imports
import {
  getMemorizationSession,
  getAllMemorizationVerses,
  getMemorizationVerse,
  startLearningVerse,
  recordReview,
  generateMemorizationPractice,
  getMemorizationStats,
  type MemorizationCard,
  type RecallQuality
} from '@/utils/voice/verseMemorization'

// Binaural Beats imports
import {
  startBinauralSession,
  stopBinauralBeat,
  getBinauralPresets,
  getBinauralPreset,
  getRecommendedPreset,
  getCurrentSession,
  isBinauralPlaying,
  getBinauralIntroSpeech,
  getHeadphoneReminder,
  cleanupAudio as cleanupBinauralAudio,
  type BinauralPreset
} from '@/utils/voice/binauralBeats'

// Spiritual Features imports
import {
  getAvailablePractices,
  logPractice,
  getAccountabilityStats,
  getAccountabilityReminder,
  getPersona,
  getAllPersonas,
  getPersonaResponse,
  getPersonaGreeting,
  getPersonaClosing,
  checkMilestones,
  getAchievedMilestones,
  getCelebrationSpeech,
  getDharmaQuestions,
  analyzeDharmaPath,
  getDharmaGuidance,
  analyzeKarma,
  getGunaQuestions,
  calculateGunaProfile,
  getGunaAdvice,
  saveGunaAssessment,
  type VoicePersona,
  type Milestone,
  type GunaProfile,
  type KarmaAnalysis,
  type DharmaProfile
} from '@/utils/voice/spiritualFeatures'

// Emotional Visualization Component
import EmotionalVisualization from '@/components/voice/EmotionalVisualization'

// Voice Service for High-Quality TTS
import voiceService from '@/services/voiceService'
import divineVoiceService, { stopDivineVoice } from '@/services/divineVoiceService'
import { stopAllAudio, initUniversalAudioStop } from '@/utils/audio/universalAudioStop'
import { useAuth } from '@/hooks/useAuth'

// Types
type VoiceState = 'idle' | 'wakeword' | 'listening' | 'thinking' | 'speaking' | 'error'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isOffline?: boolean
}

/**
 * Elite Voice Page Component
 */
export default function EliteVoicePage() {
  // State
  const [state, setState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [isOnline, setIsOnline] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState<string | null>(null)
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false)
  const [servicesReady, setServicesReady] = useState(false)

  // Microphone permission state
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied' | 'unsupported' | 'checking'>('checking')
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)

  // Voice settings
  const [voiceVolume, setVoiceVolume] = useState(1.0)
  const [voiceRate, setVoiceRate] = useState(0.95)
  const [isMuted, setIsMuted] = useState(false)
  const [lastResponse, setLastResponse] = useState('')
  const [showHelpPanel, setShowHelpPanel] = useState(false)

  // Conversation mode - true divine dialogue experience
  const [conversationMode, setConversationMode] = useState(false)
  const conversationPauseRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Meditation mode - guided meditation with KIAAN
  const [meditationMode, setMeditationMode] = useState(false)
  const [showMeditationPicker, setShowMeditationPicker] = useState(false)
  const [currentMeditation, setCurrentMeditation] = useState<MeditationSession | null>(null)
  const [meditationStep, setMeditationStep] = useState(0)
  const [meditationPaused, setMeditationPaused] = useState(false)
  const meditationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Context memory state
  const [memoryInitialized, setMemoryInitialized] = useState(false)
  const [showMemoryPanel, setShowMemoryPanel] = useState(false)

  // Daily Rituals state
  const [showRitualPicker, setShowRitualPicker] = useState(false)
  const [currentRitual, setCurrentRitual] = useState<DailyRitual | null>(null)
  const [ritualStep, setRitualStep] = useState(0)
  const ritualTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Crisis detection state
  const [showCrisisSupport, setShowCrisisSupport] = useState(false)
  const [currentCrisis, setCurrentCrisis] = useState<CrisisAssessment | null>(null)

  // Advanced features state
  const [showMantraPicker, setShowMantraPicker] = useState(false)
  const [currentMantra, setCurrentMantra] = useState<Mantra | null>(null)
  const [mantraCount, setMantraCount] = useState(0)
  const [sleepStoryMode, setSleepStoryMode] = useState(false)
  const [currentSleepStory, setCurrentSleepStory] = useState<SleepStory | null>(null)
  const [sleepStorySegment, setSleepStorySegment] = useState(0)
  const [showAffirmation, setShowAffirmation] = useState(false)
  const [currentAffirmations, setCurrentAffirmations] = useState<string[]>([])
  const [detectedEmotion, setDetectedEmotion] = useState<string>('neutral')

  // Audio context for ambience
  const audioContextRef = useRef<AudioContext | null>(null)

  // Sanskrit Pronunciation state
  const [showPronunciationPicker, setShowPronunciationPicker] = useState(false)
  const [currentPronunciation, setCurrentPronunciation] = useState<VersePronunciation | null>(null)
  const [pronunciationStep, setPronunciationStep] = useState(0)

  // Verse Memorization state
  const [showMemorizationPicker, setShowMemorizationPicker] = useState(false)
  const [currentMemorizationVerse, setCurrentMemorizationVerse] = useState<MemorizationCard | null>(null)
  const [memorizationReviewMode, setMemorizationReviewMode] = useState(false)

  // Binaural Beats state
  const [showBinauralPicker, setShowBinauralPicker] = useState(false)
  const [activeBinauralPreset, setActiveBinauralPreset] = useState<BinauralPreset | null>(null)
  const [binauralPlaying, setBinauralPlaying] = useState(false)

  // Voice Persona state
  const [showPersonaPicker, setShowPersonaPicker] = useState(false)
  const [currentPersona, setCurrentPersona] = useState<VoicePersona>('krishna')

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false)
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null)

  // Dharma Discovery state
  const [showDharmaDiscovery, setShowDharmaDiscovery] = useState(false)
  const [dharmaQuestionIndex, setDharmaQuestionIndex] = useState(0)
  const [dharmaAnswers, setDharmaAnswers] = useState<Record<string, string>>({})
  const [dharmaProfile, setDharmaProfile] = useState<DharmaProfile | null>(null)

  // Karma Analysis state
  const [showKarmaAnalysis, setShowKarmaAnalysis] = useState(false)
  const [karmaResult, setKarmaResult] = useState<KarmaAnalysis | null>(null)

  // Guna Assessment state
  const [showGunaAssessment, setShowGunaAssessment] = useState(false)
  const [gunaQuestionIndex, setGunaQuestionIndex] = useState(0)
  const [gunaAnswers, setGunaAnswers] = useState<Record<string, 'sattva' | 'rajas' | 'tamas'>>({})
  const [gunaProfile, setGunaProfile] = useState<GunaProfile | null>(null)

  // Emotional Visualization state
  const [showEmotionalJourney, setShowEmotionalJourney] = useState(false)

  // Accountability state
  const [showAccountability, setShowAccountability] = useState(false)

  // Browser diagnostics
  const [browserInfo, setBrowserInfo] = useState<{
    name: string
    isSecure: boolean
    hasSpeechRecognition: boolean
    hasMediaDevices: boolean
  } | null>(null)

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const synthesisRef = useRef<SpeechSynthesis | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const micTransitionRef = useRef<boolean>(false) // Prevent race conditions during mic transitions
  const permissionListenerRef = useRef<{ result: PermissionStatus | null; handler: (() => void) | null }>({
    result: null,
    handler: null
  })
  const selfHealingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryCountRef = useRef<number>(0)
  const maxRetries = 3
  const warmUpStreamRef = useRef<MediaStream | null>(null) // Keep microphone warm for instant activation

  // Hooks
  const { t, language } = useLanguage()
  const { user } = useAuth()

  // Voice input hook
  const {
    isListening,
    transcript: voiceTranscript,
    interimTranscript: voiceInterim,
    isSupported: voiceSupported,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceInput({
    language: language || 'en',
    onTranscript: (text, isFinal) => {
      if (isFinal) {
        setTranscript(text)
        handleUserQuery(text)
      } else {
        setInterimTranscript(text)
      }
    },
    onError: (err) => {
      console.error('[KIAAN Voice] Voice input error:', err)

      // Don't show error if we're in a transition (e.g., switching to wake word mode)
      if (micTransitionRef.current) {
        console.log('[KIAAN Voice] Ignoring error during mic transition')
        return
      }

      // Check if this is a recoverable error
      const lowerErr = err.toLowerCase()
      if (lowerErr.includes('no-speech') || lowerErr.includes('aborted')) {
        // These are expected - just return to previous state
        console.log('[KIAAN Voice] Recoverable error, returning to previous state')
        if (wakeWordEnabled) {
          setState('wakeword')
          // Restart wake word after a brief delay
          setTimeout(() => {
            if (wakeWordEnabled && !wakeWordActive) {
              startWakeWord()
            }
          }, 300)
        } else {
          setState('idle')
        }

        // Elite: Re-warm microphone for next activation
        setTimeout(() => warmUpMicrophone(), 500)
        return
      }

      // For actual errors, show the error state
      setError(err)
      setState('error')

      // Elite: Schedule self-healing for recoverable errors
      scheduleSelfHealing(err)
    }
  })

  // Wake word hook
  const {
    isActive: wakeWordActive,
    isSupported: wakeWordSupported,
    error: wakeWordError,
    start: startWakeWord,
    stop: stopWakeWord
  } = useWakeWord({
    language: language || 'en',
    onWakeWordDetected: handleWakeWordDetected,
    onError: (err) => {
      console.warn('Wake word error:', err)
    }
  })

  // Check microphone permission status using enhanced universal utility
  // This version actively tests microphone access to get accurate status
  async function checkMicrophonePermission() {
    try {
      console.log('[KIAAN Voice] Checking microphone permission status...')

      // Get basic permission state from utility
      const permState = await checkMicPermission()

      // Log platform info for debugging
      console.log('[KIAAN Voice] Platform:', permState.platform, '| Browser:', permState.browser, '| Initial status:', permState.status)

      // ALWAYS verify by actually trying to access the microphone
      // The Permissions API is unreliable and often reports wrong state
      console.log('[KIAAN Voice] Verifying microphone access by actually trying...')
      try {
        // Quick test to verify microphone is actually accessible
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(track => track.stop())
        console.log('[KIAAN Voice] ✓ Microphone access works!')
        setMicPermission('granted')
        setError(null) // Clear any previous error
        return // Success - no need to continue
      } catch (verifyErr: any) {
        const errorMessage = verifyErr.message?.toLowerCase() || ''
        const isDismissal = errorMessage.includes('dismissed') || errorMessage.includes('dismiss')

        // Log at appropriate level - dismissals are expected, not errors
        if (isDismissal) {
          console.log('[KIAAN Voice] Permission prompt was dismissed by user - they can try again')
        } else {
          console.warn('[KIAAN Voice] Microphone access test result:', verifyErr.name, verifyErr.message)
        }

        // Only set denied if we get a definitive denial (not a dismissal)
        if (verifyErr.name === 'NotAllowedError' || verifyErr.name === 'PermissionDeniedError') {
          // Check if this is a dismissal vs actual denial
          if (isDismissal || permState.status === 'prompt') {
            // User dismissed the prompt or hasn't responded yet
            // Don't show an error - just keep prompt state so they can try again
            console.log('[KIAAN Voice] Keeping prompt state - user can try again when ready')
            setMicPermission('prompt')
            // Don't set an error for dismissals - it's not an error, just user choice
            if (!isDismissal) {
              // Only clear error, don't set one
              setError(null)
            }
          } else {
            // Actual denial - user explicitly blocked
            setMicPermission('denied')
            setError('Microphone access is blocked. Please click the lock icon in your address bar, allow microphone, and refresh.')
          }
        } else if (verifyErr.name === 'NotFoundError') {
          setMicPermission('unsupported')
          setError('No microphone found on this device.')
        } else if (verifyErr.name === 'NotReadableError') {
          // Microphone in use by another app - this is temporary
          setMicPermission('prompt')
          setError('Microphone is in use by another app. Please close other apps and try again.')
        } else {
          // Unknown error - don't block, let user try
          setMicPermission('prompt')
        }
      }

      // Set error if there is one (and we didn't set one above)
      if (permState.error && permState.status !== 'granted') {
        setError(permState.error)
      }

      // Listen for permission changes if Permissions API is available
      // Store refs for cleanup to prevent memory leaks
      if (navigator.permissions && navigator.permissions.query) {
        try {
          // Clean up any previous listener
          if (permissionListenerRef.current.result && permissionListenerRef.current.handler) {
            permissionListenerRef.current.result.removeEventListener('change', permissionListenerRef.current.handler)
          }

          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          const handlePermissionChange = () => {
            console.log('[KIAAN Voice] Permission state changed, re-checking...')
            checkMicPermission().then(newState => {
              setMicPermission(newState.status)
              if (newState.status === 'denied') {
                setError('Microphone permission was revoked. Please allow access in your browser settings.')
              } else if (newState.status === 'granted') {
                setError(null)
              }
            })
          }

          // Store refs for cleanup
          permissionListenerRef.current = { result, handler: handlePermissionChange }
          result.addEventListener('change', handlePermissionChange)
        } catch {
          // Permissions API not supported for microphone, that's okay
        }
      }
    } catch (err: any) {
      console.error('[KIAAN Voice] Permission check error:', err)
      setMicPermission('prompt')
    }
  }

  // Request microphone permission for SpeechRecognition - robust flow with fallback
  async function requestMicrophonePermission(): Promise<boolean> {
    setIsRequestingPermission(true)
    setError(null)

    try {
      console.log('[KIAAN Voice] ====== PERMISSION REQUEST ======')

      // Check browser support first
      if (!isSpeechRecognitionSupported()) {
        const browserName = getBrowserName()
        setMicPermission('unsupported')
        setError(`Voice recognition is not supported in ${browserName}. Please use Chrome, Edge, or Safari.`)
        console.log('[KIAAN Voice] Speech recognition not supported')
        return false
      }

      // Check secure context
      if (!isSecureContext()) {
        setMicPermission('unsupported')
        setError('Microphone access requires HTTPS. Please access this site securely.')
        console.log('[KIAAN Voice] Not a secure context')
        return false
      }

      // First, try to get permission via direct getUserMedia (more reliable for permission prompt)
      // This is especially important on mobile browsers where SpeechRecognition may not show a permission dialog
      console.log('[KIAAN Voice] Step 1: Requesting microphone permission directly...')
      const directResult = await requestMicrophoneDirectly()

      if (!directResult.success) {
        console.log('[KIAAN Voice] Direct microphone request failed:', directResult.error)

        // Check if it's a hard denial
        if (directResult.error?.includes('denied') || directResult.error?.includes('not-allowed')) {
          setMicPermission('denied')
          setError(directResult.error || 'Microphone permission denied. Please allow access in your browser settings.')
          return false
        }

        // For other errors, still try SpeechRecognition as fallback
        console.log('[KIAAN Voice] Trying SpeechRecognition as fallback...')
      }

      // If direct request succeeded OR wasn't a hard denial, test SpeechRecognition
      console.log('[KIAAN Voice] Step 2: Testing SpeechRecognition API...')
      const testResult = await testSpeechRecognition()

      if (!testResult.success) {
        console.log('[KIAAN Voice] SpeechRecognition test failed:', testResult.error)

        // Parse the error to set appropriate permission state
        if (testResult.error?.includes('denied') || testResult.error?.includes('not-allowed') || testResult.error?.includes('not granted')) {
          setMicPermission('denied')
        } else if (testResult.error?.includes('audio-capture') || testResult.error?.includes('not found') || testResult.error?.includes('No microphone')) {
          setMicPermission('unsupported')
        } else if (testResult.error?.includes('timed out')) {
          // Timeout could mean user dismissed dialog without choosing
          setMicPermission('prompt')
        }

        setError(testResult.error || 'Failed to access microphone for voice recognition. Please check your browser settings.')
        return false
      }

      // Success!
      setMicPermission('granted')
      playSound('success')
      console.log('[KIAAN Voice] ✓ Microphone access granted for voice recognition!')
      return true

    } catch (err: any) {
      console.error('[KIAAN Voice] Permission error:', err)
      setError(err.message || 'Failed to request microphone access. Please try again.')
      return false
    } finally {
      setIsRequestingPermission(false)
    }
  }

  // Test if SpeechRecognition actually works (some browsers claim support but fail)
  // This version is more robust and handles slow permission dialogs
  async function testSpeechRecognition(): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      try {
        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

        if (!SpeechRecognitionAPI) {
          resolve({ success: false, error: 'SpeechRecognition API not available' })
          return
        }

        const testRecognition = new SpeechRecognitionAPI()
        testRecognition.lang = 'en-US'
        testRecognition.continuous = false
        testRecognition.interimResults = false

        let resolved = false
        const safeResolve = (result: { success: boolean; error?: string }) => {
          if (resolved) return
          resolved = true
          try { testRecognition.abort() } catch {}
          resolve(result)
        }

        // Extended timeout (10s) - permission dialogs can take time on mobile
        // DO NOT assume success on timeout - treat as error
        const timeout = setTimeout(() => {
          console.log('[KIAAN Voice] testSpeechRecognition timeout - permission dialog may have been dismissed')
          safeResolve({
            success: false,
            error: 'Microphone permission request timed out. Please tap "Allow" when the permission dialog appears, then try again.'
          })
        }, 10000)

        testRecognition.onstart = () => {
          clearTimeout(timeout)
          console.log('[KIAAN Voice] testSpeechRecognition onstart - permission granted!')
          safeResolve({ success: true })
        }

        testRecognition.onaudiostart = () => {
          // Audio started means we have microphone access
          clearTimeout(timeout)
          console.log('[KIAAN Voice] testSpeechRecognition onaudiostart - microphone accessible!')
          safeResolve({ success: true })
        }

        testRecognition.onerror = (event: any) => {
          clearTimeout(timeout)
          console.log('[KIAAN Voice] testSpeechRecognition error:', event.error)

          // 'no-speech' is expected since we're just testing, consider it success
          // 'aborted' means we aborted it ourselves, which is fine
          if (event.error === 'no-speech' || event.error === 'aborted') {
            safeResolve({ success: true })
          } else if (event.error === 'not-allowed') {
            safeResolve({ success: false, error: 'Microphone permission denied. Please allow microphone access in your browser settings and try again.' })
          } else if (event.error === 'network') {
            safeResolve({ success: false, error: 'Network error. Speech recognition requires an internet connection in most browsers.' })
          } else if (event.error === 'audio-capture') {
            safeResolve({ success: false, error: 'Microphone not accessible. Please check that your microphone is connected and not being used by another app.' })
          } else if (event.error === 'service-not-allowed') {
            safeResolve({ success: false, error: 'Speech recognition service not available. Please ensure you have an internet connection.' })
          } else {
            safeResolve({ success: false, error: `Speech recognition error: ${event.error}. Please try again.` })
          }
        }

        testRecognition.onend = () => {
          // If we haven't resolved yet, the recognition ended without starting audio
          // This could mean the permission dialog was dismissed
          clearTimeout(timeout)
          if (!resolved) {
            console.log('[KIAAN Voice] testSpeechRecognition ended without audio - possible permission issue')
            safeResolve({
              success: false,
              error: 'Microphone access was not granted. Please allow microphone permissions and try again.'
            })
          }
        }

        console.log('[KIAAN Voice] Starting SpeechRecognition test...')
        testRecognition.start()

      } catch (err: any) {
        console.error('[KIAAN Voice] testSpeechRecognition exception:', err)
        resolve({ success: false, error: `Failed to initialize speech recognition: ${err.message}` })
      }
    })
  }

  // Fallback: Request microphone directly via getUserMedia if SpeechRecognition fails
  async function requestMicrophoneDirectly(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[KIAAN Voice] Attempting direct microphone request via getUserMedia...')

      if (!navigator.mediaDevices?.getUserMedia) {
        return { success: false, error: 'Microphone API not available in this browser' }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      })

      // Keep the stream warm for instant activation instead of stopping immediately
      // This reduces latency when user taps to speak
      if (warmUpStreamRef.current) {
        warmUpStreamRef.current.getTracks().forEach(track => track.stop())
      }
      warmUpStreamRef.current = stream

      console.log('[KIAAN Voice] Direct microphone access granted! (keeping warm)')
      return { success: true }

    } catch (err: any) {
      console.error('[KIAAN Voice] Direct microphone request failed:', err)

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        return { success: false, error: 'Microphone permission denied. Please allow access in your browser settings.' }
      } else if (err.name === 'NotFoundError') {
        return { success: false, error: 'No microphone found. Please connect a microphone and try again.' }
      } else if (err.name === 'NotReadableError') {
        return { success: false, error: 'Microphone is being used by another application. Please close other apps using the microphone.' }
      }

      return { success: false, error: `Could not access microphone: ${err.message}` }
    }
  }

  // Elite: Preemptive microphone warm-up for instant activation
  async function warmUpMicrophone(): Promise<boolean> {
    if (warmUpStreamRef.current) {
      console.log('[KIAAN Voice] Microphone already warm')
      return true
    }

    try {
      console.log('[KIAAN Voice] Warming up microphone for instant activation...')
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      })
      warmUpStreamRef.current = stream
      console.log('[KIAAN Voice] ✓ Microphone warmed up!')
      return true
    } catch (err) {
      console.warn('[KIAAN Voice] Warm-up failed (non-critical):', err)
      return false
    }
  }

  // Elite: Release warm-up stream before starting SpeechRecognition
  function releaseWarmUpStream(): void {
    if (warmUpStreamRef.current) {
      console.log('[KIAAN Voice] Releasing warm-up stream for SpeechRecognition...')
      warmUpStreamRef.current.getTracks().forEach(track => track.stop())
      warmUpStreamRef.current = null
    }
  }

  // Elite: Self-healing error recovery with exponential backoff
  function scheduleSelfHealing(errorType: string): void {
    // Only self-heal for recoverable errors
    const nonRecoverableErrors = ['denied', 'blocked', 'unsupported', 'not found', 'no microphone']
    const isRecoverable = !nonRecoverableErrors.some(e => errorType.toLowerCase().includes(e))

    if (!isRecoverable || retryCountRef.current >= maxRetries) {
      console.log('[KIAAN Voice] Error is not recoverable or max retries reached')
      retryCountRef.current = 0
      return
    }

    // Calculate exponential backoff delay
    const delay = Math.min(500 * Math.pow(2, retryCountRef.current), 8000)
    retryCountRef.current++

    console.log(`[KIAAN Voice] Scheduling self-healing in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`)

    if (selfHealingTimerRef.current) {
      clearTimeout(selfHealingTimerRef.current)
    }

    selfHealingTimerRef.current = setTimeout(async () => {
      console.log('[KIAAN Voice] Attempting self-healing...')

      // Clear error state
      setError(null)

      // Re-check permission
      await checkMicrophonePermission()

      // If permission is now granted, try to return to ready state
      if (micPermission === 'granted') {
        setState(wakeWordEnabled ? 'wakeword' : 'idle')
        console.log('[KIAAN Voice] ✓ Self-healing successful!')
        retryCountRef.current = 0
      } else {
        console.log('[KIAAN Voice] Self-healing: permission still not granted')
      }
    }, delay)
  }

  // Elite: Cancel self-healing
  function cancelSelfHealing(): void {
    if (selfHealingTimerRef.current) {
      clearTimeout(selfHealingTimerRef.current)
      selfHealingTimerRef.current = null
    }
    retryCountRef.current = 0
  }

  // Initialize services
  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initialize speech synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthesisRef.current = window.speechSynthesis
    }

    // Initialize universal audio stop system
    initUniversalAudioStop()

    // Initialize context memory
    contextMemory.initialize().then(() => {
      setMemoryInitialized(true)
      console.log('[KIAAN Voice] Context memory initialized')
    })

    // Gather browser diagnostics
    setBrowserInfo({
      name: getBrowserName(),
      isSecure: isSecureContext(),
      hasSpeechRecognition: isSpeechRecognitionSupported(),
      hasMediaDevices: typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
    })

    // Check microphone permission
    checkMicrophonePermission()

    // Mark services as ready
    setServicesReady(true)

    // Elite: Warm up microphone if we already have permission for instant activation
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then(result => {
          if (result.state === 'granted') {
            warmUpMicrophone()
          }
        })
        .catch(() => {})
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      cleanupAudio()

      // Clean up permission listener to prevent memory leak
      if (permissionListenerRef.current.result && permissionListenerRef.current.handler) {
        permissionListenerRef.current.result.removeEventListener('change', permissionListenerRef.current.handler)
        permissionListenerRef.current = { result: null, handler: null }
      }

      // Clean up warm-up stream
      if (warmUpStreamRef.current) {
        warmUpStreamRef.current.getTracks().forEach(track => track.stop())
        warmUpStreamRef.current = null
      }

      // Cancel any pending self-healing
      if (selfHealingTimerRef.current) {
        clearTimeout(selfHealingTimerRef.current)
        selfHealingTimerRef.current = null
      }

      // Cancel conversation pause timer
      if (conversationPauseRef.current) {
        clearTimeout(conversationPauseRef.current)
        conversationPauseRef.current = null
      }

      // Cancel meditation timer
      if (meditationTimerRef.current) {
        clearTimeout(meditationTimerRef.current)
        meditationTimerRef.current = null
      }
    }
  }, [])

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle wake word detection
  // CRITICAL: Must stop wake word detection BEFORE starting voice input
  // Both use SpeechRecognition API which can't run two instances simultaneously
  async function handleWakeWordDetected() {
    // Prevent race conditions - don't start if we're already transitioning
    if (micTransitionRef.current) {
      console.log('[KIAAN Voice] Already transitioning, ignoring wake word')
      return
    }

    micTransitionRef.current = true

    try {
      // Clear any previous errors
      setError(null)

      // Play activation sound with haptic
      playSoundWithHaptic('wakeWord', 'medium')

      // Add logging for debugging
      console.log('[KIAAN Voice] Wake word detected!')
      console.log('[KIAAN Voice] Voice supported:', voiceSupported)
      console.log('[KIAAN Voice] Mic permission:', micPermission)
      console.log('[KIAAN Voice] Wake word active:', wakeWordActive)

      // CRITICAL FIX: Stop wake word detection before starting voice input
      // Both WakeWordDetector and useVoiceInput use SpeechRecognition
      // Having two SpeechRecognition instances causes microphone conflicts
      if (wakeWordActive) {
        console.log('[KIAAN Voice] Pausing wake word detection for voice input...')
        stopWakeWord()
        // Wait for wake word to fully stop and release microphone
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      // Elite: Release warm-up stream before SpeechRecognition starts
      // SpeechRecognition manages its own microphone access
      releaseWarmUpStream()

      // Now safe to start listening
      setState('listening')
      resetTranscript()

      // Cancel any pending self-healing since user is actively using
      cancelSelfHealing()

      console.log('[KIAAN Voice] Starting voice input...')
      startListening()
      playSound('listening')

    } finally {
      // Release the transition lock after a brief delay
      setTimeout(() => {
        micTransitionRef.current = false
      }, 500)
    }
  }

  // Handle voice command
  function handleVoiceCommand(commandType: VoiceCommandType, param?: string): boolean {
    switch (commandType) {
      case 'stop':
        stopSpeaking()
        playSound('click')
        return true

      case 'repeat':
        if (lastResponse) {
          playSound('notification')
          speakResponse(lastResponse)
        }
        return true

      case 'help':
        setShowHelpPanel(true)
        playSound('notification')
        const helpText = getCommandResponse('help')
        speakResponse(helpText)
        return true

      case 'louder':
        setVoiceVolume(Math.min(1.5, voiceVolume + 0.25))
        playSound('toggle')
        speakResponse('Speaking louder now.')
        return true

      case 'quieter':
        setVoiceVolume(Math.max(0.25, voiceVolume - 0.25))
        playSound('toggle')
        speakResponse('Speaking quieter now.')
        return true

      case 'faster':
        setVoiceRate(Math.min(1.5, voiceRate + 0.15))
        playSound('toggle')
        speakResponse('Speaking faster now.')
        return true

      case 'slower':
        setVoiceRate(Math.max(0.5, voiceRate - 0.15))
        playSound('toggle')
        speakResponse('Speaking more slowly now.')
        return true

      case 'clear':
        clearConversation()
        playSound('success')
        speakResponse('Conversation cleared. How can I help you?')
        return true

      case 'mute':
        setIsMuted(true)
        playSound('toggle')
        return true

      case 'unmute':
        setIsMuted(false)
        playSound('toggle')
        speakResponse('Voice responses enabled.')
        return true

      case 'goodbye':
        playOmChime()

        // End conversation mode if active
        if (conversationMode) {
          // Cancel conversation pause timer
          if (conversationPauseRef.current) {
            clearTimeout(conversationPauseRef.current)
            conversationPauseRef.current = null
          }

          const farewells = [
            "Namaste, dear one. May the wisdom of the Gita guide your path. Until we speak again, may peace be with you.",
            "Go in peace, beloved seeker. Remember, the divine light within you never dims. I am always here when you need guidance.",
            "Our dialogue ends for now, but the wisdom you carry remains eternal. May Krishna's blessings be upon you. Namaste.",
            "Thank you for this sacred conversation. May you walk your path with clarity and peace. Until next time, Om Shanti."
          ]
          const farewell = farewells[Math.floor(Math.random() * farewells.length)]

          // Create a local copy of conversationMode state
          const wasInConversationMode = true

          speakResponse(farewell).then(() => {
            if (wasInConversationMode) {
              setConversationMode(false)
            }
          })

          return true
        }

        speakResponse('Goodbye! Take care, and may peace be with you. Namaste.')
        setTimeout(() => {
          setWakeWordEnabled(false)
          stopWakeWord()
          setState('idle')
        }, 3000)
        return true

      case 'thank_you':
        playSound('success')
        speakResponse('You\'re welcome! I\'m always here to help. Namaste.')
        return true

      case 'language':
        if (param) {
          playSound('success')
          speakResponse(`Switching to ${param}.`)
        }
        return true

      default:
        return false
    }
  }

  // Handle user query
  // CRITICAL: This is called after voice input ends, need to properly manage mic state
  async function handleUserQuery(query: string) {
    // Helper to restart wake word if enabled
    const restartWakeWordIfNeeded = () => {
      if (wakeWordEnabled && !wakeWordActive) {
        setTimeout(() => {
          console.log('[KIAAN Voice] Restarting wake word detection after query handling...')
          setState('wakeword')
          startWakeWord()
        }, 300)
      } else if (!wakeWordEnabled) {
        setState('idle')
      }
    }

    if (!query.trim()) {
      console.log('[KIAAN Voice] Empty query, returning to previous state')
      restartWakeWordIfNeeded()
      return
    }

    // Check for voice commands first
    const commandMatch = detectCommand(query)
    if (commandMatch && commandMatch.confidence > 0.7) {
      const { command } = commandMatch

      // Add user message for commands too
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: query,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, userMessage])

      // Handle the command
      const handled = handleVoiceCommand(command.type, command.param)
      if (handled && isBlockingCommand(command.type)) {
        restartWakeWordIfNeeded()
        return
      }
      if (handled) {
        return
      }
    }

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    // CRISIS DETECTION - Priority check for user safety
    const crisisAssessment = detectCrisis(query)
    if (crisisAssessment.detected) {
      console.log('[KIAAN Voice] Crisis detected:', crisisAssessment.level)
      setCurrentCrisis(crisisAssessment)

      // For critical/high severity, show helplines immediately
      if (['critical', 'high'].includes(crisisAssessment.level)) {
        setShowCrisisSupport(true)
      }

      // Get crisis response with Gita wisdom
      const crisisResponse = crisisAssessment.response + ' ' + getCrisisWisdomResponse(crisisAssessment.level)

      // Add assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: crisisResponse,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])

      // Speak with extra gentle voice
      const gentleVoice = getEmotionAdaptiveVoice('sadness')
      await speakResponseWithEmotion(crisisResponse, gentleVoice.settings)

      // Add helpline info for high severity
      if (crisisAssessment.shouldShowHelpline) {
        const helplineText = formatHelplinesForSpeech(crisisAssessment.helplines)
        await speakResponseWithEmotion(helplineText, gentleVoice.settings)
      }

      // Record in memory
      if (memoryInitialized) {
        await recordKiaanConversation(query, crisisResponse)
      }

      restartWakeWordIfNeeded()
      return
    }

    // Start thinking
    setState('thinking')
    setTranscript('')
    setInterimTranscript('')
    playSound('thinking')

    try {
      let responseText: string

      if (isOnline) {
        // Online: use API
        const res = await fetch('/api/voice/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            query,
            language: language || 'en',
            history: messages.slice(-6)
          })
        })

        if (!res.ok) {
          throw new Error('API request failed')
        }

        const data = await res.json()
        responseText = data.response || "I'm here for you. Let's try again."
      } else {
        // Offline: use local templates
        responseText = await generateOfflineResponse(query)
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        isOffline: !isOnline
      }
      setMessages(prev => [...prev, assistantMessage])
      setResponse(responseText)

      // Play success sound
      playSound('success')

      // Speak response
      await speakResponse(responseText)

      // Record conversation in context memory
      if (memoryInitialized) {
        try {
          await recordKiaanConversation(query, responseText)
        } catch (memErr) {
          console.warn('[KIAAN Voice] Failed to record conversation:', memErr)
        }
      }

    } catch (err) {
      console.error('Query error:', err)

      // Play error sound
      playSound('error')

      // Fallback response
      const fallbackResponse = "I'm here with you. Could you try asking that again?"
      const errorMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date(),
        isOffline: true
      }
      setMessages(prev => [...prev, errorMessage])

      await speakResponse(fallbackResponse)
    }
  }

  // Generate offline response (simplified version)
  async function generateOfflineResponse(query: string): Promise<string> {
    // Simple concern detection
    const queryLower = query.toLowerCase()

    if (queryLower.includes('anxious') || queryLower.includes('worried') || queryLower.includes('nervous')) {
      return "I hear your anxiety. Ancient wisdom teaches us that peace comes from focusing on what you can control - your actions - not the outcomes you fear. Take a moment to breathe deeply. First, take four slow breaths. Then, focus on what's actually in your control right now. Finally, take one small action toward what matters. What feels most urgent to address?"
    }

    if (queryLower.includes('stressed') || queryLower.includes('overwhelmed')) {
      return "I sense you're feeling overwhelmed. The Gita reminds us that when you try to do everything at once, you do nothing well. Your path forward is singular focus. First, identify the one thing that matters most right now. Then, let go of attachment to everything else temporarily. Finally, give that one thing your full attention. What's the most important thing you could focus on?"
    }

    if (queryLower.includes('sad') || queryLower.includes('depressed') || queryLower.includes('hopeless')) {
      return "I hear the heaviness in your words. When life feels dark, it's hard to see the light within you - but it's there. The ancient wisdom teaches that feelings are transient, like clouds passing through the sky. First, acknowledge what you're feeling without judgment. Then, do one small act of self-care - even opening a window counts. Finally, remember that you've survived every difficult moment before. How long have you been feeling this way?"
    }

    if (queryLower.includes('angry') || queryLower.includes('frustrated') || queryLower.includes('mad')) {
      return "I can feel the intensity of what you're experiencing. Anger often protects something vulnerable underneath. The Gita teaches that from attachment, desire is born, and from desire, anger arises. First, count slowly to ten, feeling your breath. Then, ask yourself what you're really protecting - what feels threatened? Finally, consider: what outcome do you actually want here? What happened that triggered this?"
    }

    if (queryLower.includes('afraid') || queryLower.includes('scared') || queryLower.includes('fear')) {
      return "Fear is a natural response, trying to protect you. But sometimes it protects us from what we actually need to face. The Gita says: Do not fear. Abandon all varieties of duty and just surrender unto Me. I shall deliver you. First, name your fear specifically - vague fears are larger than specific ones. Then, ask: what's the worst case, and could I survive it? Finally, take one tiny step toward what scares you. What specifically are you most afraid of?"
    }

    if (queryLower.includes('purpose') || queryLower.includes('meaning') || queryLower.includes('lost')) {
      return "The search for meaning is one of life's most important journeys. The Gita teaches that you must elevate yourself by your own mind. First, write down ten things that bring you joy, no matter how small. Then, reflect on moments when you felt most alive - what do they have in common? Finally, try something new this week. Purpose often hides in unexplored territory. What activities make you lose track of time?"
    }

    // Default response
    return "Thank you for sharing what's on your mind. Ancient wisdom teaches that all challenges contain the seeds of growth. First, take a few moments to breathe and center yourself. Then, focus on what's in your control and release what isn't. Finally, take one small action toward what matters to you. What would be most helpful for you right now?"
  }

  // Speak response using HIGH-QUALITY BACKEND TTS with browser fallback
  async function speakResponse(text: string): Promise<void> {
    // Save for repeat command
    setLastResponse(text)

    // Skip speaking if muted
    if (isMuted) {
      // Add as text message only
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: text,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])

      // In conversation mode, continue listening even when muted
      if (conversationMode) {
        conversationPauseRef.current = setTimeout(() => {
          releaseWarmUpStream()
          setState('listening')
          resetTranscript()
          startListening()
          playSound('listening')
        }, 500)
      } else {
        setState(wakeWordEnabled ? 'wakeword' : 'idle')
      }
      return
    }

    setState('speaking')

    // Handler for when speech ends (used by both backend TTS and browser fallback)
    const handleSpeechEnd = () => {
      setResponse('')

      // CONVERSATION MODE: True divine dialogue - auto-continue the conversation
      if (conversationMode) {
        console.log('[KIAAN Voice] Conversation mode: KIAAN finished speaking, continuing divine dialogue...')

        // Brief sacred pause before listening again (like natural conversation rhythm)
        conversationPauseRef.current = setTimeout(async () => {
          // Release warm-up stream before SpeechRecognition
          releaseWarmUpStream()

          setState('listening')
          resetTranscript()

          console.log('[KIAAN Voice] Listening for your next words...')
          startListening()
          playSound('listening')
        }, 800) // Sacred pause - gives user time to think

        return
      }

      // Wake word mode: Return to listening for wake word
      if (wakeWordEnabled) {
        console.log('[KIAAN Voice] Speech ended, resuming wake word detection...')
        setState('wakeword')

        // Give a brief delay then restart wake word detection
        setTimeout(() => {
          if (wakeWordEnabled && !wakeWordActive) {
            console.log('[KIAAN Voice] Restarting wake word detection...')
            startWakeWord()
          }
        }, 500)
      } else {
        setState('idle')
      }
    }

    // Try DIVINE VOICE SERVICE first (Sarvam AI for Sanskrit, Google Neural for English)
    if (isOnline) {
      try {
        console.log('[KIAAN Voice] Using Divine Voice Service (world-class quality)...')

        // Use divine voice service for synthesis
        const result = await divineVoiceService.speakKiaanResponse(
          text,
          language || 'en',
          {
            volume: voiceVolume,
            onStart: () => {
              console.log('[KIAAN Voice] Divine voice started')
            },
            onEnd: () => {
              console.log('[KIAAN Voice] Divine voice complete')
              handleSpeechEnd()
            },
            onError: (error) => {
              console.warn('[KIAAN Voice] Divine voice error, falling back to browser:', error)
              speakWithBrowserFallback(text, handleSpeechEnd)
            }
          }
        )

        if (result.success) {
          console.log(`[KIAAN Voice] Playing divine voice (provider: ${result.provider}, quality: ${result.qualityScore})`)
          // Store audio reference for stop functionality
          if (result.audio) {
            audioRef.current = result.audio
          }
          return
        } else {
          console.warn('[KIAAN Voice] Divine voice synthesis failed:', result.error)
          // Fall through to browser fallback
        }

      } catch (err) {
        console.warn('[KIAAN Voice] Divine voice error, using browser fallback:', err)
        // Fall through to browser fallback
      }
    }

    // Browser Speech Synthesis fallback
    speakWithBrowserFallback(text, handleSpeechEnd)
  }

  // Browser Speech Synthesis fallback function
  function speakWithBrowserFallback(text: string, onEnd: () => void): void {
    console.log('[KIAAN Voice] Using browser speech synthesis fallback...')

    if (!synthesisRef.current) {
      setState(wakeWordEnabled ? 'wakeword' : 'idle')
      return
    }

    // Process text for natural speech
    const processedText = text
      .replace(/\.\s+/g, '. ... ')
      .replace(/\?\s+/g, '? ... ')
      .replace(/First,/g, '... First, ...')
      .replace(/Then,/g, '... Then, ...')
      .replace(/Finally,/g, '... Finally, ...')

    const utterance = new SpeechSynthesisUtterance(processedText)
    utterance.lang = language || 'en-US'
    utterance.rate = voiceRate
    utterance.pitch = 1.0
    utterance.volume = voiceVolume

    // Select voice
    const voices = synthesisRef.current.getVoices()
    const langVoices = voices.filter(v => v.lang.startsWith((language || 'en').split('-')[0]))
    if (langVoices.length > 0) {
      // Prefer local/enhanced voices
      const localVoice = langVoices.find(v => v.localService)
      utterance.voice = localVoice || langVoices[0]
    }

    utterance.onend = onEnd

    utterance.onerror = () => {
      // Handle error gracefully based on current mode
      if (conversationMode) {
        // In conversation mode, try to continue by listening
        setState('listening')
        setTimeout(() => startListening(), 500)
      } else if (wakeWordEnabled) {
        setState('wakeword')
      } else {
        setState('idle')
      }
    }

    synthesisRef.current.speak(utterance)
  }

  // Stop speaking - UNIVERSAL STOP to prevent voice from continuing
  function stopSpeaking() {
    console.log('[KIAAN Voice] UNIVERSAL STOP - Stopping ALL voice activity...')

    // 1. UNIVERSAL AUDIO STOP - stops all audio sources globally
    stopAllAudio()

    // 2. Stop divine voice service
    stopDivineVoice()

    // 3. Cancel browser speech synthesis (redundant but explicit)
    if (synthesisRef.current) {
      synthesisRef.current.cancel()
    }

    // 4. Clear conversation continuation timer (CRITICAL - prevents auto-restart)
    if (conversationPauseRef.current) {
      clearTimeout(conversationPauseRef.current)
      conversationPauseRef.current = null
    }

    // 5. Clear any meditation timers
    if (meditationTimerRef.current) {
      clearTimeout(meditationTimerRef.current)
      meditationTimerRef.current = null
    }

    // 6. Clear ritual timers
    if (ritualTimerRef.current) {
      clearTimeout(ritualTimerRef.current)
      ritualTimerRef.current = null
    }

    // 7. Clear self-healing timer
    if (selfHealingTimerRef.current) {
      clearTimeout(selfHealingTimerRef.current)
      selfHealingTimerRef.current = null
    }

    // 8. Stop listening if active
    if (isListening) {
      stopListening()
    }

    // 9. Stop any HTML5 Audio elements that might be playing
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.src = '' // Clear source to ensure full stop
    }

    // 10. Stop binaural beats if playing
    if (binauralPlaying) {
      stopBinauralBeat()
      setBinauralPlaying(false)
      setActiveBinauralPreset(null)
    }

    // 11. Clear response state
    setResponse('')

    // 12. Set state to idle/wakeword
    setState(wakeWordEnabled ? 'wakeword' : 'idle')

    console.log('[KIAAN Voice] All voice activity stopped')
  }

  // Speak response with emotion-adaptive voice settings
  async function speakResponseWithEmotion(
    text: string,
    voiceSettings: { rate: number; pitch: number; volume: number }
  ): Promise<void> {
    // Save for repeat command
    setLastResponse(text)

    // Add as text message
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: text,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, assistantMessage])

    if (isMuted) {
      setState('idle')
      return
    }

    setState('speaking')

    return new Promise((resolve) => {
      if (!synthesisRef.current) {
        setState('idle')
        resolve()
        return
      }

      // Process text for natural speech
      const processedText = text
        .replace(/\.\s+/g, '... ')
        .replace(/,/g, '.. ')

      const utterance = new SpeechSynthesisUtterance(processedText)
      utterance.lang = language || 'en-US'
      utterance.rate = voiceSettings.rate
      utterance.pitch = voiceSettings.pitch
      utterance.volume = voiceSettings.volume

      // Select voice
      const voices = synthesisRef.current.getVoices()
      const langVoices = voices.filter(v => v.lang.startsWith((language || 'en').split('-')[0]))
      if (langVoices.length > 0) {
        const localVoice = langVoices.find(v => v.localService)
        utterance.voice = localVoice || langVoices[0]
      }

      utterance.onend = () => {
        setState('idle')
        resolve()
      }

      utterance.onerror = () => {
        setState('idle')
        resolve()
      }

      synthesisRef.current.speak(utterance)
    })
  }

  // Interrupt current speech (for natural conversation)
  function interruptSpeech() {
    if (synthesisRef.current && state === 'speaking') {
      synthesisRef.current.cancel()
      console.log('[KIAAN Voice] Speech interrupted by user')
      setState('listening')
      startListening()
      return true
    }
    return false
  }

  // Toggle conversation mode - true divine dialogue
  async function toggleConversationMode() {
    if (conversationMode) {
      // Exiting conversation mode
      console.log('[KIAAN Voice] Exiting conversation mode')
      setConversationMode(false)
      stopListening()
      if (conversationPauseRef.current) {
        clearTimeout(conversationPauseRef.current)
        conversationPauseRef.current = null
      }
      setState('idle')
      setError(null)

      // Play ending chime
      playOmChime()
    } else {
      // Starting conversation mode
      console.log('[KIAAN Voice] Starting conversation mode - divine dialogue begins')

      // Disable wake word if enabled (they're mutually exclusive)
      if (wakeWordEnabled) {
        stopWakeWord()
        setWakeWordEnabled(false)
      }

      // Check and request permission
      if (micPermission !== 'granted') {
        const granted = await requestMicrophonePermission()
        if (!granted) {
          return
        }
      }

      setConversationMode(true)
      setError(null)

      // Start with a warm greeting from KIAAN
      playOmChime()

      // KIAAN initiates the divine conversation with memory-aware greeting
      const greeting = await getMemoryAwareGreeting()
      await speakResponse(greeting)
    }
  }

  // Get a warm conversation greeting from KIAAN
  function getConversationGreeting(): string {
    const greetings = [
      "Namaste, dear seeker. I am here with you now. Share what weighs upon your heart, and let us walk this path together through the wisdom of the Gita.",
      "Om. I feel your presence, beloved one. This is a sacred space where your words matter. What truth are you seeking today?",
      "Welcome to our divine dialogue. Like Arjuna speaking with Krishna, let your questions flow freely. I am here to listen and guide.",
      "Peace be with you. In this moment, you are not alone. Speak to me as you would to a trusted guide. What is on your mind?",
      "The Gita teaches that true wisdom comes through sincere inquiry. I am here, ready to explore the depths of your questions. Please, share with me."
    ]
    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  // Toggle wake word detection
  async function toggleWakeWord() {
    // Disable conversation mode if active (mutually exclusive)
    if (conversationMode) {
      setConversationMode(false)
      if (conversationPauseRef.current) {
        clearTimeout(conversationPauseRef.current)
        conversationPauseRef.current = null
      }
    }

    if (wakeWordEnabled) {
      stopWakeWord()
      setWakeWordEnabled(false)
      setState('idle')
      setError(null)
    } else {
      // Clear any previous errors
      setError(null)

      // Check if voice is supported
      if (!voiceSupported) {
        const browserName = getBrowserName()
        setError(`Voice recognition not supported in ${browserName}. Please use Chrome, Edge, or Safari.`)
        return
      }

      // Check for unsupported state
      if (micPermission === 'unsupported') {
        setError('Microphone is not available on this device.')
        return
      }

      // Always try to get permission - don't trust the cached state
      if (micPermission !== 'granted') {
        console.log('[KIAAN Voice] Requesting permission for wake word mode (current state:', micPermission, ')...')
        const granted = await requestMicrophonePermission()
        if (!granted) {
          return
        }
      }

      // Start wake word detection
      console.log('[KIAAN Voice] Starting wake word detection...')
      startWakeWord()
      setWakeWordEnabled(true)
      setState('wakeword')
    }
  }

  // ============================================
  // MEDITATION MODE FUNCTIONS
  // ============================================

  // Start a meditation session
  async function startMeditation(type: MeditationType, duration: MeditationDuration) {
    console.log('[KIAAN Voice] Starting meditation:', type, duration, 'minutes')

    // Disable other modes
    if (conversationMode) {
      setConversationMode(false)
      if (conversationPauseRef.current) {
        clearTimeout(conversationPauseRef.current)
        conversationPauseRef.current = null
      }
    }
    if (wakeWordEnabled) {
      stopWakeWord()
      setWakeWordEnabled(false)
    }

    // Generate the meditation session
    const session = generateMeditationSession(type, duration)
    setCurrentMeditation(session)
    setMeditationStep(0)
    setMeditationMode(true)
    setMeditationPaused(false)
    setShowMeditationPicker(false)

    // Play opening chime
    playOmChime()

    // Start the meditation
    await runMeditationStep(session, 0)
  }

  // Run a single meditation step
  async function runMeditationStep(session: MeditationSession, stepIndex: number) {
    if (stepIndex >= session.steps.length) {
      // Meditation complete
      await completeMeditation(session)
      return
    }

    const step = session.steps[stepIndex]
    setMeditationStep(stepIndex)

    // Play bell if required
    if (step.bellSound) {
      playOmChime()
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Speak the step text if there is any
    if (step.text) {
      setState('speaking')
      await speakMeditationText(step.text)
    }

    // Wait for the duration then move to next step
    if (!meditationPaused && meditationMode) {
      meditationTimerRef.current = setTimeout(() => {
        if (meditationMode && !meditationPaused) {
          runMeditationStep(session, stepIndex + 1)
        }
      }, step.duration * 1000)
    }
  }

  // Speak meditation text (slower, more peaceful)
  async function speakMeditationText(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!synthesisRef.current || !text) {
        resolve()
        return
      }

      // Process text for meditation (add pauses)
      const processedText = text
        .replace(/\.\.\./g, '... ... ...') // Extra long pauses
        .replace(/\.\s+/g, '.... ')
        .replace(/,/g, '... ')

      const utterance = new SpeechSynthesisUtterance(processedText)
      utterance.lang = language || 'en-US'
      utterance.rate = 0.85 // Slower for meditation
      utterance.pitch = 0.95 // Slightly lower pitch for calm
      utterance.volume = voiceVolume

      // Select voice
      const voices = synthesisRef.current.getVoices()
      const langVoices = voices.filter(v => v.lang.startsWith((language || 'en').split('-')[0]))
      if (langVoices.length > 0) {
        const localVoice = langVoices.find(v => v.localService)
        utterance.voice = localVoice || langVoices[0]
      }

      utterance.onend = () => {
        setState('idle')
        resolve()
      }

      utterance.onerror = () => {
        setState('idle')
        resolve()
      }

      synthesisRef.current.speak(utterance)
    })
  }

  // Complete meditation and give closing blessing
  async function completeMeditation(session: MeditationSession) {
    console.log('[KIAAN Voice] Meditation complete!')

    // Play completion chime
    playOmChime()
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Speak closing blessing
    setState('speaking')
    await speakMeditationText(session.closingBlessing)

    // Final chime
    playOmChime()

    // Reset state
    setMeditationMode(false)
    setCurrentMeditation(null)
    setMeditationStep(0)
    setState('idle')

    // Record in memory
    if (memoryInitialized) {
      await recordKiaanConversation(
        `Completed ${session.title} meditation (${session.duration} minutes)`,
        session.closingBlessing,
        true
      )
    }
  }

  // Pause meditation
  function pauseMeditation() {
    setMeditationPaused(true)
    if (meditationTimerRef.current) {
      clearTimeout(meditationTimerRef.current)
      meditationTimerRef.current = null
    }
    if (synthesisRef.current) {
      synthesisRef.current.pause()
    }
    playSound('click')
  }

  // Resume meditation
  function resumeMeditation() {
    if (!currentMeditation) return

    setMeditationPaused(false)
    if (synthesisRef.current) {
      synthesisRef.current.resume()
    }
    playSound('click')

    // Resume from current step
    const currentStep = currentMeditation.steps[meditationStep]
    if (currentStep) {
      meditationTimerRef.current = setTimeout(() => {
        if (meditationMode && !meditationPaused) {
          runMeditationStep(currentMeditation, meditationStep + 1)
        }
      }, currentStep.duration * 1000)
    }
  }

  // Stop meditation early
  function stopMeditation() {
    if (meditationTimerRef.current) {
      clearTimeout(meditationTimerRef.current)
      meditationTimerRef.current = null
    }
    if (synthesisRef.current) {
      synthesisRef.current.cancel()
    }

    setMeditationMode(false)
    setCurrentMeditation(null)
    setMeditationStep(0)
    setMeditationPaused(false)
    setState('idle')

    playSound('click')
    console.log('[KIAAN Voice] Meditation stopped early')
  }

  // ============================================
  // CONTEXT MEMORY ENHANCED GREETING
  // ============================================

  // Get greeting that uses context memory
  async function getMemoryAwareGreeting(): Promise<string> {
    if (!memoryInitialized) {
      return getConversationGreeting()
    }

    try {
      const personalizedGreeting = await getPersonalizedKiaanGreeting()
      return personalizedGreeting
    } catch {
      return getConversationGreeting()
    }
  }

  // ============================================
  // DAILY RITUALS FUNCTIONS
  // ============================================

  async function startDailyRitual(type: 'morning' | 'evening', duration: RitualDuration = 'standard') {
    console.log('[KIAAN Voice] Starting daily ritual:', type)

    // Disable other modes
    if (conversationMode) setConversationMode(false)
    if (meditationMode) stopMeditation()
    if (wakeWordEnabled) {
      stopWakeWord()
      setWakeWordEnabled(false)
    }

    const ritual = type === 'morning'
      ? generateMorningRitual(duration)
      : generateEveningRitual(duration)

    setCurrentRitual(ritual)
    setRitualStep(0)
    setShowRitualPicker(false)

    playOmChime()

    // Run the ritual
    await runRitualStep(ritual, 0)
  }

  async function runRitualStep(ritual: DailyRitual, stepIndex: number) {
    if (stepIndex >= ritual.steps.length) {
      await completeRitual(ritual)
      return
    }

    const step = ritual.steps[stepIndex]
    setRitualStep(stepIndex)

    if (step.bellSound) {
      playOmChime()
      await new Promise(resolve => setTimeout(resolve, 800))
    }

    if (step.text) {
      const voiceSettings = step.type === 'breathing'
        ? { rate: 0.8, pitch: 0.95, volume: voiceVolume }
        : { rate: 0.85, pitch: 1.0, volume: voiceVolume }
      await speakResponseWithEmotion(step.text, voiceSettings)
    }

    ritualTimerRef.current = setTimeout(() => {
      runRitualStep(ritual, stepIndex + 1)
    }, step.duration * 1000)
  }

  async function completeRitual(ritual: DailyRitual) {
    playOmChime()
    await new Promise(resolve => setTimeout(resolve, 1000))

    await speakResponseWithEmotion(ritual.closingBlessing, { rate: 0.85, pitch: 1.0, volume: voiceVolume })

    playOmChime()
    recordRitualCompletion(ritual.type)

    setCurrentRitual(null)
    setRitualStep(0)
    setState('idle')

    if (memoryInitialized) {
      await recordKiaanConversation(
        `Completed ${ritual.title}`,
        ritual.closingBlessing,
        true
      )
    }
  }

  function stopRitual() {
    if (ritualTimerRef.current) {
      clearTimeout(ritualTimerRef.current)
      ritualTimerRef.current = null
    }
    if (synthesisRef.current) synthesisRef.current.cancel()
    setCurrentRitual(null)
    setRitualStep(0)
    setState('idle')
  }

  // ============================================
  // MANTRA CHANTING FUNCTIONS
  // ============================================

  async function startMantraChanting(mantra: Mantra) {
    console.log('[KIAAN Voice] Starting mantra:', mantra.transliteration)

    if (conversationMode) setConversationMode(false)
    if (meditationMode) stopMeditation()

    setCurrentMantra(mantra)
    setMantraCount(0)
    setShowMantraPicker(false)

    playOmChime()

    // Introduce the mantra
    const intro = `We will chant ${mantra.transliteration} together. ${mantra.meaning}. This mantra is for ${mantra.purpose}. We will repeat it ${mantra.repetitions} times. After I chant, you may repeat silently or aloud.`
    await speakResponseWithEmotion(intro, { rate: 0.85, pitch: 1.0, volume: voiceVolume })

    await new Promise(resolve => setTimeout(resolve, 2000))

    // Chant the mantra
    for (let i = 0; i < mantra.repetitions; i++) {
      setMantraCount(i + 1)
      await speakResponseWithEmotion(mantra.transliteration, { rate: 0.7, pitch: 0.9, volume: voiceVolume })
      await new Promise(resolve => setTimeout(resolve, mantra.pauseBetween * 1000))
    }

    // Closing
    playOmChime()
    await speakResponseWithEmotion('Om Shanti. The vibration of the mantra continues within you.', { rate: 0.85, pitch: 1.0, volume: voiceVolume })

    setCurrentMantra(null)
    setMantraCount(0)
    setState('idle')

    if (memoryInitialized) {
      await recordKiaanConversation(`Chanted ${mantra.transliteration} ${mantra.repetitions} times`, 'Mantra practice completed', true)
    }
  }

  // ============================================
  // SLEEP STORY FUNCTIONS
  // ============================================

  async function startSleepStory() {
    console.log('[KIAAN Voice] Starting sleep story')

    if (conversationMode) setConversationMode(false)
    if (meditationMode) stopMeditation()

    const story = generateSleepStory()
    setCurrentSleepStory(story)
    setSleepStorySegment(0)
    setSleepStoryMode(true)

    playOmChime()

    // Run through segments with fading volume
    for (let i = 0; i < story.segments.length; i++) {
      if (!sleepStoryMode) break

      const segment = story.segments[i]
      setSleepStorySegment(i)

      if (segment.text) {
        const fadeVolume = voiceVolume * segment.fadeLevel
        await speakResponseWithEmotion(segment.text, { rate: 0.75, pitch: 0.95, volume: fadeVolume })
      }

      await new Promise(resolve => setTimeout(resolve, segment.duration * 1000))
    }

    setSleepStoryMode(false)
    setCurrentSleepStory(null)
    setState('idle')
  }

  function stopSleepStory() {
    setSleepStoryMode(false)
    if (synthesisRef.current) synthesisRef.current.cancel()
    setCurrentSleepStory(null)
    setSleepStorySegment(0)
    setState('idle')
  }

  // ============================================
  // AFFIRMATION FUNCTIONS
  // ============================================

  async function speakAffirmations() {
    const hour = new Date().getHours()
    const timeOfDay = hour < 12 ? 'morning' : 'evening'
    const emotionState = detectedEmotion || 'neutral'

    const affirmations = generateAffirmations(emotionState, [], timeOfDay as 'morning' | 'evening')
    const texts = affirmations.map(a => a.text)
    setCurrentAffirmations(texts)
    setShowAffirmation(true)

    playOmChime()

    await speakResponseWithEmotion('Receive these affirmations for your journey today.', { rate: 0.9, pitch: 1.0, volume: voiceVolume })

    for (const text of texts) {
      await speakResponseWithEmotion(text, { rate: 0.85, pitch: 1.0, volume: voiceVolume })
      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    playOmChime()
    await speakResponseWithEmotion('Carry these truths with you. You are worthy. You are enough.', { rate: 0.85, pitch: 1.0, volume: voiceVolume })

    setTimeout(() => setShowAffirmation(false), 5000)
  }

  // ============================================
  // SANSKRIT PRONUNCIATION FUNCTIONS
  // ============================================

  async function startPronunciationLesson(verseId: string) {
    console.log('[KIAAN Voice] Starting pronunciation lesson:', verseId)

    const verse = getVersePronunciation(verseId)
    if (!verse) {
      await speakResponse('I could not find that verse for pronunciation practice.')
      return
    }

    setCurrentPronunciation(verse)
    setPronunciationStep(0)
    setShowPronunciationPicker(false)

    playOmChime()

    const lesson = generatePronunciationLesson(verseId)
    for (const line of lesson) {
      await speakResponseWithEmotion(line, { rate: 0.8, pitch: 1.0, volume: voiceVolume })
      await new Promise(resolve => setTimeout(resolve, 1500))
    }

    savePronunciationProgress({
      verseId,
      attempts: 1,
      lastPracticed: new Date(),
      confidence: 50,
      masteredSyllables: [],
      difficultSyllables: []
    })

    setCurrentPronunciation(null)
    setState('idle')
  }

  // ============================================
  // VERSE MEMORIZATION FUNCTIONS
  // ============================================

  async function startMemorizationSession(verseId: string) {
    console.log('[KIAAN Voice] Starting memorization:', verseId)

    const verse = getMemorizationVerse(verseId)
    if (!verse) {
      await speakResponse('I could not find that verse for memorization.')
      return
    }

    startLearningVerse(verseId)
    setCurrentMemorizationVerse(verse)
    setMemorizationReviewMode(true)
    setShowMemorizationPicker(false)

    playOmChime()

    const practice = generateMemorizationPractice(verseId)
    for (const line of practice) {
      await speakResponseWithEmotion(line, { rate: 0.85, pitch: 1.0, volume: voiceVolume })
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    setCurrentMemorizationVerse(null)
    setMemorizationReviewMode(false)
    setState('idle')
  }

  async function recordMemorizationReview(quality: RecallQuality) {
    if (!currentMemorizationVerse) return

    const result = recordReview(currentMemorizationVerse.verseId, quality)
    const qualityText = quality >= 4 ? 'Excellent recall!' : quality >= 3 ? 'Good effort!' : 'Keep practicing, you will master this.'
    await speakResponse(`${qualityText} Next review in ${result.interval} days.`)

    setCurrentMemorizationVerse(null)
    setMemorizationReviewMode(false)
  }

  // ============================================
  // BINAURAL BEATS FUNCTIONS
  // ============================================

  async function startBinauralBeats(presetName: string) {
    console.log('[KIAAN Voice] Starting binaural beats:', presetName)

    const preset = getBinauralPreset(presetName)
    if (!preset) {
      await speakResponse('I could not find that binaural preset.')
      return
    }

    setShowBinauralPicker(false)

    // Headphone reminder
    await speakResponse(getHeadphoneReminder())
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Introduction
    const intro = getBinauralIntroSpeech(presetName)
    for (const line of intro) {
      await speakResponseWithEmotion(line, { rate: 0.9, pitch: 1.0, volume: voiceVolume })
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Start the binaural beat
    const started = await startBinauralSession(presetName)
    if (started) {
      setActiveBinauralPreset(preset)
      setBinauralPlaying(true)
    } else {
      await speakResponse('I could not start the binaural session. Please try again.')
    }
  }

  function stopBinauralBeats() {
    stopBinauralBeat()
    setBinauralPlaying(false)
    setActiveBinauralPreset(null)
    playSound('click')
  }

  // ============================================
  // VOICE PERSONA FUNCTIONS
  // ============================================

  async function switchPersona(persona: VoicePersona) {
    setCurrentPersona(persona)
    setShowPersonaPicker(false)

    const config = getPersona(persona)
    playOmChime()

    await speakResponseWithEmotion(getPersonaGreeting(persona), config.voiceSettings)

    if (memoryInitialized) {
      await recordKiaanConversation(`Switched to ${config.name} persona`, getPersonaGreeting(persona))
    }
  }

  function getPersonaVoiceSettings() {
    return getPersona(currentPersona).voiceSettings
  }

  // ============================================
  // MILESTONE CELEBRATION FUNCTIONS
  // ============================================

  async function celebrateMilestone(milestone: Milestone) {
    setCurrentMilestone(milestone)
    setShowCelebration(true)

    playOmChime()
    await new Promise(resolve => setTimeout(resolve, 500))
    playSound('success')

    const celebration = getCelebrationSpeech(milestone)
    for (const line of celebration) {
      await speakResponseWithEmotion(line, { rate: 0.9, pitch: 1.05, volume: voiceVolume })
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    playOmChime()

    setTimeout(() => {
      setShowCelebration(false)
      setCurrentMilestone(null)
    }, 5000)
  }

  // ============================================
  // DHARMA DISCOVERY FUNCTIONS
  // ============================================

  async function startDharmaDiscovery() {
    setShowDharmaDiscovery(true)
    setDharmaQuestionIndex(0)
    setDharmaAnswers({})
    setDharmaProfile(null)

    playOmChime()
    await speakResponse('Let us explore your dharma together. I will ask you questions to help discover your life purpose. Reflect deeply before answering.')
  }

  async function answerDharmaQuestion(answer: string) {
    const questions = getDharmaQuestions()
    const currentQuestion = questions[dharmaQuestionIndex]

    setDharmaAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }))

    if (currentQuestion.followUp) {
      await speakResponseWithEmotion(currentQuestion.followUp, { rate: 0.9, pitch: 1.0, volume: voiceVolume })
    }

    if (dharmaQuestionIndex < questions.length - 1) {
      setDharmaQuestionIndex(prev => prev + 1)
      await new Promise(resolve => setTimeout(resolve, 2000))
      await speakResponse(questions[dharmaQuestionIndex + 1].question)
    } else {
      // Complete - analyze
      const profile = analyzeDharmaPath({ ...dharmaAnswers, [currentQuestion.id]: answer })
      setDharmaProfile(profile)

      playOmChime()
      await speakResponseWithEmotion(getDharmaGuidance(profile), { rate: 0.85, pitch: 1.0, volume: voiceVolume })
    }
  }

  // ============================================
  // KARMA ANALYSIS FUNCTIONS
  // ============================================

  async function analyzeKarmaSituation(situation: string) {
    const analysis = analyzeKarma(situation)
    setKarmaResult(analysis)
    setShowKarmaAnalysis(true)

    playOmChime()
    await speakResponseWithEmotion(analysis.recommendation, { rate: 0.85, pitch: 1.0, volume: voiceVolume })
    await new Promise(resolve => setTimeout(resolve, 2000))
    await speakResponseWithEmotion(analysis.gitaWisdom, { rate: 0.8, pitch: 0.95, volume: voiceVolume })

    for (const question of analysis.questions) {
      await new Promise(resolve => setTimeout(resolve, 1500))
      await speakResponseWithEmotion(question, { rate: 0.9, pitch: 1.0, volume: voiceVolume })
    }
  }

  // ============================================
  // GUNA ASSESSMENT FUNCTIONS
  // ============================================

  async function startGunaAssessment() {
    setShowGunaAssessment(true)
    setGunaQuestionIndex(0)
    setGunaAnswers({})
    setGunaProfile(null)

    playOmChime()
    await speakResponse('The Gita teaches about three gunas - sattva, rajas, and tamas - that influence our nature. Let me help you understand your dominant guna through this assessment.')

    const questions = getGunaQuestions()
    await new Promise(resolve => setTimeout(resolve, 2000))
    await speakResponse(questions[0].question)
  }

  function answerGunaQuestion(guna: 'sattva' | 'rajas' | 'tamas') {
    const questions = getGunaQuestions()
    const currentQuestion = questions[gunaQuestionIndex]

    const newAnswers = { ...gunaAnswers, [currentQuestion.id]: guna }
    setGunaAnswers(newAnswers)

    if (gunaQuestionIndex < questions.length - 1) {
      setGunaQuestionIndex(prev => prev + 1)
    } else {
      // Complete - calculate
      const profile = calculateGunaProfile(newAnswers)
      setGunaProfile(profile)
      saveGunaAssessment(profile)
    }
  }

  async function speakGunaResults() {
    if (!gunaProfile) return

    playOmChime()
    await speakResponseWithEmotion(getGunaAdvice(gunaProfile), { rate: 0.85, pitch: 1.0, volume: voiceVolume })
  }

  // Manual activation - robust flow with permission handling
  async function activateManually() {
    // Prevent double-clicks or rapid activation
    if (micTransitionRef.current) {
      console.log('[KIAAN Voice] Already transitioning, ignoring manual activation')
      return
    }

    // Clear previous errors
    setError(null)

    console.log('[KIAAN Voice] ====== MANUAL ACTIVATION ======')
    console.log('[KIAAN Voice] Voice supported:', voiceSupported)
    console.log('[KIAAN Voice] Current permission:', micPermission)
    console.log('[KIAAN Voice] Browser:', browserInfo?.name)
    console.log('[KIAAN Voice] Wake word active:', wakeWordActive)

    // Check if voice is supported first
    if (!voiceSupported) {
      const browserName = getBrowserName()
      setError(`Voice input is not supported in ${browserName}. Please use Chrome, Edge, or Safari.`)
      setState('error')
      playSound('error')
      return
    }

    // Check for unsupported state (no microphone or browser issue)
    if (micPermission === 'unsupported') {
      setError('Microphone is not available. Please check that you have a microphone connected and your browser supports voice input.')
      setState('error')
      playSound('error')
      return
    }

    // Always try to get permission - don't trust the cached state
    // The Permissions API can be wrong, so we try regardless of what it says
    if (micPermission !== 'granted') {
      console.log('[KIAAN Voice] Requesting permission (current state:', micPermission, ')...')
      const granted = await requestMicrophonePermission()
      if (!granted) {
        console.log('[KIAAN Voice] Permission not granted after request')
        // Error is already set by requestMicrophonePermission
        setState('error')
        return
      }
    }

    // Permission is granted - verify one more time that microphone is accessible
    console.log('[KIAAN Voice] Permission granted, starting voice input...')

    // Start listening - this will handle stopping wake word if needed
    await handleWakeWordDetected()
  }

  // Run comprehensive diagnostic check using the enhanced utility
  async function runMicrophoneDiagnostics(): Promise<void> {
    console.log('[KIAAN Voice] ====== MICROPHONE DIAGNOSTICS ======')

    const diagnostics = await runDiagnostics()

    console.log('[KIAAN Voice] Platform:', diagnostics.platform)
    console.log('[KIAAN Voice] Browser:', diagnostics.browser)
    console.log('[KIAAN Voice] Secure context (HTTPS):', diagnostics.isSecure)
    console.log('[KIAAN Voice] MediaDevices API:', diagnostics.hasMediaDevices)
    console.log('[KIAAN Voice] SpeechRecognition API:', diagnostics.hasSpeechRecognition)
    console.log('[KIAAN Voice] Permission status:', diagnostics.permissionStatus)
    console.log('[KIAAN Voice] Audio devices found:', diagnostics.audioDevicesCount)

    if (diagnostics.errors.length > 0) {
      console.log('[KIAAN Voice] Errors:')
      diagnostics.errors.forEach(err => console.log(`[KIAAN Voice]   - ${err}`))
    }

    // Also log platform details
    const platformInfo = detectPlatform()
    console.log('[KIAAN Voice] Mobile:', platformInfo.isMobile)
    console.log('[KIAAN Voice] iOS:', platformInfo.isIOS)

    console.log('[KIAAN Voice] ====== END DIAGNOSTICS ======')
  }

  // Clear conversation
  function clearConversation() {
    setMessages([])
    setTranscript('')
    setInterimTranscript('')
    setResponse('')
    setError(null)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header */}
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/kiaan/chat"
              className="rounded-xl border border-orange-500/30 bg-white/5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-orange-50 transition-all hover:border-orange-400/50 hover:bg-white/10"
            >
              Text Chat
            </Link>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              KIAAN Voice
            </h1>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Online/Offline */}
            <div className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full ${
              isOnline
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}>
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                isOnline ? 'bg-emerald-400' : 'bg-amber-400'
              } animate-pulse`} />
              <span className="text-xs sm:text-sm font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Conversation Mode Toggle - Divine Dialogue */}
            <button
              onClick={toggleConversationMode}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all ${
                conversationMode
                  ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300 border border-amber-400/60 shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 text-orange-100/60 border border-white/10 hover:border-amber-500/30'
              }`}
              title="Divine Dialogue Mode - Continuous conversation with KIAAN"
            >
              <span className="text-sm sm:text-base">{conversationMode ? '🙏' : '💬'}</span>
              <span className="text-xs sm:text-sm font-medium">
                <span className="hidden sm:inline">{conversationMode ? 'Dialogue Active' : 'Start Dialogue'}</span>
                <span className="sm:hidden">{conversationMode ? 'Active' : 'Dialogue'}</span>
              </span>
            </button>

            {/* Wake Word Toggle */}
            <button
              onClick={toggleWakeWord}
              disabled={conversationMode || meditationMode}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all ${
                wakeWordEnabled
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                  : 'bg-white/5 text-orange-100/60 border border-white/10'
              } ${conversationMode || meditationMode ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={conversationMode || meditationMode ? 'Disable other modes first' : 'Wake word detection'}
            >
              <span className="text-sm sm:text-base">{wakeWordEnabled ? '👂' : '🔇'}</span>
              <span className="text-xs sm:text-sm font-medium">
                <span className="hidden sm:inline">{wakeWordEnabled ? 'Wake Word On' : 'Wake Word Off'}</span>
                <span className="sm:hidden">{wakeWordEnabled ? 'On' : 'Off'}</span>
              </span>
            </button>

            {/* Meditation Mode Toggle */}
            <button
              onClick={() => setShowMeditationPicker(true)}
              disabled={meditationMode}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all ${
                meditationMode
                  ? 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-purple-300 border border-purple-400/60 shadow-lg shadow-purple-500/20'
                  : 'bg-white/5 text-orange-100/60 border border-white/10 hover:border-purple-500/30'
              }`}
              title="Guided Meditation with KIAAN"
            >
              <span className="text-sm sm:text-base">{meditationMode ? '🧘' : '🪷'}</span>
              <span className="text-xs sm:text-sm font-medium">
                <span className="hidden sm:inline">{meditationMode ? 'Meditating' : 'Meditate'}</span>
                <span className="sm:hidden">{meditationMode ? '...' : 'Med'}</span>
              </span>
            </button>

            {/* Language Selector */}
            <div className="hidden sm:block">
              <LanguageSelector compact />
            </div>
          </div>
        </div>

        {/* Advanced Features Quick Access Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-2 bg-slate-900/50 border-y border-orange-500/10">
          <button
            onClick={() => setShowPersonaPicker(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs hover:bg-amber-500/20 transition-all"
            title="Choose Voice Persona"
          >
            <span>🎭</span>
            <span className="hidden sm:inline">Persona</span>
          </button>
          <button
            onClick={() => startGunaAssessment()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs hover:bg-violet-500/20 transition-all"
            title="Guna Assessment"
          >
            <span>⚖️</span>
            <span className="hidden sm:inline">Gunas</span>
          </button>
          <button
            onClick={() => speakAffirmations()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs hover:bg-rose-500/20 transition-all"
            title="Daily Affirmations"
          >
            <span>💫</span>
            <span className="hidden sm:inline">Affirm</span>
          </button>
        </div>
      </div>

      {/* Microphone Permission Request */}
      {micPermission !== 'granted' && micPermission !== 'checking' && (
        <div className="container mx-auto px-4 pb-6">
          <div className="max-w-2xl mx-auto">
            <div className={`rounded-2xl border p-6 sm:p-8 text-center ${
              micPermission === 'denied'
                ? 'border-red-500/30 bg-red-500/10'
                : micPermission === 'unsupported'
                ? 'border-amber-500/30 bg-amber-500/10'
                : 'border-orange-500/30 bg-orange-500/10'
            }`}>
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center ${
                  micPermission === 'denied'
                    ? 'bg-red-500/20'
                    : micPermission === 'unsupported'
                    ? 'bg-amber-500/20'
                    : 'bg-orange-500/20'
                }`}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`w-8 h-8 sm:w-10 sm:h-10 ${
                      micPermission === 'denied'
                        ? 'text-red-400'
                        : micPermission === 'unsupported'
                        ? 'text-amber-400'
                        : 'text-orange-400'
                    }`}
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                    {micPermission === 'denied' && (
                      <line x1="4" x2="20" y1="4" y2="20" className="text-red-400" />
                    )}
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h2 className={`text-xl sm:text-2xl font-bold mb-2 ${
                micPermission === 'denied'
                  ? 'text-red-100'
                  : micPermission === 'unsupported'
                  ? 'text-amber-100'
                  : 'text-orange-100'
              }`}>
                {micPermission === 'denied'
                  ? 'Microphone Access Denied'
                  : micPermission === 'unsupported'
                  ? 'Microphone Not Available'
                  : 'Enable Microphone Access'}
              </h2>

              {/* Description */}
              <p className={`text-sm sm:text-base mb-6 ${
                micPermission === 'denied'
                  ? 'text-red-200/80'
                  : micPermission === 'unsupported'
                  ? 'text-amber-200/80'
                  : 'text-orange-200/80'
              }`}>
                {micPermission === 'denied'
                  ? 'Please enable microphone access in your browser settings to use voice features.'
                  : micPermission === 'unsupported'
                  ? 'Your device does not support microphone access or no microphone was found.'
                  : 'KIAAN needs access to your microphone to listen and respond to your voice.'}
              </p>

              {/* Action Button */}
              {micPermission === 'prompt' && (
                <button
                  onClick={requestMicrophonePermission}
                  disabled={isRequestingPermission}
                  className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-slate-900 font-bold text-base sm:text-lg shadow-lg shadow-orange-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isRequestingPermission ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Requesting...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" x2="12" y1="19" y2="22" />
                      </svg>
                      Allow Microphone Access
                    </>
                  )}
                </button>
              )}

              {/* Settings Instructions for Denied */}
              {micPermission === 'denied' && (
                <div className="mt-4 text-left bg-slate-900/50 rounded-xl p-4">
                  <p className="text-sm text-orange-100 font-medium mb-2">How to enable:</p>
                  <ul className="text-xs sm:text-sm text-orange-200/70 space-y-1">
                    <li>• <strong>Chrome/Edge:</strong> Click the lock icon in the address bar → Site settings → Microphone → Allow</li>
                    <li>• <strong>Safari:</strong> Safari menu → Settings → Websites → Microphone → Allow</li>
                    <li>• <strong>Firefox:</strong> Click the lock icon → Clear permissions → Refresh and try again</li>
                    <li>• <strong>Mobile:</strong> Go to Settings → Browser → Microphone → Enable</li>
                  </ul>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 rounded-lg bg-orange-500/20 text-orange-300 text-sm font-medium hover:bg-orange-500/30 transition-colors"
                  >
                    Refresh Page
                  </button>
                </div>
              )}

              {/* Browser Diagnostics */}
              {browserInfo && (
                <div className="mt-4 text-left bg-slate-900/50 rounded-xl p-4">
                  <p className="text-sm text-orange-100 font-medium mb-2">System Check:</p>
                  <ul className="text-xs sm:text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      <span className={browserInfo.name !== 'Firefox' ? 'text-emerald-400' : 'text-amber-400'}>
                        {browserInfo.name !== 'Firefox' ? '✓' : '⚠'}
                      </span>
                      <span className="text-orange-200/70">
                        Browser: <strong>{browserInfo.name}</strong>
                        {browserInfo.name === 'Firefox' && ' (Voice recognition limited)'}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={browserInfo.isSecure ? 'text-emerald-400' : 'text-red-400'}>
                        {browserInfo.isSecure ? '✓' : '✗'}
                      </span>
                      <span className="text-orange-200/70">
                        Secure Context (HTTPS): <strong>{browserInfo.isSecure ? 'Yes' : 'No - Required!'}</strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={browserInfo.hasSpeechRecognition ? 'text-emerald-400' : 'text-red-400'}>
                        {browserInfo.hasSpeechRecognition ? '✓' : '✗'}
                      </span>
                      <span className="text-orange-200/70">
                        Speech Recognition: <strong>{browserInfo.hasSpeechRecognition ? 'Supported' : 'Not Supported'}</strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={browserInfo.hasMediaDevices ? 'text-emerald-400' : 'text-red-400'}>
                        {browserInfo.hasMediaDevices ? '✓' : '✗'}
                      </span>
                      <span className="text-orange-200/70">
                        Microphone API: <strong>{browserInfo.hasMediaDevices ? 'Available' : 'Not Available'}</strong>
                      </span>
                    </li>
                  </ul>
                  {!browserInfo.isSecure && (
                    <p className="mt-3 text-xs text-red-300 bg-red-500/10 rounded p-2">
                      Voice features require HTTPS. Please access the site via https:// or use localhost for development.
                    </p>
                  )}
                  {!browserInfo.hasSpeechRecognition && (
                    <p className="mt-3 text-xs text-amber-300 bg-amber-500/10 rounded p-2">
                      Please use Chrome, Edge, or Safari for full voice support. Firefox has limited speech recognition.
                    </p>
                  )}
                </div>
              )}

              {/* Privacy Note */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs sm:text-sm text-orange-200/50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Your voice is processed privately and never stored without consent</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Voice Interface */}
      <div className="container mx-auto px-4 pb-8">
        <div className="max-w-4xl mx-auto">

          {/* Central Voice Visual */}
          <div className="relative h-[280px] sm:h-[320px] md:h-[400px] flex items-center justify-center">
            <VoiceVisualizer state={state} />
          </div>

          {/* State Label & Transcript */}
          <div className="text-center mb-8">
            <StateLabel state={state} conversationMode={conversationMode} />

            {/* Live Transcript */}
            {(interimTranscript || voiceInterim) && state === 'listening' && (
              <div className="mt-4 text-orange-200/80 text-lg animate-pulse">
                {interimTranscript || voiceInterim}...
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-4 px-4 py-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-red-400 text-lg">⚠️</span>
                  <div className="flex-1">
                    <p className="font-medium">{error}</p>

                    {/* Permission denied instructions */}
                    {(error.toLowerCase().includes('denied') || error.toLowerCase().includes('blocked') || error.toLowerCase().includes('not-allowed')) && (
                      <div className="mt-2 text-red-300/70 text-xs space-y-1">
                        <p className="font-medium text-red-200">How to enable microphone access:</p>
                        {browserInfo?.name === 'Chrome' && (
                          <p>Click the lock icon (🔒) in the address bar → Site settings → Microphone → Allow</p>
                        )}
                        {browserInfo?.name === 'Safari' && (
                          <p>Safari menu → Settings for This Website → Microphone → Allow</p>
                        )}
                        {browserInfo?.name === 'Edge' && (
                          <p>Click the lock icon (🔒) in the address bar → Permissions for this site → Microphone → Allow</p>
                        )}
                        {browserInfo?.name === 'Firefox' && (
                          <p>Click the permissions icon next to the address bar → Clear permission → Refresh and try again</p>
                        )}
                        {!browserInfo?.name || browserInfo?.name === 'Unknown' && (
                          <p>Check your browser settings to allow microphone access for this site</p>
                        )}
                        <button
                          onClick={() => window.location.reload()}
                          className="mt-2 px-3 py-1.5 rounded bg-red-500/30 hover:bg-red-500/40 text-red-200 text-xs font-medium transition-colors"
                        >
                          Refresh Page After Allowing
                        </button>
                      </div>
                    )}

                    {/* Timeout instructions */}
                    {error.toLowerCase().includes('timed out') && (
                      <div className="mt-2 text-red-300/70 text-xs">
                        <p>The permission dialog may have been dismissed. Please try again and tap &quot;Allow&quot; when prompted.</p>
                        <button
                          onClick={() => {
                            setError(null)
                            setMicPermission('prompt')
                          }}
                          className="mt-2 px-3 py-1.5 rounded bg-orange-500/30 hover:bg-orange-500/40 text-orange-200 text-xs font-medium transition-colors"
                        >
                          Try Again
                        </button>
                      </div>
                    )}

                    {/* Firefox limitation */}
                    {error.includes('Firefox') && (
                      <p className="mt-2 text-red-300/70 text-xs">
                        Firefox has limited speech recognition support. For the best experience, please use Chrome, Edge, or Safari.
                      </p>
                    )}

                    {/* Network error */}
                    {error.toLowerCase().includes('network') && (
                      <p className="mt-2 text-red-300/70 text-xs">
                        Speech recognition requires an internet connection. Please check your connection and try again.
                      </p>
                    )}

                    {/* Audio capture / microphone not found */}
                    {(error.toLowerCase().includes('audio-capture') || error.toLowerCase().includes('not found') || error.toLowerCase().includes('no microphone')) && (
                      <p className="mt-2 text-red-300/70 text-xs">
                        Please ensure your microphone is properly connected and not being used by another application.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Conversation Mode Active Indicator */}
          {conversationMode && (
            <div className="mb-4 flex justify-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-400/40 shadow-lg shadow-amber-500/10">
                <div className="relative">
                  <span className="text-2xl">🙏</span>
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                </div>
                <div className="text-left">
                  <div className="text-amber-200 font-semibold text-sm">Divine Dialogue Active</div>
                  <div className="text-amber-300/70 text-xs">Speak freely - KIAAN is listening</div>
                </div>
                <button
                  onClick={toggleConversationMode}
                  className="ml-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-400/40 text-red-300 text-xs font-medium hover:bg-red-500/30 transition-colors"
                >
                  End
                </button>
              </div>
            </div>
          )}

          {/* Manual Controls */}
          <div className="flex justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            {state === 'idle' && !wakeWordEnabled && !conversationMode && (
              <button
                onClick={activateManually}
                disabled={!voiceSupported || micPermission === 'unsupported'}
                className="px-6 py-3 sm:px-8 sm:py-4 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-slate-900 font-bold text-base sm:text-lg shadow-lg shadow-orange-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                {micPermission === 'granted'
                  ? 'Tap to Speak'
                  : micPermission === 'checking'
                  ? 'Checking microphone...'
                  : micPermission === 'denied'
                  ? 'Microphone Blocked - Tap for Help'
                  : 'Enable Microphone & Speak'}
              </button>
            )}

            {state === 'wakeword' && !conversationMode && (
              <button
                onClick={activateManually}
                className="px-6 py-3 sm:px-8 sm:py-4 rounded-full bg-gradient-to-r from-orange-500/80 to-amber-500/80 text-slate-900 font-bold text-base sm:text-lg shadow-lg shadow-orange-500/20 transition-all hover:scale-105"
              >
                Or Tap to Speak
              </button>
            )}

            {state === 'listening' && (
              <button
                onClick={conversationMode ? () => stopListening() : stopListening}
                className="px-6 py-3 sm:px-8 sm:py-4 rounded-full bg-red-500 text-white font-bold text-base sm:text-lg shadow-lg shadow-red-500/30 transition-all hover:scale-105"
              >
                {conversationMode ? 'Pause Dialogue' : 'Done Speaking'}
              </button>
            )}

            {state === 'speaking' && (
              <button
                onClick={stopSpeaking}
                className="px-6 py-3 sm:px-8 sm:py-4 rounded-full bg-red-500 text-white font-bold text-base sm:text-lg shadow-lg shadow-red-500/30 transition-all hover:scale-105"
              >
                {conversationMode ? 'Pause' : 'Stop'}
              </button>
            )}

            {state === 'thinking' && conversationMode && (
              <div className="px-6 py-3 sm:px-8 sm:py-4 rounded-full bg-amber-500/20 text-amber-300 font-medium text-base sm:text-lg">
                KIAAN is contemplating...
              </div>
            )}

            {state === 'error' && (
              <button
                onClick={() => {
                  setError(null)
                  if (conversationMode) {
                    // In conversation mode, try to resume
                    setState('listening')
                    setTimeout(() => startListening(), 300)
                  } else {
                    setState('idle')
                    checkMicrophonePermission()
                  }
                }}
                className="px-6 py-3 sm:px-8 sm:py-4 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-slate-900 font-bold text-base sm:text-lg shadow-lg shadow-orange-500/30 transition-all hover:scale-105"
              >
                {conversationMode ? 'Continue Dialogue' : 'Try Again'}
              </button>
            )}
          </div>

          {/* Conversation History */}
          {messages.length > 0 && (
            <div className="rounded-2xl sm:rounded-3xl border border-orange-500/20 bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-orange-100">Conversation</h2>
                <button
                  onClick={clearConversation}
                  className="text-xs sm:text-sm text-orange-300/60 hover:text-orange-300 transition-colors"
                >
                  Clear
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4 max-h-[250px] sm:max-h-[350px] md:max-h-[400px] overflow-y-auto">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* Voice Commands Help Panel */}
          {showHelpPanel && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-orange-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-orange-100">Voice Commands</h3>
                  <button
                    onClick={() => setShowHelpPanel(false)}
                    className="text-orange-300/60 hover:text-orange-300 p-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {getAllCommands().map((cmd, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50">
                      <span className="text-orange-400 font-semibold text-sm whitespace-nowrap">&quot;{cmd.command}&quot;</span>
                      <span className="text-orange-200/70 text-sm">{cmd.description}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-orange-500/20">
                  <p className="text-orange-200/50 text-xs text-center">
                    Say any command naturally, KIAAN will understand
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Meditation Picker Modal */}
          {showMeditationPicker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-purple-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-purple-100">Guided Meditation</h3>
                    <p className="text-purple-200/60 text-sm mt-1">Choose your practice with KIAAN</p>
                  </div>
                  <button
                    onClick={() => setShowMeditationPicker(false)}
                    className="text-purple-300/60 hover:text-purple-300 p-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Meditation Types */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {getMeditationTypes().map((med) => (
                    <button
                      key={med.type}
                      onClick={() => {
                        const defaultDuration: MeditationDuration = 5
                        startMeditation(med.type, defaultDuration)
                      }}
                      className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-400/50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{med.icon}</span>
                        <span className="font-semibold text-purple-100 group-hover:text-purple-50">{med.title}</span>
                      </div>
                      <p className="text-xs text-purple-200/60">{med.description}</p>
                      <p className="text-xs text-purple-300/40 mt-1">{med.recommended}</p>
                    </button>
                  ))}
                </div>

                {/* Quick Duration Selector */}
                <div className="border-t border-purple-500/20 pt-4">
                  <p className="text-purple-200/70 text-sm mb-3">Or select duration for breathing meditation:</p>
                  <div className="flex flex-wrap gap-2">
                    {getMeditationDurations().map((dur) => (
                      <button
                        key={dur.minutes}
                        onClick={() => startMeditation('breathing', dur.minutes)}
                        className="px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-200 text-sm hover:bg-purple-500/20 hover:border-purple-400/50 transition-all"
                      >
                        {dur.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Meditation Active Indicator */}
          {meditationMode && currentMeditation && (
            <div className="mb-4 flex justify-center">
              <div className="inline-flex flex-col items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-purple-500/20 border border-purple-400/40 shadow-lg shadow-purple-500/10 max-w-md w-full">
                <div className="flex items-center gap-3 w-full">
                  <div className="relative">
                    <span className="text-3xl">🧘</span>
                    {!meditationPaused && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-purple-200 font-semibold text-sm">{currentMeditation.title}</div>
                    <div className="text-purple-300/70 text-xs">
                      Step {meditationStep + 1} of {currentMeditation.steps.length}
                      {meditationPaused && ' • Paused'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {meditationPaused ? (
                      <button
                        onClick={resumeMeditation}
                        className="px-3 py-1.5 rounded-lg bg-purple-500/30 border border-purple-400/40 text-purple-200 text-xs font-medium hover:bg-purple-500/40 transition-colors"
                      >
                        Resume
                      </button>
                    ) : (
                      <button
                        onClick={pauseMeditation}
                        className="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-medium hover:bg-purple-500/30 transition-colors"
                      >
                        Pause
                      </button>
                    )}
                    <button
                      onClick={stopMeditation}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-400/40 text-red-300 text-xs font-medium hover:bg-red-500/30 transition-colors"
                    >
                      End
                    </button>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-purple-900/50 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-purple-400 to-indigo-400 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${((meditationStep + 1) / currentMeditation.steps.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Binaural Beats Active Indicator */}
          {binauralPlaying && activeBinauralPreset && (
            <div className="mb-4 flex justify-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 border border-cyan-400/40 shadow-lg shadow-cyan-500/10">
                <div className="relative">
                  <span className="text-2xl">🎧</span>
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
                </div>
                <div className="text-left">
                  <div className="text-cyan-200 font-semibold text-sm">{activeBinauralPreset.name}</div>
                  <div className="text-cyan-300/70 text-xs">{activeBinauralPreset.type} waves • {activeBinauralPreset.beatFrequency}Hz</div>
                </div>
                <button
                  onClick={stopBinauralBeats}
                  className="ml-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-400/40 text-red-300 text-xs font-medium hover:bg-red-500/30 transition-colors"
                >
                  Stop
                </button>
              </div>
            </div>
          )}

          {/* Sanskrit Pronunciation Picker Modal */}
          {showPronunciationPicker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-teal-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-teal-100">Sanskrit Pronunciation</h3>
                    <p className="text-teal-200/60 text-sm mt-1">Learn correct shloka pronunciation</p>
                  </div>
                  <button onClick={() => setShowPronunciationPicker(false)} className="text-teal-300/60 hover:text-teal-300 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="space-y-3">
                  {getAvailableVerses().map((verse) => (
                    <button
                      key={verse.verseId}
                      onClick={() => startPronunciationLesson(verse.verseId)}
                      className="w-full p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 transition-all text-left"
                    >
                      <div className="font-semibold text-teal-100">{verse.reference}</div>
                      <div className="text-xs text-teal-300/60 mt-1">Difficulty: {verse.difficulty}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Verse Memorization Picker Modal */}
          {showMemorizationPicker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-emerald-100">Verse Memorization</h3>
                    <p className="text-emerald-200/60 text-sm mt-1">Spaced repetition for deep learning</p>
                  </div>
                  <button onClick={() => setShowMemorizationPicker(false)} className="text-emerald-300/60 hover:text-emerald-300 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                {(() => {
                  const stats = getMemorizationStats()
                  return (
                    <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="text-emerald-200 text-sm">Progress: {stats.totalVersesMastered} mastered • {stats.reviewsDueToday} due today • {stats.currentStreak} day streak</div>
                    </div>
                  )
                })()}
                <div className="space-y-3">
                  {getAllMemorizationVerses().map((verse) => (
                    <button
                      key={verse.verseId}
                      onClick={() => startMemorizationSession(verse.verseId)}
                      className="w-full p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all text-left"
                    >
                      <div className="font-semibold text-emerald-100">{verse.reference}</div>
                      <div className="text-xs text-emerald-300/70 mt-1 line-clamp-2">{verse.translation}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Binaural Beats Picker Modal */}
          {showBinauralPicker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-cyan-100">Binaural Beats</h3>
                    <p className="text-cyan-200/60 text-sm mt-1">Alpha/theta waves for meditation</p>
                  </div>
                  <button onClick={() => setShowBinauralPicker(false)} className="text-cyan-300/60 hover:text-cyan-300 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="mb-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 text-sm">
                  Use headphones for best effect. Each ear receives a different frequency.
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {getBinauralPresets().map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => startBinauralBeats(preset.name)}
                      className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all text-left"
                    >
                      <div className="font-semibold text-cyan-100">{preset.name}</div>
                      <div className="text-xs text-cyan-300/60 mt-1">{preset.type} • {preset.beatFrequency}Hz</div>
                      <div className="text-xs text-cyan-300/40 mt-1">{preset.recommendedDuration}min</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Voice Persona Picker Modal */}
          {showPersonaPicker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-amber-100">Choose Your Guide</h3>
                    <p className="text-amber-200/60 text-sm mt-1">Each persona speaks with unique wisdom</p>
                  </div>
                  <button onClick={() => setShowPersonaPicker(false)} className="text-amber-300/60 hover:text-amber-300 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="space-y-3">
                  {getAllPersonas().map((persona) => (
                    <button
                      key={persona.id}
                      onClick={() => switchPersona(persona.id)}
                      className={`w-full p-4 rounded-xl border transition-all text-left ${
                        currentPersona === persona.id
                          ? 'bg-amber-500/20 border-amber-400/60'
                          : 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15'
                      }`}
                    >
                      <div className="font-semibold text-amber-100">{persona.name}</div>
                      <div className="text-xs text-amber-300/70 mt-1">{persona.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Guna Assessment Modal */}
          {showGunaAssessment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-violet-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-violet-100">Guna Assessment</h3>
                    <p className="text-violet-200/60 text-sm mt-1">Discover your dominant nature</p>
                  </div>
                  <button onClick={() => setShowGunaAssessment(false)} className="text-violet-300/60 hover:text-violet-300 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                {!gunaProfile ? (
                  <>
                    <div className="mb-4 text-violet-200/80 text-sm">
                      Question {gunaQuestionIndex + 1} of {getGunaQuestions().length}
                    </div>
                    <div className="mb-6 text-violet-100 font-medium">
                      {getGunaQuestions()[gunaQuestionIndex]?.question}
                    </div>
                    <div className="space-y-2">
                      {getGunaQuestions()[gunaQuestionIndex]?.options.map((option, i) => (
                        <button
                          key={i}
                          onClick={() => answerGunaQuestion(option.guna)}
                          className="w-full p-3 rounded-lg bg-violet-500/10 border border-violet-500/30 hover:bg-violet-500/20 transition-all text-left text-violet-200 text-sm"
                        >
                          {option.text}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl mb-2">{gunaProfile.dominantGuna === 'sattva' ? '✨' : gunaProfile.dominantGuna === 'rajas' ? '🔥' : '🌙'}</div>
                      <div className="text-2xl font-bold text-violet-100 capitalize">{gunaProfile.dominantGuna}</div>
                      <div className="text-violet-300/70 text-sm mt-1">Dominant Guna</div>
                    </div>
                    <p className="text-violet-200/80 text-sm">{gunaProfile.description}</p>
                    <div className="flex justify-between text-xs text-violet-300/60">
                      <span>Sattva: {gunaProfile.scores.sattva}</span>
                      <span>Rajas: {gunaProfile.scores.rajas}</span>
                      <span>Tamas: {gunaProfile.scores.tamas}</span>
                    </div>
                    <button
                      onClick={speakGunaResults}
                      className="w-full py-2 rounded-lg bg-violet-500/20 text-violet-200 text-sm font-medium hover:bg-violet-500/30 transition-colors"
                    >
                      Hear Full Guidance
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Emotional Journey Modal */}
          {showEmotionalJourney && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-orange-500/30 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-orange-100">Your Emotional Journey</h3>
                  <button onClick={() => setShowEmotionalJourney(false)} className="text-orange-300/60 hover:text-orange-300 p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                <EmotionalVisualization height={350} showInsights={true} />
              </div>
            </div>
          )}

          {/* Celebration Modal */}
          {showCelebration && currentMilestone && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-gradient-to-br from-amber-900/90 to-orange-900/90 border border-amber-400/50 rounded-2xl max-w-md w-full p-8 shadow-2xl text-center">
                <div className="text-6xl mb-4 animate-bounce">🏆</div>
                <h3 className="text-2xl font-bold text-amber-100 mb-2">{currentMilestone.name}</h3>
                <p className="text-amber-200/80 mb-4">{currentMilestone.description}</p>
                <p className="text-amber-300/70 text-sm italic">{currentMilestone.celebration}</p>
                <button
                  onClick={() => { setShowCelebration(false); setCurrentMilestone(null); }}
                  className="mt-6 px-6 py-2 rounded-full bg-amber-500 text-slate-900 font-bold hover:bg-amber-400 transition-colors"
                >
                  Continue Journey
                </button>
              </div>
            </div>
          )}

          {/* Crisis Support Panel */}
          {showCrisisSupport && currentCrisis && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-red-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">💜</div>
                  <h3 className="text-xl font-bold text-red-100">You Are Not Alone</h3>
                </div>
                <p className="text-red-200/80 mb-4">{currentCrisis.response}</p>
                <div className="space-y-2 mb-4">
                  {currentCrisis.helplines.slice(0, 3).map((helpline, i) => (
                    <div key={i} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="font-semibold text-red-100">{helpline.name}</div>
                      <div className="text-red-300 text-lg font-mono">{helpline.number}</div>
                      <div className="text-red-300/60 text-xs">{helpline.available}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowCrisisSupport(false)}
                  className="w-full py-2 rounded-lg bg-red-500/20 text-red-200 text-sm font-medium hover:bg-red-500/30 transition-colors"
                >
                  I understand, close this
                </button>
              </div>
            </div>
          )}

          {/* Voice Settings Indicator */}
          {(isMuted || voiceVolume !== 1.0 || voiceRate !== 0.95) && (
            <div className="flex justify-center gap-2 mb-4">
              {isMuted && (
                <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs">
                  Muted
                </span>
              )}
              {voiceVolume !== 1.0 && (
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs">
                  Volume: {Math.round(voiceVolume * 100)}%
                </span>
              )}
              {voiceRate !== 0.95 && (
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs">
                  Speed: {voiceRate < 0.95 ? 'Slower' : 'Faster'}
                </span>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="text-center text-orange-100/50 text-xs sm:text-sm px-4">
            {meditationMode ? (
              <>
                <p className="text-purple-300/70">Guided meditation in progress - follow KIAAN&apos;s voice</p>
                <p className="mt-1">Breathe deeply and let go of all tension</p>
              </>
            ) : conversationMode ? (
              <>
                <p className="text-amber-300/70">Divine dialogue active - speak naturally, KIAAN will respond and continue listening</p>
                <p className="mt-1">Say &quot;goodbye&quot; or &quot;namaste&quot; to end the dialogue gracefully</p>
              </>
            ) : wakeWordEnabled ? (
              <p>Say &quot;Hey KIAAN&quot;, &quot;Namaste KIAAN&quot;, or tap the button to start</p>
            ) : (
              <>
                <p>Tap the button above to speak to KIAAN</p>
                <p className="mt-1 text-amber-300/50">Dialogue for conversation | Meditate for guided practice</p>
              </>
            )}
            {!meditationMode && (
              <p className="mt-1">Say &quot;help&quot; for voice commands | KIAAN remembers your journey</p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

/**
 * Voice Visualizer Component
 */
function VoiceVisualizer({ state }: { state: VoiceState }) {
  return (
    <div className="relative">
      {state === 'idle' && <IdleAnimation />}
      {state === 'wakeword' && <WakeWordAnimation />}
      {state === 'listening' && <ListeningAnimation />}
      {state === 'thinking' && <ThinkingAnimation />}
      {state === 'speaking' && <SpeakingAnimation />}
      {state === 'error' && <ErrorAnimation />}
    </div>
  )
}

function IdleAnimation() {
  return (
    <div className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-64 md:h-64">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-800/50 to-slate-700/50 flex items-center justify-center">
        <span className="text-4xl sm:text-5xl md:text-6xl opacity-50">🕉️</span>
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-6 sm:mt-8 text-orange-300/50 text-xs sm:text-sm">
        Tap to begin
      </div>
    </div>
  )
}

function WakeWordAnimation() {
  return (
    <div className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-64 md:h-64">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-orange-500/20 animate-pulse" />
      <div className="absolute inset-6 sm:inset-8 rounded-full bg-gradient-to-br from-purple-500/30 to-orange-500/30 animate-pulse delay-300" />
      <div className="absolute inset-12 sm:inset-16 rounded-full bg-gradient-to-br from-purple-500/40 to-orange-500/40 flex items-center justify-center">
        <span className="text-4xl sm:text-5xl md:text-6xl">👂</span>
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-6 sm:mt-8 text-orange-300 text-xs sm:text-sm animate-pulse">
        Say &quot;Hey KIAAN&quot;
      </div>
    </div>
  )
}

function ListeningAnimation() {
  return (
    <div className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-64 md:h-64">
      <div className="absolute inset-0 rounded-full bg-orange-500/10 animate-ping" />
      <div className="absolute inset-2 sm:inset-4 rounded-full bg-orange-500/20 animate-ping delay-200" />
      <div className="absolute inset-4 sm:inset-8 rounded-full bg-orange-500/30 animate-ping delay-400" />
      <div className="absolute inset-10 sm:inset-12 md:inset-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-slate-900"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-6 sm:mt-8 text-orange-50 text-sm sm:text-base md:text-lg font-semibold">
        Listening...
      </div>
    </div>
  )
}

function ThinkingAnimation() {
  return (
    <div className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-64 md:h-64">
      <svg className="w-full h-full animate-spin" style={{ animationDuration: '3s' }} viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#thinkingGradient)"
          strokeWidth="2"
          strokeDasharray="10 5"
        />
        <defs>
          <linearGradient id="thinkingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-4xl sm:text-5xl md:text-6xl animate-pulse">🕉️</span>
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-6 sm:mt-8 text-orange-50 text-sm sm:text-base md:text-lg font-semibold">
        Finding wisdom...
      </div>
    </div>
  )
}

function SpeakingAnimation() {
  return (
    <div className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-64 md:h-64 flex items-center justify-center">
      <div className="flex items-end gap-1 sm:gap-1.5 h-20 sm:h-24 md:h-32">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="w-2.5 sm:w-3 md:w-4 bg-gradient-to-t from-orange-500 to-amber-400 rounded-full animate-audio-wave"
            style={{
              height: `${Math.random() * 60 + 40}%`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: '0.8s'
            }}
          />
        ))}
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-6 sm:mt-8 text-orange-50 text-sm sm:text-base md:text-lg font-semibold">
        KIAAN is speaking...
      </div>
    </div>
  )
}

function ErrorAnimation() {
  return (
    <div className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-64 md:h-64">
      <div className="absolute inset-0 rounded-full bg-red-500/20 flex items-center justify-center">
        <span className="text-4xl sm:text-5xl md:text-6xl">⚠️</span>
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-6 sm:mt-8 text-red-400 text-xs sm:text-sm">
        Something went wrong
      </div>
    </div>
  )
}

/**
 * State Label Component
 */
function StateLabel({ state, conversationMode }: { state: VoiceState; conversationMode?: boolean }) {
  const labels: Record<VoiceState, { title: string; subtitle: string; conversationTitle?: string; conversationSubtitle?: string }> = {
    idle: { title: 'Ready', subtitle: 'Tap to speak', conversationTitle: 'Ready', conversationSubtitle: 'Tap "Start Dialogue" for divine conversation' },
    wakeword: { title: 'Listening', subtitle: 'Say "Hey KIAAN"' },
    listening: { title: 'Listening', subtitle: 'Speak naturally', conversationTitle: 'I Am Listening', conversationSubtitle: 'Share your heart, dear seeker' },
    thinking: { title: 'Contemplating', subtitle: 'Finding wisdom...', conversationTitle: 'Reflecting', conversationSubtitle: 'Drawing from ancient wisdom...' },
    speaking: { title: 'Speaking', subtitle: 'KIAAN is responding', conversationTitle: 'Speaking to You', conversationSubtitle: 'Receiving divine guidance' },
    error: { title: 'Error', subtitle: 'Please try again', conversationTitle: 'Moment of Pause', conversationSubtitle: 'Let us try again together' }
  }

  const label = labels[state]
  const title = conversationMode && label.conversationTitle ? label.conversationTitle : label.title
  const subtitle = conversationMode && label.conversationSubtitle ? label.conversationSubtitle : label.subtitle

  return (
    <div>
      <h2 className={`text-xl sm:text-2xl font-bold ${conversationMode ? 'text-amber-100' : 'text-orange-50'}`}>{title}</h2>
      <p className={`mt-1 text-sm sm:text-base ${conversationMode ? 'text-amber-200/70' : 'text-orange-200/70'}`}>{subtitle}</p>
    </div>
  )
}

/**
 * Message Bubble Component
 */
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-orange-500/20 text-orange-50 rounded-br-md'
            : 'bg-slate-800/80 text-slate-100 rounded-bl-md'
        }`}
      >
        <p className="text-sm leading-relaxed">{message.content}</p>
        <div className="flex items-center gap-2 mt-2 text-xs opacity-50">
          <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {message.isOffline && <span>(offline)</span>}
        </div>
      </div>
    </div>
  )
}
