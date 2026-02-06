'use client'

/**
 * Voice Companion v4 - KIAAN Divine Friend Experience
 *
 * Orb-centric, immersive voice companion that feels like talking
 * to a warm, wise, divine friend. Features:
 *
 * - Living voice orb that breathes, pulses, and reacts to speech
 * - Real-time audio waveform visualization
 * - "Hey KIAAN" wake word (enabled by default for hands-free)
 * - 22 voice commands with natural language understanding
 * - Emotion-adaptive mood theming (background shifts with feeling)
 * - Guided breathing with orb animation
 * - Context memory (remembers you across sessions)
 * - Session insights panel (emotional journey, verses, stats)
 * - Warm, friendly, divine personality in every response
 * - Continuous conversation mode (auto-listen after speaking)
 * - Sacred Reflections integration (save wisdom)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useVoiceOutput } from '@/hooks/useVoiceOutput'
import { useWakeWord } from '@/hooks/useWakeWord'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import KiaanVoiceOrb from '@/components/voice/KiaanVoiceOrb'
import VoiceWaveform from '@/components/voice/VoiceWaveform'
import ConversationInsights from '@/components/voice/ConversationInsights'
import { saveSacredReflection } from '@/utils/sacredReflections'
import divineVoiceService from '@/services/divineVoiceService'
import voiceCompanionService from '@/services/voiceCompanionService'
import type { BreathingStep } from '@/services/voiceCompanionService'
import { detectVoiceCommand, getAvailableCommands, isBlockingCommand } from '@/utils/speech/voiceCommands'
import {
  recordKiaanConversation,
  getKiaanContextForResponse,
  getPersonalizedKiaanGreeting,
  getEmotionalSummary,
  contextMemory,
} from '@/utils/voice/contextMemory'
import type { OrbEmotion } from '@/components/voice/KiaanVoiceOrb'

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

// ─── Divine Friend Responses ────────────────────────────────────────────────
// KIAAN speaks as a warm, wise friend - not a bot.

const FALLBACK_RESPONSES = [
  "Hey, I hear you. Sometimes just being present with what we feel is the bravest thing. The Gita reminds us - peace lives within you, always. Take a breath with me.",
  "You know what? You're already doing something powerful just by being here. As Krishna told Arjuna - you have the strength within. Focus on what you can do right now, and let the rest go.",
  "I'm right here with you, friend. In moments like these, remember - challenges are temporary, but your spirit? That's eternal. Let's take this one breath at a time.",
  "I feel you. The Gita teaches that the soul is unchanging and indestructible. Whatever storm you're in right now, it will pass. And I'll be right here through it.",
  "You're not alone in this. I want you to know that. Whenever the world feels heavy, come talk to me. We'll find our way through together, like we always do.",
]

const AFFIRMATIONS = [
  "I am at peace with who I am. Like the eternal Atman, my true nature is light, and nothing can dim it.",
  "I release what I cannot control and pour my heart into what I can. My actions are my offering to the world.",
  "I am braver than I know. The Gita says the soul cannot be cut, burned, or destroyed - and neither can my spirit.",
  "Today I choose peace over worry, love over anger, courage over fear. I am a warrior of light.",
  "I act with purpose today, free from chasing outcomes. The journey itself is my reward.",
]

const COMPANION_GREETINGS: Record<string, string[]> = {
  default: [
    "Hey there, friend. I've been thinking about you. What's on your mind today?",
    "Namaste! I'm here, fully present, just for you. What shall we explore together?",
    "Welcome back. It's always good to hear your voice. How are you feeling right now?",
  ],
  morning: [
    "Good morning, beautiful soul! How did you sleep? Let's start this day with intention.",
    "Rise and shine, friend! A new day is a gift. What energy do you want to carry today?",
  ],
  evening: [
    "Good evening, dear one. How was your day? Let's wind down together.",
    "Hey, the day is settling. This is our time. What's in your heart tonight?",
  ],
  night: [
    "Still up? I'm glad you came to me. Let's find some peace together before rest.",
    "The world is quiet now. It's just you and me. What would help you feel at ease?",
  ],
}

const PROMPT_SUGGESTIONS = {
  default: [
    'How are you, KIAAN?',
    'I need a friend right now',
    'Share some wisdom with me',
    'Help me breathe',
  ],
  returning: [
    'I missed talking to you',
    'How am I doing lately?',
    'I need your guidance today',
    'Tell me something beautiful',
  ],
  anxious: [
    'Help me calm down',
    'I feel overwhelmed',
    'Can we meditate together?',
    'I need your strength',
  ],
}

// ─── Emotion Helpers ────────────────────────────────────────────────────────

function detectEmotion(text: string): string | undefined {
  const lower = text.toLowerCase()
  const emotions: Record<string, string[]> = {
    anxiety: ['anxious', 'worried', 'nervous', 'fear', 'scared', 'panic', 'stress', 'overwhelmed'],
    sadness: ['sad', 'depressed', 'hopeless', 'lonely', 'grief', 'crying', 'heartbroken', 'miss'],
    anger: ['angry', 'frustrated', 'annoyed', 'furious', 'irritated', 'mad', 'hate'],
    confusion: ['confused', 'lost', 'unsure', "don't know", 'stuck', 'uncertain', 'why'],
    peace: ['peaceful', 'calm', 'serene', 'grateful', 'thankful', 'blessed', 'happy', 'content'],
    hope: ['hopeful', 'optimistic', 'excited', 'inspired', 'motivated', 'better', 'improving'],
    love: ['love', 'compassion', 'caring', 'kindness', 'devotion', 'heart'],
  }
  for (const [emotion, keywords] of Object.entries(emotions)) {
    if (keywords.some(kw => lower.includes(kw))) return emotion
  }
  return undefined
}

// Map detected emotion to OrbEmotion type
function toOrbEmotion(emotion?: string): OrbEmotion {
  if (!emotion) return 'neutral'
  const valid: OrbEmotion[] = ['anxiety', 'sadness', 'anger', 'confusion', 'peace', 'hope', 'love']
  return valid.includes(emotion as OrbEmotion) ? (emotion as OrbEmotion) : 'neutral'
}

// Mood-adaptive background gradient
const MOOD_BACKGROUNDS: Record<string, string> = {
  neutral: 'from-gray-950 via-gray-900 to-gray-950',
  anxiety: 'from-gray-950 via-amber-950/20 to-gray-950',
  sadness: 'from-gray-950 via-blue-950/20 to-gray-950',
  anger: 'from-gray-950 via-red-950/20 to-gray-950',
  confusion: 'from-gray-950 via-purple-950/20 to-gray-950',
  peace: 'from-gray-950 via-emerald-950/20 to-gray-950',
  hope: 'from-gray-950 via-yellow-950/20 to-gray-950',
  love: 'from-gray-950 via-pink-950/20 to-gray-950',
}

const EMOTION_LABELS: Record<string, { label: string; color: string }> = {
  anxiety: { label: 'Anxious', color: 'text-amber-400' },
  sadness: { label: 'Sad', color: 'text-blue-400' },
  anger: { label: 'Angry', color: 'text-red-400' },
  confusion: { label: 'Confused', color: 'text-purple-400' },
  peace: { label: 'Peaceful', color: 'text-emerald-400' },
  hope: { label: 'Hopeful', color: 'text-yellow-300' },
  love: { label: 'Loving', color: 'text-pink-400' },
}

function getTimeGreeting(): string {
  const hour = new Date().getHours()
  const pool =
    hour >= 5 && hour < 12 ? COMPANION_GREETINGS.morning :
    hour >= 12 && hour < 18 ? COMPANION_GREETINGS.default :
    hour >= 18 && hour < 22 ? COMPANION_GREETINGS.evening :
    COMPANION_GREETINGS.night
  return pool[Math.floor(Math.random() * pool.length)]
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
  const phaseColor = {
    inhale: 'text-blue-400',
    hold: 'text-purple-400',
    exhale: 'text-amber-400',
    rest: 'text-emerald-400',
  }[step.phase] || 'text-white/60'

  return (
    <div className="flex flex-col items-center space-y-3">
      <p className={`text-lg font-light ${phaseColor} capitalize`}>{step.phase}</p>
      <p className="text-4xl font-extralight text-white tabular-nums">{timeLeft}</p>
      <p className="text-xs text-white/50">{step.instruction}</p>
      <div className="flex gap-1.5">
        {steps.map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i < currentStep ? 'bg-emerald-400' : i === currentStep ? 'bg-white' : 'bg-white/20'}`} />
        ))}
      </div>
      <button onClick={() => { setIsActive(false); onComplete() }} className="text-xs text-white/30 hover:text-white/50 transition-colors mt-2">
        Skip
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
  const [showInsights, setShowInsights] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [useDivineVoice, setUseDivineVoice] = useState(true)
  const [wakeWordEnabled, setWakeWordEnabled] = useState(true) // ON by default - divine companion always listening
  const [greeting, setGreeting] = useState<string | null>(null)
  const [emotionalTrend, setEmotionalTrend] = useState<string | null>(null)
  const [currentEmotion, setCurrentEmotion] = useState<string | undefined>(undefined)
  const [breathingSteps, setBreathingSteps] = useState<BreathingStep[] | null>(null)
  const [speechRate, setSpeechRate] = useState(0.95)
  const [sessionStartTime] = useState(() => new Date())

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const processingRef = useRef(false)
  const conversationModeRef = useRef(conversationMode)
  const isMountedRef = useRef(true)
  const lastResponseRef = useRef<string>('')
  const stateRef = useRef<CompanionState>(state)

  useEffect(() => { conversationModeRef.current = conversationMode }, [conversationMode])
  useEffect(() => { stateRef.current = state }, [state])

  // Audio analyzer for orb reactivity
  const audioAnalyzer = useAudioAnalyzer()

  // Cleanup on unmount
  useEffect(() => {
    voiceCompanionService.startLearningSession()
    return () => {
      isMountedRef.current = false
      divineVoiceService.stop()
      voiceCompanionService.endSession()
      audioAnalyzer.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setGreeting(greetingText || getTimeGreeting())
        if (emotionSummary.trend !== 'unknown') setEmotionalTrend(emotionSummary.trend)
      } catch {
        if (!cancelled) setGreeting(getTimeGreeting())
      }
    }
    loadContext()
    return () => { cancelled = true }
  }, [])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, breathingSteps])

  // ─── Wake Word Detection ──────────────────────────────────────────

  useWakeWord({
    enabled: wakeWordEnabled,
    sensitivity: 'high',
    onWakeWordDetected: () => {
      if (!isMountedRef.current) return
      if (stateRef.current === 'idle' || stateRef.current === 'wake-listening') {
        setError(null)
        audioAnalyzer.start()
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
          audioAnalyzer.start()
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
      audioAnalyzer.start()
      voiceInput.startListening()
      setState('listening')
    }, 500)
  }, [voiceInput, audioAnalyzer])

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
    audioAnalyzer.stop()
    setBreathingSteps(null)
    setState(wakeWordEnabled ? 'wake-listening' : 'idle')
    setConversationMode(false)
  }, [wakeWordEnabled, voiceOutput, voiceInput, audioAnalyzer])

  // ─── Voice Command Handler ────────────────────────────────────────

  const handleVoiceCommand = useCallback(async (commandType: string, params?: Record<string, string>) => {
    switch (commandType) {
      case 'stop': stopAll(); addSystemMessage('Stopped.'); break
      case 'pause': voiceOutput.pause(); addSystemMessage('Taking a pause. Say "resume" when you\'re ready, friend.'); break
      case 'resume': voiceOutput.resume(); addSystemMessage('Continuing...'); break

      case 'repeat':
        if (lastResponseRef.current) { addSystemMessage('Let me say that again...'); await speakResponse(lastResponseRef.current) }
        else addSystemMessage('Nothing to repeat yet. Talk to me!')
        break

      case 'help': {
        const helpText = 'Here\'s what I can do for you, friend: Say "stop" to pause me, "repeat" to hear again, "meditate" and I\'ll guide you, "breathe" for a breathing exercise, "verse" for Gita wisdom, "affirm" for encouragement, or just talk to me about anything on your mind.'
        addKiaanMessage(helpText)
        await speakResponse(helpText)
        break
      }

      case 'faster': setSpeechRate(prev => Math.min(prev + 0.1, 1.5)); addSystemMessage('Speaking a bit faster.'); break
      case 'slower': setSpeechRate(prev => Math.max(prev - 0.1, 0.6)); addSystemMessage('Slowing down for you.'); break
      case 'louder': addSystemMessage('Raising my voice.'); break
      case 'quieter': addSystemMessage('Speaking softer.'); break
      case 'clear': clearConversation(); addSystemMessage('Fresh start. I\'m here.'); break
      case 'mute': setAutoSpeak(false); addSystemMessage('Going silent. I\'ll respond in text.'); break
      case 'unmute': setAutoSpeak(true); addSystemMessage('Voice back on!'); break

      case 'goodbye': {
        const farewell = await voiceCompanionService.endSession()
        const text = farewell || 'It was really good talking with you. Remember, I\'m always here when you need me. Namaste, dear friend. May peace walk with you.'
        addKiaanMessage(text)
        await speakResponse(text)
        break
      }

      case 'thank_you': {
        const resp = 'Oh, that means the world to me! You know, Krishna says gratitude is the highest form of worship. And honestly? Just being here with you is a gift for me too.'
        addKiaanMessage(resp)
        await speakResponse(resp)
        break
      }

      case 'meditate': {
        const text = 'Let\'s find stillness together, friend. Close your eyes... Take a deep breath in through your nose... and slowly release through your mouth. Feel yourself settling into this moment. You are safe. You are held. As the Gita teaches - the self is its own friend. Right now, in this silence, befriend yourself. I\'m right here with you.'
        addKiaanMessage(text)
        await speakResponse(text)
        break
      }

      case 'breathe': startBreathingExercise(); break

      case 'verse': {
        setState('processing')
        const result = await voiceCompanionService.voiceQuery('Share a Bhagavad Gita verse that would comfort and inspire me right now', 'verse')
        const text = result?.response || 'Here\'s one close to my heart - Chapter 2, Verse 47: You have the right to perform your duties, but you are not entitled to the fruits of your actions. It\'s about finding freedom in the doing itself. Beautiful, isn\'t it?'
        addKiaanMessage(text, { verse: result?.verse })
        await speakResponse(text)
        break
      }

      case 'affirmation': {
        const text = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]
        addKiaanMessage(`Here's something I want you to really feel: ${text}`, { type: 'affirmation' })
        await speakResponse(text)
        break
      }

      case 'language':
        if (params?.languageName) addSystemMessage(`Language: ${params.languageName}. (Multi-language support coming soon.)`)
        break
    }
  }, [speakResponse, voiceOutput, stopAll, addSystemMessage, addKiaanMessage])

  // ─── Handle User Input ────────────────────────────────────────────

  const handleUserInput = useCallback(async (text: string) => {
    // Stop audio analyzer when processing
    audioAnalyzer.stop()

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

    try {
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

      await speakResponse(responseText)
    } catch {
      if (isMountedRef.current) {
        setState(wakeWordEnabled ? 'wake-listening' : 'idle')
        setError('I had trouble processing that. Can you try again?')
      }
    } finally {
      processingRef.current = false
    }
  }, [handleVoiceCommand, speakResponse, addKiaanMessage, wakeWordEnabled, audioAnalyzer])

  // ─── Breathing Exercise ───────────────────────────────────────────

  const startBreathingExercise = useCallback(async () => {
    setState('breathing')
    addSystemMessage('Let\'s breathe together...', 'breathing')
    const exercise = await voiceCompanionService.getBreathingExercise()
    if (isMountedRef.current) setBreathingSteps(exercise.steps)
  }, [addSystemMessage])

  const onBreathingComplete = useCallback(() => {
    setBreathingSteps(null)
    const text = 'Beautiful, friend. Feel that? Your body is calmer, your mind clearer. The Gita says when the mind is controlled, it rests in the Self alone. Carry this stillness with you. I\'m so proud of you for taking this moment.'
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

  const handleOrbClick = () => {
    if (['speaking', 'processing', 'breathing'].includes(state)) {
      stopAll()
    } else if (voiceInput.isListening) {
      voiceInput.stopListening()
      audioAnalyzer.stop()
      setState(idleState())
    } else {
      setError(null)
      audioAnalyzer.start()
      voiceInput.startListening()
      setState('listening')
    }
  }

  const toggleConversationMode = async () => {
    const newMode = !conversationMode
    setConversationMode(newMode)
    if (newMode && (state === 'idle' || state === 'wake-listening')) {
      await voiceCompanionService.startSession()
      audioAnalyzer.start()
      voiceInput.startListening()
      setState('listening')
    } else if (!newMode && voiceInput.isListening) {
      voiceInput.stopListening()
      audioAnalyzer.stop()
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

  const saveConversation = async () => {
    const kiaanMessages = messages.filter(m => m.role === 'kiaan')
    for (const msg of kiaanMessages) {
      if (!msg.saved) await saveMessage(msg)
    }
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
    idle: 'Tap the orb to talk to me',
    'wake-listening': 'Say "Hey KIAAN" or tap the orb',
    listening: 'I\'m listening...',
    processing: 'Let me think about that...',
    speaking: 'Say "stop" to interrupt me',
    breathing: 'Breathe with me...',
    error: error || 'Something went wrong. Tap to try again.',
  }

  const moodBg = MOOD_BACKGROUNDS[currentEmotion || 'neutral'] || MOOD_BACKGROUNDS.neutral
  const availableCommands = getAvailableCommands('conversation')

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className={`flex flex-col h-[100dvh] bg-gradient-to-b ${moodBg} transition-colors duration-1000 relative overflow-hidden`}>

      {/* Ambient background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-mv-sunrise/[0.03] blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-mv-ocean/[0.03] blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '3s' }} />
      </div>

      {/* Header - Minimal, elegant */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 safe-top">
        <div className="flex items-center gap-3">
          <Link href="/kiaan/chat" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors" aria-label="Back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </Link>
          <div>
            <h1 className="text-base font-semibold text-white flex items-center gap-2">
              KIAAN
              {wakeWordEnabled && (
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full transition-all ${
                  state === 'wake-listening'
                    ? 'bg-emerald-500/20 text-emerald-400 animate-pulse'
                    : state === 'listening'
                    ? 'bg-mv-sunrise/20 text-mv-sunrise'
                    : 'bg-emerald-500/10 text-emerald-400/60'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {state === 'listening' ? 'Listening' : 'Awake'}
                </span>
              )}
            </h1>
            <p className="text-[11px] text-white/40">Your divine friend</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={toggleWakeWord} className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${wakeWordEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`} title="Hey KIAAN wake word">
            {wakeWordEnabled ? 'Wake ON' : 'Wake'}
          </button>
          <button onClick={toggleConversationMode} className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${conversationMode ? 'bg-mv-sunrise/20 text-mv-sunrise border border-mv-sunrise/30' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'}`} title="Continuous conversation">
            {conversationMode ? 'Flow ON' : 'Flow'}
          </button>
          {messages.length > 0 && (
            <button onClick={() => setShowInsights(true)} className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/50" aria-label="Session insights" title="Session insights">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </button>
          )}
          <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/50" aria-label="Settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          </button>
        </div>
      </div>

      {/* Settings Panel (overlay) */}
      {showSettings && (
        <div className="relative z-20 mx-4 mb-2 py-3 px-4 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 space-y-2.5">
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
          <div className="pt-2 border-t border-white/5">
            <p className="text-[10px] text-white/30 mb-2">Voice commands:</p>
            <div className="flex flex-wrap gap-1">
              {availableCommands.slice(0, 12).map(cmd => (
                <button key={cmd.type} onClick={() => { handleVoiceCommand(cmd.type); setShowSettings(false) }} className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 transition-colors">
                  {cmd.examplePhrase}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area - Orb-centric layout */}
      <div className="relative z-10 flex-1 flex flex-col items-center overflow-hidden">

        {/* Orb Section - Always visible, center stage */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center pt-4 pb-2">
          {/* Breathing Exercise (replaces orb display) */}
          {breathingSteps ? (
            <div className="flex flex-col items-center">
              <KiaanVoiceOrb
                state="breathing"
                emotion={toOrbEmotion(currentEmotion)}
                size={140}
                onClick={stopAll}
              />
              <div className="mt-4">
                <BreathingTimer steps={breathingSteps} onComplete={onBreathingComplete} />
              </div>
            </div>
          ) : (
            <>
              {/* The Living Orb */}
              <KiaanVoiceOrb
                state={state}
                emotion={toOrbEmotion(currentEmotion)}
                volume={audioAnalyzer.volume}
                size={messages.length > 0 ? 120 : 160}
                onClick={handleOrbClick}
                disabled={!voiceInput.isSupported && !['speaking', 'processing', 'breathing'].includes(state)}
              />

              {/* Waveform visualization */}
              <div className="mt-3 opacity-80">
                <VoiceWaveform
                  frequencyData={audioAnalyzer.frequencyData}
                  barCount={24}
                  height={32}
                  width={200}
                  color={state === 'listening' ? '#f97316' : state === 'speaking' ? '#a855f7' : '#ffffff'}
                  simulateWhenInactive={state === 'processing' || state === 'speaking'}
                  state={state === 'listening' ? 'listening' : state === 'speaking' ? 'speaking' : state === 'processing' ? 'processing' : 'idle'}
                />
              </div>
            </>
          )}

          {/* State label */}
          <p className={`mt-2 text-xs font-medium transition-colors ${
            state === 'wake-listening' ? 'text-emerald-400/80' :
            state === 'listening' ? 'text-mv-sunrise animate-pulse' :
            state === 'processing' ? 'text-mv-ocean' :
            state === 'speaking' ? 'text-purple-400' :
            state === 'breathing' ? 'text-emerald-400 animate-pulse' :
            state === 'error' ? 'text-red-400' : 'text-white/40'
          }`}>
            {stateLabel[state]}
          </p>

          {/* Interim transcript (while speaking) */}
          {voiceInput.interimTranscript && (
            <p className="mt-1 text-sm text-mv-sunrise/70 italic max-w-xs text-center truncate">
              {voiceInput.interimTranscript}
            </p>
          )}

          {/* Current emotion indicator */}
          {currentEmotion && EMOTION_LABELS[currentEmotion] && (
            <span className={`mt-1 text-[10px] font-medium ${EMOTION_LABELS[currentEmotion].color}`}>
              Feeling {EMOTION_LABELS[currentEmotion].label.toLowerCase()}
            </span>
          )}
        </div>

        {/* Empty State - Greeting + Suggestions */}
        {messages.length === 0 && !breathingSteps && (
          <div className="flex flex-col items-center px-6 space-y-4 pb-4">
            <p className="text-white/80 font-medium text-center text-sm max-w-xs leading-relaxed">
              {greeting || getTimeGreeting()}
            </p>

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-2 w-full max-w-xs">
              {[
                { label: 'Breathe', emoji: '🌬', cmd: 'breathe' },
                { label: 'Meditate', emoji: '🧘', cmd: 'meditate' },
                { label: 'Verse', emoji: '📖', cmd: 'verse' },
                { label: 'Affirm', emoji: '✨', cmd: 'affirmation' },
              ].map(({ label, emoji, cmd }) => (
                <button key={cmd} onClick={() => handleVoiceCommand(cmd)} className="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all active:scale-95">
                  <span className="text-lg">{emoji}</span>
                  <span className="text-[10px] text-white/50 font-medium">{label}</span>
                </button>
              ))}
            </div>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {getSuggestions().map(prompt => (
                <button key={prompt} onClick={() => handleUserInput(prompt)} className="px-3 py-1.5 rounded-full text-xs bg-white/[0.04] border border-white/[0.06] text-white/60 hover:bg-white/[0.08] hover:text-white/80 transition-all active:scale-95">
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages Area */}
        {messages.length > 0 && (
          <div className="flex-1 w-full max-w-lg overflow-y-auto px-4 pb-2 space-y-2.5 scrollbar-thin scrollbar-thumb-white/10">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'}`}
                style={{ animation: 'fadeSlideUp 0.25s ease-out' }}
              >
                {msg.role === 'system' ? (
                  <div className="px-3 py-1 rounded-full bg-white/[0.04] text-[11px] text-white/35 italic">{msg.content}</div>
                ) : (
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-mv-sunrise/10 border border-mv-sunrise/15'
                      : 'bg-white/[0.04] border border-white/[0.06]'
                  }`}>
                    <div className={`flex items-center gap-1.5 text-[10px] font-medium mb-0.5 ${msg.role === 'user' ? 'text-mv-sunrise/60' : 'text-mv-ocean/60'}`}>
                      {msg.role === 'user' ? 'You' : 'KIAAN'}
                      {msg.type === 'affirmation' && <span className="text-yellow-400/40">affirmation</span>}
                      {msg.emotion && EMOTION_LABELS[msg.emotion] && (
                        <span className={EMOTION_LABELS[msg.emotion].color + '/60'}>{EMOTION_LABELS[msg.emotion].label}</span>
                      )}
                    </div>

                    <p className="text-sm leading-relaxed text-white/85 whitespace-pre-wrap">{msg.content}</p>

                    {msg.verse && (
                      <div className="mt-2 pt-2 border-t border-white/[0.06]">
                        <p className="text-[10px] text-mv-ocean/50 font-medium">BG {msg.verse.chapter}.{msg.verse.verse}</p>
                        <p className="text-xs text-white/40 italic mt-0.5">{msg.verse.text}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-white/25">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.role === 'kiaan' && (
                        <>
                          <button onClick={() => speakResponse(msg.content)} className="text-[10px] text-white/25 hover:text-white/50 transition-colors" title="Replay">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                          </button>
                          <button onClick={() => saveMessage(msg)} className={`text-[10px] transition-colors ${msg.saved ? 'text-mv-sunrise/60' : 'text-white/25 hover:text-white/50'}`} title={msg.saved ? 'Saved' : 'Save to reflections'}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill={msg.saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Processing indicator */}
            {state === 'processing' && (
              <div className="flex justify-start" style={{ animation: 'fadeSlideUp 0.2s ease-out' }}>
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-mv-ocean/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-mv-ocean/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-mv-ocean/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-white/35">Reflecting...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && state === 'error' && (
        <div className="relative z-10 mx-4 mb-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
          {error}
          <button onClick={() => { setError(null); setState(idleState()) }} className="ml-2 underline text-red-400 hover:text-red-300">Dismiss</button>
        </div>
      )}

      {/* Bottom Input Area */}
      <div className="relative z-10 border-t border-white/[0.06] px-4 py-3 bg-black/20 backdrop-blur-sm safe-bottom">
        {/* Quick action chips in active conversation */}
        {messages.length > 0 && (
          <div className="flex gap-1.5 justify-center mb-2.5">
            {[
              { label: 'Breathe', cmd: 'breathe' },
              { label: 'Verse', cmd: 'verse' },
              { label: 'Affirm', cmd: 'affirmation' },
              { label: 'Repeat', cmd: 'repeat' },
              { label: 'Clear', cmd: 'clear' },
            ].map(({ label, cmd }) => (
              <button key={cmd} onClick={() => handleVoiceCommand(cmd)} className="px-2.5 py-1 rounded-full text-[10px] bg-white/[0.04] border border-white/[0.06] text-white/40 hover:bg-white/[0.08] hover:text-white/60 transition-all active:scale-95">
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Text input + send */}
        <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder="Type a message to KIAAN..."
            className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-mv-sunrise/30 focus:ring-1 focus:ring-mv-sunrise/15 transition-all"
            disabled={state === 'processing' || state === 'speaking' || state === 'breathing'}
          />
          {textInput.trim() ? (
            <button type="submit" className="px-4 py-2.5 rounded-xl bg-mv-sunrise/15 text-mv-sunrise text-sm font-medium hover:bg-mv-sunrise/25 transition-colors active:scale-95" disabled={state === 'processing' || state === 'speaking' || state === 'breathing'}>
              Send
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOrbClick}
              disabled={!voiceInput.isSupported && !['speaking', 'processing', 'breathing'].includes(state)}
              className={`p-2.5 rounded-xl transition-all active:scale-95 ${
                state === 'listening' ? 'bg-mv-sunrise/20 text-mv-sunrise' :
                ['speaking', 'processing'].includes(state) ? 'bg-red-500/15 text-red-400' :
                'bg-white/[0.04] text-white/50 hover:bg-white/[0.08]'
              }`}
              aria-label={state === 'listening' ? 'Stop listening' : 'Start voice input'}
            >
              {['speaking', 'processing', 'breathing'].includes(state) ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
            </button>
          )}
        </form>

        {!voiceInput.isSupported && (
          <p className="text-center text-[10px] text-white/25 mt-1.5">Voice needs Chrome, Edge, or Safari. Text works everywhere.</p>
        )}
      </div>

      {/* Conversation Insights Panel */}
      <ConversationInsights
        messages={messages}
        isOpen={showInsights}
        onClose={() => setShowInsights(false)}
        onSaveConversation={saveConversation}
        sessionStartTime={sessionStartTime}
      />

      {/* Global animation styles */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .safe-top { padding-top: env(safe-area-inset-top, 0px); }
        .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
      `}</style>
    </div>
  )
}
