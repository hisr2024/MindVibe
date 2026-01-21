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
import { getBrowserName, isSecureContext, isSpeechRecognitionSupported } from '@/utils/browserSupport'

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

  // Check microphone permission status
  async function checkMicrophonePermission() {
    try {
      // Check if mediaDevices API is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicPermission('unsupported')
        return
      }

      // Check permission status using Permissions API if available
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          setMicPermission(result.state as 'prompt' | 'granted' | 'denied')

          // Listen for permission changes
          result.onchange = () => {
            setMicPermission(result.state as 'prompt' | 'granted' | 'denied')
          }
        } catch {
          // Permissions API not supported for microphone, default to prompt
          setMicPermission('prompt')
        }
      } else {
        // Permissions API not available, default to prompt
        setMicPermission('prompt')
      }
    } catch {
      setMicPermission('prompt')
    }
  }

  // Request microphone permission - returns true if granted
  async function requestMicrophonePermission(): Promise<boolean> {
    setIsRequestingPermission(true)
    setError(null)

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      // Permission granted - stop the stream immediately (we just needed permission)
      stream.getTracks().forEach(track => track.stop())
      setMicPermission('granted')

      // Play success sound
      playActivationSound()

      return true

    } catch (err: any) {
      console.error('Microphone permission error:', err)

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermission('denied')
        setError('Microphone access denied. Please enable it in your browser settings.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setMicPermission('unsupported')
        setError('No microphone found. Please connect a microphone and try again.')
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Microphone is in use by another application. Please close other apps using the microphone.')
      } else {
        setError('Could not access microphone. Please check your device settings.')
      }
      return false
    } finally {
      setIsRequestingPermission(false)
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
    }
  }, [])

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle wake word detection
  function handleWakeWordDetected() {
    // Play activation sound
    playActivationSound()

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50])
    }

    // Start listening
    setState('listening')
    resetTranscript()
    startListening()
  }

  // Play activation sound
  function playActivationSound() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return

      const ctx = new AudioContextClass()
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      oscillator.connect(gain)
      gain.connect(ctx.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.15)

      setTimeout(() => ctx.close(), 200)
    } catch (e) {
      // Silent fail
    }
  }

  // Handle user query
  async function handleUserQuery(query: string) {
    if (!query.trim()) {
      setState(wakeWordEnabled ? 'wakeword' : 'idle')
      return
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

      // Speak response
      await speakResponse(responseText)

    } catch (err) {
      console.error('Query error:', err)

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
      utterance.rate = 0.95
      utterance.pitch = 1.0
      utterance.volume = 1.0

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
        setState(wakeWordEnabled ? 'wakeword' : 'idle')

        // Auto-resume listening in hands-free mode
        if (wakeWordEnabled) {
          setTimeout(() => {
            setState('listening')
            startListening()
          }, 1000)
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
    } else {
      // Check permission first
      if (micPermission !== 'granted') {
        const granted = await requestMicrophonePermission()
        if (!granted) {
          return
        }
      }
      startWakeWord()
      setWakeWordEnabled(true)
      setState('wakeword')
    }
  }

  // Manual activation
  async function activateManually() {
    // Check permission first
    if (micPermission !== 'granted') {
      const granted = await requestMicrophonePermission()
      if (!granted) {
        return
      }
    }
    handleWakeWordDetected()
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
              <div className="mt-4 px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm">
                {error}
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
                {micPermission === 'granted' ? 'Tap to Speak' : micPermission === 'checking' ? 'Loading...' : 'Enable Microphone & Speak'}
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

          {/* Instructions */}
          <div className="text-center text-orange-100/50 text-xs sm:text-sm px-4">
            {wakeWordEnabled ? (
              <p>Say &quot;Hey KIAAN&quot; or tap the button to start</p>
            ) : (
              <p>Tap the button above to speak to KIAAN</p>
            )}
            <p className="mt-1">KIAAN uses ancient Gita wisdom to guide you</p>
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
