'use client'

/**
 * KIAAN Companion - Your Best Friend Chat
 *
 * A warm, conversational interface where KIAAN acts as the user's best friend.
 * Features a modern chat UI with voice input, mood detection, contextual
 * suggestions, and persistent conversation history.
 *
 * Design principles:
 * - Feels like texting your best friend, not using an app
 * - Warm colors, smooth animations, minimal chrome
 * - Voice-first but text-friendly
 * - Mood-adaptive background and UI elements
 * - KIAAN remembers you across sessions
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import CompanionChatBubble from '@/components/companion/CompanionChatBubble'
import CompanionMoodRing from '@/components/companion/CompanionMoodRing'
import CompanionVoiceRecorder from '@/components/companion/CompanionVoiceRecorder'
import CompanionSuggestions from '@/components/companion/CompanionSuggestions'
import CompanionVoicePlayer from '@/components/companion/CompanionVoicePlayer'
import { apiFetch } from '@/lib/api'

// ─── Referral Context Greetings ──────────────────────────────────────

const REFERRAL_GREETINGS: Record<string, string> = {
  'emotional-reset': "Hey friend! I see you just came from the Emotional Reset. How are you feeling now? Sometimes it helps to talk through what came up during that process. I'm all ears.",
  'ardha': "Hey! I noticed you were working with Ardha on reframing your thoughts. Want to talk about what you discovered? Sometimes saying it out loud makes it click even deeper.",
  'viyog': "Friend! You've been working on letting go with Viyoga. That takes real courage. How are you feeling about it? I'm here if you want to process what came up.",
  'relationship-compass': "Hey there. Relationship stuff is never easy, and I saw you were exploring the Relationship Compass. Want to talk about what's going on? No judgment, just your friend listening.",
  'karma-reset': "I see you've been doing some deep work with Karma Reset. That takes a lot of strength. How are you holding up? Sometimes it helps to just talk about it.",
  'karma-footprint': "Hey friend! I noticed you were reflecting on your daily actions. That kind of self-awareness is beautiful. Want to share what you're thinking about?",
  'karmic-tree': "Your growth journey is inspiring, friend! I saw you checking your Karmic Tree. Want to talk about where you are and where you want to go?",
  'sacred-reflections': "Hey! I see you've been journaling. Writing is powerful, and so is talking it through. Want to share what's on your heart today?",
  'kiaan-vibe': "I see you were vibing with some meditation music. Feeling more centered? Want to chat about anything that came up during that peaceful time?",
  'wisdom-rooms': "Hey friend! I noticed you were in the Wisdom Rooms. Community wisdom is amazing, but sometimes you need one-on-one time. I'm right here for you.",
}

// ─── Types ──────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'companion'
  content: string
  mood?: string | null
  phase?: string | null
  timestamp: Date
}

interface SessionState {
  sessionId: string | null
  phase: string
  friendshipLevel: string
  userName: string | null
  isActive: boolean
}

// ─── Mood Background Colors ────────────────────────────────────────────

const MOOD_BACKGROUNDS: Record<string, string> = {
  happy: 'from-amber-50 via-yellow-50 to-orange-50',
  sad: 'from-blue-50 via-indigo-50 to-blue-50',
  anxious: 'from-purple-50 via-violet-50 to-purple-50',
  angry: 'from-red-50 via-rose-50 to-red-50',
  confused: 'from-orange-50 via-amber-50 to-yellow-50',
  peaceful: 'from-emerald-50 via-green-50 to-teal-50',
  hopeful: 'from-yellow-50 via-amber-50 to-yellow-50',
  lonely: 'from-indigo-50 via-blue-50 to-indigo-50',
  grateful: 'from-green-50 via-emerald-50 to-green-50',
  neutral: 'from-gray-50 via-slate-50 to-gray-50',
  excited: 'from-pink-50 via-rose-50 to-pink-50',
  overwhelmed: 'from-slate-50 via-gray-50 to-slate-50',
}

// ─── Component ──────────────────────────────────────────────────────────

export default function CompanionPage() {
  const searchParams = useSearchParams()
  const referralTool = searchParams.get('from')
  const referralMood = searchParams.get('mood')

  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentMood, setCurrentMood] = useState(referralMood || 'neutral')
  const [session, setSession] = useState<SessionState>({
    sessionId: null,
    phase: 'connect',
    friendshipLevel: 'new',
    userName: null,
    isActive: false,
  })
  const [isInitializing, setIsInitializing] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoPlayVoice, setAutoPlayVoice] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState('priya')
  const [isSpeaking, setIsSpeaking] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // ─── Session Management ─────────────────────────────────────────────

  const startSession = useCallback(async () => {
    try {
      setError(null)
      const response = await apiFetch('/api/companion/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'en',
          referral_tool: referralTool || undefined,
          referral_mood: referralMood || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSession({
          sessionId: data.session_id,
          phase: data.phase,
          friendshipLevel: data.friendship_level,
          userName: data.user_name,
          isActive: true,
        })

        // Add greeting as first message
        setMessages([
          {
            id: `greeting-${Date.now()}`,
            role: 'companion',
            content: data.greeting,
            mood: 'neutral',
            phase: 'connect',
            timestamp: new Date(),
          },
        ])
        setShowSuggestions(true)
      } else {
        // Fallback: create local session
        createLocalSession()
      }
    } catch {
      createLocalSession()
    } finally {
      setIsInitializing(false)
    }
  }, [])

  const createLocalSession = useCallback(() => {
    const localId = `local_${Date.now()}`
    setSession({
      sessionId: localId,
      phase: 'connect',
      friendshipLevel: 'new',
      userName: null,
      isActive: true,
    })

    // Use referral-aware greeting if user came from another tool
    let greeting: string
    if (referralTool && REFERRAL_GREETINGS[referralTool]) {
      greeting = REFERRAL_GREETINGS[referralTool]
    } else {
      const hour = new Date().getHours()
      if (hour >= 5 && hour < 12) {
        greeting = "Good morning, friend! I'm KIAAN. Think of me as that friend who's always here - no judgment, no agenda. What's on your mind today?"
      } else if (hour >= 12 && hour < 17) {
        greeting = "Hey there! I'm KIAAN, your personal friend who never gets tired of listening. How's your day going?"
      } else if (hour >= 17 && hour < 21) {
        greeting = "Good evening! I'm KIAAN. The day's winding down - perfect time for a real conversation. How are you feeling?"
      } else {
        greeting = "Hey night owl! I'm KIAAN. Can't sleep, or just need someone to talk to? Either way, I'm right here."
      }
    }

    setMessages([
      {
        id: `greeting-${Date.now()}`,
        role: 'companion',
        content: greeting,
        mood: 'neutral',
        phase: 'connect',
        timestamp: new Date(),
      },
    ])
    setShowSuggestions(true)
    setIsInitializing(false)
  }, [referralTool])

  useEffect(() => {
    startSession()
  }, [startSession])

  // ─── Message Sending ────────────────────────────────────────────────

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading || !session.sessionId) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)
    setShowSuggestions(false)
    setError(null)

    try {
      // Try backend first
      if (!session.sessionId.startsWith('local_')) {
        const response = await apiFetch('/api/companion/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: session.sessionId,
            message: text.trim(),
            language: 'en',
            content_type: 'text',
          }),
        })

        if (response.ok) {
          const data = await response.json()

          const companionMessage: Message = {
            id: data.message_id || `companion-${Date.now()}`,
            role: 'companion',
            content: data.response,
            mood: data.mood,
            phase: data.phase,
            timestamp: new Date(),
          }

          setMessages(prev => [...prev, companionMessage])
          setCurrentMood(data.mood || 'neutral')
          setSession(prev => ({ ...prev, phase: data.phase || prev.phase }))
          setShowSuggestions(true)
          setIsLoading(false)
          return
        }
      }

      // Fallback: use local friend wisdom (never falls back to chat API which may leak religious content)
      addLocalFallbackResponse(text.trim())
    } catch {
      addLocalFallbackResponse(text.trim())
    } finally {
      setIsLoading(false)
      setShowSuggestions(true)
    }
  }, [isLoading, session.sessionId])

  const addLocalFallbackResponse = useCallback((userText: string) => {
    const lower = userText.toLowerCase()

    // Local mood detection for contextual responses
    const moodMap: Record<string, string[]> = {
      anxious: ['anxious', 'anxiety', 'worried', 'scared', 'panic', 'stress', 'nervous', 'afraid'],
      sad: ['sad', 'depressed', 'hopeless', 'crying', 'heartbroken', 'empty', 'grief', 'miss'],
      angry: ['angry', 'furious', 'frustrated', 'mad', 'hate', 'unfair', 'betrayed'],
      lonely: ['lonely', 'alone', 'isolated', 'nobody', 'no one', 'abandoned'],
      overwhelmed: ['overwhelmed', 'too much', 'exhausted', 'burnt out', 'drowning'],
      confused: ['confused', 'lost', 'stuck', 'unsure', 'don\'t know'],
      hopeful: ['hopeful', 'excited', 'inspired', 'motivated', 'looking forward'],
      happy: ['happy', 'grateful', 'thankful', 'amazing', 'wonderful', 'great'],
    }

    let detectedMood = 'neutral'
    for (const [mood, keywords] of Object.entries(moodMap)) {
      if (keywords.some(kw => lower.includes(kw))) {
        detectedMood = mood
        break
      }
    }

    // Rich mood-specific friend responses (secular Gita wisdom)
    const moodResponses: Record<string, string[]> = {
      anxious: [
        "Hey, take a breath with me. Just one. In... and out. Here's what I've learned: you have every right to put your heart into things, but the outcome isn't yours to control. Focus on the effort, let go of the result. How does that sit with you?",
        "I can feel that weight you're carrying. Your mind is running ahead into a future that hasn't happened yet. The only moment that's real is right now, with me. Can we just be here for a second?",
      ],
      sad: [
        "Oh friend. I can feel the heaviness. You don't need to put on a brave face with me. Here's what I believe deeply: nothing that truly matters about you can be destroyed. The core of who you are is untouchable. What's hurting right now?",
        "Feelings are like seasons. Winter feels endless when you're in it, but it always passes. Your sadness is real and I respect it completely. But it's not permanent. I'm here with you through it.",
      ],
      angry: [
        "I feel that fire. It makes sense - it means you care deeply about something. But here's what I've learned: anger that leads to action is powerful. Anger that leads to brooding burns you first. What do you want to DO about this?",
        "Your anger is valid. Full stop. But before you act on it, let me share something: usually anger comes from wanting something to be different than it is. What is it protecting in you?",
      ],
      lonely: [
        "I hear you. And here's what I need you to know: you reached out to me, which means you're not as alone as it feels. Loneliness lies to us. I'm here, and I care. Can you tell me more?",
        "You are never truly alone. Every connection you've ever had, those threads are still there. Loneliness is a feeling, not a fact. And right now? I'm right here with you.",
      ],
      overwhelmed: [
        "Okay, pause. Just pause with me. You're trying to carry everything at once. What is the ONE thing that matters most right now? Just one. We'll start there.",
        "When everything feels like too much, it's because your mind is treating every problem as equally urgent. They're not. Let's focus on just one thing together. What's on top?",
      ],
      confused: [
        "Being confused is actually a sign of growth. Every person who figured out something life-changing started by admitting 'I have no idea what to do.' What's pulling you in different directions?",
        "Stop trying to see the whole path. You just need to see the next step. One step. That's all. What feels like the right next move to you?",
      ],
      hopeful: [
        "That spark of hope? Hold onto it. It's not naive - it's the truest thing about you. When you believe things can get better, you start making choices that MAKE things better. Tell me what's exciting you!",
        "I love seeing you like this! This energy is beautiful. What's inspiring this feeling?",
      ],
      happy: [
        "This is beautiful! Soak it in. Too often we rush past the good moments. Just be here in this happiness for a minute. You earned it. What's making you smile?",
        "Your energy is contagious right now. I love it! Tell me everything - what happened?",
      ],
      neutral: [
        "I hear you, friend. Whatever you're going through, you don't have to face it alone. I'm right here. Tell me more.",
        "Thank you for sharing that with me. It takes courage to open up. What's really on your mind?",
        "I'm listening, really listening. Not to fix you - just to be here. What's the hardest part of what you're dealing with?",
        "You know what I love about you? You keep showing up. Even on the hard days. That says everything about who you are. How can I help?",
        "You are stronger than you think. Not in a motivational poster way - in a real, proven way. Think about everything you've survived. What do you need right now?",
      ],
    }

    const pool = moodResponses[detectedMood] || moodResponses.neutral
    const response = pool[Math.floor(Math.random() * pool.length)]

    setCurrentMood(detectedMood)
    setMessages(prev => [
      ...prev,
      {
        id: `companion-${Date.now()}`,
        role: 'companion',
        content: response,
        mood: detectedMood,
        phase: 'connect',
        timestamp: new Date(),
      },
    ])
  }, [])

  // ─── End Session ────────────────────────────────────────────────────

  const endSession = useCallback(async () => {
    if (!session.sessionId || session.sessionId.startsWith('local_')) {
      setSession(prev => ({ ...prev, isActive: false }))
      return
    }

    try {
      const response = await apiFetch('/api/companion/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.sessionId }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [
          ...prev,
          {
            id: `farewell-${Date.now()}`,
            role: 'companion',
            content: data.farewell,
            mood: 'peaceful',
            phase: 'empower',
            timestamp: new Date(),
          },
        ])
      }
    } catch {
      // Silent fail - not critical
    }

    setSession(prev => ({ ...prev, isActive: false }))
  }, [session.sessionId])

  // ─── Voice Input ────────────────────────────────────────────────────

  const handleVoiceTranscription = useCallback((text: string) => {
    sendMessage(text)
  }, [sendMessage])

  // ─── Keyboard Handling ──────────────────────────────────────────────

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputText)
    }
  }, [inputText, sendMessage])

  // ─── Auto-scroll ────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Auto-resize textarea ──────────────────────────────────────────

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`
    }
  }, [inputText])

  // ─── Handle suggestion selection ───────────────────────────────────

  const handleSuggestion = useCallback((suggestion: string) => {
    sendMessage(suggestion)
  }, [sendMessage])

  // ─── Voice state handlers ─────────────────────────────────────────

  const handleVoiceStart = useCallback(() => setIsSpeaking(true), [])
  const handleVoiceEnd = useCallback(() => setIsSpeaking(false), [])

  // ─── Background gradient based on mood ────────────────────────────

  const bgGradient = MOOD_BACKGROUNDS[currentMood] || MOOD_BACKGROUNDS.neutral

  // ─── Render ───────────────────────────────────────────────────────

  if (isInitializing) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 flex items-center justify-center`}>
        <div className="text-center">
          <CompanionMoodRing mood="neutral" size="lg" />
          <p className="mt-4 text-gray-600 animate-pulse">KIAAN is getting ready...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient} transition-colors duration-2000 flex flex-col`}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <CompanionMoodRing mood={currentMood} size="sm" isSpeaking={isLoading} />
            <div>
              <h1 className="text-base font-semibold text-gray-900 dark:text-white">KIAAN</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isLoading ? 'Thinking...' : session.isActive ? 'Your best friend' : 'Session ended'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Friendship badge */}
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              session.friendshipLevel === 'deep' ? 'bg-violet-100 text-violet-700' :
              session.friendshipLevel === 'close' ? 'bg-indigo-100 text-indigo-700' :
              session.friendshipLevel === 'familiar' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {session.friendshipLevel === 'deep' ? 'Best Friend' :
               session.friendshipLevel === 'close' ? 'Close Friend' :
               session.friendshipLevel === 'familiar' ? 'Friend' :
               'New Friend'}
            </span>

            {/* Auto-play voice toggle */}
            <button
              onClick={() => setAutoPlayVoice(v => !v)}
              className={`p-1.5 rounded-full transition-all ${
                autoPlayVoice
                  ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/30'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title={autoPlayVoice ? 'Voice auto-play ON' : 'Voice auto-play OFF'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {autoPlayVoice ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                )}
              </svg>
            </button>

            {session.isActive && (
              <button
                onClick={endSession}
                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded transition-colors"
                title="End conversation"
              >
                End
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {messages.map((msg, i) => (
            <div key={msg.id}>
              <CompanionChatBubble
                id={msg.id}
                role={msg.role}
                content={msg.content}
                mood={msg.mood}
                phase={msg.phase}
                timestamp={msg.timestamp}
                isLatest={i === messages.length - 1}
              />
              {msg.role === 'companion' && (
                <div className="ml-10 mb-3 -mt-1">
                  <CompanionVoicePlayer
                    text={msg.content}
                    mood={msg.mood || currentMood}
                    voiceId={selectedVoice}
                    compact
                    autoPlay={autoPlayVoice && i === messages.length - 1}
                    onStart={handleVoiceStart}
                    onEnd={handleVoiceEnd}
                  />
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
                <span className="text-white text-xs font-bold">K</span>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-gray-400"
                      style={{
                        animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Suggestions */}
      {showSuggestions && session.isActive && !isLoading && (
        <div className="max-w-2xl mx-auto w-full px-4 pb-2">
          <CompanionSuggestions
            mood={currentMood}
            phase={session.phase}
            isFirstMessage={messages.length <= 1}
            onSelect={handleSuggestion}
          />
        </div>
      )}

      {/* Input Area */}
      {session.isActive ? (
        <footer className="sticky bottom-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-800/50">
          <div className="max-w-2xl mx-auto px-4 py-3">
            {error && (
              <p className="text-xs text-red-500 mb-2">{error}</p>
            )}
            <div className="flex items-end gap-2">
              {/* Voice recorder */}
              <CompanionVoiceRecorder
                onTranscription={handleVoiceTranscription}
                isDisabled={!session.isActive}
                isProcessing={isLoading}
              />

              {/* Text input */}
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Talk to KIAAN..."
                  rows={1}
                  className="w-full resize-none rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-300 transition-all duration-200"
                  disabled={isLoading}
                />
              </div>

              {/* Send button */}
              <button
                onClick={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isLoading}
                className={`p-2.5 rounded-full transition-all duration-200 ${
                  inputText.trim() && !isLoading
                    ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-md hover:shadow-lg hover:scale-105'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                }`}
                aria-label="Send message"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>

            <p className="text-[10px] text-gray-400 text-center mt-2">
              KIAAN is your friend, not a therapist. If you&apos;re in crisis, please call your local emergency line.
            </p>
          </div>
        </footer>
      ) : (
        <footer className="sticky bottom-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200/50 p-4">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm text-gray-500 mb-3">This conversation has ended.</p>
            <button
              onClick={startSession}
              className="px-6 py-2 bg-gradient-to-r from-violet-500 to-indigo-600 text-white rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all hover:scale-105"
            >
              Start New Conversation
            </button>
          </div>
        </footer>
      )}

      {/* Typing animation styles - using regular style tag to avoid Turbopack styled-jsx issues */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes typing-dot {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      ` }} />
    </div>
  )
}
