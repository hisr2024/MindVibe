'use client'

/**
 * KIAAN Companion - Orb-Based Voice Best Friend
 *
 * An immersive, orb-centered interface where KIAAN acts as the user's best friend.
 * The large animated orb is the visual centerpiece, breathing and pulsing with
 * mood-reactive colors. Messages flow below in glass-morphism cards.
 *
 * Design principles:
 * - Orb is the soul of the interface - alive, breathing, responsive
 * - Dark, immersive background with mood-reactive ambient glow
 * - Glass-morphism cards for messages and controls
 * - Voice-first but text-friendly
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

// ─── Mood Ambient Glow Colors ────────────────────────────────────────

const MOOD_GLOW: Record<string, string> = {
  happy: 'rgba(245,158,11,0.12)',
  sad: 'rgba(59,130,246,0.12)',
  anxious: 'rgba(168,85,247,0.12)',
  angry: 'rgba(239,68,68,0.12)',
  confused: 'rgba(249,115,22,0.12)',
  peaceful: 'rgba(16,185,129,0.12)',
  hopeful: 'rgba(234,179,8,0.12)',
  lonely: 'rgba(99,102,241,0.12)',
  grateful: 'rgba(34,197,94,0.12)',
  neutral: 'rgba(139,92,246,0.12)',
  excited: 'rgba(236,72,153,0.12)',
  overwhelmed: 'rgba(100,116,139,0.12)',
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

    // SAFETY FIRST: Crisis detection overrides everything
    const crisisSignals = [
      'kill myself', 'suicide', 'end my life', 'want to die', "don't want to live",
      'self harm', 'self-harm', 'cutting myself', 'hurt myself', 'no reason to live',
      'better off dead', "can't go on", 'end it all', 'take my life',
    ]
    if (crisisSignals.some(signal => lower.includes(signal))) {
      setCurrentMood('sad')
      setMessages(prev => [
        ...prev,
        {
          id: `companion-${Date.now()}`,
          role: 'companion',
          content: "I hear you, and I'm really glad you told me this. What you're feeling is real, and it matters. You matter.\n\nI want to be honest with you: I'm your friend, and I care deeply, but right now you deserve to talk to someone who can truly help.\n\nPlease reach out:\n\u2022 iCall: 9152987821 (India)\n\u2022 Vandrevala Foundation: 1860-2662-345 (24/7)\n\u2022 Crisis Text Line: Text HOME to 741741 (US)\n\u2022 International: findahelpline.com\n\nI'm not going anywhere. I'll be right here before, during, and after you reach out. You are not alone in this.",
          mood: 'sad',
          phase: 'connect',
          timestamp: new Date(),
        },
      ])
      return
    }

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

    const moodResponses: Record<string, string[]> = {
      anxious: [
        "Hey, take a breath with me. Just one. In... and out. Think of it like applying for a dream job - you pour everything into the application, then let go. You did YOUR part. The result isn't something you can control from your couch at 2am. How does that sit with you?",
        "I can feel that weight. Your mind right now is like a browser with 47 tabs open, half of them playing different music. Let's close all the tabs except this one. This conversation. This breath. The future tab? It's not even loaded yet.",
        "Your anxiety is like a smoke detector going off because you're making toast. The alarm is REAL, but there's no actual fire. Right this second, we're safe. What's the 'toast' that's setting it off?",
      ],
      sad: [
        "Oh friend. Remember when you thought that breakup would end you? Or that failed exam was game over? Look at you now. This pain is real, and I respect it completely. But like every hard thing before it - it will pass too. What's hurting right now?",
        "Grief is like writing a text to someone whose number doesn't work anymore. The love is still real. That never goes away, and you wouldn't want it to. Your capacity to love that deeply? That's your superpower. I'm here with you through this.",
        "Think about the ocean. The surface has storms, massive waves. But 20 feet down? Completely still. There's a deeper part of you that knows this wave will pass. What would it feel like to remember that stillness underneath?",
      ],
      angry: [
        "I feel that fire. And it makes total sense. Your anger is like rocket fuel - in a rocket, it takes you to the moon. In a dumpster, it just burns everything. Let's aim it somewhere useful. What do you want to DO about this?",
        "Ever sent an angry text at 11pm and woke up at 7am thinking 'why did I do that'? That's because anger literally hijacks the smart part of your brain. Before you act on this, give it one hour. Let the smart part get back in the driver's seat. What happened?",
        "Your anger is valid. Full stop. It's like a notification on your phone - it's telling you something needs attention. But you don't have to open every notification immediately. What is this anger trying to tell you?",
      ],
      lonely: [
        "You just reached out to me. That tiny act tells me something huge: you're not as disconnected as loneliness wants you to believe. Loneliness is a liar. Think of connections like Wi-Fi signals - they're invisible but everywhere. Who could you text one real message to today?",
        "Social media is the worst because everyone looks connected and thriving. But most of those people are scrolling alone on their couch too. We're all lonely sometimes. You reaching out right now? That takes real courage. Tell me more.",
      ],
      overwhelmed: [
        "Imagine your mind is like a kitchen after Thanksgiving dinner. Dishes everywhere. You don't clean it all at once - you start with ONE counter. Clear it. Done. Then the next. What's your one counter right now? Forget everything else.",
        "Here's permission you didn't know you needed: you don't have to be productive today. Sometimes 'showing up' means brushing your teeth and drinking water. That counts. You're not behind. What's the ONE thing you could let go of?",
        "You know why airplane safety says put YOUR mask on first? Because you can't help anyone else if you're suffocating. You're pouring from an empty cup. What would taking care of yourself look like today?",
      ],
      confused: [
        "Every successful founder started exactly where you are: completely lost. Jeff Bezos was shipping books from a garage. The clarity comes FROM the doing, not before it. What's one small step you could take this week?",
        "Google Maps doesn't show you the entire route in detail - it shows you the next turn. That's all you need. What's your next turn? Not the whole life plan - just the next turn.",
        "Decision paralysis is like standing in front of Netflix for 20 minutes. But there's rarely a truly 'wrong' choice. Take path A? Growth. Path B? Different growth. The only wrong choice is no choice. What feels right in your gut?",
      ],
      hopeful: [
        "That spark of hope? It's like a startup founder pitching an idea everyone thinks is crazy. You can see something others can't - a future version of your life that doesn't exist yet. And that vision changes every decision you make. Tell me what you're seeing!",
        "I love this energy! Hope is like compound interest. Small daily deposits add up in ways you can't see yet. Hold onto this feeling. What's inspiring it?",
      ],
      happy: [
        "Quick - screenshot this moment in your mind! We're SO good at remembering bad days in HD but good days barely register. Be here in this happiness. Soak it in. This is what life's actually about. What's making you smile?",
        "Your energy is contagious right now! Happiness is like a wifi signal - it comes and goes, and that's okay. Just enjoy the good connection while it lasts. Tell me everything!",
      ],
      neutral: [
        "I hear you, friend. Whatever you're going through, you don't have to face it alone. Think about your track record of handling hard things - it's literally 100%. What's on your mind?",
        "Imagine you had a friend who talked to you the way you talk to yourself. You'd fire that friend immediately, right? Try talking to yourself like you'd talk to your best friend. What's really going on?",
        "The real difference between people who build the life they want? It's showing up on Tuesday. And the boring days in between. Just keep showing up. How can I help today?",
        "Everyone you meet is fighting a battle you can't see. Including you. So be kind to them, but mostly - be kind to yourself. You're doing better than you think. What do you need right now?",
        "Nobody talks about this, but the goal isn't to never feel bad. It's to know you can HANDLE it. Like, you don't need a phone case that prevents all drops - you need a phone that survives them. You're that phone. What's happening?",
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

  // ─── Mood glow color ──────────────────────────────────────────────

  const ambientGlow = MOOD_GLOW[currentMood] || MOOD_GLOW.neutral

  // ─── Render: Initializing ─────────────────────────────────────────

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0a0a14 0%, #12082a 50%, #0a0a14 100%)' }}>
        <div className="text-center">
          <CompanionMoodRing mood="neutral" size="xl" />
          <p className="mt-8 text-white/40 text-sm animate-pulse">KIAAN is getting ready...</p>
        </div>
      </div>
    )
  }

  // ─── Render: Main Orb UI ──────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0a0a14 0%, #12082a 50%, #0a0a14 100%)' }}
    >
      {/* Ambient mood glow behind the orb */}
      <div
        className="absolute pointer-events-none transition-all duration-[3000ms]"
        style={{
          top: '10%',
          left: '50%',
          width: '600px',
          height: '600px',
          transform: 'translateX(-50%)',
          background: `radial-gradient(circle, ${ambientGlow} 0%, transparent 70%)`,
        }}
      />

      {/* Subtle stars/noise texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px), radial-gradient(circle at 50% 50%, white 0.5px, transparent 0.5px), radial-gradient(circle at 30% 80%, white 0.5px, transparent 0.5px), radial-gradient(circle at 70% 20%, white 1px, transparent 1px)',
          backgroundSize: '200px 200px, 300px 300px, 150px 150px, 250px 250px, 350px 350px',
        }}
      />

      {/* ─── Header ─── */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 pt-safe-top">
        <Link href="/dashboard" className="p-2 rounded-full text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className="flex items-center gap-2">
          {/* Friendship badge */}
          <span className="text-[10px] px-2.5 py-1 rounded-full border border-white/10 text-white/50 bg-white/5">
            {session.friendshipLevel === 'deep' ? 'Best Friend' :
             session.friendshipLevel === 'close' ? 'Close Friend' :
             session.friendshipLevel === 'familiar' ? 'Friend' :
             'New Friend'}
          </span>

          {/* Auto-play voice toggle */}
          <button
            onClick={() => setAutoPlayVoice(v => !v)}
            className={`p-2 rounded-full transition-all ${
              autoPlayVoice
                ? 'bg-violet-500/20 text-violet-400'
                : 'text-white/30 hover:text-white/60 hover:bg-white/5'
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
              className="text-[10px] text-white/30 hover:text-white/60 px-2.5 py-1 rounded-full border border-white/10 hover:bg-white/5 transition-all"
              title="End conversation"
            >
              End
            </button>
          )}
        </div>
      </header>

      {/* ─── Scrollable Content ─── */}
      <main className="flex-1 overflow-y-auto relative z-10">
        {/* ─── Orb Section ─── */}
        <div className="flex flex-col items-center pt-6 pb-4">
          <CompanionMoodRing
            mood={currentMood}
            size="xl"
            isSpeaking={isSpeaking}
            isListening={isLoading}
            intensity={isLoading ? 0.8 : 0.5}
          />

          <h2 className="mt-6 text-lg font-semibold text-white/90 tracking-wide">KIAAN</h2>
          <p className="text-xs text-white/40 mt-0.5">
            {isLoading ? 'Thinking...' : session.isActive ? 'Your best friend' : 'Session ended'}
          </p>
        </div>

        {/* ─── Messages ─── */}
        <div className="max-w-xl mx-auto px-4 pb-4">
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
                <div className="ml-9 mb-3 -mt-1">
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
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.6), rgba(99,102,241,0.4))',
                  boxShadow: '0 0 12px rgba(139,92,246,0.3)',
                }}
              >
                <span className="text-white text-[10px] font-bold">K</span>
              </div>
              <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-white/40"
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

      {/* ─── Suggestions ─── */}
      {showSuggestions && session.isActive && !isLoading && (
        <div className="relative z-10 max-w-xl mx-auto w-full px-4 pb-2">
          <CompanionSuggestions
            mood={currentMood}
            phase={session.phase}
            isFirstMessage={messages.length <= 1}
            onSelect={handleSuggestion}
          />
        </div>
      )}

      {/* ─── Input Area ─── */}
      {session.isActive ? (
        <footer className="relative z-10 border-t border-white/5" style={{ background: 'rgba(10,10,20,0.8)', backdropFilter: 'blur(20px)' }}>
          <div className="max-w-xl mx-auto px-4 py-3 pb-safe-bottom">
            {error && (
              <p className="text-xs text-red-400/80 mb-2">{error}</p>
            )}
            <div className="flex items-end gap-2">
              {/* Voice recorder */}
              <div className="dark">
                <CompanionVoiceRecorder
                  onTranscription={handleVoiceTranscription}
                  isDisabled={!session.isActive}
                  isProcessing={isLoading}
                />
              </div>

              {/* Text input */}
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Talk to KIAAN..."
                  rows={1}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/90 placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 transition-all duration-200"
                  style={{ backdropFilter: 'blur(12px)' }}
                  disabled={isLoading}
                />
              </div>

              {/* Send button */}
              <button
                onClick={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isLoading}
                className={`p-2.5 rounded-full transition-all duration-200 ${
                  inputText.trim() && !isLoading
                    ? 'text-white shadow-lg hover:scale-105'
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                }`}
                style={
                  inputText.trim() && !isLoading
                    ? {
                        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                        boxShadow: '0 0 20px rgba(139,92,246,0.3)',
                      }
                    : undefined
                }
                aria-label="Send message"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>

            <p className="text-[10px] text-white/20 text-center mt-2">
              KIAAN is your friend, not a therapist. If you&apos;re in crisis, please call your local emergency line.
            </p>
          </div>
        </footer>
      ) : (
        <footer className="relative z-10 border-t border-white/5 p-4" style={{ background: 'rgba(10,10,20,0.8)', backdropFilter: 'blur(20px)' }}>
          <div className="max-w-xl mx-auto text-center pb-safe-bottom">
            <p className="text-sm text-white/40 mb-3">This conversation has ended.</p>
            <button
              onClick={startSession}
              className="px-6 py-2.5 rounded-full text-sm font-medium text-white transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                boxShadow: '0 0 25px rgba(139,92,246,0.3)',
              }}
            >
              Start New Conversation
            </button>
          </div>
        </footer>
      )}

      {/* Animation styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes typing-dot {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      ` }} />
    </div>
  )
}
