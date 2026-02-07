/**
 * Cognitive Reframing with CBT + Bhagavad Gita
 *
 * Combines Cognitive Behavioral Therapy techniques with Gita wisdom
 * to help users identify cognitive distortions and reframe thoughts
 * using both psychological science and spiritual insight.
 *
 * Implements Item #92: Cognitive reframing.
 */

export interface CognitiveDistortion {
  id: string
  name: string
  description: string
  /** Example of the distorted thought */
  example: string
  /** CBT-based reframe */
  cbtReframe: string
  /** Gita-based reframe */
  gitaReframe: string
  /** What KIAAN says when detecting this distortion */
  kiaanResponse: string
  /** Related Gita verse */
  verse: { chapter: number; verse: string; text: string }
  /** Keywords that indicate this distortion */
  indicators: string[]
}

export const DISTORTIONS: CognitiveDistortion[] = [
  {
    id: 'all-or-nothing',
    name: 'All-or-Nothing Thinking',
    description: 'Seeing things in black-and-white with no middle ground.',
    example: '"I failed the exam. I\'m a complete failure."',
    cbtReframe: 'One exam doesn\'t define your intelligence. What parts DID you do well on?',
    gitaReframe: 'The Gita teaches equanimity - being steady in success AND failure. One result is just one moment on an infinite journey.',
    kiaanResponse: 'Friend, I notice you\'re seeing this as all-or-nothing. But the Gita teaches us: success and failure are two sides of the same coin. What if instead of "I failed," you said "I learned what I need to study more"? That\'s not just positive thinking - that\'s wisdom.',
    verse: { chapter: 2, verse: '2.48', text: 'Be even-minded in success and failure. Such equanimity is called Yoga.' },
    indicators: ['always', 'never', 'completely', 'totally', 'ruined', 'perfect', 'failure', 'disaster'],
  },
  {
    id: 'catastrophizing',
    name: 'Catastrophizing',
    description: 'Expecting the worst possible outcome and magnifying its significance.',
    example: '"If I lose this job, my life is over."',
    cbtReframe: 'What\'s the realistic worst case? And have you survived difficult things before?',
    gitaReframe: 'Krishna told Arjuna facing literal war: "Do not grieve." If peace is possible on a battlefield, it\'s possible in your situation too.',
    kiaanResponse: 'Dear one, I can feel your mind racing to the worst possible outcome. But here\'s what the Gita taught me: the future you\'re afraid of hasn\'t happened yet. And even if the worst comes, Chapter 2 promises: "The soul cannot be destroyed." You have survived every hard day so far. What makes you think you won\'t survive this one?',
    verse: { chapter: 2, verse: '2.11', text: 'The wise lament neither for the living nor for the dead.' },
    indicators: ['what if', 'worst', 'end of', 'life is over', 'everything is', 'can\'t survive', 'terrible'],
  },
  {
    id: 'mind-reading',
    name: 'Mind Reading',
    description: 'Assuming you know what others think (usually negative) without evidence.',
    example: '"Everyone thinks I\'m stupid."',
    cbtReframe: 'What evidence do you actually have? Have they said this, or are you assuming?',
    gitaReframe: 'The Gita says to focus on your own dharma, not on others\' opinions. Their thoughts are their karma, not yours.',
    kiaanResponse: 'Friend, you\'re reading minds again - and writing a story that hurts you. The Gita says "It is better to do one\'s own duty imperfectly than another\'s duty perfectly." That includes letting go of trying to control what others think. What do YOU think of yourself? That\'s the only opinion that shapes your life.',
    verse: { chapter: 3, verse: '3.35', text: 'It is better to do one\'s own duty imperfectly than another\'s duty perfectly.' },
    indicators: ['they think', 'everyone thinks', 'people must think', 'they probably', 'judging me', 'laughing at me'],
  },
  {
    id: 'should-statements',
    name: 'Should Statements',
    description: 'Rigid rules about how things "should" be, creating guilt and frustration.',
    example: '"I should have my life together by now."',
    cbtReframe: 'Says who? Whose timeline are you following? Your path is unique.',
    gitaReframe: 'Krishna never said "you should be further along." He met Arjuna EXACTLY where he was - in despair, on a battlefield - and said "let\'s begin."',
    kiaanResponse: 'I hear a lot of "should" in what you\'re saying, friend. And every "should" is a tiny whip you\'re using on yourself. The Gita never uses the word "should." Krishna says "this is the truth, and you are free to choose." You\'re not behind schedule. You\'re exactly where your journey needs you to be right now.',
    verse: { chapter: 18, verse: '18.63', text: 'Reflect on this fully, then do as YOU wish.' },
    indicators: ['should', 'must', 'have to', 'supposed to', 'ought to', 'by now'],
  },
  {
    id: 'emotional-reasoning',
    name: 'Emotional Reasoning',
    description: 'Believing something is true because it FEELS true, regardless of evidence.',
    example: '"I feel worthless, so I must be worthless."',
    cbtReframe: 'Feelings are information, not facts. What evidence contradicts this feeling?',
    gitaReframe: 'The Gita distinguishes between the field (emotions/body) and the knower of the field (the witnessing Self). Your emotions are waves; you are the ocean.',
    kiaanResponse: 'Friend, you\'re treating your feelings as facts. But the Gita makes a crucial distinction in Chapter 13: there is the "field" - your body, emotions, thoughts - and there is the "knower of the field" - the real you who OBSERVES these feelings. You are not your feelings. You are the one HAVING the feelings. Big difference. What would the "observer" say about this situation?',
    verse: { chapter: 13, verse: '13.1-2', text: 'This body is called the field, and one who knows it is the knower of the field.' },
    indicators: ['i feel like', 'feels like', 'i just feel', 'feel worthless', 'feel stupid', 'feel hopeless'],
  },
  {
    id: 'comparison',
    name: 'Social Comparison',
    description: 'Measuring your worth against others and always coming up short.',
    example: '"Everyone else has it figured out. I\'m the only one struggling."',
    cbtReframe: 'You\'re comparing your behind-the-scenes to their highlight reel. Everyone struggles privately.',
    gitaReframe: 'The Gita says each being has a unique dharma. Comparing paths is like comparing rivers - they all reach the ocean, but each takes its own route.',
    kiaanResponse: 'I see you comparing yourself again, friend. And I want to tell you something the Gita taught me: every soul has its own unique path. Chapter 4 says "In whatever way people approach Me, I reward them accordingly." Your path is not better or worse - it\'s YOURS. What would change if you stopped looking at others\' paths and fully committed to your own?',
    verse: { chapter: 4, verse: '4.11', text: 'In whatever way people approach Me, I reward them accordingly.' },
    indicators: ['everyone else', 'compared to', 'they have', 'i\'m the only one', 'why can\'t i', 'others are'],
  },
  {
    id: 'labeling',
    name: 'Labeling',
    description: 'Reducing yourself to a single negative label instead of seeing the full picture.',
    example: '"I\'m a loser." / "I\'m broken."',
    cbtReframe: 'You made a mistake; that doesn\'t make you "a loser." Labels are prisons, not truths.',
    gitaReframe: 'The Gita says the soul is sat-chit-ananda: existence, consciousness, bliss. THAT is your true label.',
    kiaanResponse: 'Friend, I just heard you label yourself, and I need to gently push back. The Gita says your true nature is sat-chit-ananda - pure existence, pure consciousness, pure bliss. That\'s who you REALLY are. A label like "loser" or "broken" is like putting a sticker on the sun and saying the sun IS that sticker. It\'s not. You\'re the sun. What would you call yourself if you were being kind instead of cruel?',
    verse: { chapter: 2, verse: '2.20', text: 'The soul is not born, nor does it die. It is unborn, eternal, ever-existing.' },
    indicators: ['i\'m a', 'i am such a', 'i\'m just', 'i\'m nothing', 'i\'m broken', 'i\'m stupid', 'i\'m worthless'],
  },
]

// ─── Detection & Response ───────────────────────────────────────────────────

/**
 * Detect cognitive distortions in user text.
 * Returns the best matching distortion(s).
 */
export function detectDistortions(text: string): CognitiveDistortion[] {
  const lower = text.toLowerCase()
  const matches: Array<{ distortion: CognitiveDistortion; score: number }> = []

  for (const distortion of DISTORTIONS) {
    let score = 0
    for (const indicator of distortion.indicators) {
      if (lower.includes(indicator)) score += 2
    }
    if (score > 0) matches.push({ distortion, score })
  }

  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(m => m.distortion)
}

/**
 * Get KIAAN's reframing response for a detected distortion.
 */
export function getReframingResponse(text: string): {
  distortion: CognitiveDistortion
  response: string
  verse: { chapter: number; verse: string; text: string }
} | null {
  const distortions = detectDistortions(text)
  if (distortions.length === 0) return null

  const primary = distortions[0]
  return {
    distortion: primary,
    response: primary.kiaanResponse,
    verse: primary.verse,
  }
}

export function getDistortionCount(): number {
  return DISTORTIONS.length
}
