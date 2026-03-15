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
    gitaReframe: 'Equanimity means being steady in success AND failure. One result is just one moment on a much longer path.',
    kiaanResponse: 'I notice your mind has collapsed everything into two categories — total success or total failure. But life rarely operates in absolutes. Samatvam — the practice of meeting both praise and criticism with the same quiet composure — reveals something important: a single result is not a verdict. It is information. What if you held this outcome the way a river holds a stone — letting it shape you without stopping your flow? What did this experience actually teach you, beyond the label you gave it?',
    verse: { chapter: 2, verse: '2.48', text: 'Be even-minded in success and failure. Such equanimity is called Yoga.' },
    indicators: ['always', 'never', 'completely', 'totally', 'ruined', 'perfect', 'failure', 'disaster'],
  },
  {
    id: 'catastrophizing',
    name: 'Catastrophizing',
    description: 'Expecting the worst possible outcome and magnifying its significance.',
    example: '"If I lose this job, my life is over."',
    cbtReframe: 'What\'s the realistic worst case? And have you survived difficult things before?',
    gitaReframe: 'Even facing the most overwhelming circumstances, clarity is possible. If equanimity can exist in the fiercest storms, it can exist in yours.',
    kiaanResponse: 'Your mind is racing ahead to a future that does not yet exist — and it is choosing the darkest version to rehearse. But notice: that rehearsal IS the suffering, not the event itself. There is a deeper truth here — the part of you that has weathered every storm before this one was never actually destroyed by any of them. Something in you has always survived intact. That something is more durable than any circumstance. What if, instead of bracing for the worst, you simply attended to what is real right now — this breath, this moment, this one next step?',
    verse: { chapter: 2, verse: '2.11', text: 'The wise lament neither for the living nor for the dead.' },
    indicators: ['what if', 'worst', 'end of', 'life is over', 'everything is', 'can\'t survive', 'terrible'],
  },
  {
    id: 'mind-reading',
    name: 'Mind Reading',
    description: 'Assuming you know what others think (usually negative) without evidence.',
    example: '"Everyone thinks I\'m stupid."',
    cbtReframe: 'What evidence do you actually have? Have they said this, or are you assuming?',
    gitaReframe: 'Your dharma is your own path and effort. Others\' thoughts are their own field — you cannot cultivate both.',
    kiaanResponse: 'You are writing a story about what lives inside other people\'s minds — and it is a story that wounds you. But here is what\'s striking: you have no evidence for it. You are suffering from a narrative you authored yourself. Your svadharma — your own unique duty — is to walk your path with sincerity, not to decode the silent judgments of others. Their thoughts belong to their field, not yours. The only opinion with real power over your life is the one you hold about yourself. If you stopped trying to read their minds, what would you choose to believe about your own worth?',
    verse: { chapter: 3, verse: '3.35', text: 'It is better to do one\'s own duty imperfectly than another\'s duty perfectly.' },
    indicators: ['they think', 'everyone thinks', 'people must think', 'they probably', 'judging me', 'laughing at me'],
  },
  {
    id: 'should-statements',
    name: 'Should Statements',
    description: 'Rigid rules about how things "should" be, creating guilt and frustration.',
    example: '"I should have my life together by now."',
    cbtReframe: 'Says who? Whose timeline are you following? Your path is unique.',
    gitaReframe: 'Wisdom does not demand "you should be further along." It meets you exactly where you are and says: begin from here.',
    kiaanResponse: 'Listen to the word "should" in that sentence. It carries a hidden whip — one you are using on yourself. But whose timeline are you measuring against? Every "should" implies a script you did not write, a standard borrowed from somewhere outside your own dharma. The deepest wisdom does not operate in "shoulds." It says: reflect fully, then act from your own understanding. You are free to choose — not obligated to perform. You are not behind schedule. The path you are on unfolds at exactly the pace your growth requires. What would it feel like to replace "I should" with "I choose"?',
    verse: { chapter: 18, verse: '18.63', text: 'Reflect on this fully, then do as YOU wish.' },
    indicators: ['should', 'must', 'have to', 'supposed to', 'ought to', 'by now'],
  },
  {
    id: 'emotional-reasoning',
    name: 'Emotional Reasoning',
    description: 'Believing something is true because it FEELS true, regardless of evidence.',
    example: '"I feel worthless, so I must be worthless."',
    cbtReframe: 'Feelings are information, not facts. What evidence contradicts this feeling?',
    gitaReframe: 'There is a distinction between the field of experience (emotions, body, thoughts) and the one who witnesses that field. Your emotions are weather; you are the sky.',
    kiaanResponse: 'You are treating a feeling as if it were a fact — as if the emotion itself constitutes proof. But there is an ancient distinction worth sitting with: there is the field of experience — the body that tires, the emotions that surge, the thoughts that spiral — and then there is the one who watches all of it. You are not the storm. You are the awareness that notices the storm. Feelings are signals, not sentences. They inform you; they do not define you. The part of you that can observe "I feel worthless" is itself proof that you are something far larger than that feeling. What would the observer — the one watching all of this — say about your situation right now?',
    verse: { chapter: 13, verse: '13.1-2', text: 'This body is called the field, and one who knows it is the knower of the field.' },
    indicators: ['i feel like', 'feels like', 'i just feel', 'feel worthless', 'feel stupid', 'feel hopeless'],
  },
  {
    id: 'comparison',
    name: 'Social Comparison',
    description: 'Measuring your worth against others and always coming up short.',
    example: '"Everyone else has it figured out. I\'m the only one struggling."',
    cbtReframe: 'You\'re comparing your behind-the-scenes to their highlight reel. Everyone struggles privately.',
    gitaReframe: 'Each being walks a unique path. Comparing rivers is meaningless — they all reach the ocean by their own route.',
    kiaanResponse: 'You are standing at a window looking out at other people\'s lives, and measuring your interior against their exterior. That comparison will never produce anything but pain — because you are comparing your unedited experience to their curated surface. Each person carries a dharma that is uniquely theirs. Your path is not a slower version of someone else\'s — it is an entirely different river flowing toward the same ocean. Imperfect movement along YOUR path carries more truth than flawless imitation of another\'s. What would shift if you stopped measuring your progress against theirs and simply asked: am I moving forward on my own terms?',
    verse: { chapter: 4, verse: '4.11', text: 'In whatever way people approach Me, I reward them accordingly.' },
    indicators: ['everyone else', 'compared to', 'they have', 'i\'m the only one', 'why can\'t i', 'others are'],
  },
  {
    id: 'labeling',
    name: 'Labeling',
    description: 'Reducing yourself to a single negative label instead of seeing the full picture.',
    example: '"I\'m a loser." / "I\'m broken."',
    cbtReframe: 'You made a mistake; that doesn\'t make you "a loser." Labels are prisons, not truths.',
    gitaReframe: 'Your essential nature — awareness itself — was never born, never dies, and cannot be diminished by any label the mind invents.',
    kiaanResponse: 'Notice what just happened: you collapsed the vast complexity of who you are into a single word. "Broken." "Loser." But a label is a cage the mind builds, not a truth the self discovers. Your essential nature — the awareness reading these words right now — was never born and will never be destroyed. It cannot be "broken" any more than the sky can be scarred by the clouds passing through it. That label describes a moment, perhaps even a pattern — but it does not describe YOU. Somewhere beneath the label is a being of extraordinary depth who is far too large for any single word. If you stripped the label away entirely, what remains? What would you call yourself if you were being honest rather than harsh?',
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
