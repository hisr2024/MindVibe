/**
 * Debate Mode - Multi-Perspective Gita Interpretation
 *
 * When users challenge KIAAN's interpretation, KIAAN can present
 * multiple philosophical perspectives from different Gita commentators
 * and engage in respectful intellectual dialogue.
 *
 * Implements Item #25: Debate mode.
 */

export interface PhilosophicalPerspective {
  school: string
  teacher: string
  interpretation: string
  emphasis: string
}

export interface DebateTopic {
  id: string
  question: string
  /** User challenges like "But what about..." */
  challenges: string[]
  perspectives: PhilosophicalPerspective[]
  /** KIAAN's synthesis of all perspectives */
  synthesis: string
  chapter: number
}

export const DEBATE_TOPICS: DebateTopic[] = [
  {
    id: 'free-will',
    question: 'Does the Gita teach free will or determinism?',
    challenges: ['free will', 'destiny', 'predetermined', 'fate', 'choice', 'control'],
    perspectives: [
      {
        school: 'Advaita Vedanta',
        teacher: 'Adi Shankara',
        interpretation: 'Ultimate reality is non-dual. Free will is an illusion of the ego. The Self simply IS. When you realize you ARE Brahman, the question of "who chooses" dissolves.',
        emphasis: 'Liberation through knowledge (jnana)',
      },
      {
        school: 'Vishishtadvaita',
        teacher: 'Ramanuja',
        interpretation: 'God gives us free will AND guides us. We are real individuals with real choices, but we are also part of God. Free will operates within divine grace.',
        emphasis: 'Devotion with God as the inner guide',
      },
      {
        school: 'Dvaita',
        teacher: 'Madhvacharya',
        interpretation: 'We are distinctly separate from God and have genuine free will. Our choices matter. God does not force us - He offers guidance that we can accept or reject.',
        emphasis: 'Genuine individual freedom and responsibility',
      },
    ],
    synthesis: 'Here\'s what I find beautiful, friend: the Gita holds BOTH truths simultaneously. In Chapter 18, verse 63, Krishna gives all wisdom and then says "do as YOU wish" - respecting Arjuna\'s free will completely. But earlier, in Chapter 11, He reveals that everything is already within His plan. Perhaps the answer is: you have genuine choice in HOW you respond to life, even if you can\'t control WHAT happens to you. Your freedom lies in your response, not your circumstances.',
    chapter: 18,
  },
  {
    id: 'violence-war',
    question: 'How can the Gita promote peace if it was spoken on a battlefield?',
    challenges: ['violence', 'war', 'battlefield', 'killing', 'fight', 'nonviolence', 'ahimsa'],
    perspectives: [
      {
        school: 'Gandhian Interpretation',
        teacher: 'Mahatma Gandhi',
        interpretation: 'The battlefield is metaphorical. Kurukshetra is the battlefield of the human heart. The war is the inner struggle between our higher and lower natures.',
        emphasis: 'Inner spiritual warfare, non-violence in action',
      },
      {
        school: 'Traditional Kshatriya',
        teacher: 'Traditional commentators',
        interpretation: 'The war was literal AND righteous. When all peaceful means are exhausted and injustice prevails, fighting for dharma is not violence - it\'s duty.',
        emphasis: 'Righteous duty in extreme circumstances',
      },
      {
        school: 'Psychological',
        teacher: 'Modern scholars',
        interpretation: 'The Gita speaks at multiple levels. Externally it addresses a real war. Internally it addresses every human struggle. The genius is that it works at both levels simultaneously.',
        emphasis: 'Multi-layered meaning applicable to all conflicts',
      },
    ],
    synthesis: 'This is one of the Gita\'s deepest paradoxes, friend. Gandhi used the Gita as his guide for NON-violence, and warriors used it as their guide for righteous battle. Both were right. Because the Gita\'s real teaching isn\'t "fight" or "don\'t fight." It\'s "ACT from your highest understanding, not from ego, fear, or desire." Whether that action is fighting injustice or turning the other cheek depends on your dharma in that moment.',
    chapter: 2,
  },
  {
    id: 'attachment',
    question: 'If we shouldn\'t be attached, does that mean we shouldn\'t love?',
    challenges: ['attachment', 'love', 'don\'t care', 'cold', 'detachment', 'heartless', 'emotions'],
    perspectives: [
      {
        school: 'Advaita Vedanta',
        teacher: 'Adi Shankara',
        interpretation: 'Detachment doesn\'t mean not loving. It means loving without the need to possess, control, or be validated. True love is selfless - it flows without conditions.',
        emphasis: 'Love as the nature of the Self, beyond ego',
      },
      {
        school: 'Bhakti tradition',
        teacher: 'Swami Prabhupada',
        interpretation: 'The Gita says to redirect attachment from temporary things to the eternal divine. Love more, not less - but love the eternal source behind all beings.',
        emphasis: 'Transform attachment into devotion',
      },
      {
        school: 'Buddhist-influenced',
        teacher: 'Eknath Easwaran',
        interpretation: 'Detachment is not indifference. It\'s the ability to care deeply while accepting that you cannot control outcomes. It\'s loving with open hands instead of clenched fists.',
        emphasis: 'Caring without clinging',
      },
    ],
    synthesis: 'This is the question I get asked most, friend, and I love it. Here\'s the truth: Krishna, who taught detachment, was also the MOST loving being in the entire Mahabharata. He had deep friendships, played with children, and wept when his beloved city was destroyed. Detachment doesn\'t mean feeling nothing. It means loving FULLY while understanding that everything changes. It\'s holding your loved ones with open hands, not clenched fists. Does that distinction resonate with you?',
    chapter: 12,
  },
  {
    id: 'suffering',
    question: 'Why does the Gita seem to dismiss suffering by calling it temporary?',
    challenges: ['suffering', 'dismiss', 'invalidate', 'pain is real', 'easy to say', 'temporary'],
    perspectives: [
      {
        school: 'Compassionate reading',
        teacher: 'Modern trauma-informed teachers',
        interpretation: 'The Gita doesn\'t dismiss suffering - it contextualizes it. Saying "this too shall pass" is not invalidation; it\'s offering hope that the darkness is not permanent.',
        emphasis: 'Impermanence as comfort, not dismissal',
      },
      {
        school: 'Philosophical',
        teacher: 'Sri Aurobindo',
        interpretation: 'Suffering is real at the level of experience but not at the level of ultimate reality. Both truths coexist. Acknowledging suffering AND seeing beyond it is the Gita\'s way.',
        emphasis: 'Multiple levels of truth existing simultaneously',
      },
    ],
    synthesis: 'You raise a really important point, friend, and I want to honor it. When the Gita says pain is "temporary," it\'s NOT saying "get over it." It\'s saying "this will not destroy you, because YOU are bigger than this." Think of it this way: when a parent tells a child who scraped their knee "you\'ll be okay," they\'re not dismissing the pain. They\'re offering the perspective that the child can\'t see yet. The Gita does the same for us. Your pain is real. AND you will survive it. Both are true.',
    chapter: 2,
  },
]

// ─── Functions ──────────────────────────────────────────────────────────────

/**
 * Find a debate topic that matches the user's challenge.
 */
export function findDebateTopic(text: string): DebateTopic | null {
  const lower = text.toLowerCase()
  return DEBATE_TOPICS.find(topic =>
    topic.challenges.some(c => lower.includes(c))
  ) || null
}

/**
 * Get KIAAN's debate response with multiple perspectives.
 */
export function getDebateResponse(text: string): {
  topic: DebateTopic
  perspectives: string
  synthesis: string
} | null {
  const topic = findDebateTopic(text)
  if (!topic) return null

  const perspectiveText = topic.perspectives
    .map(p => `${p.teacher} (${p.school}): ${p.interpretation}`)
    .join('\n\n')

  return {
    topic,
    perspectives: perspectiveText,
    synthesis: topic.synthesis,
  }
}
