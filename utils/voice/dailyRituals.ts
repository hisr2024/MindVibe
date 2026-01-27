/**
 * KIAAN Daily Rituals System
 *
 * Morning Wisdom & Evening Reflection routines that create
 * spiritual habits and deepen the connection with divine wisdom.
 *
 * Features:
 * - Morning awakening ritual with verse and intention
 * - Evening reflection with gratitude and release
 * - Time-aware greetings and content
 * - Customizable ritual durations
 * - Progress tracking
 */

export type RitualType = 'morning' | 'evening' | 'midday'
export type RitualDuration = 'brief' | 'standard' | 'extended'

export interface RitualStep {
  text: string
  duration: number // seconds
  type: 'greeting' | 'verse' | 'reflection' | 'affirmation' | 'breathing' | 'intention' | 'gratitude' | 'release' | 'blessing'
  bellSound?: boolean
}

export interface DailyRitual {
  type: RitualType
  title: string
  description: string
  steps: RitualStep[]
  closingBlessing: string
}

// Morning verses with themes
const MORNING_VERSES = [
  {
    sanskrit: "Karmanye vadhikaraste ma phaleshu kadachana",
    translation: "You have the right to work only, but never to its fruits.",
    chapter: "2.47",
    theme: "action",
    reflection: "Today, focus on giving your best effort without attachment to outcomes."
  },
  {
    sanskrit: "Yogasthah kuru karmani sangam tyaktva dhananjaya",
    translation: "Established in yoga, perform actions, abandoning attachment.",
    chapter: "2.48",
    theme: "equanimity",
    reflection: "Approach today's tasks with a calm, centered mind."
  },
  {
    sanskrit: "Uddhared atmanatmanam natmanam avasadayet",
    translation: "Let a person lift themselves by their own self; let them not degrade themselves.",
    chapter: "6.5",
    theme: "self-elevation",
    reflection: "You have the power to elevate yourself today. Choose thoughts that lift you."
  },
  {
    sanskrit: "Nainam chindanti shastrani nainam dahati pavakah",
    translation: "Weapons cannot cut the soul, fire cannot burn it.",
    chapter: "2.23",
    theme: "resilience",
    reflection: "Your true self is indestructible. Face today's challenges with this knowing."
  },
  {
    sanskrit: "Samatvam yoga uchyate",
    translation: "Equanimity is called yoga.",
    chapter: "2.48",
    theme: "balance",
    reflection: "Maintain your inner balance regardless of what today brings."
  }
]

// Evening verses with themes
const EVENING_VERSES = [
  {
    sanskrit: "Prasade sarva-duhkhanam hanir asyopajayate",
    translation: "In tranquility, all sorrows are destroyed.",
    chapter: "2.65",
    theme: "peace",
    reflection: "Release the day's tensions and return to your natural state of peace."
  },
  {
    sanskrit: "Yada yada hi dharmasya glanir bhavati bharata",
    translation: "Whenever there is a decline in righteousness, I manifest myself.",
    chapter: "4.7",
    theme: "divine support",
    reflection: "Trust that divine guidance is always available when needed."
  },
  {
    sanskrit: "Sarva-dharman parityajya mam ekam sharanam vraja",
    translation: "Abandon all varieties of dharma and surrender unto Me alone.",
    chapter: "18.66",
    theme: "surrender",
    reflection: "Release your worries. Surrender the day's burdens to the divine."
  },
  {
    sanskrit: "Na hi jnanena sadrisham pavitram iha vidyate",
    translation: "There is nothing as purifying as knowledge in this world.",
    chapter: "4.38",
    theme: "wisdom",
    reflection: "What wisdom did today bring you? Honor the lessons learned."
  },
  {
    sanskrit: "Tat tvam asi",
    translation: "You are That - you are the eternal consciousness.",
    chapter: "Upanishadic",
    theme: "identity",
    reflection: "Beyond all that happened today, you remain the unchanging witness."
  }
]

// Morning affirmations
const MORNING_AFFIRMATIONS = [
  "I greet this day with an open heart and a peaceful mind.",
  "I am filled with the energy and clarity to fulfill my dharma.",
  "Today I choose peace over worry, love over fear, action over hesitation.",
  "I am connected to the infinite wisdom that guides all beings.",
  "My actions today will be offerings to the divine.",
  "I release yesterday and embrace the possibilities of today.",
  "I am exactly where I need to be on my journey.",
  "Divine light flows through me, guiding my thoughts, words, and actions.",
  "I trust the unfolding of this day, knowing all is as it should be.",
  "I am a vessel of peace, bringing calm to all I encounter."
]

// Evening gratitudes
const EVENING_GRATITUDE_PROMPTS = [
  "What moment today brought you closest to peace?",
  "Who crossed your path today that you're grateful for?",
  "What challenge today helped you grow?",
  "What simple blessing did you notice today?",
  "When did you feel most alive today?",
  "What act of kindness did you witness or perform today?",
  "What wisdom did today reveal to you?",
  "What are you grateful for about your body today?",
  "What moment of beauty did you notice today?",
  "What made you smile today?"
]

// Release prompts for evening
const EVENING_RELEASE_PROMPTS = [
  "What worry can you release to the universe tonight?",
  "What resentment are you ready to let go of?",
  "What expectation can you surrender?",
  "What regret can you forgive yourself for?",
  "What tension in your body can you release with your exhale?",
  "What thought has been weighing on you that you can set down now?",
  "What fear can you offer to the divine for transformation?"
]

/**
 * Get time-appropriate greeting
 */
function getTimeGreeting(): { period: RitualType; greeting: string } {
  const hour = new Date().getHours()

  if (hour >= 4 && hour < 12) {
    return {
      period: 'morning',
      greeting: "Good morning, awakening soul. The dawn brings new possibilities."
    }
  } else if (hour >= 12 && hour < 17) {
    return {
      period: 'midday',
      greeting: "Namaste. The day is at its peak. Let us pause and recenter."
    }
  } else {
    return {
      period: 'evening',
      greeting: "Good evening, dear one. The day comes to rest, and so may you."
    }
  }
}

/**
 * Generate morning ritual
 */
export function generateMorningRitual(duration: RitualDuration = 'standard'): DailyRitual {
  const verse = MORNING_VERSES[Math.floor(Math.random() * MORNING_VERSES.length)]
  const affirmation = MORNING_AFFIRMATIONS[Math.floor(Math.random() * MORNING_AFFIRMATIONS.length)]
  const { greeting } = getTimeGreeting()

  const steps: RitualStep[] = [
    {
      text: greeting,
      duration: 3,
      type: 'greeting',
      bellSound: true
    },
    {
      text: "Let us begin this sacred morning practice. Find a comfortable position, close your eyes, and take three deep breaths with me.",
      duration: 4,
      type: 'breathing'
    },
    {
      text: "Breathe in deeply... hold... and release slowly.",
      duration: 6,
      type: 'breathing'
    },
    {
      text: "Again, breathe in light and energy... hold... and release any heaviness from sleep.",
      duration: 6,
      type: 'breathing'
    },
    {
      text: "One more time, breathe in the possibilities of this new day... hold... and release all that no longer serves you.",
      duration: 6,
      type: 'breathing'
    }
  ]

  // Add verse
  steps.push({
    text: `Today's wisdom comes from the Bhagavad Gita, Chapter ${verse.chapter}.`,
    duration: 3,
    type: 'verse'
  })
  steps.push({
    text: `In Sanskrit: ${verse.sanskrit}`,
    duration: 5,
    type: 'verse'
  })
  steps.push({
    text: `This means: ${verse.translation}`,
    duration: 5,
    type: 'verse'
  })
  steps.push({
    text: verse.reflection,
    duration: 6,
    type: 'reflection'
  })

  // Extended version adds more content
  if (duration === 'extended') {
    steps.push({
      text: "Let this wisdom sink deeply into your consciousness. How might you embody this teaching today?",
      duration: 10,
      type: 'reflection'
    })
  }

  // Affirmation
  steps.push({
    text: "Now, receive this morning affirmation. Let it become your companion for today.",
    duration: 3,
    type: 'affirmation'
  })
  steps.push({
    text: affirmation,
    duration: 6,
    type: 'affirmation'
  })

  // Intention setting
  steps.push({
    text: "Before you open your eyes, set one intention for today. What quality do you wish to embody? Perhaps it's patience, courage, kindness, or focus.",
    duration: 8,
    type: 'intention'
  })

  if (duration !== 'brief') {
    steps.push({
      text: "Hold that intention in your heart. Visualize yourself moving through the day with this quality guiding you.",
      duration: 8,
      type: 'intention'
    })
  }

  // Closing
  steps.push({
    text: "When you are ready, gently open your eyes. Carry this peace with you into your day.",
    duration: 4,
    type: 'blessing',
    bellSound: true
  })

  return {
    type: 'morning',
    title: 'Morning Awakening',
    description: 'Start your day with wisdom, breath, and intention',
    steps,
    closingBlessing: "May your day be filled with purpose, peace, and the presence of the divine. Go forth with courage. Hari Om Tat Sat."
  }
}

/**
 * Generate evening ritual
 */
export function generateEveningRitual(duration: RitualDuration = 'standard'): DailyRitual {
  const verse = EVENING_VERSES[Math.floor(Math.random() * EVENING_VERSES.length)]
  const gratitudePrompt = EVENING_GRATITUDE_PROMPTS[Math.floor(Math.random() * EVENING_GRATITUDE_PROMPTS.length)]
  const releasePrompt = EVENING_RELEASE_PROMPTS[Math.floor(Math.random() * EVENING_RELEASE_PROMPTS.length)]

  const steps: RitualStep[] = [
    {
      text: "Good evening, dear one. The day comes to its natural close. Let us honor it together.",
      duration: 4,
      type: 'greeting',
      bellSound: true
    },
    {
      text: "Find a comfortable position. You may sit or lie down. Close your eyes and let your body settle.",
      duration: 5,
      type: 'breathing'
    },
    {
      text: "Take a deep breath in, gathering all the energy of the day... and exhale slowly, beginning to release.",
      duration: 6,
      type: 'breathing'
    },
    {
      text: "Again, breathe in... and as you exhale, let your shoulders drop, your jaw unclench, your brow soften.",
      duration: 6,
      type: 'breathing'
    }
  ]

  // Gratitude
  steps.push({
    text: "Let us begin with gratitude, for it is the gateway to peace.",
    duration: 3,
    type: 'gratitude'
  })
  steps.push({
    text: gratitudePrompt,
    duration: 10,
    type: 'gratitude'
  })

  if (duration !== 'brief') {
    steps.push({
      text: "Allow the warmth of gratitude to fill your heart. Even small blessings are worthy of thanks.",
      duration: 6,
      type: 'gratitude'
    })
  }

  // Reflection on the day
  steps.push({
    text: "Now, gently review your day without judgment. You did your best with what you knew and felt.",
    duration: 6,
    type: 'reflection'
  })

  // Release
  steps.push({
    text: "It is time to release what no longer serves you.",
    duration: 3,
    type: 'release'
  })
  steps.push({
    text: releasePrompt,
    duration: 10,
    type: 'release'
  })
  steps.push({
    text: "With your next exhale, let it go. Release it to the universe. It is no longer yours to carry.",
    duration: 6,
    type: 'release'
  })

  // Evening verse
  steps.push({
    text: `Receive this evening wisdom from the Gita, Chapter ${verse.chapter}.`,
    duration: 3,
    type: 'verse'
  })
  steps.push({
    text: verse.translation,
    duration: 5,
    type: 'verse'
  })
  steps.push({
    text: verse.reflection,
    duration: 6,
    type: 'reflection'
  })

  // Extended adds more relaxation
  if (duration === 'extended') {
    steps.push({
      text: "Feel your body becoming heavier, more relaxed. The earth holds you. You are safe.",
      duration: 8,
      type: 'breathing'
    })
  }

  // Closing blessing
  steps.push({
    text: "The day is complete. You have done enough. You are enough. Rest now in the knowledge of your divine nature.",
    duration: 5,
    type: 'blessing',
    bellSound: true
  })

  return {
    type: 'evening',
    title: 'Evening Reflection',
    description: 'Close your day with gratitude, release, and peace',
    steps,
    closingBlessing: "May your rest be deep and restorative. May your dreams carry wisdom. The divine watches over you through the night. Om Shanti, Shanti, Shanti."
  }
}

/**
 * Get ritual based on current time
 */
export function getTimeAppropriateRitual(duration: RitualDuration = 'standard'): DailyRitual {
  const { period } = getTimeGreeting()

  if (period === 'morning') {
    return generateMorningRitual(duration)
  } else {
    return generateEveningRitual(duration)
  }
}

/**
 * Check if it's a good time for a ritual reminder
 */
export function shouldSuggestRitual(): { suggest: boolean; type: RitualType; message: string } {
  const hour = new Date().getHours()

  // Morning suggestion (6-9 AM)
  if (hour >= 6 && hour <= 9) {
    return {
      suggest: true,
      type: 'morning',
      message: "Good morning! Would you like to start your day with the Morning Awakening ritual?"
    }
  }

  // Evening suggestion (7-10 PM)
  if (hour >= 19 && hour <= 22) {
    return {
      suggest: true,
      type: 'evening',
      message: "The day draws to a close. Would you like to do the Evening Reflection ritual?"
    }
  }

  return {
    suggest: false,
    type: 'morning',
    message: ''
  }
}

/**
 * Track ritual completion in localStorage
 */
export function recordRitualCompletion(type: RitualType): void {
  const key = 'kiaan_ritual_history'
  const today = new Date().toISOString().split('T')[0]

  try {
    const history = JSON.parse(localStorage.getItem(key) || '{}')

    if (!history[today]) {
      history[today] = { morning: false, evening: false }
    }

    history[today][type] = true

    // Keep only last 30 days
    const dates = Object.keys(history).sort().slice(-30)
    const trimmedHistory: Record<string, { morning: boolean; evening: boolean }> = {}
    dates.forEach(date => {
      trimmedHistory[date] = history[date]
    })

    localStorage.setItem(key, JSON.stringify(trimmedHistory))
  } catch (e) {
    console.warn('Failed to record ritual completion:', e)
  }
}

/**
 * Get ritual streak count
 */
export function getRitualStreak(): { current: number; longest: number; todayComplete: { morning: boolean; evening: boolean } } {
  const key = 'kiaan_ritual_history'

  try {
    const history = JSON.parse(localStorage.getItem(key) || '{}')
    const dates = Object.keys(history).sort().reverse()
    const today = new Date().toISOString().split('T')[0]

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    // Calculate streaks
    for (let i = 0; i < dates.length; i++) {
      const dateHistory = history[dates[i]]
      const hasRitual = dateHistory.morning || dateHistory.evening

      if (hasRitual) {
        tempStreak++
        if (i === 0 || isConsecutiveDay(dates[i], dates[i - 1])) {
          currentStreak = tempStreak
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 0
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak)

    return {
      current: currentStreak,
      longest: longestStreak,
      todayComplete: history[today] || { morning: false, evening: false }
    }
  } catch {
    return { current: 0, longest: 0, todayComplete: { morning: false, evening: false } }
  }
}

function isConsecutiveDay(date1: string, date2: string): boolean {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays === 1
}
