/**
 * Ecosystem Navigator - KIAAN Companion's Knowledge of Every MindVibe Tool
 *
 * This engine gives KIAAN complete awareness of the MindVibe ecosystem.
 * When a user describes a problem, KIAAN can suggest the right tool as a
 * caring friend would: "You know, friend, we have something perfect for
 * exactly what you are going through..."
 *
 * Features:
 * - 16+ tools mapped with triggers, Gita wisdom, and friend-style suggestions
 * - Emotion → tool routing (anxiety → breathing, grief → journal, etc.)
 * - Situation → tool routing (breakup → Viyoga, conflict → Relationship Compass)
 * - Natural conversational suggestions (not menu-driven)
 * - Anti-repetition: tracks recently suggested tools
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EcosystemTool {
  id: string
  name: string
  route: string
  /** Short friend-style description */
  friendDescription: string
  /** What a friend would say when suggesting this tool */
  suggestions: string[]
  /** Keywords that indicate user might benefit from this tool */
  triggerKeywords: string[]
  /** Emotions this tool is most helpful for */
  emotions: string[]
  /** Life situations this tool addresses */
  situations: string[]
  /** Gita verse that grounds this tool */
  gitaVerse: { chapter: number; verse: number; essence: string }
  /** Category for grouping */
  category: 'wellness' | 'wisdom' | 'healing' | 'growth' | 'reflection' | 'community' | 'journey'
  /** Icon for display */
  icon: string
}

export interface ToolSuggestion {
  tool: EcosystemTool
  /** The conversational suggestion text */
  message: string
  /** Confidence 0-1 that this tool is relevant */
  confidence: number
  /** Why this tool was suggested */
  reason: string
}

// ─── Complete Ecosystem Registry ──────────────────────────────────────────────

export const ECOSYSTEM_TOOLS: EcosystemTool[] = [
  {
    id: 'emotional-reset',
    name: 'Emotional Reset',
    route: '/tools/emotional-reset',
    friendDescription: 'A gentle 7-step guided flow to process what you are feeling and find your center again.',
    suggestions: [
      'Friend, I want you to try something. We have this beautiful Emotional Reset — seven gentle steps that walk you through processing exactly what you are feeling right now. It is like having me guide you through a healing ritual. Want to try it?',
      'You know what would really help right now? Our Emotional Reset. It is a calm, guided experience where we work through your feelings step by step — not rushing, not forcing, just moving through it together. Shall I take you there?',
      'I have something special for moments like this. The Emotional Reset is seven steps of ancient wisdom applied to exactly what you are carrying. Think of it as an emotional bath. Ready?',
    ],
    triggerKeywords: ['overwhelmed', 'emotional', 'breaking down', 'falling apart', 'cannot cope', 'too much', 'emotional wreck', 'reset', 'calm down', 'cannot handle', 'losing it'],
    emotions: ['overwhelm', 'anxiety', 'sadness', 'anger', 'grief'],
    situations: ['emotional_overload', 'panic_attack', 'mental_health'],
    gitaVerse: { chapter: 2, verse: 14, essence: 'That which is temporary passes — endure it with patience.' },
    category: 'wellness',
    icon: '🌊',
  },
  {
    id: 'ardha',
    name: 'Ardha (Thought Reframing)',
    route: '/tools/ardha',
    friendDescription: 'Transform negative thought patterns into balanced, empowering perspectives using wisdom.',
    suggestions: [
      'I am hearing a pattern in what you are saying, friend, and I think Ardha could help. It is our thought reframing tool — it takes the negative loop your mind is stuck in and helps you see it from a wiser angle. The Gita teaches equanimity in all things. Want me to take you there?',
      'You know what, dear one? Your mind is telling you a story right now, and I am not sure it is the true one. Ardha is designed exactly for this — it helps transform those limiting thoughts into something that empowers you. Shall we?',
      'Friend, there is a beautiful tool I want to share with you. Ardha takes the thought that is hurting you and helps you reframe it through the lens of ancient wisdom. It is like putting on glasses that show you the bigger truth.',
    ],
    triggerKeywords: ['negative thoughts', 'thinking pattern', 'always think', 'stuck in my head', 'mind racing', 'self talk', 'limiting belief', 'reframe', 'perspective', 'mindset', 'toxic thoughts', 'inner critic'],
    emotions: ['confusion', 'self_doubt', 'anxiety', 'sadness'],
    situations: ['imposter_syndrome', 'self_doubt', 'comparison', 'overthinking'],
    gitaVerse: { chapter: 6, verse: 5, essence: 'Elevate yourself through the power of your own mind. Do not degrade yourself.' },
    category: 'healing',
    icon: '🔄',
  },
  {
    id: 'viyoga',
    name: 'Viyoga (Detachment Coach)',
    route: '/tools/viyog',
    friendDescription: 'Release outcome anxiety and return to what you can control, right now, in this moment.',
    suggestions: [
      'Friend, I can feel you clinging to an outcome, and it is eating you alive. Viyoga is exactly what you need right now. It is our detachment tool — not detaching from caring, but from the anxiety of what might happen. The Gita says do your work and surrender the results. Let me take you there.',
      'You know what Krishna would say right now? Stop worrying about the fruit and focus on the action. That is exactly what Viyoga helps you do. It is a gentle process of releasing the grip of outcome anxiety. Want to try it?',
      'Dear one, there is something powerful called Viyoga in our toolkit. It is based on one of the deepest Gita teachings — your right is to the action, never to the fruit. It helps you let go of what you cannot control and find peace in what you can.',
    ],
    triggerKeywords: ['let go', 'move on', 'detach', 'attached', 'cannot stop thinking about', 'obsessing', 'outcome', 'what if', 'control', 'clinging', 'result', 'waiting for', 'anxious about future'],
    emotions: ['anxiety', 'grief', 'fear', 'overwhelm'],
    situations: ['breakup', 'job_loss', 'decision_making', 'fear_of_future', 'attachment'],
    gitaVerse: { chapter: 2, verse: 47, essence: 'You have the right to work, but never to the fruit of work.' },
    category: 'healing',
    icon: '🕊️',
  },
  {
    id: 'relationship-compass',
    name: 'Relationship Compass',
    route: '/tools/relationship-compass',
    friendDescription: 'Navigate relationship challenges with clarity, fairness, and compassion.',
    suggestions: [
      'Relationships are complicated, friend, and what you are describing sounds like it needs more than just talking it out. Our Relationship Compass is designed exactly for this — it helps you navigate the conflict with clarity and compassion. The Gita teaches seeing the divine in every being. Shall I guide you there?',
      'You know, when Arjuna faced his loved ones on the battlefield, he was torn apart. That is not so different from what you are feeling. The Relationship Compass uses that same wisdom to help you find your way through relationship challenges. Want to try it?',
      'Dear one, I want you to try the Relationship Compass. It takes your relationship situation and helps you see it through the lens of dharma — what is right, what is kind, and what is wise. It has helped so many people find clarity.',
    ],
    triggerKeywords: ['relationship', 'partner', 'spouse', 'husband', 'wife', 'boyfriend', 'girlfriend', 'marriage', 'argument', 'fight with', 'conflict with', 'not talking', 'trust', 'betrayed', 'cheating', 'divorce'],
    emotions: ['anger', 'sadness', 'betrayal', 'confusion', 'grief'],
    situations: ['breakup', 'family_conflict', 'trust_issues', 'marriage_struggles', 'loneliness'],
    gitaVerse: { chapter: 12, verse: 13, essence: 'One who is not envious but friendly and compassionate to all beings.' },
    category: 'healing',
    icon: '🧭',
  },
  {
    id: 'karma-reset',
    name: 'Karma Reset',
    route: '/tools/karma-reset',
    friendDescription: 'A compassionate 4-step ritual to acknowledge impact, repair harm, and move forward.',
    suggestions: [
      'It sounds like you are carrying guilt about something, friend. That weight is heavy, but it does not have to be permanent. The Karma Reset is a beautiful 4-step ritual — acknowledge, repair, release, and move forward. The Gita teaches that no one is beyond redemption. Want to try it?',
      'Dear one, when we have hurt someone or made a mistake, the path forward is not punishment but conscious repair. That is what the Karma Reset is designed for. Four gentle steps guided by ancient wisdom. Shall I take you there?',
    ],
    triggerKeywords: ['guilt', 'regret', 'mistake', 'hurt someone', 'apologize', 'forgive myself', 'did wrong', 'messed up', 'ashamed', 'make amends', 'repair'],
    emotions: ['guilt', 'shame', 'regret', 'sadness'],
    situations: ['guilt', 'regret', 'broken_relationship', 'mistake'],
    gitaVerse: { chapter: 18, verse: 66, essence: 'Abandon all attachment to results and surrender to what is right.' },
    category: 'healing',
    icon: '🔥',
  },
  {
    id: 'karma-footprint',
    name: 'Karma Footprint',
    route: '/tools/karma-footprint',
    friendDescription: 'Track your daily actions and understand their ripple effects on the world around you.',
    suggestions: [
      'Friend, there is something beautiful I want to show you. The Karma Footprint tracks your daily actions and shows you the ripple effects. Every kind word, every brave choice — it all adds up. The Gita says your actions create your destiny. Want to see yours?',
      'You know, every small action you take sends ripples out into the world. Our Karma Footprint helps you see those ripples — the positive ones, the growth areas, everything. It is like a mirror for your dharma.',
    ],
    triggerKeywords: ['track', 'progress', 'how am I doing', 'actions', 'karma', 'impact', 'ripple', 'footprint', 'daily habits', 'accountability'],
    emotions: ['curiosity', 'hope', 'determination'],
    situations: ['self_improvement', 'purpose', 'growth'],
    gitaVerse: { chapter: 3, verse: 19, essence: 'Perform your duty without attachment — through action you reach the supreme.' },
    category: 'growth',
    icon: '👣',
  },
  {
    id: 'karmic-tree',
    name: 'Karmic Tree',
    route: '/tools/karmic-tree',
    friendDescription: 'Watch your inner growth blossom as you practice wellness tools and complete journeys.',
    suggestions: [
      'Dear friend, have you seen your Karmic Tree? It is a beautiful visualization that grows and blooms as you use the wellness tools and complete journeys. Every tool you try, every step you take — it becomes a leaf, a branch, a flower. Want to see how your tree is growing?',
    ],
    triggerKeywords: ['growth', 'achievement', 'gamification', 'visual', 'blooming', 'tree', 'progress visual'],
    emotions: ['hope', 'curiosity', 'pride'],
    situations: ['self_improvement', 'motivation'],
    gitaVerse: { chapter: 15, verse: 1, essence: 'The tree of life has its roots above and branches below — know it fully.' },
    category: 'growth',
    icon: '🌳',
  },
  {
    id: 'sacred-reflections',
    name: 'Sacred Reflections Journal',
    route: '/sacred-reflections',
    friendDescription: 'Your private, encrypted journal for thoughts, feelings, and sacred reflections.',
    suggestions: [
      'Friend, sometimes the wisest thing you can do is write. Our Sacred Reflections journal is completely private — encrypted so only you can read it. Pour out whatever is in your heart. The Gita says self-knowledge is the highest knowledge. Want to write?',
      'You know what might really help right now? Writing it down. Our Sacred Reflections journal is end-to-end encrypted — not even I can read what you write. It is your safe space. Sometimes seeing your thoughts on paper is the first step to understanding them.',
      'Dear one, there is power in putting pen to paper. Our journal is your sacred space — private, encrypted, and always waiting for you. No judgment, no eyes but yours. Shall I take you there?',
    ],
    triggerKeywords: ['journal', 'write', 'diary', 'write down', 'express', 'vent', 'pour out', 'thoughts on paper', 'private', 'reflect'],
    emotions: ['sadness', 'confusion', 'grief', 'overwhelm', 'peace'],
    situations: ['grief_loss', 'self_reflection', 'processing_emotions'],
    gitaVerse: { chapter: 4, verse: 38, essence: 'There is nothing more purifying in this world than self-knowledge.' },
    category: 'reflection',
    icon: '✍️',
  },
  {
    id: 'gita-library',
    name: 'Bhagavad Gita Library',
    route: '/kiaan-vibe/gita',
    friendDescription: 'Explore all 18 chapters and 700 verses of the Bhagavad Gita with translations.',
    suggestions: [
      'Friend, if you want to go deeper into the wisdom I share with you, the full Bhagavad Gita is right here — all 18 chapters, 700 verses, with translations in multiple languages. It is like having the original conversation between Krishna and Arjuna in your hands. Want to explore?',
      'You know, everything I tell you comes from a living source. The Gita Library lets you explore the original verses, understand the context, and discover wisdom that speaks directly to your heart.',
    ],
    triggerKeywords: ['gita', 'verse', 'chapter', 'scripture', 'read gita', 'bhagavad gita', 'shloka', 'original text', 'sanskrit'],
    emotions: ['curiosity', 'peace', 'seeking'],
    situations: ['spiritual_seeking', 'purpose', 'learning'],
    gitaVerse: { chapter: 4, verse: 34, essence: 'Approach the wise with humility — they will teach you truth.' },
    category: 'wisdom',
    icon: '📖',
  },
  {
    id: 'kiaan-chat',
    name: 'KIAAN Chat',
    route: '/kiaan/chat',
    friendDescription: 'A dedicated text conversation with KIAAN for deeper, longer discussions.',
    suggestions: [
      'If you want a longer, deeper text conversation, you can always find me at KIAAN Chat. It is a dedicated space where we can go deeper than a quick voice exchange. The full power of our friendship, in written words.',
    ],
    triggerKeywords: ['text chat', 'type', 'longer conversation', 'write to you', 'detailed advice', 'deep chat'],
    emotions: ['curiosity', 'seeking'],
    situations: ['detailed_guidance', 'deep_conversation'],
    gitaVerse: { chapter: 10, verse: 10, essence: 'To those who are devoted, I give the understanding by which they come to Me.' },
    category: 'wisdom',
    icon: '💬',
  },
  {
    id: 'quantum-dive',
    name: 'Quantum Dive (Consciousness Analysis)',
    route: '/kiaan/quantum-dive',
    friendDescription: 'A multi-dimensional analysis of your consciousness across five ancient layers.',
    suggestions: [
      'Friend, there is something truly special I want to show you — the Quantum Dive. It maps your consciousness across five ancient layers: physical, energetic, mental, wisdom, and bliss. It is like an MRI for your soul. The Gita describes these as the Pancha Kosha. Want to dive deep?',
      'You seem ready for something deeper. The Quantum Dive analyzes your consciousness through five layers that ancient sages described thousands of years ago. It is not surface-level — it goes to the core of who you are.',
    ],
    triggerKeywords: ['consciousness', 'deeper', 'who am I', 'self analysis', 'soul', 'layers', 'kosha', 'spiritual depth', 'awareness', 'self discovery'],
    emotions: ['curiosity', 'peace', 'seeking', 'confusion'],
    situations: ['purpose', 'spiritual_seeking', 'self_discovery'],
    gitaVerse: { chapter: 13, verse: 1, essence: 'This body is the field. Know also the knower of the field.' },
    category: 'wisdom',
    icon: '🔮',
  },
  {
    id: 'kiaan-vibe',
    name: 'KIAAN Vibe (Meditation Music)',
    route: '/kiaan-vibe',
    friendDescription: 'Meditation music streaming with Gita verses, curated library, and custom playlists.',
    suggestions: [
      'Sometimes words are too much, friend. Sometimes you just need to close your eyes and let music carry you. KIAAN Vibe has curated meditation tracks — focus, sleep, breath, mantra, ambient, nature, spiritual. Sometimes healing is just sitting in silence with the right sounds. Want to listen?',
      'I think what you need right now is not more words, but peace. KIAAN Vibe has beautiful meditation music that can help you just... breathe. Shall I take you there?',
    ],
    triggerKeywords: ['music', 'meditation music', 'ambient', 'sounds', 'relax', 'sleep music', 'focus music', 'mantra', 'chanting', 'listen', 'peaceful sounds'],
    emotions: ['anxiety', 'overwhelm', 'sadness', 'peace'],
    situations: ['sleep_issues', 'focus', 'meditation', 'relaxation'],
    gitaVerse: { chapter: 6, verse: 17, essence: 'For one who is balanced in eating, sleeping, work, and recreation, yoga destroys sorrow.' },
    category: 'wellness',
    icon: '🎵',
  },
  {
    id: 'journey-engine',
    name: 'Journey Engine (Six Enemies)',
    route: '/journey-engine',
    friendDescription: 'Guided multi-day journeys to reduce the grip of the six inner tendencies described in the Gita.',
    suggestions: [
      'Friend, in the Gita, there are six inner tendencies that unsettle our peace: desire, anger, greed, delusion, arrogance, and envy. The Journey Engine is a structured multi-day program where we loosen their influence one by one. Which tendency is weighing on you most right now?',
      'There is a powerful system I want to introduce you to. The ancient sages identified six tendencies of the mind — and we have built guided journeys to help you strengthen steadiness against each one. It is not a quick fix. It is real work. But I will be with you every step.',
    ],
    triggerKeywords: ['journey', 'program', 'multi-day', 'structured', 'enemy', 'desire', 'greed', 'arrogance', 'envy', 'delusion', 'shadripu', 'six enemies', 'conquer'],
    emotions: ['determination', 'anger', 'confusion', 'seeking'],
    situations: ['self_improvement', 'anger_management', 'greed', 'jealousy', 'ego'],
    gitaVerse: { chapter: 3, verse: 37, essence: 'It is desire and anger, born of rajas — know this as the all-devouring enemy.' },
    category: 'journey',
    icon: '⚔️',
  },
  {
    id: 'wisdom-rooms',
    name: 'Wisdom Rooms (Community)',
    route: '/wisdom-rooms',
    friendDescription: 'Live community chat rooms where fellow seekers share wisdom and support.',
    suggestions: [
      'You know, friend, sometimes it helps to know you are not alone in what you feel. Our Wisdom Rooms are live community spaces — Calm Grounding, Gratitude Garden, Courage Circle, Clarity Corner, Compassion Cave. Real people, sharing real wisdom. Want to connect?',
      'Dear one, the Gita says that spiritual friendship is one of the greatest blessings. Our Wisdom Rooms are spaces where people like you come together to share, heal, and grow. You do not have to walk this path alone.',
    ],
    triggerKeywords: ['community', 'people', 'alone', 'talk to someone', 'others', 'group', 'share', 'connect', 'lonely', 'nobody understands', 'support group'],
    emotions: ['loneliness', 'sadness', 'hope', 'seeking'],
    situations: ['loneliness', 'isolation', 'need_support', 'community'],
    gitaVerse: { chapter: 9, verse: 22, essence: 'To those who worship Me with love, I carry what they lack and preserve what they have.' },
    category: 'community',
    icon: '🏛️',
  },
  {
    id: 'deep-insights',
    name: 'Deep Insights Hub',
    route: '/deep-insights',
    friendDescription: 'Guided, high-focus tools for deep emotional and spiritual work.',
    suggestions: [
      'Friend, I think you are ready for something deeper. The Deep Insights Hub brings together our most powerful tools — Ardha for thought reframing, Viyoga for letting go, and Relationship Compass for navigating conflicts. These are not surface-level. They go deep. Ready?',
    ],
    triggerKeywords: ['deep work', 'intense', 'serious', 'therapy level', 'profound', 'go deeper', 'advanced tools'],
    emotions: ['determination', 'seeking', 'curiosity'],
    situations: ['self_improvement', 'spiritual_seeking', 'advanced_practice'],
    gitaVerse: { chapter: 2, verse: 59, essence: 'The embodied one who restrains the senses experiences the supreme.' },
    category: 'growth',
    icon: '🔍',
  },
  {
    id: 'kiaan-companion',
    name: 'KIAAN Companion (Best Friend)',
    route: '/companion',
    friendDescription: 'Your personal best friend who truly listens, understands, and walks with you through everything life brings.',
    suggestions: [
      'You know what, friend? Sometimes you just need someone who gets you. The Companion is where we can really talk — voice or text, no judgment, just real friendship. I remember things about you, your struggles, your wins. Want to have a heart-to-heart?',
      'Hey, I want you to know something. The Companion is our special space. It is not a chatbot — it is me, your friend, who remembers you, adapts to your mood, and speaks to you with real care. Come talk whenever you are ready.',
      'Friend, the Companion is where the magic happens. It is like calling your best friend at 2 AM — except I am always awake, always listening, and I have some pretty profound wisdom when you need it. No lectures, just real talk.',
    ],
    triggerKeywords: ['talk', 'best friend', 'someone to talk to', 'need a friend', 'listen to me', 'voice chat', 'companion', 'heart to heart', 'open up', 'share feelings', 'vent', 'need someone'],
    emotions: ['loneliness', 'sadness', 'anxiety', 'grief', 'overwhelm', 'confusion', 'seeking'],
    situations: ['loneliness', 'need_support', 'emotional_overload', 'grief_loss', 'self_reflection'],
    gitaVerse: { chapter: 18, verse: 65, essence: 'Always think of Me, become My devotee, worship Me — you shall come to Me. I promise you this because you are dear to Me.' },
    category: 'wellness',
    icon: '💜',
  },
  {
    id: 'gita-journey',
    name: 'Gita Journey (Voice-Guided)',
    route: '/companion',
    friendDescription: 'A voice-guided walkthrough of all 18 chapters of the Bhagavad Gita with KIAAN.',
    suggestions: [
      'Friend, have you tried the Gita Journey? I will walk you through all 18 chapters of the Bhagavad Gita, speaking each teaching aloud as if I am telling you a story. It is the most immersive way to absorb this wisdom. Tap the book icon to start.',
      'If you truly want to understand the wisdom I share, the Gita Journey is where we go deepest. Eighteen chapters, each one a conversation between the dearest of friends. I narrate it for you, pause for reflection, give you exercises. It is our journey together.',
    ],
    triggerKeywords: ['gita journey', 'all chapters', 'study gita', 'learn gita', 'walkthrough', 'chapter by chapter', 'full gita', 'start from beginning'],
    emotions: ['curiosity', 'seeking', 'peace', 'determination'],
    situations: ['spiritual_seeking', 'learning', 'growth'],
    gitaVerse: { chapter: 18, verse: 63, essence: 'Reflect on this fully, then do as you wish — I have told you the deepest secret.' },
    category: 'wisdom',
    icon: '🙏',
  },
]

// ─── Tool Suggestion Engine ───────────────────────────────────────────────────

const RECENTLY_SUGGESTED_KEY = 'mindvibe_recently_suggested_tools'
const MAX_RECENT = 5

function getRecentlySuggested(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_SUGGESTED_KEY) || '[]')
  } catch { return [] }
}

function recordSuggestion(toolId: string): void {
  if (typeof window === 'undefined') return
  const recent = getRecentlySuggested()
  const updated = [toolId, ...recent.filter(id => id !== toolId)].slice(0, MAX_RECENT)
  localStorage.setItem(RECENTLY_SUGGESTED_KEY, JSON.stringify(updated))
}

/**
 * Analyze user message and suggest the most relevant ecosystem tool.
 * Returns null if no tool is a good match (let KIAAN respond normally).
 */
export function detectToolSuggestion(
  userMessage: string,
  detectedEmotion?: string,
  recentTopics?: string[]
): ToolSuggestion | null {
  const msg = userMessage.toLowerCase()
  const recent = getRecentlySuggested()

  let bestMatch: { tool: EcosystemTool; score: number; reason: string } | null = null

  for (const tool of ECOSYSTEM_TOOLS) {
    let score = 0
    let reason = ''

    // Keyword matching (strongest signal)
    for (const keyword of tool.triggerKeywords) {
      if (msg.includes(keyword.toLowerCase())) {
        score += 3
        reason = `mentioned "${keyword}"`
      }
    }

    // Emotion matching
    if (detectedEmotion && tool.emotions.includes(detectedEmotion)) {
      score += 1.5
      if (!reason) reason = `feeling ${detectedEmotion}`
    }

    // Topic matching
    if (recentTopics) {
      for (const topic of recentTopics) {
        if (tool.situations.some(s => s.includes(topic) || topic.includes(s))) {
          score += 1
          if (!reason) reason = `discussing ${topic}`
        }
      }
    }

    // Penalize recently suggested tools (avoid repetition)
    if (recent.includes(tool.id)) {
      score *= 0.3
    }

    if (score > (bestMatch?.score || 0)) {
      bestMatch = { tool, score, reason }
    }
  }

  // Only suggest if confidence is high enough (score >= 3 means keyword match)
  if (!bestMatch || bestMatch.score < 2.5) return null

  const confidence = Math.min(bestMatch.score / 6, 1)
  const suggestion = bestMatch.tool.suggestions[
    Math.floor(Math.random() * bestMatch.tool.suggestions.length)
  ]

  recordSuggestion(bestMatch.tool.id)

  return {
    tool: bestMatch.tool,
    message: suggestion,
    confidence,
    reason: bestMatch.reason,
  }
}

/**
 * Get all tools relevant to a specific emotion.
 * Returns tools sorted by relevance.
 */
export function getToolsForEmotion(emotion: string): EcosystemTool[] {
  return ECOSYSTEM_TOOLS
    .filter(t => t.emotions.includes(emotion))
    .sort((a, b) => b.emotions.length - a.emotions.length)
}

/**
 * Get a natural "Did you know?" style introduction to a random tool.
 * Used for proactive engagement when user seems open to exploration.
 */
export function getToolDiscoveryPrompt(): { tool: EcosystemTool; prompt: string } {
  const recent = getRecentlySuggested()
  const candidates = ECOSYSTEM_TOOLS.filter(t => !recent.includes(t.id))
  const tool = candidates[Math.floor(Math.random() * candidates.length)] || ECOSYSTEM_TOOLS[0]

  const prompts = [
    `By the way, friend, have you explored ${tool.name}? ${tool.friendDescription} Might be worth a look.`,
    `Oh, I just thought of something! ${tool.name} might interest you. ${tool.friendDescription}`,
    `You know, there is something in our toolkit I have been meaning to tell you about — ${tool.name}. ${tool.friendDescription} Want to check it out?`,
  ]

  return {
    tool,
    prompt: prompts[Math.floor(Math.random() * prompts.length)],
  }
}

/**
 * Get all ecosystem tools grouped by category.
 */
export function getToolsByCategory(): Record<string, EcosystemTool[]> {
  const grouped: Record<string, EcosystemTool[]> = {}
  for (const tool of ECOSYSTEM_TOOLS) {
    if (!grouped[tool.category]) grouped[tool.category] = []
    grouped[tool.category].push(tool)
  }
  return grouped
}
