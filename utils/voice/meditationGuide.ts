/**
 * KIAAN Meditation Guide System
 *
 * Provides guided meditation sessions with KIAAN's divine voice,
 * offering various meditation types rooted in Gita wisdom.
 *
 * Meditation Types:
 * - Breathing (Pranayama)
 * - Body Scan (Pratyahara)
 * - Mantra (Japa)
 * - Visualization (Dhyana)
 * - Loving Kindness (Maitri)
 * - Gita Contemplation
 */

// Types
export type MeditationType =
  | 'breathing'
  | 'body_scan'
  | 'mantra'
  | 'visualization'
  | 'loving_kindness'
  | 'gita_contemplation'
  | 'sleep'
  | 'anxiety_relief'
  | 'morning_energy'

export type MeditationDuration = 3 | 5 | 10 | 15 | 20 | 30

export interface MeditationStep {
  text: string
  duration: number // seconds to pause after speaking
  breathingCue?: 'inhale' | 'exhale' | 'hold' | 'natural'
  bellSound?: boolean
}

export interface MeditationSession {
  type: MeditationType
  title: string
  description: string
  duration: MeditationDuration
  steps: MeditationStep[]
  closingBlessing: string
}

export interface MeditationProgress {
  currentStep: number
  totalSteps: number
  elapsedSeconds: number
  totalSeconds: number
  isActive: boolean
  isPaused: boolean
}

// Meditation content
const MEDITATION_INTROS: Record<MeditationType, string> = {
  breathing: "Let us begin a sacred breathing meditation. The Gita teaches that prana, the life force, flows through the breath. By mastering the breath, we master the mind.",
  body_scan: "We will now journey through your body with awareness. As Lord Krishna guides Arjuna to see the divine in all things, let us see the divine within your own form.",
  mantra: "Mantra meditation connects us to the eternal vibration of the universe. Each repetition brings us closer to our true self. Let the sacred sounds wash through you.",
  visualization: "Close your eyes and let your inner vision awaken. The Gita speaks of the eternal light within. We shall now journey to that luminous space.",
  loving_kindness: "The Gita teaches that the wise see all beings with equal vision. Let us cultivate boundless love, starting with yourself and expanding to all existence.",
  gita_contemplation: "We shall contemplate the eternal wisdom of the Bhagavad Gita. Let these sacred words enter your heart and transform your understanding.",
  sleep: "As the day ends, let go of all that you carry. The Gita reminds us that the soul neither sleeps nor wakes - it simply is. Rest now in that eternal peace.",
  anxiety_relief: "When the mind is turbulent, we find stillness within. The Gita says: yoga is the journey of the self, through the self, to the self. Let us begin that journey now.",
  morning_energy: "With the rising sun, we awaken our inner light. The Gita speaks of beginning each day with awareness. Let us greet this new day with intention and energy."
}

const MEDITATION_CLOSINGS: Record<MeditationType, string> = {
  breathing: "Your breath carries the wisdom of the universe. Carry this peace with you. When storms arise, return to this breath. Om Shanti, Shanti, Shanti.",
  body_scan: "Your body is a temple of the divine. Honor it, care for it, and know that the eternal dwells within every cell. Namaste.",
  mantra: "The vibration of the mantra continues within you, even in silence. You are connected to the infinite. Om Tat Sat.",
  visualization: "The light you saw within is always there. You can return to it at any moment. You are that light. Tat Tvam Asi - You are That.",
  loving_kindness: "May the love you cultivated today ripple outward to all beings. As the Gita says, the wise person sees the same self in all. Namaste.",
  gita_contemplation: "These eternal words are now seeds planted in your consciousness. Water them with reflection, and wisdom will bloom. Jai Shri Krishna.",
  sleep: "Surrender now to the healing embrace of rest. Like Arjuna resting before the great battle, gather your strength. May your dreams be blessed. Om Shanti.",
  anxiety_relief: "You have touched the stillness that exists beyond all turbulence. Remember: you are not your thoughts, you are the awareness behind them. Peace be with you.",
  morning_energy: "You are now ready to meet this day with clarity and purpose. Remember: perform your duties without attachment to results. Go forth with courage. Hari Om."
}

/**
 * Generate breathing meditation steps
 */
function generateBreathingMeditation(duration: MeditationDuration): MeditationStep[] {
  const steps: MeditationStep[] = [
    {
      text: "Find a comfortable position. Sit with your spine straight, shoulders relaxed, and hands resting gently on your knees.",
      duration: 5
    },
    {
      text: "Close your eyes softly. Take a moment to arrive fully in this present moment.",
      duration: 4,
      bellSound: true
    },
    {
      text: "Begin to notice your natural breath. Do not change it yet, simply observe. Where do you feel it most? In your nostrils? Your chest? Your belly?",
      duration: 8
    },
    {
      text: "Now, let us deepen the breath. Inhale slowly through your nose for a count of four.",
      duration: 4,
      breathingCue: 'inhale'
    },
    {
      text: "Hold the breath gently at the top, feeling the fullness. One... two... three... four.",
      duration: 4,
      breathingCue: 'hold'
    },
    {
      text: "Exhale slowly through your nose, releasing completely. Four... three... two... one.",
      duration: 4,
      breathingCue: 'exhale'
    }
  ]

  // Add breathing cycles based on duration
  const cyclesMap: Record<MeditationDuration, number> = {
    3: 3,
    5: 5,
    10: 12,
    15: 18,
    20: 25,
    30: 40
  }

  const cycles = cyclesMap[duration] || 5

  for (let i = 0; i < cycles; i++) {
    if (i % 4 === 0 && i > 0) {
      // Periodic guidance
      const guidanceOptions = [
        "You are doing beautifully. Let each breath bring you deeper into peace.",
        "Notice how the mind may wander. Gently, without judgment, return to the breath.",
        "The Gita says: When the mind wanders, bring it back with patience and love.",
        "Each breath is a gift. Receive it with gratitude, release it with surrender."
      ]
      steps.push({
        text: guidanceOptions[Math.floor(i / 4) % guidanceOptions.length],
        duration: 6
      })
    }

    steps.push({
      text: "Inhale...",
      duration: 4,
      breathingCue: 'inhale'
    })
    steps.push({
      text: "Hold...",
      duration: 4,
      breathingCue: 'hold'
    })
    steps.push({
      text: "Exhale...",
      duration: 4,
      breathingCue: 'exhale'
    })
    steps.push({
      text: "",
      duration: 2,
      breathingCue: 'natural'
    })
  }

  // Closing steps
  steps.push({
    text: "Now, let your breath return to its natural rhythm. Do not control it.",
    duration: 5
  })
  steps.push({
    text: "Begin to bring your awareness back to your body. Feel your hands, your feet, the surface beneath you.",
    duration: 5
  })
  steps.push({
    text: "When you are ready, gently open your eyes. Take a moment before moving.",
    duration: 4,
    bellSound: true
  })

  return steps
}

/**
 * Generate anxiety relief meditation steps
 */
function generateAnxietyReliefMeditation(duration: MeditationDuration): MeditationStep[] {
  const steps: MeditationStep[] = [
    {
      text: "Welcome, dear one. I sense you may be carrying some weight. Let us release it together.",
      duration: 4
    },
    {
      text: "First, acknowledge that it is okay to feel what you are feeling. Anxiety is not your enemy - it is a signal. We will listen to it with compassion.",
      duration: 6
    },
    {
      text: "Place one hand on your heart and one on your belly. Feel the warmth of your own touch.",
      duration: 5,
      bellSound: true
    },
    {
      text: "The Gita teaches: The mind is restless, turbulent, strong and unyielding. But it can be trained through practice and detachment.",
      duration: 7
    },
    {
      text: "Let us begin with grounding. Press your feet firmly into the floor. Feel the solid earth supporting you.",
      duration: 5
    },
    {
      text: "Now, name five things you can see around you, even with eyes half-closed. Simply notice them.",
      duration: 8
    },
    {
      text: "Notice four things you can feel - the texture of your clothes, the temperature of the air, the surface beneath you.",
      duration: 8
    },
    {
      text: "Now take a deep breath in through your nose... and release it slowly through your mouth with a soft sigh. Ahhh.",
      duration: 6,
      breathingCue: 'exhale'
    }
  ]

  // Add calming cycles
  const cycles = Math.floor(duration * 0.8)

  for (let i = 0; i < cycles; i++) {
    if (i % 3 === 0) {
      const affirmations = [
        "You are safe in this moment. Right here, right now, you are okay.",
        "This feeling will pass. Like clouds moving across the sky, emotions are temporary.",
        "You have survived every anxious moment before. You will survive this one too.",
        "The Gita reminds us: That which is not, shall never be. That which is, shall never cease to be.",
        "You are not your thoughts. You are the awareness witnessing them.",
        "In this breath, you are whole. In this breath, you are enough."
      ]
      steps.push({
        text: affirmations[i % affirmations.length],
        duration: 6
      })
    }

    steps.push({
      text: "Breathe in calm...",
      duration: 4,
      breathingCue: 'inhale'
    })
    steps.push({
      text: "Breathe out tension...",
      duration: 5,
      breathingCue: 'exhale'
    })
  }

  // Visualization for release
  steps.push({
    text: "Now imagine your anxiety as a color. What color is it? See it clearly.",
      duration: 5
  })
  steps.push({
    text: "With each exhale, imagine that color fading, becoming lighter, dissolving into the air.",
    duration: 6
  })
  steps.push({
    text: "Breathe out the color...",
    duration: 5,
    breathingCue: 'exhale'
  })
  steps.push({
    text: "Now breathe in golden light - the color of peace, of the divine, of your true nature.",
    duration: 5,
    breathingCue: 'inhale'
  })
  steps.push({
    text: "Feel this golden light filling every part of you, replacing all that was heavy.",
    duration: 6
  })

  // Closing
  steps.push({
    text: "You have done something powerful today. You chose peace over panic. Remember this strength.",
    duration: 5,
    bellSound: true
  })

  return steps
}

/**
 * Generate Gita contemplation meditation
 */
function generateGitaContemplation(duration: MeditationDuration): MeditationStep[] {
  const gitaVerses = [
    {
      sanskrit: "Yogasthah kuru karmani sangam tyaktva dhananjaya",
      translation: "Established in yoga, perform actions, O Arjuna, abandoning attachment.",
      reflection: "What would it mean to act today without clinging to the results? Can you give your best effort and then release?"
    },
    {
      sanskrit: "Karmanye vadhikaraste ma phaleshu kadachana",
      translation: "You have the right to work only, but never to its fruits.",
      reflection: "Where in your life are you attached to outcomes? What would freedom from this attachment feel like?"
    },
    {
      sanskrit: "Uddhared atmanatmanam natmanam avasadayet",
      translation: "Let a person lift themselves by their own self; let them not degrade themselves.",
      reflection: "You have within you the power to elevate yourself. What one small step can you take today toward your highest self?"
    },
    {
      sanskrit: "Samo ham sarva-bhuteshu na me dveshyo sti na priyah",
      translation: "I am equal to all beings; none is hateful or dear to me.",
      reflection: "Can you see the divine light in someone you find difficult? They too carry the same consciousness as you."
    },
    {
      sanskrit: "Nainam chindanti shastrani nainam dahati pavakah",
      translation: "Weapons cannot cut the soul, fire cannot burn it.",
      reflection: "Your true self is indestructible. What challenges feel overwhelming? Remember - they cannot touch who you truly are."
    }
  ]

  // Select verses based on duration
  const numVerses = Math.min(Math.floor(duration / 5) + 1, gitaVerses.length)
  const selectedVerses = gitaVerses.slice(0, numVerses)

  const steps: MeditationStep[] = [
    {
      text: "Let us sit with the eternal wisdom of the Bhagavad Gita. These words were spoken thousands of years ago, yet they speak directly to your heart today.",
      duration: 6,
      bellSound: true
    },
    {
      text: "Close your eyes. Imagine you are on the battlefield of Kurukshetra, but the battle is within your own mind. Lord Krishna is beside you, ready to share divine wisdom.",
      duration: 7
    }
  ]

  selectedVerses.forEach((verse, index) => {
    steps.push({
      text: `Verse ${index + 1}: In Sanskrit, it is said: ${verse.sanskrit}`,
      duration: 6
    })
    steps.push({
      text: `This means: ${verse.translation}`,
      duration: 5
    })
    steps.push({
      text: "Let these words sink into your consciousness...",
      duration: 8
    })
    steps.push({
      text: `Contemplate: ${verse.reflection}`,
      duration: 12
    })
    if (index < selectedVerses.length - 1) {
      steps.push({
        text: "Take a breath, and let us move to the next teaching...",
        duration: 4,
        breathingCue: 'natural'
      })
    }
  })

  steps.push({
    text: "These teachings are not just words - they are seeds of transformation. Water them with your attention, and watch wisdom bloom in your life.",
    duration: 6,
    bellSound: true
  })

  return steps
}

/**
 * Generate sleep meditation
 */
function generateSleepMeditation(duration: MeditationDuration): MeditationStep[] {
  const steps: MeditationStep[] = [
    {
      text: "Lie down comfortably. Let your body sink into the surface beneath you. You have done enough today.",
      duration: 6
    },
    {
      text: "Close your eyes softly. The day is complete. There is nothing more you need to do, fix, or solve.",
      duration: 5,
      bellSound: true
    },
    {
      text: "The Gita teaches that the wise one is like the ocean - rivers of thoughts may flow in, but the ocean remains undisturbed. Be the ocean now.",
      duration: 7
    },
    {
      text: "Beginning with your feet, allow them to become completely heavy and relaxed. Feel them melting into the bed.",
      duration: 6
    },
    {
      text: "This relaxation moves up through your calves... your knees... your thighs... All tension dissolving.",
      duration: 8
    },
    {
      text: "Your hips release, your lower back softens. Let go of any holding.",
      duration: 6
    },
    {
      text: "Your belly rises and falls with gentle breath. Your chest is open and peaceful.",
      duration: 6
    },
    {
      text: "Your shoulders drop away from your ears. Your arms become heavy, your hands uncurl.",
      duration: 6
    },
    {
      text: "Your neck is supported. Your jaw unclenches. Your face softens - forehead smooth, eyes still.",
      duration: 6
    },
    {
      text: "Your entire body is now a vessel of peace. There is nothing to hold onto.",
      duration: 5
    }
  ]

  // Add gentle breathing and sleep-inducing content
  const sleepCycles = Math.floor(duration * 0.6)

  for (let i = 0; i < sleepCycles; i++) {
    if (i % 4 === 0) {
      const sleepGuidance = [
        "You are safe. You are held. Let sleep come to you like a gentle friend.",
        "With each breath, you drift deeper into stillness. Deeper into peace.",
        "Release the day... release your thoughts... release everything.",
        "You are floating now, between waking and dreaming, in a sacred space.",
        "The universe holds you as a mother holds a child. You are completely safe."
      ]
      steps.push({
        text: sleepGuidance[i % sleepGuidance.length],
        duration: 8
      })
    }

    steps.push({
      text: "",
      duration: 6,
      breathingCue: 'natural'
    })
  }

  steps.push({
    text: "Sleep now, dear one. May your rest be deep and your dreams be blessed. Om Shanti.",
    duration: 8,
    bellSound: true
  })

  // Long silence at end
  steps.push({
    text: "",
    duration: 30,
    breathingCue: 'natural'
  })

  return steps
}

/**
 * Generate morning energy meditation
 */
function generateMorningMeditation(duration: MeditationDuration): MeditationStep[] {
  const steps: MeditationStep[] = [
    {
      text: "Good morning, awakening soul. A new day has been given to you - a precious gift of possibility.",
      duration: 5,
      bellSound: true
    },
    {
      text: "Before you open your eyes fully, take a moment to feel gratitude for this body that carried you through the night.",
      duration: 5
    },
    {
      text: "Stretch gently. Wiggle your fingers and toes. Feel the life force beginning to flow more strongly.",
      duration: 6
    },
    {
      text: "The Gita says: The self is the friend of the self, and the self is the enemy of the self. Today, choose to be your own ally.",
      duration: 7
    },
    {
      text: "Take a deep energizing breath in - feel the oxygen filling every cell with vitality!",
      duration: 4,
      breathingCue: 'inhale'
    },
    {
      text: "Release with power - let go of any remaining sleep, any heaviness.",
      duration: 4,
      breathingCue: 'exhale'
    }
  ]

  // Add energizing cycles
  const cycles = Math.floor(duration * 0.5)

  for (let i = 0; i < cycles; i++) {
    if (i % 3 === 0) {
      const morningAffirmations = [
        "I am awake. I am alive. I am ready to embrace this day.",
        "Today I will act with purpose, letting go of what I cannot control.",
        "I carry infinite potential within me. Today I will use it wisely.",
        "I am connected to all beings. My actions today will ripple outward with love.",
        "This day is mine to shape. I choose courage, kindness, and clarity."
      ]
      steps.push({
        text: morningAffirmations[i % morningAffirmations.length],
        duration: 5
      })
    }

    steps.push({
      text: "Energizing breath in!",
      duration: 3,
      breathingCue: 'inhale'
    })
    steps.push({
      text: "Power out!",
      duration: 3,
      breathingCue: 'exhale'
    })
  }

  // Set intentions
  steps.push({
    text: "Now, set your intention for this day. What quality do you want to embody? Perhaps it's patience, or courage, or compassion.",
    duration: 8
  })
  steps.push({
    text: "Hold that intention in your heart. Let it be your compass today.",
    duration: 6
  })
  steps.push({
    text: "You are ready. Rise with purpose. The world awaits your unique light.",
    duration: 4,
    bellSound: true
  })

  return steps
}

/**
 * Generate meditation session
 */
export function generateMeditationSession(
  type: MeditationType,
  duration: MeditationDuration
): MeditationSession {
  let steps: MeditationStep[]
  let title: string
  let description: string

  switch (type) {
    case 'breathing':
      steps = generateBreathingMeditation(duration)
      title = 'Sacred Breath'
      description = 'Pranayama breathing meditation for inner peace'
      break

    case 'anxiety_relief':
      steps = generateAnxietyReliefMeditation(duration)
      title = 'Anxiety Relief'
      description = 'Calming meditation for anxious moments'
      break

    case 'gita_contemplation':
      steps = generateGitaContemplation(duration)
      title = 'Gita Wisdom'
      description = 'Contemplation of sacred Bhagavad Gita verses'
      break

    case 'sleep':
      steps = generateSleepMeditation(duration)
      title = 'Peaceful Sleep'
      description = 'Gentle guidance into restful sleep'
      break

    case 'morning_energy':
      steps = generateMorningMeditation(duration)
      title = 'Morning Awakening'
      description = 'Energizing meditation to start your day'
      break

    default:
      steps = generateBreathingMeditation(duration)
      title = 'Guided Meditation'
      description = 'A peaceful meditation journey'
  }

  // Add intro
  const introStep: MeditationStep = {
    text: MEDITATION_INTROS[type],
    duration: 6,
    bellSound: true
  }
  steps.unshift(introStep)

  return {
    type,
    title,
    description,
    duration,
    steps,
    closingBlessing: MEDITATION_CLOSINGS[type]
  }
}

/**
 * Get all available meditation types with descriptions
 */
export function getMeditationTypes(): {
  type: MeditationType
  title: string
  description: string
  icon: string
  recommended: string
}[] {
  return [
    {
      type: 'breathing',
      title: 'Sacred Breath',
      description: 'Pranayama breathing for calm and clarity',
      icon: '🌬️',
      recommended: 'Daily practice, any time'
    },
    {
      type: 'anxiety_relief',
      title: 'Anxiety Relief',
      description: 'Grounding meditation for anxious moments',
      icon: '🧘',
      recommended: 'When feeling overwhelmed'
    },
    {
      type: 'gita_contemplation',
      title: 'Gita Wisdom',
      description: 'Contemplate sacred verses deeply',
      icon: '📖',
      recommended: 'When seeking guidance'
    },
    {
      type: 'sleep',
      title: 'Peaceful Sleep',
      description: 'Gentle journey into restful sleep',
      icon: '🌙',
      recommended: 'Bedtime'
    },
    {
      type: 'morning_energy',
      title: 'Morning Awakening',
      description: 'Energizing start to your day',
      icon: '🌅',
      recommended: 'Upon waking'
    },
    {
      type: 'loving_kindness',
      title: 'Loving Kindness',
      description: 'Cultivate compassion for all beings',
      icon: '💝',
      recommended: 'When heart feels closed'
    }
  ]
}

/**
 * Get available durations
 */
export function getMeditationDurations(): {
  minutes: MeditationDuration
  label: string
  description: string
}[] {
  return [
    { minutes: 3, label: '3 min', description: 'Quick reset' },
    { minutes: 5, label: '5 min', description: 'Brief practice' },
    { minutes: 10, label: '10 min', description: 'Standard session' },
    { minutes: 15, label: '15 min', description: 'Deeper practice' },
    { minutes: 20, label: '20 min', description: 'Full meditation' },
    { minutes: 30, label: '30 min', description: 'Extended journey' }
  ]
}
