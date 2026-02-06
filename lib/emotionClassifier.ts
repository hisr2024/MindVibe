/**
 * Emotion Classification System - Enhanced v2.0
 *
 * Maps user mood data (score + tags) to one of 5 emotion categories
 * that drive dynamic UI theme changes.
 *
 * ENHANCED v2.0: Now supports AI-powered classification via OpenAI + Core Wisdom Gita
 * - Primary: AI-powered emotion analysis with Gita concepts (shanti, chinta, etc.)
 * - Fallback: Local keyword-based classification when API unavailable
 *
 * Quantum Enhancement #4: Emotion-Driven UI Themes
 */

export type Emotion = 'calm' | 'energized' | 'melancholic' | 'anxious' | 'balanced'

// Gita emotion mappings for AI-powered responses
export type GitaEmotion = 'shanti' | 'utsaha' | 'vishada' | 'chinta' | 'samatvam'

export interface MoodData {
  score: number  // 1-10 scale
  tags?: string[]
  note?: string
}

export interface AIEmotionAnalysis {
  primary_emotion: Emotion
  gita_mapping: GitaEmotion
  intensity: number
  description: string
  recommended_verse: string
  verse_text: string
  healing_path: string
  activities: string[]
  ai_powered: boolean
}

/**
 * Classifies user's emotional state based on mood score and tags
 *
 * Classification Logic:
 * - energized: High score (8+) with energy-related tags
 * - calm: High score (7+) without energy tags
 * - melancholic: Very low score (1-3)
 * - anxious: Stress/anxiety-related tags present
 * - balanced: Default neutral state
 *
 * @param moodData - User's mood entry
 * @returns Emotion category
 */
export function classifyEmotion(moodData: MoodData): Emotion {
  const { score, tags = [] } = moodData

  // Normalize tags to lowercase for comparison
  const normalizedTags = tags.map(tag => tag.toLowerCase())

  // Energy-related tags
  const energyTags = ['energetic', 'excited', 'motivated', 'active', 'productive']
  const hasEnergyTag = energyTags.some(tag => normalizedTags.includes(tag))

  // Stress/anxiety tags
  const anxietyTags = ['anxious', 'stressed', 'worried', 'nervous', 'overwhelmed', 'stress']
  const hasAnxietyTag = anxietyTags.some(tag => normalizedTags.includes(tag))

  // Calm/peaceful tags
  const calmTags = ['calm', 'peaceful', 'relaxed', 'gratitude', 'grateful', 'content']
  const hasCalmTag = calmTags.some(tag => normalizedTags.includes(tag))

  // Classification rules (priority order matters)

  // 1. Anxiety takes priority regardless of score
  if (hasAnxietyTag) {
    return 'anxious'
  }

  // 2. Very low mood = melancholic
  if (score <= 3) {
    return 'melancholic'
  }

  // 3. High energy + high score = energized
  if (score >= 8 && hasEnergyTag) {
    return 'energized'
  }

  // 4. High score + calm tags = calm
  if (score >= 7 && hasCalmTag) {
    return 'calm'
  }

  // 5. High score without specific tags = calm
  if (score >= 7) {
    return 'calm'
  }

  // 6. Medium-low score = melancholic
  if (score <= 5) {
    return 'melancholic'
  }

  // 7. Default = balanced
  return 'balanced'
}

/**
 * Gets human-readable label for emotion
 */
export function getEmotionLabel(emotion: Emotion): string {
  const labels: Record<Emotion, string> = {
    calm: 'Calm & Peaceful',
    energized: 'Energized & Motivated',
    melancholic: 'Reflective & Melancholic',
    anxious: 'Anxious & Stressed',
    balanced: 'Balanced & Neutral'
  }
  return labels[emotion]
}

/**
 * Gets short description of the emotion state
 */
export function getEmotionDescription(emotion: Emotion): string {
  const descriptions: Record<Emotion, string> = {
    calm: 'Your space feels serene and peaceful',
    energized: 'Your space radiates energy and warmth',
    melancholic: 'Your space offers gentle comfort',
    anxious: 'Your space provides grounding stability',
    balanced: 'Your space maintains harmonious equilibrium'
  }
  return descriptions[emotion]
}

/**
 * Suggests appropriate activities based on emotion
 */
export function getEmotionActivities(emotion: Emotion): string[] {
  const activities: Record<Emotion, string[]> = {
    calm: [
      'Continue meditation practice',
      'Read uplifting verses',
      'Practice gratitude journaling'
    ],
    energized: [
      'Set new goals',
      'Engage with challenging verses',
      'Journal about achievements'
    ],
    melancholic: [
      'Read comforting verses',
      'Gentle guided meditation',
      'Express feelings in journal'
    ],
    anxious: [
      'Breathing exercises',
      'Grounding meditation',
      'Talk to KIAAN chatbot'
    ],
    balanced: [
      'Explore wisdom library',
      'Reflect on your journey',
      'Maintain current practices'
    ]
  }
  return activities[emotion]
}

// =============================================================================
// AI-POWERED EMOTION CLASSIFICATION (v2.0)
// Uses OpenAI + Core Wisdom Gita database for intelligent analysis
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

/**
 * AI-powered emotion classification using OpenAI + Core Wisdom Gita
 *
 * REPLACES: classifyEmotion() hardcoded logic with intelligent AI analysis
 *
 * Falls back to local classification if API unavailable
 *
 * @param moodData - User's mood entry
 * @returns Promise<AIEmotionAnalysis> with Gita-grounded emotional analysis
 */
export async function classifyEmotionWithAI(moodData: MoodData): Promise<AIEmotionAnalysis> {
  try {
    const response = await fetch(`${API_BASE_URL}/gita-ai/analyze-emotion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        mood_score: moodData.score,
        tags: moodData.tags || [],
        note: moodData.note || '',
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const analysis: AIEmotionAnalysis = await response.json()
    return analysis

  } catch (error) {
    console.warn('AI emotion classification failed, using local fallback:', error)
    return classifyEmotionLocal(moodData)
  }
}

/**
 * Local fallback for emotion classification when AI unavailable
 * Uses the same logic as classifyEmotion but returns AIEmotionAnalysis format
 */
function classifyEmotionLocal(moodData: MoodData): AIEmotionAnalysis {
  const emotion = classifyEmotion(moodData)

  // Map emotions to Gita concepts
  const gitaMapping: Record<Emotion, GitaEmotion> = {
    calm: 'shanti',
    energized: 'utsaha',
    melancholic: 'vishada',
    anxious: 'chinta',
    balanced: 'samatvam'
  }

  // Verse recommendations based on emotion
  const verseRecommendations: Record<Emotion, { verse: string; text: string }> = {
    calm: {
      verse: 'BG 2.66',
      text: 'There is no wisdom for the uncontrolled, and for the uncontrolled there is no meditation.'
    },
    energized: {
      verse: 'BG 18.26',
      text: 'One who is enthusiastic, steadfast, determined - such a worker is sattvic.'
    },
    melancholic: {
      verse: 'BG 2.11',
      text: 'The wise grieve neither for the living nor for the dead.'
    },
    anxious: {
      verse: 'BG 6.35',
      text: 'The mind is restless, but by practice and detachment it can be controlled.'
    },
    balanced: {
      verse: 'BG 2.48',
      text: 'Perform action with equanimity, abandoning attachment to success and failure.'
    }
  }

  const healingPaths: Record<Emotion, string> = {
    calm: 'Maintain this state through regular practice of shanti',
    energized: 'Channel energy into dharmic action with nishkama karma',
    melancholic: 'Remember your eternal nature (atman) is untouched by temporary emotions',
    anxious: 'Practice abhyasa (consistent practice) and vairagya (detachment)',
    balanced: 'Continue witnessing emotions with sakshi bhava'
  }

  const verse = verseRecommendations[emotion]

  return {
    primary_emotion: emotion,
    gita_mapping: gitaMapping[emotion],
    intensity: moodData.score / 10,
    description: getEmotionDescription(emotion),
    recommended_verse: verse.verse,
    verse_text: verse.text,
    healing_path: healingPaths[emotion],
    activities: getEmotionActivities(emotion),
    ai_powered: false
  }
}

/**
 * Get Gita emotion label for display
 */
export function getGitaEmotionLabel(gitaEmotion: GitaEmotion): string {
  const labels: Record<GitaEmotion, string> = {
    shanti: 'Shanti (Peace)',
    utsaha: 'Utsaha (Enthusiasm)',
    vishada: 'Vishada (Sorrow)',
    chinta: 'Chinta (Worry)',
    samatvam: 'Samatvam (Equanimity)'
  }
  return labels[gitaEmotion]
}
