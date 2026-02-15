/**
 * Wisdom Core Engine — Full 701-verse Bhagavad Gita Corpus
 *
 * Provides intelligent, context-aware verse selection for the KIAAN chatbot.
 * Draws from the complete authenticated Gita corpus (gita_verses_complete.json)
 * and translates wisdom into modern psychology and behavioral science framing.
 *
 * Architecture:
 * 1. Load + index all 701 verses at module init (cached by Node.js module system)
 * 2. Map moods → mental_health_applications for scoring
 * 3. Map topics → mental_health_applications for scoring
 * 4. Score + rank + sample with variety for each query
 * 5. Return verse with psychology-grounded wisdom text
 */

// ─── Types ───────────────────────────────────────────────────────────────

export interface GitaVerse {
  chapter: number
  verse: number
  sanskrit: string
  transliteration: string
  english: string
  hindi: string
  word_meanings: string
  chapter_name: string
  theme: string
  principle: string
  mental_health_applications: string[]
}

export interface WisdomResult {
  verse_ref: string
  chapter: number
  verse: number
  english: string
  sanskrit: string
  theme: string
  principle: string
  psychological_insight: string
  mental_health_applications: string[]
}

// ─── Mood → Application Mapping ──────────────────────────────────────────
// Maps detected moods to relevant mental_health_application tags

const MOOD_TO_APPLICATIONS: Record<string, string[]> = {
  anxious: ['anxiety_management', 'stress_reduction', 'emotional_regulation', 'letting_go', 'detachment', 'inner_peace', 'mindfulness', 'acceptance', 'distress_tolerance', 'present_moment_focus'],
  sad: ['depression_recovery', 'grief_processing', 'grief', 'resilience', 'self_compassion', 'acceptance', 'emotional_regulation', 'impermanence', 'self_care', 'inner_peace'],
  angry: ['anger_management', 'anger', 'impulse_control', 'emotional_regulation', 'forgiveness', 'compassion', 'self_discipline', 'equanimity', 'discernment', 'conflict_resolution'],
  confused: ['cognitive_clarity', 'mental_clarity', 'discernment', 'self_knowledge', 'wisdom', 'identity_clarity', 'purpose_and_meaning', 'self_awareness', 'insight', 'focus'],
  lonely: ['emotional_connection', 'relationships', 'self_compassion', 'self_acceptance', 'devotion', 'kindness', 'love', 'selfless_love', 'inner_peace', 'interconnection'],
  overwhelmed: ['stress_reduction', 'distress_tolerance', 'emotional_regulation', 'balance', 'acceptance', 'letting_go', 'surrender', 'self_care', 'mindfulness', 'focus'],
  hurt: ['grief_processing', 'forgiveness', 'self_compassion', 'resilience', 'acceptance', 'emotional_regulation', 'letting_go', 'impermanence', 'self_care', 'inner_freedom'],
  guilty: ['self_compassion', 'self_acceptance', 'forgiveness', 'moral_clarity', 'dharma', 'acceptance', 'personal_growth', 'transformation', 'action', 'self_improvement'],
  fearful: ['anxiety_management', 'resilience', 'inner_peace', 'endurance', 'self_empowerment', 'trust', 'protection', 'liberation', 'faith', 'freedom'],
  stressed: ['stress_reduction', 'balance', 'emotional_regulation', 'mindfulness', 'self_care', 'acceptance', 'equanimity', 'present_moment_focus', 'inner_peace', 'letting_go'],
  frustrated: ['impulse_control', 'emotional_regulation', 'patience', 'acceptance', 'action', 'self_discipline', 'detachment', 'equanimity', 'personal_growth', 'resilience'],
  jealous: ['self_acceptance', 'contentment', 'equanimity', 'self_knowledge', 'gratitude', 'personal_growth', 'identity_clarity', 'self_awareness', 'inner_peace', 'detachment'],
  happy: ['gratitude', 'contentment', 'mindfulness', 'present_moment_focus', 'balance', 'appreciation', 'emotional_balance', 'positive_thinking', 'inner_peace', 'purpose'],
  excited: ['focus', 'balance', 'mindfulness', 'intentionality', 'purpose_and_meaning', 'action', 'discipline', 'present_moment_focus', 'self_awareness', 'motivation'],
  hopeful: ['motivation', 'personal_growth', 'resilience', 'action', 'purpose_and_meaning', 'self_empowerment', 'transformation', 'self_improvement', 'aspiration', 'faith'],
  peaceful: ['inner_peace', 'mindfulness', 'meditation', 'equanimity', 'balance', 'contentment', 'self_awareness', 'acceptance', 'gratitude', 'meditation_support'],
  grateful: ['gratitude', 'appreciation', 'contentment', 'mindfulness', 'positive_thinking', 'inner_peace', 'devotion', 'humility', 'self_awareness', 'emotional_balance'],
  neutral: ['self_awareness', 'mindfulness', 'cognitive_awareness', 'wisdom', 'self_knowledge', 'purpose_and_meaning', 'personal_growth', 'insight', 'focus', 'action'],
}

// ─── Topic → Application Mapping ─────────────────────────────────────────

const TOPIC_TO_APPLICATIONS: Record<string, string[]> = {
  family: ['relationships', 'compassion', 'forgiveness', 'emotional_connection', 'selfless_love', 'kindness', 'duty', 'dharma', 'conflict_resolution', 'love'],
  relationship: ['relationships', 'attachment', 'attachment_release', 'forgiveness', 'emotional_connection', 'love', 'compassion', 'conflict_resolution', 'self_compassion', 'boundaries'],
  work: ['work_stress', 'stress_reduction', 'action', 'duty', 'karma', 'detachment', 'focus', 'discipline', 'motivation', 'purpose_and_meaning'],
  academic: ['focus', 'self_discipline', 'stress_reduction', 'cognitive_clarity', 'mental_clarity', 'anxiety_management', 'motivation', 'learning', 'self_improvement', 'action'],
  health: ['self_care', 'body_awareness', 'balance', 'resilience', 'acceptance', 'mindfulness', 'meditation', 'inner_peace', 'endurance', 'stress_reduction'],
  celebration: ['gratitude', 'appreciation', 'contentment', 'positive_thinking', 'inner_peace', 'mindfulness', 'emotional_balance', 'love', 'purpose', 'devotion'],
  loss: ['grief_processing', 'grief', 'impermanence', 'resilience', 'acceptance', 'self_compassion', 'inner_peace', 'letting_go', 'emotional_regulation', 'endurance'],
  growth: ['personal_growth', 'self_improvement', 'transformation', 'self_knowledge', 'self_awareness', 'self_empowerment', 'discipline', 'motivation', 'action', 'aspiration'],
  spiritual: ['meditation', 'self_knowledge', 'self_awareness', 'inner_peace', 'consciousness', 'wisdom', 'mindfulness', 'transcendence', 'purpose_and_meaning', 'insight'],
  general: ['self_awareness', 'mindfulness', 'wisdom', 'action', 'purpose_and_meaning', 'personal_growth', 'emotional_regulation', 'resilience', 'cognitive_awareness', 'insight'],
}

// ─── Chapter Relevance Weights ───────────────────────────────────────────
// Chapters with highest therapeutic density get a scoring boost

const CHAPTER_WEIGHTS: Record<number, number> = {
  1: 0.8,   // Emotional crisis — relevant for naming emotional states
  2: 1.5,   // Wisdom/equanimity — highest therapeutic value
  3: 1.3,   // Action/karma yoga — behavioral activation
  4: 1.0,   // Knowledge
  5: 1.2,   // Renunciation — letting go
  6: 1.4,   // Meditation/self-control — regulation techniques
  7: 0.9,   // Knowledge of the absolute
  8: 0.7,   // Imperishable — abstract
  9: 0.8,   // Royal knowledge
  10: 0.7,  // Divine glories — abstract
  11: 0.5,  // Universal form — highly abstract
  12: 1.3,  // Devotion/compassion — relationship-focused
  13: 1.1,  // Self-knowledge
  14: 1.0,  // Three gunas — personality/temperament
  15: 0.8,  // Supreme person
  16: 1.2,  // Virtues vs vices — character development
  17: 0.9,  // Faith types
  18: 1.4,  // Liberation/synthesis — comprehensive
}

// ─── Psychology Translation Layer ────────────────────────────────────────
// Translates Gita concepts into cognitive science language

const PSYCHOLOGY_FRAMES: Record<string, string> = {
  detachment: 'Cognitive defusion — separating yourself from the thought rather than being fused with it. You can notice the attachment without acting from it.',
  letting_go: 'Acceptance-based coping — releasing the effortful control that is itself generating distress. This is not giving up; it is redirecting energy.',
  equanimity: 'Emotional regulation through equanimity — the capacity to experience the full range of emotions without being destabilized by any of them.',
  mindfulness: 'Present-moment awareness without judgment. Your attention stays with what IS, rather than looping into what was or what might be.',
  self_awareness: 'Metacognition — the ability to observe your own mental processes. This self-monitoring capacity is the strongest predictor of behavioral change.',
  acceptance: 'Psychological acceptance — acknowledging reality as it is, without avoidance or suppression. This reduces the secondary suffering that resistance creates.',
  resilience: 'Psychological resilience — your demonstrated capacity to adapt under stress. This is not a trait you either have or lack; it is a skill that strengthens with use.',
  inner_peace: 'Nervous system regulation — a state where your parasympathetic system is dominant, enabling clear thinking, social connection, and recovery.',
  self_compassion: 'Self-compassion — treating yourself with the same concern you would offer someone you care about. Research shows this outperforms self-criticism on every outcome measure.',
  forgiveness: 'Cognitive reappraisal of past harm — not condoning what happened, but releasing the ongoing neurological cost of carrying resentment.',
  action: 'Behavioral activation — taking values-aligned action even when motivation is low. Action generates the neurochemistry that creates motivation, not the other way around.',
  duty: 'Values-aligned action — acting from your core values rather than from impulse, avoidance, or external pressure.',
  karma: 'Process focus — directing attention to the quality of your effort rather than the uncertainty of outcomes. This reduces performance anxiety and increases flow.',
  focus: 'Attentional control — the trained ability to direct and sustain attention where you choose, rather than where habit or distraction pulls it.',
  discipline: 'Self-regulation — the executive function capacity to override impulse in service of a longer-term goal. This is a trainable skill, not a fixed trait.',
  gratitude: 'Gratitude practice rewires the reticular activating system, shifting your brain\'s attention filter to notice positive data alongside negative.',
  compassion: 'Compassion activates the care-giving system (oxytocin, vagal tone) rather than the threat system. It is a regulated response, not just an emotion.',
  meditation: 'Meditation is attentional training that strengthens prefrontal cortex function, improves emotional regulation, and reduces default-mode network rumination.',
  surrender: 'Psychological flexibility — the willingness to contact the present moment fully and change behavior in service of chosen values, even when it is uncomfortable.',
  balance: 'Allostatic regulation — your system\'s ability to maintain stability through change. This requires cycling between effort and recovery, not constant output.',
  stress_reduction: 'Downregulation of the HPA axis — reducing cortisol through vagal activation (slow breathing, grounding, social connection) rather than cognitive effort.',
  anxiety_management: 'Anxiety is future-focused threat simulation. The intervention is present-moment anchoring and behavioral exposure rather than avoidance.',
  anger_management: 'Anger management through the window of tolerance — keeping arousal within the range where executive function remains online.',
  impulse_control: 'Response inhibition — the prefrontal capacity to pause between stimulus and response. Each pause strengthens the neural pathway for the next one.',
  self_knowledge: 'Interoceptive awareness — the ability to read your own internal states accurately. This is the foundation of emotional intelligence.',
  contentment: 'Hedonic adaptation works in both directions. Contentment is not about having more — it is about recalibrating your reference point to what is actually present.',
  grief_processing: 'Grief is the neurological cost of attachment. The pain is proportional to what mattered. Processing it means allowing the waves rather than damming them.',
  identity_clarity: 'Self-concept clarity — having a coherent, stable sense of who you are that is not contingent on external validation or recent performance.',
  personal_growth: 'Post-traumatic growth and deliberate development — the documented capacity of the human brain to build new capability from difficulty.',
  self_discipline: 'Executive function training — strengthening the neural circuits for planning, prioritization, and impulse override through consistent practice.',
  emotional_regulation: 'Affect regulation — the ability to modulate emotional intensity, duration, and expression. This is a skill that develops through practice, not willpower.',
  purpose_and_meaning: 'Values clarification — identifying what genuinely matters to you and using that as a compass for decision-making.',
  cognitive_clarity: 'Prefrontal cortex engagement — clear thinking that emerges when emotional arousal is within the window of tolerance.',
  conflict_resolution: 'Perspective-taking and de-escalation — the regulated capacity to hold another person\'s viewpoint alongside your own.',
  relationships: 'Attachment theory — understanding your relational patterns (secure, anxious, avoidant) and how they shape your expectations and behaviors in relationships.',
  impermanence: 'Neuroplasticity and state-transience — your brain and emotional states are constantly changing. No current state, positive or negative, is permanent.',
  transformation: 'Neuroplastic change — your brain physically reorganizes in response to new experiences, behaviors, and attention patterns. Change is not metaphorical; it is structural.',
  self_empowerment: 'Self-efficacy — your belief in your ability to influence outcomes through your own effort. This is the strongest predictor of follow-through.',
  depression_recovery: 'Behavioral activation for depression — starting with small, achievable actions that generate positive reinforcement and break the withdrawal cycle.',
  distress_tolerance: 'Distress tolerance — the capacity to endure difficult emotional states without resorting to avoidance, suppression, or impulsive behavior.',
  work_stress: 'Occupational stress management — distinguishing between controllable inputs (effort, boundaries) and uncontrollable outcomes (results, others\' behavior).',
  liberation: 'Psychological freedom — the state of acting from choice rather than from conditioning, compulsion, or avoidance.',
  wisdom: 'Applied self-knowledge — understanding your patterns well enough to interrupt automatic reactions and choose deliberate responses.',
  attachment_release: 'Cognitive defusion from attachment objects — maintaining commitment without rigidity, and caring without clinging.',
}

// ─── Verse Corpus Loading ────────────────────────────────────────────────

let _versesCache: GitaVerse[] | null = null
let _applicationIndex: Map<string, number[]> | null = null
let _themeIndex: Map<string, number[]> | null = null

function loadVerses(): GitaVerse[] {
  if (_versesCache) return _versesCache

  try {
    const raw = require('@/data/gita/gita_verses_complete.json') as GitaVerse[]
    _versesCache = raw
    return raw
  } catch {
    console.error('[WisdomCore] Failed to load Gita verses')
    return []
  }
}

function buildApplicationIndex(verses: GitaVerse[]): Map<string, number[]> {
  if (_applicationIndex) return _applicationIndex

  const index = new Map<string, number[]>()
  for (let i = 0; i < verses.length; i++) {
    const apps = verses[i].mental_health_applications || []
    for (const app of apps) {
      const list = index.get(app)
      if (list) {
        list.push(i)
      } else {
        index.set(app, [i])
      }
    }
  }
  _applicationIndex = index
  return index
}

function buildThemeIndex(verses: GitaVerse[]): Map<string, number[]> {
  if (_themeIndex) return _themeIndex

  const index = new Map<string, number[]>()
  for (let i = 0; i < verses.length; i++) {
    const theme = verses[i].theme
    if (theme) {
      const list = index.get(theme)
      if (list) {
        list.push(i)
      } else {
        index.set(theme, [i])
      }
    }
  }
  _themeIndex = index
  return index
}

// ─── Scoring Engine ──────────────────────────────────────────────────────

interface ScoredVerse {
  index: number
  score: number
  verse: GitaVerse
}

function scoreVerses(
  mood: string,
  topic: string,
  recentVerseRefs: Set<string>,
): ScoredVerse[] {
  const verses = loadVerses()
  if (verses.length === 0) return []

  const appIndex = buildApplicationIndex(verses)
  buildThemeIndex(verses)

  const moodApps = MOOD_TO_APPLICATIONS[mood] || MOOD_TO_APPLICATIONS.neutral
  const topicApps = TOPIC_TO_APPLICATIONS[topic] || TOPIC_TO_APPLICATIONS.general

  // Build candidate set from application index (efficient — avoids scanning all 701)
  const candidateIndices = new Set<number>()
  for (const app of [...moodApps, ...topicApps]) {
    const indices = appIndex.get(app)
    if (indices) {
      for (const idx of indices) candidateIndices.add(idx)
    }
  }

  // Score candidates
  const scored: ScoredVerse[] = []
  for (const idx of candidateIndices) {
    const v = verses[idx]
    const apps = v.mental_health_applications || []
    let score = 0

    // Mood application match (+3.0 per match, max 2 matches counted)
    let moodMatches = 0
    for (const app of moodApps) {
      if (apps.includes(app)) {
        moodMatches++
        if (moodMatches <= 2) score += 3.0
      }
    }

    // Topic application match (+2.0 per match, max 2 matches counted)
    let topicMatches = 0
    for (const app of topicApps) {
      if (apps.includes(app)) {
        topicMatches++
        if (topicMatches <= 2) score += 2.0
      }
    }

    // Chapter therapeutic weight
    score *= (CHAPTER_WEIGHTS[v.chapter] || 1.0)

    // Novelty bonus — verses not recently used get +3.0
    const ref = `${v.chapter}.${v.verse}`
    if (!recentVerseRefs.has(ref)) {
      score += 3.0
    }

    // Minimum score threshold — skip low-relevance verses
    if (score > 3.0) {
      scored.push({ index: idx, score, verse: v })
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)
  return scored
}

// ─── Psychology Translation ──────────────────────────────────────────────

function buildPsychologicalInsight(verse: GitaVerse, mood: string): string {
  const apps = verse.mental_health_applications || []

  // Find the most relevant psychological frame
  for (const app of apps) {
    const frame = PSYCHOLOGY_FRAMES[app]
    if (frame) return frame
  }

  // Fallback: use mood-based frame
  const moodApps = MOOD_TO_APPLICATIONS[mood] || []
  for (const app of moodApps) {
    const frame = PSYCHOLOGY_FRAMES[app]
    if (frame) return frame
  }

  return 'Self-awareness is the foundation of change. When you can observe the pattern, you are no longer fully inside it.'
}

// ─── Public API ──────────────────────────────────────────────────────────

/**
 * Select the best wisdom verse for the current mood + topic context.
 * Returns a psychologically framed wisdom result from the full 701-verse corpus.
 */
export function selectWisdom(
  mood: string,
  topic: string,
  recentVerseRefs: string[] = [],
): WisdomResult | null {
  const recentSet = new Set(recentVerseRefs)
  const scored = scoreVerses(mood, topic, recentSet)

  if (scored.length === 0) return null

  // Pick from top 5 for variety (weighted random)
  const topN = scored.slice(0, Math.min(5, scored.length))
  const totalScore = topN.reduce((sum, s) => sum + s.score, 0)
  let rand = Math.random() * totalScore
  let selected = topN[0]
  for (const candidate of topN) {
    rand -= candidate.score
    if (rand <= 0) {
      selected = candidate
      break
    }
  }

  const v = selected.verse
  return {
    verse_ref: `${v.chapter}.${v.verse}`,
    chapter: v.chapter,
    verse: v.verse,
    english: v.english.trim(),
    sanskrit: v.sanskrit.trim(),
    theme: v.theme,
    principle: v.principle,
    psychological_insight: buildPsychologicalInsight(v, mood),
    mental_health_applications: v.mental_health_applications,
  }
}

/**
 * Select multiple wisdom verses for richer context (e.g., for system prompts).
 * Returns 2-3 diverse, high-relevance verses.
 */
export function selectWisdomBatch(
  mood: string,
  topic: string,
  count: number = 3,
  recentVerseRefs: string[] = [],
): WisdomResult[] {
  const recentSet = new Set(recentVerseRefs)
  const scored = scoreVerses(mood, topic, recentSet)

  if (scored.length === 0) return []

  // Select diverse verses — avoid same chapter, prefer variety
  const results: WisdomResult[] = []
  const usedChapters = new Set<number>()

  for (const candidate of scored) {
    if (results.length >= count) break

    // Skip if we already have a verse from this chapter (diversity)
    if (usedChapters.has(candidate.verse.chapter) && results.length < scored.length - 1) {
      continue
    }

    const v = candidate.verse
    results.push({
      verse_ref: `${v.chapter}.${v.verse}`,
      chapter: v.chapter,
      verse: v.verse,
      english: v.english.trim(),
      sanskrit: v.sanskrit.trim(),
      theme: v.theme,
      principle: v.principle,
      psychological_insight: buildPsychologicalInsight(v, mood),
      mental_health_applications: v.mental_health_applications,
    })
    usedChapters.add(v.chapter)
  }

  return results
}

/**
 * Get a psychology-grounded wisdom string for the local friend engine.
 * Combines verse translation with behavioral science framing.
 */
export function getGroundedWisdom(
  mood: string,
  topic: string,
  recentVerseRefs: string[] = [],
): { wisdom: string; principle: string; verse_ref: string } | null {
  const result = selectWisdom(mood, topic, recentVerseRefs)
  if (!result) return null

  // Combine the verse's core message with psychological framing
  const wisdom = `${result.psychological_insight} The principle here: "${result.english}"`

  return {
    wisdom,
    principle: result.theme,
    verse_ref: result.verse_ref,
  }
}

/**
 * Build verse context for system prompts (OpenAI/LLM integration).
 * Returns formatted verse references for the AI to draw from.
 */
export function buildVerseContext(
  mood: string,
  topic: string,
  count: number = 3,
): string {
  const verses = selectWisdomBatch(mood, topic, count)
  if (verses.length === 0) return ''

  const lines = verses.map((v, i) => {
    return `VERSE ${i + 1} (BG ${v.verse_ref}):
Translation: "${v.english}"
Psychology: ${v.psychological_insight}
Applications: ${v.mental_health_applications.slice(0, 5).join(', ')}`
  })

  return `WISDOM CORPUS — Draw from these authenticated verses (translate into modern psychology, never cite as scripture):

${lines.join('\n\n')}`
}

/**
 * Get total verse count (for diagnostics/health checks).
 */
export function getVerseCount(): number {
  return loadVerses().length
}

/**
 * Get available themes (for UI/filtering).
 */
export function getAvailableThemes(): string[] {
  const verses = loadVerses()
  buildThemeIndex(verses)
  return _themeIndex ? [..._themeIndex.keys()] : []
}
