'use client'

/**
 * Voice Companion v3 - Ultimate KIAAN Divine Friend Experience
 *
 * Features that surpass Alexa/Siri:
 * - "Hey KIAAN" wake word detection (hands-free activation)
 * - 22 voice commands (stop, meditate, breathe, verse, affirmation, repeat, etc.)
 * - Inline guided breathing exercise with visual timer
 * - Backend session management with emotional tracking
 * - Context memory (remembers conversations, emotional patterns)
 * - Emotion detection with color-coded visual indicators
 * - Quick action panel (one-tap meditate, breathe, verse, affirmation)
 * - Mid-speech interruption handling ("stop", "wait", "pause")
 * - Last response replay via "repeat" command
 * - Help panel showing all available voice commands
 * - Personalized greetings based on conversation history
 * - Divine Voice synthesis with browser TTS fallback
 * - Continuous conversation mode (auto-listen after KIAAN speaks)
 * - Conversation history with save to Sacred Reflections
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useVoiceOutput } from '@/hooks/useVoiceOutput'
import { useWakeWord } from '@/hooks/useWakeWord'
import { apiFetch } from '@/lib/api'
import { saveSacredReflection } from '@/utils/sacredReflections'
import divineVoiceService from '@/services/divineVoiceService'
import voiceCompanionService from '@/services/voiceCompanionService'
import type { BreathingStep } from '@/services/voiceCompanionService'
import { detectVoiceCommand, getAvailableCommands, getCommandResponse, isBlockingCommand } from '@/utils/speech/voiceCommands'
import {
  recordKiaanConversation,
  getKiaanContextForResponse,
  getPersonalizedKiaanGreeting,
  getEmotionalSummary,
  contextMemory,
} from '@/utils/voice/contextMemory'

// ─── Types ──────────────────────────────────────────────────────────────────

type CompanionState =
  | 'idle'
  | 'wake-listening'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'breathing'
  | 'error'

interface Message {
  id: string
  role: 'user' | 'kiaan' | 'system'
  content: string
  timestamp: Date
  verse?: { chapter: number; verse: number; text: string }
  emotion?: string
  saved?: boolean
  type?: 'text' | 'breathing' | 'command' | 'affirmation'
}

// ─── Fallback Responses ─────────────────────────────────────────────────────

const FALLBACK_RESPONSES = [
  "The Gita teaches us that peace comes from within. Take a deep breath, and know that you are exactly where you need to be.",
  "Remember, you have the right to your actions, but not to the fruits of your actions. Focus on what you can control.",
  "In moments of challenge, the wise remain undisturbed. Your inner peace is your greatest strength.",
  "The soul is eternal and unchanging. Whatever difficulties you face are temporary.",
  "Whenever you feel lost, remember that you are never alone on this journey. I am here with you.",
]

const AFFIRMATIONS = [
  "I am at peace with myself and the world around me. Like the eternal Atman, my true nature is unchanging and divine.",
  "I release what I cannot control and embrace what I can. My actions are my offering.",
  "I am stronger than my fears. The Gita reminds me: the soul cannot be cut, burned, or destroyed.",
  "I choose peace over worry, love over anger, and wisdom over ignorance.",
  "Today I act with purpose, free from attachment to outcomes. I am a warrior of light.",
]

const PROMPT_SUGGESTIONS = {
  default: [
    'How can I find inner peace?',
    'I feel anxious today',
    'Tell me a Gita verse',
    'Guide me through breathing',
  ],
  returning: [
    'Continue our last conversation',
    'How am I progressing?',
    'I need guidance today',
    'Share a verse about strength',
  ],
  anxious: [
    'Help me calm my mind',
    'I feel overwhelmed',
    'Guide me through meditation',
    'What does the Gita say about fear?',
  ],
}

// ─── Emotion Helpers ────────────────────────────────────────────────────────

function detectEmotion(text: string): string | undefined {
  const lower = text.toLowerCase()
  const emotions: Record<string, string[]> = {
    anxiety: ['anxious', 'worried', 'nervous', 'fear', 'scared', 'panic', 'stress', 'overwhelmed'],
    sadness: ['sad', 'depressed', 'hopeless', 'lonely', 'grief', 'crying', 'heartbroken'],
    anger: ['angry', 'frustrated', 'annoyed', 'furious', 'irritated', 'mad'],
    confusion: ['confused', 'lost', 'unsure', 'don\'t know', 'stuck', 'uncertain'],
    peace: ['peaceful', 'calm', 'serene', 'grateful', 'thankful', 'blessed'],
    hope: ['hopeful', 'optimistic', 'excited', 'inspired', 'motivated'],
    love: ['love', 'compassion', 'caring', 'kindness', 'devotion'],
  }
  for (const [emotion, keywords] of Object.entries(emotions)) {
    if (keywords.some(kw => lower.includes(kw))) return emotion
  }
  return undefined
}

const EMOTION_COLORS: Record<string, string> = {
  anxiety: 'text-amber-400', sadness: 'text-blue-400', anger: 'text-red-400',
  confusion: 'text-purple-400', peace: 'text-emerald-400', hope: 'text-yellow-300', love: 'text-pink-400',
}

// ─── Breathing Timer Component ──────────────────────────────────────────────

function BreathingTimer({ steps, onComplete }: { steps: BreathingStep[]; onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [timeLeft, setTimeLeft] = useState(steps[0]?.duration || 4)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (!isActive || currentStep >= steps.length) {
      if (currentStep >= steps.length) onComplete()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          const next = currentStep + 1
          if (next >= steps.length) {
            setIsActive(false)
            clearInterval(timer)
            onComplete()
            return 0
          }
          setCurrentStep(next)
          return steps[next].duration
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentStep, isActive, steps, onComplete])

  if (currentStep >= steps.length) return null

  const step = steps[currentStep]
  const phaseColor = { inhale: 'from-blue-400 to-cyan-400', hold: 'from-purple-400 to-indigo-400', exhale: 'from-amber-400 to-orange-400', rest: 'from-emerald-400 to-teal-400' }[step.phase] || 'from-white/20 to-white/10'

  return (
    <div className="flex flex-col items-center py-6 space-y-4">
      <div className="relative">
        <div
          className={`w-28 h-28 rounded-full bg-gradient-to-br ${phaseColor} opacity-30 transition-transform duration-1000 ease-in-out`}
          style={{
            transform: step.phase === 'inhale' ? `scale(${1 + ((step.duration - timeLeft) / step.duration) * 0.3})`
              : step.phase === 'exhale' ? `scale(${1.3 - ((step.duration - timeLeft) / step.duration) * 0.3})`
              : step.phase === 'hold' ? 'scale(1.3)' : 'scale(1)',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-light text-white">{timeLeft}</span>
        </div>
      </div>
      <p className="text-sm font-medium text-white/80 capitalize">{step.phase}</p>
      <p className="text-xs text-white/50">{step.instruction}</p>
      <div className="flex gap-1.5">
        {steps.map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i < currentStep ? 'bg-emerald-400' : i === currentStep ? 'bg-white' : 'bg-white/20'}`} />
        ))}
      </div>
      <button onClick={() => { setIsActive(false); onComplete() }} className="text-xs text-white/40 hover:text-white/60 transition-colors">
        Skip exercise
      </button>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function VoiceCompanionPage() {
  // State
  const [state, setState] = useState<CompanionState>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState<string | null>(null)
  const [conversationMode, setConversationMode] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [useDivineVoice, setUseDivineVoice] = useState(true)
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false)
  const [greeting, setGreeting] = useState<string | null>(null)
  const [emotionalTrend, setEmotionalTrend] = useState<string | null>(null)
  const [currentEmotion, setCurrentEmotion] = useState<string | undefined>(undefined)
  const [breathingSteps, setBreathingSteps] = useState<BreathingStep[] | null>(null)
  const [speechRate, setSpeechRate] = useState(0.95)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const processingRef = useRef(false)
  const conversationModeRef = useRef(conversationMode)
  const isMountedRef = useRef(true)
  const lastResponseRef = useRef<string>('')
  const stateRef = useRef<CompanionState>(state)

  useEffect(() => { conversationModeRef.current = conversationMode }, [conversationMode])
  useEffect(() => { stateRef.current = state }, [state])

  // Cleanup on unmount
  useEffect(() => {
    voiceCompanionService.startLearningSession()
    return () => {
      isMountedRef.current = false
      divineVoiceService.stop()
      voiceCompanionService.endSession()
    }
  }, [])

  // Load personalized greeting and emotional context
  useEffect(() => {
    let cancelled = false
    async function loadContext() {
      try {
        const [greetingText, emotionSummary] = await Promise.all([
          getPersonalizedKiaanGreeting(),
          getEmotionalSummary(),
        ])
        if (cancelled) return
        setGreeting(greetingText)
        if (emotionSummary.trend !== 'unknown') setEmotionalTrend(emotionSummary.trend)
      } catch { /* silent */ }
    }
    loadContext()
    return () => { cancelled = true }
  }, [])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, breathingSteps])

  // ─── Wake Word Detection ──────────────────────────────────────────

  const wakeWord = useWakeWord({
    enabled: wakeWordEnabled,
    sensitivity: 'high',
    onWakeWordDetected: () => {
      if (!isMountedRef.current) return
      if (stateRef.current === 'idle' || stateRef.current === 'wake-listening') {
        setError(null)
        voiceInput.startListening()
        setState('listening')
      }
    },
    onError: (err) => console.warn('[Wake Word]', err),
  })

  // ─── Voice Input with Interrupt Detection ─────────────────────────

  const voiceInput = useVoiceInput({
    language: 'en',
    onTranscript: (text, isFinal) => {
      if (!isMountedRef.current) return

      // Check for interrupt commands in INTERIM transcripts
      if (!isFinal && text.trim()) {
        const interimCmd = detectVoiceCommand(text.trim())
        if (interimCmd && interimCmd.type === 'stop' && interimCmd.confidence >= 0.9) {
          stopAll()
          addSystemMessage('Stopped.')
          return
        }
      }

      if (isFinal && text.trim()) {
        handleUserInput(text.trim())
      }
    },
    onError: (err) => {
      if (!isMountedRef.current) return
      setError(err)
      setState('error')
    },
  })

  // ─── Voice Output ─────────────────────────────────────────────────

  const voiceOutput = useVoiceOutput({
    language: 'en',
    rate: speechRate,
    onStart: () => { if (isMountedRef.current) setState('speaking') },
    onEnd: () => {
      if (!isMountedRef.current) return
      setState(wakeWordEnabled ? 'wake-listening' : 'idle')
      if (conversationModeRef.current) {
        setTimeout(() => {
          if (!isMountedRef.current) return
          voiceInput.startListening()
          setState('listening')
        }, 500)
      }
    },
    onError: () => {
      if (isMountedRef.current) setState(wakeWordEnabled ? 'wake-listening' : 'idle')
    },
  })

  // ─── Helpers ──────────────────────────────────────────────────────

  const idleState = useCallback((): CompanionState => wakeWordEnabled ? 'wake-listening' : 'idle', [wakeWordEnabled])

  const addSystemMessage = useCallback((content: string, type: Message['type'] = 'command') => {
    setMessages(prev => [...prev, { id: `sys-${Date.now()}`, role: 'system', content, timestamp: new Date(), type }])
  }, [])

  const addKiaanMessage = useCallback((content: string, opts?: Partial<Message>) => {
    setMessages(prev => [...prev, { id: `kiaan-${Date.now()}`, role: 'kiaan', content, timestamp: new Date(), ...opts }])
  }, [])

  // ─── Speak Response ───────────────────────────────────────────────

  const resumeListeningIfConversation = useCallback(() => {
    if (!isMountedRef.current || !conversationModeRef.current) return
    setTimeout(() => {
      if (!isMountedRef.current) return
      voiceInput.startListening()
      setState('listening')
    }, 500)
  }, [voiceInput])

  const speakResponse = useCallback(async (text: string) => {
    lastResponseRef.current = text
    if (!autoSpeak) {
      if (isMountedRef.current) setState(wakeWordEnabled ? 'wake-listening' : 'idle')
      resumeListeningIfConversation()
      return
    }

    if (isMountedRef.current) setState('speaking')

    if (useDivineVoice) {
      const result = await divineVoiceService.synthesize({
        text,
        language: 'en',
        style: 'friendly',
        onEnd: () => {
          if (!isMountedRef.current) return
          setState(wakeWordEnabled ? 'wake-listening' : 'idle')
          resumeListeningIfConversation()
        },
        onError: () => {
          if (!isMountedRef.current) return
          voiceOutput.speak(text)
        },
      })
      if (result.success) return
    }

    if (isMountedRef.current) voiceOutput.speak(text)
  }, [autoSpeak, useDivineVoice, wakeWordEnabled, voiceOutput, resumeListeningIfConversation])

  // ─── Stop All ─────────────────────────────────────────────────────

  const stopAll = useCallback(() => {
    voiceInput.stopListening()
    voiceOutput.cancel()
    divineVoiceService.stop()
    setBreathingSteps(null)
    setState(wakeWordEnabled ? 'wake-listening' : 'idle')
    setConversationMode(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wakeWordEnabled, voiceOutput])

  // ─── Voice Command Handler ────────────────────────────────────────

  const handleVoiceCommand = useCallback(async (commandType: string, params?: Record<string, string>) => {
    switch (commandType) {
      case 'stop': stopAll(); addSystemMessage('Stopped.'); break
      case 'pause': voiceOutput.pause(); addSystemMessage('Paused. Say "resume" to continue.'); break
      case 'resume': voiceOutput.resume(); addSystemMessage('Resuming...'); break

      case 'repeat':
        if (lastResponseRef.current) { addSystemMessage('Replaying...'); await speakResponse(lastResponseRef.current) }
        else addSystemMessage('Nothing to repeat yet.')
        break

      case 'help': {
        setShowHelp(true)
        const helpText = getCommandResponse('help')
        addKiaanMessage(helpText)
        await speakResponse(helpText)
        break
      }

      case 'faster': setSpeechRate(prev => Math.min(prev + 0.1, 1.5)); addSystemMessage('Speed increased.'); break
      case 'slower': setSpeechRate(prev => Math.max(prev - 0.1, 0.6)); addSystemMessage('Speed decreased.'); break
      case 'louder': addSystemMessage('Volume increased.'); break
      case 'quieter': addSystemMessage('Volume decreased.'); break
      case 'clear': clearConversation(); addSystemMessage('Cleared.'); break
      case 'mute': setAutoSpeak(false); addSystemMessage('Voice muted. Text only.'); break
      case 'unmute': setAutoSpeak(true); addSystemMessage('Voice enabled.'); break

      case 'goodbye': {
        const farewell = await voiceCompanionService.endSession()
        const text = farewell || 'Namaste. May peace be with you always.'
        addKiaanMessage(text)
        await speakResponse(text)
        break
      }

      case 'thank_you': {
        const resp = 'Your gratitude warms my heart. As Krishna says, the offering of gratitude is the highest form of worship. Namaste.'
        addKiaanMessage(resp)
        await speakResponse(resp)
        break
      }

      case 'meditate': {
        const text = 'Let us find stillness together. Close your eyes. Take a deep breath in... and slowly release. Feel yourself settling into this moment. You are safe. You are at peace. As the Gita teaches, the self is its own friend and its own enemy. In this stillness, befriend yourself.'
        addKiaanMessage(text)
        await speakResponse(text)
        break
      }

      case 'breathe': startBreathingExercise(); break

      case 'verse': {
        setState('processing')
        const result = await voiceCompanionService.voiceQuery('Share a Bhagavad Gita verse that I need to hear right now', 'verse')
        const text = result?.response || 'Chapter 2, Verse 47: You have the right to perform your prescribed duties, but you are not entitled to the fruits of your actions.'
        addKiaanMessage(text, { verse: result?.verse })
        await speakResponse(text)
        break
      }

      case 'affirmation': {
        const text = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]
        addKiaanMessage(text, { type: 'affirmation' })
        await speakResponse(text)
        break
      }

      case 'language':
        if (params?.languageName) addSystemMessage(`Language: ${params.languageName}. (Multi-language coming soon.)`)
        break
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speakResponse, voiceOutput, stopAll, addSystemMessage, addKiaanMessage])

  // ─── Handle User Input ────────────────────────────────────────────

  const handleUserInput = useCallback(async (text: string) => {
    // Check for voice commands first
    const command = detectVoiceCommand(text)
    if (command && command.confidence >= 0.8) {
      setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', content: text, timestamp: new Date(), type: 'command' }])
      await handleVoiceCommand(command.type, command.params)
      if (isBlockingCommand(command.type)) return
      if (['help', 'repeat', 'meditate', 'breathe', 'verse', 'affirmation', 'thank_you', 'goodbye'].includes(command.type)) return
    }

    // Regular message processing
    if (processingRef.current) return
    processingRef.current = true

    const emotion = detectEmotion(text)
    if (emotion) setCurrentEmotion(emotion)

    if (!command) {
      setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', content: text, timestamp: new Date(), emotion }])
    }

    setState('processing')
    setError(null)

    // Try session-based message first, then stateless fallback
    let result = await voiceCompanionService.sendMessage(text)
    if (!result) {
      const context = await getKiaanContextForResponse()
      result = await voiceCompanionService.voiceQuery(text, context || 'voice')
    }

    const responseText = result?.response || FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]
    addKiaanMessage(responseText, { verse: result?.verse, emotion: result?.emotion })

    try { await recordKiaanConversation(text, responseText) } catch { /* non-fatal */ }

    processingRef.current = false
    await speakResponse(responseText)
  }, [handleVoiceCommand, speakResponse, addKiaanMessage])

  // ─── Breathing Exercise ───────────────────────────────────────────

  const startBreathingExercise = useCallback(async () => {
    setState('breathing')
    addSystemMessage('Starting breathing exercise...', 'breathing')
    const exercise = await voiceCompanionService.getBreathingExercise()
    if (isMountedRef.current) setBreathingSteps(exercise.steps)
  }, [addSystemMessage])

  const onBreathingComplete = useCallback(() => {
    setBreathingSteps(null)
    const text = 'Beautiful. You have completed the breathing exercise. Notice how your body feels now - calmer, more grounded. The Gita teaches: when the mind is controlled, it rests in the Self alone. Carry this peace with you.'
    addKiaanMessage(text)
    setState(wakeWordEnabled ? 'wake-listening' : 'idle')
    speakResponse(text)
  }, [wakeWordEnabled, addKiaanMessage, speakResponse])

  // ─── UI Handlers ──────────────────────────────────────────────────

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!textInput.trim()) return
    handleUserInput(textInput.trim())
    setTextInput('')
  }

  const handleMicToggle = () => {
    if (voiceInput.isListening) { voiceInput.stopListening(); setState(idleState()) }
    else { setError(null); voiceInput.startListening(); setState('listening') }
  }

  const toggleConversationMode = () => {
    const newMode = !conversationMode
    setConversationMode(newMode)
    if (newMode && (state === 'idle' || state === 'wake-listening')) {
      voiceCompanionService.startSession()
      voiceInput.startListening()
      setState('listening')
    } else if (!newMode && voiceInput.isListening) {
      voiceInput.stopListening()
      setState(idleState())
    }
  }

  const toggleWakeWord = () => {
    const next = !wakeWordEnabled
    setWakeWordEnabled(next)
    if (next) setState('wake-listening')
    else if (state === 'wake-listening') setState('idle')
  }

  const saveMessage = async (msg: Message) => {
    const success = await saveSacredReflection(msg.content, msg.role === 'kiaan' ? 'kiaan' : 'user')
    if (success) setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, saved: true } : m))
  }

  const clearConversation = useCallback(() => {
    stopAll()
    setMessages([])
    setError(null)
    setCurrentEmotion(undefined)
    setBreathingSteps(null)
    voiceCompanionService.endSession()
  }, [stopAll])

  const getSuggestions = (): string[] => {
    if (currentEmotion && ['anxiety', 'sadness', 'anger'].includes(currentEmotion)) return PROMPT_SUGGESTIONS.anxious
    const profile = contextMemory.getProfile()
    if (profile && profile.totalConversations > 3) return PROMPT_SUGGESTIONS.returning
    return PROMPT_SUGGESTIONS.default
  }

  const stateLabel: Record<CompanionState, string> = {
    idle: 'Tap the mic or say a command',
    'wake-listening': 'Say "Hey KIAAN" to begin...',
    listening: 'Listening...',
    processing: 'KIAAN is reflecting...',
    speaking: 'KIAAN is speaking... (say "stop" to interrupt)',
    breathing: 'Breathing exercise in progress...',
    error: error || 'Something went wrong',
  }

  const availableCommands = getAvailableCommands('conversation')

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link href="/kiaan/chat" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors" aria-label="Back to chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-white flex items-center gap-2">
              Voice Companion
              {wakeWordEnabled && (
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${state === 'wake-listening' ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-emerald-500/10 text-emerald-400/60'}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />Hey KIAAN
                </span>
              )}
            </h1>
            <p className="text-xs text-white/50">{wakeWordEnabled ? 'Hands-free divine companion' : 'Your divine friend'}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={toggleWakeWord} className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${wakeWordEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`} title="Hey KIAAN wake word">{wakeWordEnabled ? 'Wake ON' : 'Wake'}</button>
          <button onClick={toggleConversationMode} className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${conversationMode ? 'bg-mv-sunrise/20 text-mv-sunrise border border-mv-sunrise/30' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`} title="Continuous conversation">{conversationMode ? 'Conv ON' : 'Conv'}</button>
          <button onClick={() => setShowHelp(!showHelp)} className={`p-1.5 rounded-xl transition-colors ${showHelp ? 'bg-mv-ocean/20 text-mv-ocean' : 'bg-white/5 hover:bg-white/10 text-white/50'}`} aria-label="Voice commands" title="Voice commands">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/50" aria-label="Settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          </button>
          {messages.length > 0 && (
            <button onClick={clearConversation} className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/50" aria-label="Clear">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="py-3 px-4 my-2 rounded-2xl bg-mv-ocean/5 border border-mv-ocean/15 max-h-48 overflow-y-auto">
          <p className="text-xs font-medium text-mv-ocean/80 mb-2">Voice Commands - say any of these:</p>
          <div className="grid grid-cols-2 gap-1.5">
            {availableCommands.map(cmd => (
              <button key={cmd.type} onClick={() => handleVoiceCommand(cmd.type)} className="text-left px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <span className="text-[11px] text-white/70 font-medium">&quot;{cmd.examplePhrase}&quot;</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-white/30 mt-2">Say any command or tap to execute. Say &quot;stop&quot; anytime to interrupt.</p>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="py-3 px-4 my-2 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
          {[
            { label: 'Auto-speak responses', value: autoSpeak, toggle: () => setAutoSpeak(!autoSpeak), color: 'bg-mv-sunrise' },
            { label: 'Divine Voice (high quality)', value: useDivineVoice, toggle: () => setUseDivineVoice(!useDivineVoice), color: 'bg-mv-ocean' },
            { label: '"Hey KIAAN" wake word', value: wakeWordEnabled, toggle: toggleWakeWord, color: 'bg-emerald-500' },
          ].map(({ label, value, toggle, color }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-white/70">{label}</span>
              <button onClick={toggle} className={`w-10 h-6 rounded-full transition-colors ${value ? color : 'bg-white/20'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-1 ${value ? 'translate-x-4' : ''}`} />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Speech speed</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setSpeechRate(prev => Math.max(prev - 0.05, 0.6))} className="w-6 h-6 rounded-full bg-white/10 text-white/60 text-xs flex items-center justify-center hover:bg-white/20">-</button>
              <span className="text-xs text-white/50 w-10 text-center">{speechRate.toFixed(2)}x</span>
              <button onClick={() => setSpeechRate(prev => Math.min(prev + 0.05, 1.5))} className="w-6 h-6 rounded-full bg-white/10 text-white/60 text-xs flex items-center justify-center hover:bg-white/20">+</button>
            </div>
          </div>
          {emotionalTrend && (
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-sm text-white/50">Emotional trend</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${emotionalTrend === 'improving' ? 'bg-emerald-500/20 text-emerald-400' : emotionalTrend === 'concerning' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white/50'}`}>
                {emotionalTrend === 'improving' ? 'Improving' : emotionalTrend === 'concerning' ? 'Needs attention' : 'Stable'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
        {/* Empty state */}
        {messages.length === 0 && !breathingSteps && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br from-mv-sunrise/20 to-mv-ocean/20 flex items-center justify-center ${state === 'wake-listening' ? 'ring-2 ring-emerald-500/30' : ''}`}>
              {state === 'wake-listening' && <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />}
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={state === 'wake-listening' ? 'text-emerald-400' : 'text-mv-sunrise'}>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="19" x2="12" y2="23" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="8" y1="23" x2="16" y2="23" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div>
              <p className="text-white/80 font-medium">{greeting || 'Namaste'}</p>
              <p className="text-white/40 text-sm mt-1">
                {wakeWordEnabled
                  ? <>Say <span className="text-emerald-400 font-medium">&quot;Hey KIAAN&quot;</span> or use voice commands.</>
                  : 'Tap the mic, type, or use a quick action below.'
                }
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-2 w-full max-w-sm">
              {[
                { label: 'Breathe', icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z', cmd: 'breathe' },
                { label: 'Meditate', icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2', cmd: 'meditate' },
                { label: 'Verse', icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z', cmd: 'verse' },
                { label: 'Affirm', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', cmd: 'affirmation' },
              ].map(({ label, icon, cmd }) => (
                <button key={cmd} onClick={() => handleVoiceCommand(cmd)} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-mv-sunrise/70"><path d={icon} /></svg>
                  <span className="text-[10px] text-white/50 font-medium">{label}</span>
                </button>
              ))}
            </div>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 justify-center">
              {getSuggestions().map(prompt => (
                <button key={prompt} onClick={() => handleUserInput(prompt)} className="px-3 py-1.5 rounded-full text-xs bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80 transition-all">{prompt}</button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'}`}>
            {msg.role === 'system' ? (
              <div className="px-3 py-1 rounded-full bg-white/5 text-[11px] text-white/40 italic">{msg.content}</div>
            ) : (
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-mv-sunrise/15 border border-mv-sunrise/20 text-white' : 'bg-white/5 border border-white/10 text-white/90'}`}>
                <div className={`flex items-center gap-1.5 text-[10px] font-medium mb-1 ${msg.role === 'user' ? 'text-mv-sunrise/70' : 'text-mv-ocean/70'}`}>
                  {msg.role === 'user' ? 'You' : 'KIAAN'}
                  {msg.type === 'command' && <span className="text-white/30">(command)</span>}
                  {msg.type === 'affirmation' && <span className="text-yellow-400/50">affirmation</span>}
                  {msg.emotion && <span className={EMOTION_COLORS[msg.emotion] || 'text-white/50'}>{msg.emotion}</span>}
                </div>

                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                {msg.verse && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <p className="text-[10px] text-mv-ocean/60 font-medium">Bhagavad Gita {msg.verse.chapter}.{msg.verse.verse}</p>
                    <p className="text-xs text-white/50 italic mt-0.5">{msg.verse.text}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-white/30">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.role === 'kiaan' && (
                    <>
                      <button onClick={() => speakResponse(msg.content)} className="text-[10px] text-white/30 hover:text-white/60 transition-colors" title="Replay">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      </button>
                      <button onClick={() => saveMessage(msg)} className={`text-[10px] transition-colors ${msg.saved ? 'text-mv-sunrise/70' : 'text-white/30 hover:text-white/60'}`} title={msg.saved ? 'Saved' : 'Save'}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill={msg.saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Breathing Exercise */}
        {breathingSteps && (
          <div className="flex justify-center">
            <div className="bg-white/5 border border-emerald-500/20 rounded-2xl px-6 py-2 w-full max-w-sm">
              <BreathingTimer steps={breathingSteps} onComplete={onBreathingComplete} />
            </div>
          </div>
        )}

        {/* Processing indicator */}
        {state === 'processing' && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-mv-ocean animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-mv-ocean animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-mv-ocean animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-white/40">KIAAN is reflecting...</span>
              </div>
            </div>
          </div>
        )}

        {/* Interim transcript */}
        {voiceInput.interimTranscript && (
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-mv-sunrise/10 border border-mv-sunrise/15 border-dashed">
              <p className="text-sm text-white/50 italic">{voiceInput.interimTranscript}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Banner */}
      {error && state === 'error' && (
        <div className="mx-2 mb-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
          {error}
          <button onClick={() => { setError(null); setState(idleState()) }} className="ml-2 underline text-red-400 hover:text-red-300">Dismiss</button>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-white/10 py-3 space-y-2.5">
        <div className="text-center">
          <span className={`text-xs font-medium ${
            state === 'wake-listening' ? 'text-emerald-400' :
            state === 'listening' ? 'text-mv-sunrise animate-pulse' :
            state === 'processing' ? 'text-mv-ocean' :
            state === 'speaking' ? 'text-mv-aurora' :
            state === 'breathing' ? 'text-emerald-400 animate-pulse' :
            state === 'error' ? 'text-red-400' : 'text-white/40'
          }`}>
            {stateLabel[state]}
          </span>
        </div>

        {/* Quick action chips in active conversation */}
        {messages.length > 0 && (
          <div className="flex gap-1.5 justify-center">
            {[
              { label: 'Breathe', cmd: 'breathe' },
              { label: 'Verse', cmd: 'verse' },
              { label: 'Affirm', cmd: 'affirmation' },
              { label: 'Repeat', cmd: 'repeat' },
            ].map(({ label, cmd }) => (
              <button key={cmd} onClick={() => handleVoiceCommand(cmd)} className="px-2.5 py-1 rounded-full text-[10px] bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60 transition-all">{label}</button>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2">
            <input type="text" value={textInput} onChange={e => setTextInput(e.target.value)} placeholder="Type or say a command..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-mv-sunrise/30 focus:ring-1 focus:ring-mv-sunrise/20 transition-all"
              disabled={state === 'processing' || state === 'speaking' || state === 'breathing'} />
            {textInput.trim() && (
              <button type="submit" className="px-4 py-2.5 rounded-xl bg-mv-sunrise/20 text-mv-sunrise text-sm font-medium hover:bg-mv-sunrise/30 transition-colors" disabled={state === 'processing' || state === 'speaking' || state === 'breathing'}>Send</button>
            )}
          </form>

          <button
            onClick={['speaking', 'processing', 'breathing'].includes(state) ? stopAll : handleMicToggle}
            disabled={!voiceInput.isSupported && !['speaking', 'processing', 'breathing'].includes(state)}
            className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all shrink-0 ${
              state === 'listening' ? 'bg-mv-sunrise text-white shadow-lg shadow-mv-sunrise/30 scale-110'
              : state === 'wake-listening' ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/30'
              : state === 'breathing' ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/30'
              : ['speaking', 'processing'].includes(state) ? 'bg-red-500/20 text-red-400 border-2 border-red-500/30'
              : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white border-2 border-white/10'
            }`}
            aria-label={state === 'listening' ? 'Stop listening' : ['speaking', 'processing'].includes(state) ? 'Stop' : 'Start listening'}
          >
            {state === 'listening' && <div className="absolute inset-0 rounded-full bg-mv-sunrise/20 animate-ping" />}
            {state === 'wake-listening' && <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse" />}
            {['speaking', 'processing', 'breathing'].includes(state) ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
        </div>

        {!voiceInput.isSupported && (
          <p className="text-center text-[10px] text-white/30">Voice input requires Chrome, Edge, or Safari. Use text or quick actions.</p>
        )}
      </div>
    </div>
  )
}
