/**
 * Emotion Classification System
 *
 * Maps user mood data (score + tags) to one of 5 emotion categories
 * that drive dynamic UI theme changes.
 *
 * Quantum Enhancement #4: Emotion-Driven UI Themes
 */

export type Emotion = 'calm' | 'energized' | 'melancholic' | 'anxious' | 'balanced'

export interface MoodData {
  score: number  // 1-10 scale
  tags?: string[]
  note?: string
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
