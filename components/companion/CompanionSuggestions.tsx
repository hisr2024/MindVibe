'use client'

/**
 * CompanionSuggestions - Quick reply suggestions for the chat.
 *
 * Shows contextual conversation starters or follow-up suggestions
 * that feel natural - like topics a best friend might bring up.
 */

interface SuggestionsProps {
  mood?: string
  phase?: string
  isFirstMessage?: boolean
  onSelect: (suggestion: string) => void
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

export default function CompanionSuggestions({
  mood,
  phase,
  isFirstMessage = false,
  onSelect,
}: SuggestionsProps) {
  // Choose suggestions based on context
  let pool: string[]
  if (isFirstMessage) {
    pool = SUGGESTIONS.first_time
  } else if (mood && SUGGESTIONS[mood]) {
    // Mix mood-specific with phase-specific
    const moodSuggestions = SUGGESTIONS[mood] || []
    const phaseSuggestions = SUGGESTIONS[phase || 'connect'] || []
    pool = [...moodSuggestions.slice(0, 2), ...phaseSuggestions.slice(0, 2)]
  } else {
    pool = SUGGESTIONS[phase || 'connect'] || SUGGESTIONS.connect
  }

  // Show max 4 suggestions
  const suggestions = pool.slice(0, 4)

  return (
    <div className="flex flex-wrap gap-2 px-2">
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          onClick={() => onSelect(suggestion)}
          className="text-xs px-3 py-1.5 rounded-full border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 hover:border-violet-300 transition-all duration-200 whitespace-nowrap"
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
}
