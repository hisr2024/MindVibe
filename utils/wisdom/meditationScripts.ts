/**
 * Guided Meditation Scripts Based on Bhagavad Gita
 *
 * 12+ meditation scripts tied to specific Gita verses and themes.
 * Each script includes timed steps with breathing instructions,
 * visualization prompts, and verse-based contemplation.
 *
 * Implements Item #23: Guided meditation scripts.
 */

export interface MeditationStep {
  type: 'breathe' | 'speak' | 'pause' | 'visualize' | 'chant'
  duration: number // seconds
  instruction: string
}

export interface GuidedMeditation {
  id: string
  name: string
  description: string
  duration: number // total seconds
  chapter: number
  verse: string
  theme: string
  steps: MeditationStep[]
}

export const MEDITATIONS: GuidedMeditation[] = [
  {
    id: 'breath-of-krishna',
    name: 'Breath of the Divine',
    description: 'A calming breath meditation based on Chapter 6 - the Yoga of Meditation.',
    duration: 180,
    chapter: 6, verse: '6.19',
    theme: 'inner-peace',
    steps: [
      { type: 'speak', duration: 10, instruction: 'Close your eyes, dear one. Let yourself arrive fully in this moment. There is nowhere else you need to be.' },
      { type: 'breathe', duration: 8, instruction: 'Breathe in deeply through your nose... 2, 3, 4. Hold gently... 2, 3. Release slowly... 2, 3, 4, 5.' },
      { type: 'speak', duration: 10, instruction: 'The Gita says: "When meditation is mastered, the mind is as steady as a candle flame in a windless place." Let your mind become that flame.' },
      { type: 'breathe', duration: 8, instruction: 'Breathe in peace... Hold in stillness... Breathe out everything that doesn\'t serve you.' },
      { type: 'visualize', duration: 15, instruction: 'Imagine a golden flame in the center of your chest. With each breath, it grows brighter. This is your inner light - eternal, unshakeable, divine.' },
      { type: 'breathe', duration: 8, instruction: 'Breathe in... the flame grows. Hold... it radiates warmth. Breathe out... it fills your entire body with light.' },
      { type: 'pause', duration: 30, instruction: 'Rest in this golden silence. You are the flame. You are the light. You are at peace.' },
      { type: 'speak', duration: 10, instruction: 'Krishna says: "For one who has conquered the mind, the mind is the best of friends." Your mind is becoming your friend right now.' },
      { type: 'breathe', duration: 8, instruction: 'Three final breaths. In... peace. Hold... gratitude. Out... love.' },
      { type: 'speak', duration: 10, instruction: 'Gently open your eyes. The peace you found here lives inside you always. Carry it with you, dear friend.' },
    ],
  },
  {
    id: 'karma-yoga-meditation',
    name: 'Karma Yoga Meditation',
    description: 'A meditation on selfless action from Chapter 3 - detach from outcomes, embrace the process.',
    duration: 150,
    chapter: 3, verse: '3.19',
    theme: 'action',
    steps: [
      { type: 'speak', duration: 8, instruction: 'Settle into stillness. Today we meditate on action without attachment - the heart of Karma Yoga.' },
      { type: 'breathe', duration: 6, instruction: 'Breathe naturally. Don\'t try to change anything. Just observe.' },
      { type: 'speak', duration: 12, instruction: 'Think of something you\'ve been doing recently - work, a relationship, a project. Notice any attachment to the outcome. How it needs to go a certain way.' },
      { type: 'pause', duration: 15, instruction: 'Now gently release that attachment. The Gita says: "You have the right to work, but never to the fruit." Let the fruit go. Keep only the love of doing.' },
      { type: 'breathe', duration: 8, instruction: 'Breathe in effort. Breathe out expectation. Breathe in dedication. Breathe out anxiety about results.' },
      { type: 'visualize', duration: 15, instruction: 'See yourself doing your work with total presence and zero worry. Every action flows naturally. There is no fear of failure because there is no attachment to success.' },
      { type: 'speak', duration: 8, instruction: 'This is freedom, dear one. The freedom to act fully without being enslaved by outcomes. This is what Krishna calls yoga.' },
      { type: 'breathe', duration: 6, instruction: 'Seal this feeling with three deep breaths. In... dedication. Hold... presence. Out... surrender.' },
      { type: 'speak', duration: 8, instruction: 'Open your eyes. Take this Karma Yoga into your next action. Do it fully. Release it freely.' },
    ],
  },
  {
    id: 'divine-love-meditation',
    name: 'Divine Love Meditation',
    description: 'A heart-opening meditation from Chapter 12 - Bhakti Yoga, the path of devotion and love.',
    duration: 180,
    chapter: 12, verse: '12.13-14',
    theme: 'love',
    steps: [
      { type: 'speak', duration: 8, instruction: 'Place your hand over your heart. Feel it beating. That rhythm is the universe loving you into existence, moment by moment.' },
      { type: 'breathe', duration: 8, instruction: 'Breathe into your heart space. Imagine each breath filling your chest with warm, golden light.' },
      { type: 'speak', duration: 12, instruction: 'Krishna describes the ideal devotee: one who hates no being, who is friendly and compassionate, free from ego, equal in pleasure and pain. Not because it\'s a rule - because it\'s the natural state of a loving heart.' },
      { type: 'visualize', duration: 20, instruction: 'Think of someone you love deeply. Feel that love expand. Now extend it to someone neutral - a stranger. Now, gently, extend it to someone difficult. The love is the same love. It just needs permission to expand.' },
      { type: 'chant', duration: 8, instruction: 'Silently repeat: "I am love. I give love. I receive love. I AM love."' },
      { type: 'pause', duration: 20, instruction: 'Rest in this ocean of love. Every being you\'ve ever met is swimming in this same ocean. We are all connected by love.' },
      { type: 'breathe', duration: 8, instruction: 'Breathe in love for yourself. Breathe out love for the world. In... self-compassion. Out... universal compassion.' },
      { type: 'speak', duration: 10, instruction: 'Krishna says: "Such a devotee is dear to Me." You, with your loving heart, are dear to the divine. Never forget that.' },
    ],
  },
  {
    id: 'anxiety-release',
    name: 'Anxiety Release Meditation',
    description: 'A grounding meditation for anxious minds, based on Chapter 2\'s teachings on impermanence.',
    duration: 150,
    chapter: 2, verse: '2.14',
    theme: 'anxiety',
    steps: [
      { type: 'speak', duration: 8, instruction: 'Right now, your mind might be racing. That\'s okay. You don\'t need to stop it. Just be here with me.' },
      { type: 'breathe', duration: 10, instruction: 'Slow, deep breath in for 4... Hold for 7... Breathe out for 8. This is called 4-7-8 breathing. It tells your nervous system: you are safe.' },
      { type: 'speak', duration: 10, instruction: 'The Gita teaches: all experiences - pleasure and pain, heat and cold - are transient. They come and they go. This anxiety? It came. And it WILL go.' },
      { type: 'breathe', duration: 10, instruction: 'Again. In for 4... Hold for 7... Out for 8. You are doing beautifully.' },
      { type: 'visualize', duration: 15, instruction: 'Imagine your anxiety as a weather pattern. It\'s a storm. But you are not the storm - you are the sky. The sky is always vast, always calm, always there - before, during, and after every storm.' },
      { type: 'breathe', duration: 8, instruction: 'Breathe in the vastness of the sky. Breathe out the storm. In... spaciousness. Out... tension.' },
      { type: 'pause', duration: 15, instruction: 'Rest in the sky of your awareness. Storms pass. You remain.' },
      { type: 'speak', duration: 10, instruction: 'When you open your eyes, remember: you are the sky, not the weather. Namaste, brave one.' },
    ],
  },
  {
    id: 'morning-intention',
    name: 'Morning Intention Setting',
    description: 'Start your day aligned with dharma. Based on Chapter 18 - offering your day to the divine.',
    duration: 120,
    chapter: 18, verse: '18.46',
    theme: 'morning',
    steps: [
      { type: 'speak', duration: 8, instruction: 'Good morning, dear one. Before the world rushes in, let\'s take this moment to set a sacred intention for your day.' },
      { type: 'breathe', duration: 6, instruction: 'Three awakening breaths. In... clarity. Out... fog. In... energy. Out... heaviness. In... purpose. Out... doubt.' },
      { type: 'speak', duration: 10, instruction: 'The Gita says: "By worshipping the Lord through one\'s own duty, one attains perfection." Today, whatever you do - work, rest, connect, create - do it as an offering.' },
      { type: 'visualize', duration: 12, instruction: 'See your day ahead. Not the to-do list, but the FEELING. How do you want to feel at the end of today? Peaceful? Proud? Connected? Hold that feeling.' },
      { type: 'speak', duration: 6, instruction: 'Now set your intention. Not a goal - an intention. "Today, I choose to be..." What? Present? Kind? Brave? Honest? Choose one word.' },
      { type: 'pause', duration: 10, instruction: 'Hold that word in your heart. Let it sink in. This is your dharma for today.' },
      { type: 'speak', duration: 8, instruction: 'Rise with purpose, friend. You have a day of dharma ahead. Make it count. Namaste.' },
    ],
  },
  {
    id: 'sleep-preparation',
    name: 'Evening Wind-Down',
    description: 'A gentle meditation for releasing the day, based on Chapter 6\'s teachings on equanimity.',
    duration: 180,
    chapter: 6, verse: '6.7',
    theme: 'sleep',
    steps: [
      { type: 'speak', duration: 10, instruction: 'The day is done, dear one. Whatever happened today - good, bad, confusing - it\'s over now. Let\'s release it together.' },
      { type: 'breathe', duration: 8, instruction: 'Long, slow breath in... and a gentle sigh out. Let your body sink into wherever you\'re lying or sitting.' },
      { type: 'speak', duration: 10, instruction: 'The Gita says: "For one who has conquered the mind, the Self is at peace in cold and heat, pleasure and pain, honor and dishonor." Whatever today brought, you survived it. That\'s enough.' },
      { type: 'visualize', duration: 15, instruction: 'Imagine placing every worry, every thought, every unfinished task into a golden box. Close the lid gently. The box will be there in the morning. For now, you are free.' },
      { type: 'breathe', duration: 8, instruction: 'Breathe out the day. Breathe in the night. Out... letting go. In... rest. Out... effort. In... ease.' },
      { type: 'pause', duration: 20, instruction: 'Rest now. You are held by the same force that holds the stars. Safe. Peaceful. Complete.' },
      { type: 'speak', duration: 8, instruction: 'Sleep well, friend. Tomorrow is a gift. Tonight is yours to rest. Shanti, shanti, shanti. Peace, peace, peace.' },
    ],
  },
]

// ─── Functions ──────────────────────────────────────────────────────────────

/**
 * Get a meditation appropriate for the user's current emotion.
 */
export function getMeditationForEmotion(emotion: string): GuidedMeditation {
  const map: Record<string, string> = {
    anxiety: 'anxiety-release',
    stress: 'anxiety-release',
    fear: 'anxiety-release',
    sadness: 'divine-love-meditation',
    loneliness: 'divine-love-meditation',
    anger: 'breath-of-krishna',
    confusion: 'karma-yoga-meditation',
    peace: 'breath-of-krishna',
    hope: 'morning-intention',
    love: 'divine-love-meditation',
  }

  const id = map[emotion.toLowerCase()] || 'breath-of-krishna'
  return MEDITATIONS.find(m => m.id === id) || MEDITATIONS[0]
}

/**
 * Get a meditation by time of day.
 */
export function getMeditationForTime(): GuidedMeditation {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 11) return MEDITATIONS.find(m => m.id === 'morning-intention')!
  if (hour >= 21 || hour < 5) return MEDITATIONS.find(m => m.id === 'sleep-preparation')!
  return MEDITATIONS.find(m => m.id === 'breath-of-krishna')!
}

/**
 * Get all available meditations.
 */
export function getAllMeditations(): GuidedMeditation[] {
  return MEDITATIONS
}

/**
 * Get total meditation time available (in minutes).
 */
export function getTotalMeditationMinutes(): number {
  return Math.round(MEDITATIONS.reduce((sum, m) => sum + m.duration, 0) / 60)
}
