'use client'

/**
 * CompanionSuggestions - Glass-pill suggestions for dark orb UI.
 *
 * Shows contextual conversation starters or follow-up suggestions
 * styled as glowing glass pills on the dark companion background.
 *
 * Features time-of-day awareness and shuffled suggestions so
 * users see varied prompts on each visit.
 */

import { useMemo } from 'react'

interface SuggestionsProps {
  mood?: string
  phase?: string
  isFirstMessage?: boolean
  onSelect: (suggestion: string) => void
}

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

/**
 * Deterministic shuffle seeded by the current hour.
 * Changes suggestions every hour but stays stable within the same hour
 * to avoid layout jumps during a single session.
 */
function seededShuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  const seed = new Date().getHours() + new Date().getDate() * 24
  let state = seed
  for (let i = copy.length - 1; i > 0; i--) {
    state = (state * 1664525 + 1013904223) & 0x7fffffff
    const j = state % (i + 1)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const SUGGESTIONS: Record<string, string[]> = {
  first_time: [
    "I just need someone to talk to",
    "I've been having a rough day",
    "Tell me something that'll make me smile",
    "I'm feeling anxious about something",
    "I have good news to share!",
  ],
  connect: [
    "I want to talk about something personal",
    "Can you just listen for a bit?",
    "I don't even know where to start",
    "Something happened today...",
  ],
  listen: [
    "There's more to it...",
    "That's exactly how I feel",
    "I haven't told anyone this before",
    "It's been going on for a while",
  ],
  understand: [
    "Yes, you get it",
    "Not quite, let me explain better",
    "That's part of it, but also...",
    "How did you know?",
  ],
  guide: [
    "That actually makes sense",
    "I never thought of it that way",
    "But what if it doesn't work?",
    "Tell me more about that",
    "I want to try that",
  ],
  empower: [
    "I feel better already",
    "You're right, I can do this",
    "I needed to hear that",
    "What should I do first?",
    "Thank you, friend",
  ],
  anxious: [
    "Help me calm down",
    "My mind won't stop racing",
    "I can't stop worrying about...",
    "Can we do a breathing exercise?",
  ],
  sad: [
    "I just need to vent",
    "Everything feels heavy",
    "I miss how things used to be",
    "Will it get better?",
  ],
  angry: [
    "I need to get this off my chest",
    "Someone really hurt me",
    "Life isn't fair sometimes",
    "How do I let this go?",
  ],
}

const TIME_GREETINGS: Record<TimeOfDay, string[]> = {
  morning: [
    "Good morning — how are you feeling today?",
    "Starting the day fresh — what's on your mind?",
    "A new morning, a new beginning. Talk to me.",
  ],
  afternoon: [
    "How's your afternoon going?",
    "Taking a moment to check in — what's up?",
    "Afternoon pause — anything on your heart?",
  ],
  evening: [
    "Winding down? Let's talk about your day.",
    "Evening reflection — how are you feeling?",
    "The day is settling — what stayed with you?",
  ],
  night: [
    "Can't sleep? I'm here.",
    "Late-night thoughts? Share them with me.",
    "The world is quiet — what's on your mind?",
  ],
}

export default function CompanionSuggestions({
  mood,
  phase,
  isFirstMessage = false,
  onSelect,
}: SuggestionsProps) {
  const suggestions = useMemo(() => {
    let pool: string[]

    if (isFirstMessage) {
      const timeOfDay = getTimeOfDay()
      const timeGreetings = TIME_GREETINGS[timeOfDay]
      const basePool = SUGGESTIONS.first_time
      // Mix one time-aware greeting with shuffled first_time suggestions
      pool = [
        seededShuffle(timeGreetings)[0],
        ...seededShuffle(basePool),
      ]
    } else if (mood && SUGGESTIONS[mood]) {
      const moodSuggestions = seededShuffle(SUGGESTIONS[mood] || [])
      const phaseSuggestions = seededShuffle(SUGGESTIONS[phase || 'connect'] || [])
      pool = [...moodSuggestions.slice(0, 2), ...phaseSuggestions.slice(0, 2)]
    } else {
      pool = seededShuffle(SUGGESTIONS[phase || 'connect'] || SUGGESTIONS.connect)
    }

    return pool.slice(0, 4)
  }, [mood, phase, isFirstMessage])

  return (
    <div className="flex flex-wrap gap-2 px-2">
      {suggestions.map((suggestion, i) => (
        <button
          key={suggestion}
          onClick={() => onSelect(suggestion)}
          className="text-xs px-3.5 py-2 rounded-full border border-white/10 text-white/70 bg-white/5 hover:bg-white/10 hover:text-white/90 hover:border-white/20 backdrop-blur-sm transition-all duration-200 whitespace-nowrap"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}
