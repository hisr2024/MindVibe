/**
 * Therapeutic Programs Engine
 *
 * ॐ श्री कृष्णाय नमः
 *
 * Comprehensive therapeutic program system featuring:
 * - Multi-day structured programs (7-day, 21-day, 90-day)
 * - Session-based progression with brainwave protocols
 * - Mood tracking integration
 * - Streak and achievement system
 * - Progress analytics
 *
 * Based on Bhagavad Gita Chapter 6 - Dhyana Yoga:
 * "अभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते"
 * "By practice and detachment, the mind is controlled" (BG 6.35)
 *
 * Scientific Foundation:
 * - Progressive brainwave entrainment
 * - Spaced repetition for habit formation
 * - Therapeutic sound protocols
 */

import {
  musicSystem,
  type BrainwaveState,
  type MeditationType,
  type SpiritualMode,
  SACRED_FREQUENCIES
} from './MusicSystem'

// ============ Types ============

export type ProgramType =
  | 'anxiety_relief'
  | 'deep_sleep'
  | 'focus_mastery'
  | 'meditation_foundation'
  | 'emotional_healing'
  | 'stress_reduction'
  | 'spiritual_awakening'
  | 'creativity_boost'
  | 'energy_vitality'

export type ProgramDuration = 7 | 14 | 21 | 30 | 90

export type SessionType =
  | 'meditation'
  | 'breathing'
  | 'sound_bath'
  | 'binaural_session'
  | 'guided_visualization'
  | 'mantra'
  | 'chakra_activation'
  | 'sleep_induction'
  | 'energy_boost'

export type TimeOfDayRecommendation =
  | 'brahma_muhurta'  // 4-6 AM
  | 'morning'          // 6-10 AM
  | 'midday'           // 10 AM - 2 PM
  | 'afternoon'        // 2-6 PM
  | 'evening'          // 6-9 PM
  | 'night'            // 9 PM - 12 AM
  | 'anytime'

export interface ProgramSession {
  id: string
  dayNumber: number
  sessionNumber: number
  title: string
  titleHindi: string
  description: string
  duration: number // minutes

  // Audio configuration
  sessionType: SessionType
  meditationType?: MeditationType
  spiritualMode?: SpiritualMode
  brainwaveProtocol?: {
    state: BrainwaveState
    startFrequency: number
    endFrequency: number
    technique: 'binaural' | 'isochronic' | 'monaural'
  }

  // Timing
  recommendedTimeOfDay: TimeOfDayRecommendation

  // Content
  preSessionInstructions?: string
  guidedScript?: string[]
  breathingPattern?: {
    inhale: number
    hold: number
    exhale: number
    holdEmpty: number
  }

  // Post-session
  reflectionPrompts: string[]

  // Gita integration
  gitaVerse?: {
    chapter: number
    verse: number
    sanskrit: string
    translation: string
  }
}

export interface TherapeuticProgram {
  id: string
  type: ProgramType
  name: string
  nameHindi: string
  description: string
  durationDays: ProgramDuration

  // Therapeutic info
  therapeuticFocus: string[]
  targetConditions: string[]
  expectedOutcomes: string[]

  // Scientific basis
  methodology: string
  researchBasis: string

  // Content
  sessions: ProgramSession[]

  // Visual
  coverGradient: string
  icon: string

  // Difficulty
  difficultyLevel: 1 | 2 | 3 | 4 | 5
  prerequisites: string[]
}

export interface ProgramEnrollment {
  id: string
  programId: string
  userId: string

  // Progress
  startDate: Date
  currentDay: number
  status: 'active' | 'paused' | 'completed' | 'abandoned'
  progressPercentage: number

  // Sessions
  completedSessions: string[]
  totalSessionsCompleted: number

  // Streaks
  currentStreak: number
  longestStreak: number
  lastSessionDate: Date | null

  // Mood tracking
  moodHistory: {
    sessionId: string
    moodBefore: number
    moodAfter: number
    date: Date
  }[]

  // Completion
  actualCompletionDate: Date | null
  completionNotes: string
}

export interface SessionCompletion {
  sessionId: string
  completedAt: Date
  moodBefore: number  // 1-10
  moodAfter: number   // 1-10
  energyBefore: number
  energyAfter: number
  duration: number    // actual duration in minutes
  reflectionNotes: string
  rating: number      // 1-5
}

export interface ProgramInsights {
  averageMoodImprovement: number
  bestTimeOfDay: TimeOfDayRecommendation
  mostEffectiveSessions: string[]
  adherenceRate: number
  predictedCompletionDate: Date
  weeklyProgress: number[]
}

// ============ Program Definitions ============

const PROGRAM_SESSIONS_ANXIETY: ProgramSession[] = [
  // Day 1
  {
    id: 'anxiety-1-1',
    dayNumber: 1,
    sessionNumber: 1,
    title: 'Grounding & Awareness',
    titleHindi: 'आधार और जागरूकता',
    description: 'Begin with gentle alpha waves to establish calm awareness',
    duration: 10,
    sessionType: 'binaural_session',
    meditationType: 'mindfulness',
    brainwaveProtocol: {
      state: 'alpha',
      startFrequency: 10,
      endFrequency: 10,
      technique: 'binaural'
    },
    recommendedTimeOfDay: 'morning',
    preSessionInstructions: 'Find a quiet space. Sit comfortably. Close your eyes.',
    reflectionPrompts: [
      'What sensations did you notice in your body?',
      'How does your mind feel now compared to before?'
    ],
    gitaVerse: {
      chapter: 6,
      verse: 10,
      sanskrit: 'योगी युञ्जीत सततमात्मानं रहसि स्थितः',
      translation: 'The yogi should constantly engage the mind, remaining in solitude'
    }
  },
  // Day 2
  {
    id: 'anxiety-2-1',
    dayNumber: 2,
    sessionNumber: 1,
    title: 'Breath of Calm',
    titleHindi: 'शांति की श्वास',
    description: 'Synchronized breathing with theta-alpha transition',
    duration: 12,
    sessionType: 'breathing',
    meditationType: 'mindfulness',
    brainwaveProtocol: {
      state: 'alpha',
      startFrequency: 12,
      endFrequency: 8,
      technique: 'binaural'
    },
    recommendedTimeOfDay: 'morning',
    breathingPattern: {
      inhale: 4,
      hold: 4,
      exhale: 6,
      holdEmpty: 2
    },
    reflectionPrompts: [
      'How did the breathing pattern affect your thoughts?',
      'Notice any areas of tension that released'
    ],
    gitaVerse: {
      chapter: 4,
      verse: 29,
      sanskrit: 'अपाने जुह्वति प्राणं प्राणेऽपानं तथापरे',
      translation: 'Some offer the outgoing breath into the incoming, and the incoming into the outgoing'
    }
  },
  // Day 3
  {
    id: 'anxiety-3-1',
    dayNumber: 3,
    sessionNumber: 1,
    title: 'Heart Center Healing',
    titleHindi: 'हृदय केंद्र उपचार',
    description: '528 Hz heart healing with loving-kindness meditation',
    duration: 15,
    sessionType: 'sound_bath',
    meditationType: 'loving_kindness',
    spiritualMode: 'chakra_journey',
    brainwaveProtocol: {
      state: 'alpha',
      startFrequency: 10,
      endFrequency: 8,
      technique: 'binaural'
    },
    recommendedTimeOfDay: 'evening',
    reflectionPrompts: [
      'What emotions arose during the heart-focused meditation?',
      'Who came to mind when sending loving-kindness?'
    ],
    gitaVerse: {
      chapter: 12,
      verse: 13,
      sanskrit: 'अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च',
      translation: 'One who is not envious but is a kind friend to all living entities'
    }
  },
  // Day 4
  {
    id: 'anxiety-4-1',
    dayNumber: 4,
    sessionNumber: 1,
    title: 'Releasing Fear',
    titleHindi: 'भय मुक्ति',
    description: '396 Hz liberation frequency with guided visualization',
    duration: 18,
    sessionType: 'guided_visualization',
    spiritualMode: 'mahamrityunjaya',
    brainwaveProtocol: {
      state: 'theta',
      startFrequency: 8,
      endFrequency: 6,
      technique: 'binaural'
    },
    recommendedTimeOfDay: 'evening',
    reflectionPrompts: [
      'What fears or worries did you visualize releasing?',
      'How does your body feel after letting go?'
    ],
    gitaVerse: {
      chapter: 2,
      verse: 56,
      sanskrit: 'दुःखेष्वनुद्विग्नमनाः सुखेषु विगतस्पृहः',
      translation: 'One whose mind is undisturbed by sorrow, and free from desire for pleasure'
    }
  },
  // Day 5
  {
    id: 'anxiety-5-1',
    dayNumber: 5,
    sessionNumber: 1,
    title: 'Deep Theta Journey',
    titleHindi: 'गहरी थीटा यात्रा',
    description: 'Deepening practice with theta waves for inner peace',
    duration: 20,
    sessionType: 'meditation',
    meditationType: 'transcendental',
    spiritualMode: 'om_meditation',
    brainwaveProtocol: {
      state: 'theta',
      startFrequency: 7,
      endFrequency: 5,
      technique: 'binaural'
    },
    recommendedTimeOfDay: 'brahma_muhurta',
    reflectionPrompts: [
      'Describe the quality of stillness you experienced',
      'What insights arose from the deeper state?'
    ],
    gitaVerse: {
      chapter: 6,
      verse: 19,
      sanskrit: 'यथा दीपो निवातस्थो नेङ्गते सोपमा स्मृता',
      translation: 'As a lamp in a windless place does not flicker, such is the disciplined mind'
    }
  },
  // Day 6
  {
    id: 'anxiety-6-1',
    dayNumber: 6,
    sessionNumber: 1,
    title: 'Body Scan Relaxation',
    titleHindi: 'शरीर स्कैन विश्राम',
    description: 'Progressive muscle relaxation with alpha waves',
    duration: 20,
    sessionType: 'guided_visualization',
    meditationType: 'mindfulness',
    brainwaveProtocol: {
      state: 'alpha',
      startFrequency: 10,
      endFrequency: 8,
      technique: 'isochronic'
    },
    recommendedTimeOfDay: 'evening',
    reflectionPrompts: [
      'Which areas of your body held the most tension?',
      'How do you feel after the full body relaxation?'
    ]
  },
  // Day 7
  {
    id: 'anxiety-7-1',
    dayNumber: 7,
    sessionNumber: 1,
    title: 'Integration & Mastery',
    titleHindi: 'एकीकरण और महारत',
    description: 'Complete journey from alpha to theta to delta',
    duration: 25,
    sessionType: 'sound_bath',
    meditationType: 'cosmic',
    spiritualMode: 'gita_dhyana',
    brainwaveProtocol: {
      state: 'theta',
      startFrequency: 12,
      endFrequency: 4,
      technique: 'binaural'
    },
    recommendedTimeOfDay: 'brahma_muhurta',
    reflectionPrompts: [
      'How has your relationship with anxiety changed this week?',
      'What tools will you carry forward from this program?',
      'What does inner peace feel like to you now?'
    ],
    gitaVerse: {
      chapter: 6,
      verse: 27,
      sanskrit: 'प्रशान्तमनसं ह्येनं योगिनं सुखमुत्तमम्',
      translation: 'The yogi whose mind is peaceful attains the highest happiness'
    }
  }
]

const PROGRAM_SESSIONS_SLEEP: ProgramSession[] = [
  {
    id: 'sleep-1-1',
    dayNumber: 1,
    sessionNumber: 1,
    title: 'Evening Wind Down',
    titleHindi: 'संध्या विश्राम',
    description: 'Gentle transition from beta to alpha for relaxation',
    duration: 15,
    sessionType: 'sound_bath',
    meditationType: 'zen',
    brainwaveProtocol: {
      state: 'alpha',
      startFrequency: 12,
      endFrequency: 8,
      technique: 'binaural'
    },
    recommendedTimeOfDay: 'night',
    reflectionPrompts: [
      'Rate your sleepiness from 1-10',
      'What thoughts are you releasing tonight?'
    ]
  },
  {
    id: 'sleep-2-1',
    dayNumber: 2,
    sessionNumber: 1,
    title: 'Theta Twilight',
    titleHindi: 'थीटा संध्या',
    description: 'Deeper relaxation with theta waves',
    duration: 20,
    sessionType: 'meditation',
    meditationType: 'deep_sleep',
    spiritualMode: 'om_meditation',
    brainwaveProtocol: {
      state: 'theta',
      startFrequency: 8,
      endFrequency: 5,
      technique: 'binaural'
    },
    recommendedTimeOfDay: 'night',
    reflectionPrompts: [
      'How quickly did you feel drowsy?',
      'Notice any dreams or images?'
    ]
  },
  {
    id: 'sleep-3-1',
    dayNumber: 3,
    sessionNumber: 1,
    title: 'Delta Descent',
    titleHindi: 'डेल्टा अवतरण',
    description: 'Journey into delta for deep restorative sleep',
    duration: 30,
    sessionType: 'sleep_induction',
    meditationType: 'deep_sleep',
    brainwaveProtocol: {
      state: 'delta',
      startFrequency: 6,
      endFrequency: 2,
      technique: 'binaural'
    },
    recommendedTimeOfDay: 'night',
    reflectionPrompts: [
      'How was your sleep quality?',
      'Do you remember any dreams?'
    ],
    gitaVerse: {
      chapter: 6,
      verse: 17,
      sanskrit: 'युक्तस्वप्नावबोधस्य योगो भवति दुःखहा',
      translation: 'For one who is moderate in sleep and wakefulness, yoga destroys all sorrow'
    }
  },
  // Additional sleep sessions...
  {
    id: 'sleep-7-1',
    dayNumber: 7,
    sessionNumber: 1,
    title: 'Sleep Mastery',
    titleHindi: 'निद्रा महारत',
    description: 'Complete delta protocol for deepest restoration',
    duration: 45,
    sessionType: 'sleep_induction',
    meditationType: 'deep_sleep',
    spiritualMode: 'vedic_chant',
    brainwaveProtocol: {
      state: 'delta',
      startFrequency: 8,
      endFrequency: 1,
      technique: 'binaural'
    },
    recommendedTimeOfDay: 'night',
    reflectionPrompts: [
      'How has your sleep quality changed this week?',
      'What bedtime routine will you maintain?'
    ]
  }
]

const PROGRAM_SESSIONS_FOCUS: ProgramSession[] = [
  {
    id: 'focus-1-1',
    dayNumber: 1,
    sessionNumber: 1,
    title: 'Alert Clarity',
    titleHindi: 'सतर्क स्पष्टता',
    description: 'Beta wave stimulation for mental sharpness',
    duration: 15,
    sessionType: 'binaural_session',
    meditationType: 'focus',
    brainwaveProtocol: {
      state: 'beta',
      startFrequency: 14,
      endFrequency: 18,
      technique: 'isochronic'
    },
    recommendedTimeOfDay: 'morning',
    reflectionPrompts: [
      'How clear does your thinking feel?',
      'What task will you focus on next?'
    ],
    gitaVerse: {
      chapter: 6,
      verse: 12,
      sanskrit: 'तत्रैकाग्रं मनः कृत्वा यतचित्तेन्द्रियक्रियः',
      translation: 'Having made the mind one-pointed, controlling the activities of the mind and senses'
    }
  },
  {
    id: 'focus-7-1',
    dayNumber: 7,
    sessionNumber: 1,
    title: 'Flow State Mastery',
    titleHindi: 'प्रवाह स्थिति महारत',
    description: 'Beta-gamma protocol for peak performance',
    duration: 25,
    sessionType: 'meditation',
    meditationType: 'flow_state',
    brainwaveProtocol: {
      state: 'gamma',
      startFrequency: 18,
      endFrequency: 40,
      technique: 'isochronic'
    },
    recommendedTimeOfDay: 'morning',
    reflectionPrompts: [
      'Describe your experience of flow',
      'What cognitive improvements have you noticed?'
    ]
  }
]

// ============ Program Definitions ============

export const THERAPEUTIC_PROGRAMS: TherapeuticProgram[] = [
  {
    id: 'anxiety-relief-7',
    type: 'anxiety_relief',
    name: '7-Day Anxiety Relief',
    nameHindi: '7 दिन चिंता मुक्ति',
    description: 'A gentle journey from anxiety to inner peace using progressive brainwave entrainment and ancient wisdom.',
    durationDays: 7,
    therapeuticFocus: ['Anxiety reduction', 'Emotional regulation', 'Stress management'],
    targetConditions: ['Generalized anxiety', 'Worry patterns', 'Nervous tension'],
    expectedOutcomes: [
      'Reduced anxiety symptoms',
      'Better emotional regulation',
      'Improved sleep quality',
      'Greater sense of calm'
    ],
    methodology: 'Progressive alpha-theta brainwave entrainment combined with mindfulness and heart-centered practices',
    researchBasis: 'Based on studies showing alpha-theta training reduces anxiety (Peniston & Kulkosky, 1991)',
    sessions: PROGRAM_SESSIONS_ANXIETY,
    coverGradient: 'from-violet-600 via-purple-600 to-indigo-600',
    icon: '🧘',
    difficultyLevel: 2,
    prerequisites: []
  },
  {
    id: 'deep-sleep-7',
    type: 'deep_sleep',
    name: '7-Day Deep Sleep',
    nameHindi: '7 दिन गहरी नींद',
    description: 'Restore your natural sleep rhythm with delta wave protocols and evening relaxation practices.',
    durationDays: 7,
    therapeuticFocus: ['Sleep quality', 'Relaxation', 'Circadian rhythm'],
    targetConditions: ['Insomnia', 'Poor sleep quality', 'Difficulty falling asleep'],
    expectedOutcomes: [
      'Faster sleep onset',
      'Deeper sleep cycles',
      'More restful mornings',
      'Reduced nighttime waking'
    ],
    methodology: 'Progressive delta wave entrainment with guided relaxation',
    researchBasis: 'Delta wave entrainment promotes slow-wave sleep (Abeln et al., 2014)',
    sessions: PROGRAM_SESSIONS_SLEEP,
    coverGradient: 'from-indigo-600 via-blue-600 to-purple-600',
    icon: '🌙',
    difficultyLevel: 1,
    prerequisites: []
  },
  {
    id: 'focus-mastery-7',
    type: 'focus_mastery',
    name: '7-Day Focus Mastery',
    nameHindi: '7 दिन एकाग्रता महारत',
    description: 'Sharpen your mental clarity and achieve flow states with beta-gamma brainwave training.',
    durationDays: 7,
    therapeuticFocus: ['Concentration', 'Mental clarity', 'Cognitive performance'],
    targetConditions: ['Difficulty concentrating', 'Mental fog', 'Procrastination'],
    expectedOutcomes: [
      'Improved concentration',
      'Enhanced mental clarity',
      'Ability to enter flow state',
      'Better productivity'
    ],
    methodology: 'Beta and gamma wave enhancement through isochronic tones',
    researchBasis: 'Gamma entrainment enhances cognitive performance (Williams & Gruzelier, 2001)',
    sessions: PROGRAM_SESSIONS_FOCUS,
    coverGradient: 'from-blue-600 via-cyan-600 to-teal-600',
    icon: '🎯',
    difficultyLevel: 2,
    prerequisites: []
  },
  {
    id: 'spiritual-awakening-21',
    type: 'spiritual_awakening',
    name: '21-Day Spiritual Awakening',
    nameHindi: '21 दिन आध्यात्मिक जागृति',
    description: 'A transformative journey through the chakras and consciousness layers with Gita wisdom.',
    durationDays: 21,
    therapeuticFocus: ['Spiritual growth', 'Self-realization', 'Inner peace'],
    targetConditions: ['Spiritual seeking', 'Life purpose questions', 'Inner transformation'],
    expectedOutcomes: [
      'Deeper self-awareness',
      'Chakra activation',
      'Connection with higher self',
      'Life clarity and purpose'
    ],
    methodology: 'Progressive chakra activation with Solfeggio frequencies and Gita contemplation',
    researchBasis: 'Based on yogic traditions and modern consciousness research',
    sessions: [], // Would be 21 sessions
    coverGradient: 'from-amber-500 via-orange-500 to-rose-500',
    icon: '🕉️',
    difficultyLevel: 4,
    prerequisites: ['Basic meditation experience']
  },
  {
    id: 'meditation-foundation-21',
    type: 'meditation_foundation',
    name: '21-Day Meditation Foundation',
    nameHindi: '21 दिन ध्यान नींव',
    description: 'Build a strong meditation practice from scratch with progressive skill building.',
    durationDays: 21,
    therapeuticFocus: ['Meditation skill', 'Mindfulness', 'Mental discipline'],
    targetConditions: ['Meditation beginners', 'Inconsistent practice', 'Restless mind'],
    expectedOutcomes: [
      'Consistent meditation habit',
      'Increased focus duration',
      'Calmer mind',
      'Improved self-awareness'
    ],
    methodology: 'Progressive meditation training from basic mindfulness to deeper states',
    researchBasis: '21 days for habit formation (Lally et al., 2010)',
    sessions: [], // Would be 21 sessions
    coverGradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    icon: '🧘‍♀️',
    difficultyLevel: 1,
    prerequisites: []
  }
]

// ============ Therapeutic Programs Engine ============

class TherapeuticProgramsEngine {
  private enrollments: Map<string, ProgramEnrollment> = new Map()
  private completions: Map<string, SessionCompletion[]> = new Map()

  // ============ Program Discovery ============

  getAllPrograms(): TherapeuticProgram[] {
    return THERAPEUTIC_PROGRAMS
  }

  getProgramById(programId: string): TherapeuticProgram | null {
    return THERAPEUTIC_PROGRAMS.find(p => p.id === programId) || null
  }

  getProgramsByType(type: ProgramType): TherapeuticProgram[] {
    return THERAPEUTIC_PROGRAMS.filter(p => p.type === type)
  }

  getProgramsByDuration(days: ProgramDuration): TherapeuticProgram[] {
    return THERAPEUTIC_PROGRAMS.filter(p => p.durationDays === days)
  }

  getRecommendedPrograms(context: {
    currentMood?: number
    anxietyLevel?: number
    sleepQuality?: number
    focusLevel?: number
    completedPrograms?: string[]
  }): TherapeuticProgram[] {
    const recommendations: TherapeuticProgram[] = []
    const completed = context.completedPrograms || []

    // Recommend based on needs
    if (context.anxietyLevel && context.anxietyLevel > 5) {
      recommendations.push(...this.getProgramsByType('anxiety_relief').filter(p => !completed.includes(p.id)))
    }

    if (context.sleepQuality && context.sleepQuality < 5) {
      recommendations.push(...this.getProgramsByType('deep_sleep').filter(p => !completed.includes(p.id)))
    }

    if (context.focusLevel && context.focusLevel < 5) {
      recommendations.push(...this.getProgramsByType('focus_mastery').filter(p => !completed.includes(p.id)))
    }

    // Default recommendations
    if (recommendations.length === 0) {
      return THERAPEUTIC_PROGRAMS.filter(p => p.difficultyLevel <= 2 && !completed.includes(p.id)).slice(0, 3)
    }

    return recommendations.slice(0, 3)
  }

  // ============ Enrollment ============

  enrollInProgram(programId: string, userId: string, startDate?: Date): ProgramEnrollment {
    const program = this.getProgramById(programId)
    if (!program) {
      throw new Error(`Program ${programId} not found`)
    }

    const enrollment: ProgramEnrollment = {
      id: `enrollment-${Date.now()}`,
      programId,
      userId,
      startDate: startDate || new Date(),
      currentDay: 1,
      status: 'active',
      progressPercentage: 0,
      completedSessions: [],
      totalSessionsCompleted: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastSessionDate: null,
      moodHistory: [],
      actualCompletionDate: null,
      completionNotes: ''
    }

    this.enrollments.set(enrollment.id, enrollment)
    return enrollment
  }

  getEnrollment(enrollmentId: string): ProgramEnrollment | null {
    return this.enrollments.get(enrollmentId) || null
  }

  getUserEnrollments(userId: string): ProgramEnrollment[] {
    return Array.from(this.enrollments.values())
      .filter(e => e.userId === userId)
  }

  getActiveEnrollment(userId: string): ProgramEnrollment | null {
    return Array.from(this.enrollments.values())
      .find(e => e.userId === userId && e.status === 'active') || null
  }

  // ============ Session Management ============

  getNextSession(enrollmentId: string): ProgramSession | null {
    const enrollment = this.getEnrollment(enrollmentId)
    if (!enrollment) return null

    const program = this.getProgramById(enrollment.programId)
    if (!program) return null

    // Find next uncompleted session
    const nextSession = program.sessions.find(
      s => !enrollment.completedSessions.includes(s.id)
    )

    return nextSession || null
  }

  getTodaySessions(enrollmentId: string): ProgramSession[] {
    const enrollment = this.getEnrollment(enrollmentId)
    if (!enrollment) return []

    const program = this.getProgramById(enrollment.programId)
    if (!program) return []

    return program.sessions.filter(s => s.dayNumber === enrollment.currentDay)
  }

  async startSession(enrollmentId: string, sessionId: string): Promise<void> {
    const enrollment = this.getEnrollment(enrollmentId)
    if (!enrollment) throw new Error('Enrollment not found')

    const program = this.getProgramById(enrollment.programId)
    if (!program) throw new Error('Program not found')

    const session = program.sessions.find(s => s.id === sessionId)
    if (!session) throw new Error('Session not found')

    // Start the appropriate music/meditation
    if (session.meditationType) {
      await musicSystem.startMeditationMusic(session.meditationType)
    }

    if (session.spiritualMode) {
      await musicSystem.startSpiritualMusic(session.spiritualMode)
    }

    // Start ambient if no specific mode
    if (!session.meditationType && !session.spiritualMode) {
      await musicSystem.startAmbientMusic('serene')
    }
  }

  async completeSession(
    enrollmentId: string,
    sessionId: string,
    completion: Omit<SessionCompletion, 'sessionId' | 'completedAt'>
  ): Promise<{ enrollment: ProgramEnrollment; insights: ProgramInsights }> {
    const enrollment = this.getEnrollment(enrollmentId)
    if (!enrollment) throw new Error('Enrollment not found')

    const program = this.getProgramById(enrollment.programId)
    if (!program) throw new Error('Program not found')

    const session = program.sessions.find(s => s.id === sessionId)
    if (!session) throw new Error('Session not found')

    // Record completion
    const fullCompletion: SessionCompletion = {
      sessionId,
      completedAt: new Date(),
      ...completion
    }

    const existingCompletions = this.completions.get(enrollmentId) || []
    existingCompletions.push(fullCompletion)
    this.completions.set(enrollmentId, existingCompletions)

    // Update enrollment
    enrollment.completedSessions.push(sessionId)
    enrollment.totalSessionsCompleted++
    enrollment.lastSessionDate = new Date()

    // Update mood history
    enrollment.moodHistory.push({
      sessionId,
      moodBefore: completion.moodBefore,
      moodAfter: completion.moodAfter,
      date: new Date()
    })

    // Update streak
    this.updateStreak(enrollment)

    // Update progress
    enrollment.progressPercentage = (enrollment.completedSessions.length / program.sessions.length) * 100

    // Check day advancement
    const todaySessions = program.sessions.filter(s => s.dayNumber === enrollment.currentDay)
    const completedToday = todaySessions.filter(s => enrollment.completedSessions.includes(s.id))

    if (completedToday.length === todaySessions.length) {
      enrollment.currentDay = Math.min(enrollment.currentDay + 1, program.durationDays)
    }

    // Check completion
    if (enrollment.completedSessions.length === program.sessions.length) {
      enrollment.status = 'completed'
      enrollment.actualCompletionDate = new Date()
    }

    // Stop music
    musicSystem.stopAll()

    // Generate insights
    const insights = this.generateInsights(enrollmentId)

    return { enrollment, insights }
  }

  private updateStreak(enrollment: ProgramEnrollment): void {
    const today = new Date()
    const lastSession = enrollment.lastSessionDate

    if (!lastSession) {
      enrollment.currentStreak = 1
    } else {
      const dayDiff = Math.floor(
        (today.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (dayDiff === 0 || dayDiff === 1) {
        enrollment.currentStreak++
      } else {
        enrollment.currentStreak = 1
      }
    }

    enrollment.longestStreak = Math.max(
      enrollment.longestStreak,
      enrollment.currentStreak
    )
  }

  // ============ Insights ============

  generateInsights(enrollmentId: string): ProgramInsights {
    const enrollment = this.getEnrollment(enrollmentId)
    if (!enrollment) {
      return {
        averageMoodImprovement: 0,
        bestTimeOfDay: 'anytime',
        mostEffectiveSessions: [],
        adherenceRate: 0,
        predictedCompletionDate: new Date(),
        weeklyProgress: []
      }
    }

    const completions = this.completions.get(enrollmentId) || []

    // Calculate average mood improvement
    const moodImprovements = completions.map(c => c.moodAfter - c.moodBefore)
    const averageMoodImprovement = moodImprovements.length > 0
      ? moodImprovements.reduce((a, b) => a + b, 0) / moodImprovements.length
      : 0

    // Find most effective sessions
    const sessionEffectiveness = completions.map(c => ({
      sessionId: c.sessionId,
      improvement: c.moodAfter - c.moodBefore,
      rating: c.rating
    }))
    const mostEffectiveSessions = sessionEffectiveness
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 3)
      .map(s => s.sessionId)

    // Calculate adherence rate
    const program = this.getProgramById(enrollment.programId)
    const expectedSessions = program
      ? Math.min(enrollment.currentDay, program.durationDays) * (program.sessions.length / program.durationDays)
      : 0
    const adherenceRate = expectedSessions > 0
      ? (enrollment.totalSessionsCompleted / expectedSessions) * 100
      : 100

    // Predict completion date
    const avgSessionsPerDay = enrollment.totalSessionsCompleted / Math.max(1, enrollment.currentDay)
    const remainingSessions = program
      ? program.sessions.length - enrollment.completedSessions.length
      : 0
    const daysRemaining = avgSessionsPerDay > 0 ? remainingSessions / avgSessionsPerDay : 7
    const predictedCompletionDate = new Date()
    predictedCompletionDate.setDate(predictedCompletionDate.getDate() + Math.ceil(daysRemaining))

    return {
      averageMoodImprovement,
      bestTimeOfDay: 'morning', // Would calculate from session times
      mostEffectiveSessions,
      adherenceRate: Math.min(100, adherenceRate),
      predictedCompletionDate,
      weeklyProgress: [] // Would calculate weekly stats
    }
  }

  // ============ Progress Controls ============

  pauseEnrollment(enrollmentId: string): void {
    const enrollment = this.getEnrollment(enrollmentId)
    if (enrollment) {
      enrollment.status = 'paused'
    }
  }

  resumeEnrollment(enrollmentId: string): void {
    const enrollment = this.getEnrollment(enrollmentId)
    if (enrollment && enrollment.status === 'paused') {
      enrollment.status = 'active'
    }
  }

  abandonEnrollment(enrollmentId: string): void {
    const enrollment = this.getEnrollment(enrollmentId)
    if (enrollment) {
      enrollment.status = 'abandoned'
    }
  }

  // ============ Analytics ============

  getUserStats(userId: string): {
    totalPrograms: number
    completedPrograms: number
    totalSessions: number
    totalMinutes: number
    longestStreak: number
    averageMoodImprovement: number
  } {
    const enrollments = this.getUserEnrollments(userId)

    let totalSessions = 0
    let totalMinutes = 0
    let longestStreak = 0
    let totalMoodImprovement = 0
    let moodCount = 0

    enrollments.forEach(enrollment => {
      totalSessions += enrollment.totalSessionsCompleted
      longestStreak = Math.max(longestStreak, enrollment.longestStreak)

      enrollment.moodHistory.forEach(m => {
        totalMoodImprovement += m.moodAfter - m.moodBefore
        moodCount++
      })

      const completions = this.completions.get(enrollment.id) || []
      completions.forEach(c => {
        totalMinutes += c.duration
      })
    })

    return {
      totalPrograms: enrollments.length,
      completedPrograms: enrollments.filter(e => e.status === 'completed').length,
      totalSessions,
      totalMinutes,
      longestStreak,
      averageMoodImprovement: moodCount > 0 ? totalMoodImprovement / moodCount : 0
    }
  }
}

// ============ Singleton Export ============

export const therapeuticProgramsEngine = new TherapeuticProgramsEngine()

// ============ Export Types and Constants ============

export { THERAPEUTIC_PROGRAMS as PROGRAMS }
