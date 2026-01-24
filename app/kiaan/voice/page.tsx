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

  // Hooks
  const { t, language } = useLanguage()

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
        return
      }

      // For actual errors, show the error state
      setError(err)
      setState('error')
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

      // If the permission API says "granted", verify it actually works
      // (Some browsers report granted but still fail on actual access)
      if (permState.status === 'granted') {
        console.log('[KIAAN Voice] Permission API says granted - verifying...')
        try {
          // Quick test to verify microphone is actually accessible
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          stream.getTracks().forEach(track => track.stop())
          console.log('[KIAAN Voice] ✓ Verified microphone access works')
          setMicPermission('granted')
        } catch (verifyErr: any) {
          console.warn('[KIAAN Voice] Permission was "granted" but verification failed:', verifyErr.name)
          // The permission state was wrong - update to reflect reality
          if (verifyErr.name === 'NotAllowedError') {
            setMicPermission('denied')
            setError('Microphone permission was revoked. Please allow access again.')
          } else if (verifyErr.name === 'NotFoundError') {
            setMicPermission('unsupported')
            setError('No microphone found on this device.')
          } else {
            setMicPermission('prompt')
          }
          return
        }
      } else {
        // Update state based on result
        setMicPermission(permState.status)
      }

      // Set error if there is one (and we didn't set one above)
      if (permState.error && permState.status !== 'granted') {
        setError(permState.error)
      }

      // Listen for permission changes if Permissions API is available
      if (navigator.permissions && navigator.permissions.query) {
        try {
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

      // Successfully got microphone access - stop the stream as we just needed permission
      stream.getTracks().forEach(track => track.stop())

      console.log('[KIAAN Voice] Direct microphone access granted!')
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

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      cleanupAudio()
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

      // Now safe to start listening
      setState('listening')
      resetTranscript()

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

  // Speak response using TTS
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
      setState(wakeWordEnabled ? 'wakeword' : 'idle')
      return
    }

    setState('speaking')

    return new Promise((resolve) => {
      if (!synthesisRef.current) {
        setState(wakeWordEnabled ? 'wakeword' : 'idle')
        resolve()
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

      utterance.onend = () => {
        setResponse('')

        // Auto-resume in hands-free mode
        if (wakeWordEnabled) {
          // After speaking, restart wake word detection (not direct listening)
          // This gives user time to respond naturally with "Hey KIAAN" again
          // or they can tap to speak manually
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

        resolve()
      }

      utterance.onerror = () => {
        setState(wakeWordEnabled ? 'wakeword' : 'idle')
        resolve()
      }

      synthesisRef.current.speak(utterance)
    })
  }

  // Stop speaking
  function stopSpeaking() {
    if (synthesisRef.current) {
      synthesisRef.current.cancel()
    }
    setState(wakeWordEnabled ? 'wakeword' : 'idle')
  }

  // Toggle wake word detection
  async function toggleWakeWord() {
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

      // Check for unsupported/denied state
      if (micPermission === 'unsupported') {
        setError('Microphone is not available on this device.')
        return
      }

      if (micPermission === 'denied') {
        setError('Microphone access is blocked. Please allow microphone access in your browser settings and refresh the page.')
        return
      }

      // Request permission if needed (will also be requested when wake word is detected)
      if (micPermission !== 'granted') {
        console.log('[KIAAN Voice] Requesting permission for wake word mode...')
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

    // If permission is denied, show clear instructions
    if (micPermission === 'denied') {
      setError('Microphone access is blocked. Please click the lock/info icon in your browser\'s address bar, allow microphone access, and refresh the page.')
      setState('error')
      playSound('error')
      return
    }

    // If permission is not granted yet (prompt state), request it first
    if (micPermission !== 'granted') {
      console.log('[KIAAN Voice] Requesting permission first...')
      const granted = await requestMicrophonePermission()
      if (!granted) {
        console.log('[KIAAN Voice] Permission not granted')
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

            {/* Wake Word Toggle */}
            <button
              onClick={toggleWakeWord}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all ${
                wakeWordEnabled
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                  : 'bg-white/5 text-orange-100/60 border border-white/10'
              }`}
            >
              <span className="text-sm sm:text-base">{wakeWordEnabled ? '👂' : '🔇'}</span>
              <span className="text-xs sm:text-sm font-medium">
                <span className="hidden sm:inline">{wakeWordEnabled ? 'Wake Word On' : 'Wake Word Off'}</span>
                <span className="sm:hidden">{wakeWordEnabled ? 'On' : 'Off'}</span>
              </span>
            </button>

            {/* Language Selector */}
            <div className="hidden sm:block">
              <LanguageSelector compact />
            </div>
          </div>
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
            <StateLabel state={state} />

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

          {/* Manual Controls */}
          <div className="flex justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            {state === 'idle' && !wakeWordEnabled && (
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

            {state === 'wakeword' && (
              <button
                onClick={activateManually}
                className="px-6 py-3 sm:px-8 sm:py-4 rounded-full bg-gradient-to-r from-orange-500/80 to-amber-500/80 text-slate-900 font-bold text-base sm:text-lg shadow-lg shadow-orange-500/20 transition-all hover:scale-105"
              >
                Or Tap to Speak
              </button>
            )}

            {state === 'listening' && (
              <button
                onClick={stopListening}
                className="px-6 py-3 sm:px-8 sm:py-4 rounded-full bg-red-500 text-white font-bold text-base sm:text-lg shadow-lg shadow-red-500/30 transition-all hover:scale-105"
              >
                Done Speaking
              </button>
            )}

            {state === 'speaking' && (
              <button
                onClick={stopSpeaking}
                className="px-6 py-3 sm:px-8 sm:py-4 rounded-full bg-red-500 text-white font-bold text-base sm:text-lg shadow-lg shadow-red-500/30 transition-all hover:scale-105"
              >
                Stop
              </button>
            )}

            {state === 'error' && (
              <button
                onClick={() => {
                  setError(null)
                  setState('idle')
                  // Re-check permission status
                  checkMicrophonePermission()
                }}
                className="px-6 py-3 sm:px-8 sm:py-4 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-slate-900 font-bold text-base sm:text-lg shadow-lg shadow-orange-500/30 transition-all hover:scale-105"
              >
                Try Again
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
            {wakeWordEnabled ? (
              <p>Say &quot;Hey KIAAN&quot;, &quot;Namaste KIAAN&quot;, or tap the button to start</p>
            ) : (
              <p>Tap the button above to speak to KIAAN</p>
            )}
            <p className="mt-1">Say &quot;help&quot; for voice commands | KIAAN uses ancient Gita wisdom</p>
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
function StateLabel({ state }: { state: VoiceState }) {
  const labels: Record<VoiceState, { title: string; subtitle: string }> = {
    idle: { title: 'Ready', subtitle: 'Tap to speak' },
    wakeword: { title: 'Listening', subtitle: 'Say "Hey KIAAN"' },
    listening: { title: 'Listening', subtitle: 'Speak naturally' },
    thinking: { title: 'Contemplating', subtitle: 'Finding wisdom...' },
    speaking: { title: 'Speaking', subtitle: 'KIAAN is responding' },
    error: { title: 'Error', subtitle: 'Please try again' }
  }

  const { title, subtitle } = labels[state]

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-orange-50">{title}</h2>
      <p className="text-orange-200/70 mt-1 text-sm sm:text-base">{subtitle}</p>
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
