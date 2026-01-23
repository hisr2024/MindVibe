/**
 * Daily Check-In Engine - Morning & Evening Voice Check-Ins
 *
 * Structured voice-based daily wellness check-ins:
 * - Morning intention setting
 * - Evening reflection and gratitude
 * - Mood tracking through voice
 * - Energy level assessment
 * - Sleep quality check (morning)
 * - Day rating (evening)
 *
 * Practical Use Cases:
 * - "KIAAN, morning check-in" - Start day with intention
 * - "KIAAN, how was my day" - Evening reflection
 * - Track patterns over time
 * - Personalized insights based on check-in data
 */

// ============ Types & Interfaces ============

/**
 * Check-in type
 */
export type CheckInType = 'morning' | 'evening' | 'midday' | 'custom'

/**
 * Mood options
 */
export type MoodLevel = 1 | 2 | 3 | 4 | 5  // 1 = very low, 5 = very high

/**
 * Energy level
 */
export type EnergyLevel = 'depleted' | 'low' | 'moderate' | 'good' | 'excellent'

/**
 * Sleep quality
 */
export type SleepQuality = 'poor' | 'fair' | 'good' | 'great' | 'excellent'

/**
 * Check-in question
 */
export interface CheckInQuestion {
  id: string
  text: string
  voiceText: string          // TTS-optimized text
  type: 'mood' | 'energy' | 'sleep' | 'intention' | 'gratitude' | 'reflection' | 'rating' | 'freeform'
  responseOptions?: string[]
  required: boolean
  followUp?: string          // Follow-up based on response
}

/**
 * Check-in response
 */
export interface CheckInResponse {
  questionId: string
  value: string | number
  voiceTranscript?: string
  timestamp: Date
}

/**
 * Complete check-in record
 */
export interface CheckInRecord {
  id: string
  type: CheckInType
  date: Date
  responses: CheckInResponse[]
  overallMood?: MoodLevel
  energyLevel?: EnergyLevel
  sleepQuality?: SleepQuality
  intentions?: string[]
  gratitudes?: string[]
  dayRating?: number
  notes?: string
  duration: number  // seconds
}

/**
 * Check-in flow
 */
export interface CheckInFlow {
  type: CheckInType
  name: string
  description: string
  questions: CheckInQuestion[]
  estimatedMinutes: number
}

/**
 * Daily insights
 */
export interface DailyInsights {
  averageMood: number
  averageEnergy: number
  moodTrend: 'improving' | 'stable' | 'declining'
  commonGratitudes: string[]
  streakDays: number
  bestTimeOfDay: string
  suggestions: string[]
}

/**
 * Engine state
 */
export interface CheckInState {
  isActive: boolean
  currentFlow: CheckInType | null
  currentQuestionIndex: number
  responses: CheckInResponse[]
  startTime: Date | null
}

/**
 * Engine configuration
 */
export interface CheckInConfig {
  enableReminders?: boolean
  morningTime?: string       // HH:MM
  eveningTime?: string       // HH:MM
  onQuestion?: (question: CheckInQuestion) => void
  onResponse?: (response: CheckInResponse) => void
  onComplete?: (record: CheckInRecord) => void
  onInsight?: (insight: string) => void
}

// ============ Check-In Flows ============

/**
 * Morning check-in flow
 */
const MORNING_FLOW: CheckInFlow = {
  type: 'morning',
  name: 'Morning Check-In',
  description: 'Start your day with intention and awareness',
  estimatedMinutes: 3,
  questions: [
    {
      id: 'morning_greeting',
      text: 'Good morning! How did you sleep last night?',
      voiceText: 'Good morning! Let\'s start with a quick check-in. How did you sleep last night?',
      type: 'sleep',
      responseOptions: ['poor', 'fair', 'good', 'great', 'excellent'],
      required: true,
      followUp: 'I hope tonight brings better rest.'
    },
    {
      id: 'morning_energy',
      text: 'How is your energy level right now?',
      voiceText: 'And how is your energy level right now?',
      type: 'energy',
      responseOptions: ['depleted', 'low', 'moderate', 'good', 'excellent'],
      required: true
    },
    {
      id: 'morning_mood',
      text: 'On a scale of 1 to 5, how would you rate your mood?',
      voiceText: 'On a scale of 1 to 5, with 5 being great, how would you rate your mood this morning?',
      type: 'mood',
      required: true
    },
    {
      id: 'morning_intention',
      text: 'What is one intention you want to set for today?',
      voiceText: 'What is one intention you\'d like to set for today? It could be something small, like being patient, or something specific you want to accomplish.',
      type: 'intention',
      required: true
    },
    {
      id: 'morning_gratitude',
      text: 'What is one thing you\'re grateful for this morning?',
      voiceText: 'Before we finish, what\'s one thing you\'re grateful for this morning?',
      type: 'gratitude',
      required: false
    }
  ]
}

/**
 * Evening check-in flow
 */
const EVENING_FLOW: CheckInFlow = {
  type: 'evening',
  name: 'Evening Reflection',
  description: 'Reflect on your day and prepare for rest',
  estimatedMinutes: 4,
  questions: [
    {
      id: 'evening_greeting',
      text: 'Good evening! How was your day overall?',
      voiceText: 'Good evening! Let\'s take a moment to reflect on your day. How was it overall?',
      type: 'rating',
      required: true
    },
    {
      id: 'evening_mood',
      text: 'How are you feeling right now?',
      voiceText: 'How are you feeling right now, on a scale of 1 to 5?',
      type: 'mood',
      required: true
    },
    {
      id: 'evening_energy',
      text: 'How is your energy level?',
      voiceText: 'And how is your energy level at the end of the day?',
      type: 'energy',
      responseOptions: ['depleted', 'low', 'moderate', 'good', 'excellent'],
      required: true
    },
    {
      id: 'evening_highlight',
      text: 'What was the highlight of your day?',
      voiceText: 'What was the highlight of your day? It could be something big or small.',
      type: 'reflection',
      required: true
    },
    {
      id: 'evening_challenge',
      text: 'Was there anything challenging today?',
      voiceText: 'Was there anything challenging or difficult today that you\'d like to acknowledge?',
      type: 'reflection',
      required: false
    },
    {
      id: 'evening_gratitude',
      text: 'Name three things you\'re grateful for today.',
      voiceText: 'Let\'s end with gratitude. Can you name three things you\'re grateful for today?',
      type: 'gratitude',
      required: true
    },
    {
      id: 'evening_tomorrow',
      text: 'What are you looking forward to tomorrow?',
      voiceText: 'What\'s one thing you\'re looking forward to tomorrow?',
      type: 'intention',
      required: false
    }
  ]
}

/**
 * Midday check-in (shorter)
 */
const MIDDAY_FLOW: CheckInFlow = {
  type: 'midday',
  name: 'Midday Pause',
  description: 'A brief moment to check in with yourself',
  estimatedMinutes: 1,
  questions: [
    {
      id: 'midday_mood',
      text: 'How are you feeling right now?',
      voiceText: 'Let\'s take a quick pause. How are you feeling right now?',
      type: 'mood',
      required: true
    },
    {
      id: 'midday_energy',
      text: 'How is your energy?',
      voiceText: 'And how is your energy level?',
      type: 'energy',
      responseOptions: ['depleted', 'low', 'moderate', 'good', 'excellent'],
      required: true
    },
    {
      id: 'midday_need',
      text: 'What do you need right now?',
      voiceText: 'What\'s one thing you need right now? Maybe a break, some water, or a moment of calm?',
      type: 'freeform',
      required: false
    }
  ]
}

export const CHECK_IN_FLOWS: Record<CheckInType, CheckInFlow> = {
  morning: MORNING_FLOW,
  evening: EVENING_FLOW,
  midday: MIDDAY_FLOW,
  custom: {
    type: 'custom',
    name: 'Custom Check-In',
    description: 'A personalized check-in',
    estimatedMinutes: 2,
    questions: []
  }
}

// ============ Engine Class ============

/**
 * Daily Check-In Engine
 *
 * Manages structured voice-based daily wellness check-ins.
 */
export class DailyCheckInEngine {
  private state: CheckInState = {
    isActive: false,
    currentFlow: null,
    currentQuestionIndex: 0,
    responses: [],
    startTime: null
  }

  private config: CheckInConfig = {
    enableReminders: true,
    morningTime: '07:00',
    eveningTime: '21:00'
  }

  private history: CheckInRecord[] = []
  private storageKey = 'kiaan_checkin_history'

  constructor(options?: CheckInConfig) {
    if (options) {
      this.config = { ...this.config, ...options }
    }
    this.loadHistory()
  }

  /**
   * Start a check-in
   */
  startCheckIn(type: CheckInType): CheckInFlow {
    const flow = CHECK_IN_FLOWS[type]

    this.state = {
      isActive: true,
      currentFlow: type,
      currentQuestionIndex: 0,
      responses: [],
      startTime: new Date()
    }

    // Emit first question
    if (this.config.onQuestion && flow.questions.length > 0) {
      this.config.onQuestion(flow.questions[0])
    }

    return flow
  }

  /**
   * Get current question
   */
  getCurrentQuestion(): CheckInQuestion | null {
    if (!this.state.isActive || !this.state.currentFlow) return null

    const flow = CHECK_IN_FLOWS[this.state.currentFlow]
    if (this.state.currentQuestionIndex >= flow.questions.length) return null

    return flow.questions[this.state.currentQuestionIndex]
  }

  /**
   * Submit response to current question
   */
  submitResponse(value: string | number, voiceTranscript?: string): CheckInQuestion | null {
    if (!this.state.isActive || !this.state.currentFlow) return null

    const flow = CHECK_IN_FLOWS[this.state.currentFlow]
    const currentQuestion = flow.questions[this.state.currentQuestionIndex]

    // Record response
    const response: CheckInResponse = {
      questionId: currentQuestion.id,
      value,
      voiceTranscript,
      timestamp: new Date()
    }

    this.state.responses.push(response)

    if (this.config.onResponse) {
      this.config.onResponse(response)
    }

    // Move to next question
    this.state.currentQuestionIndex++

    if (this.state.currentQuestionIndex >= flow.questions.length) {
      // Check-in complete
      this.completeCheckIn()
      return null
    }

    const nextQuestion = flow.questions[this.state.currentQuestionIndex]

    if (this.config.onQuestion) {
      this.config.onQuestion(nextQuestion)
    }

    return nextQuestion
  }

  /**
   * Skip current question
   */
  skipQuestion(): CheckInQuestion | null {
    if (!this.state.isActive || !this.state.currentFlow) return null

    const flow = CHECK_IN_FLOWS[this.state.currentFlow]
    const currentQuestion = flow.questions[this.state.currentQuestionIndex]

    // Only skip if not required
    if (currentQuestion.required) {
      return currentQuestion  // Can't skip, return same question
    }

    this.state.currentQuestionIndex++

    if (this.state.currentQuestionIndex >= flow.questions.length) {
      this.completeCheckIn()
      return null
    }

    const nextQuestion = flow.questions[this.state.currentQuestionIndex]

    if (this.config.onQuestion) {
      this.config.onQuestion(nextQuestion)
    }

    return nextQuestion
  }

  /**
   * Cancel check-in
   */
  cancelCheckIn(): void {
    this.state = {
      isActive: false,
      currentFlow: null,
      currentQuestionIndex: 0,
      responses: [],
      startTime: null
    }
  }

  /**
   * Get check-in history
   */
  getHistory(days?: number): CheckInRecord[] {
    if (!days) return [...this.history]

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    return this.history.filter(r => r.date >= cutoff)
  }

  /**
   * Get today's check-ins
   */
  getTodayCheckIns(): CheckInRecord[] {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return this.history.filter(r => r.date >= today)
  }

  /**
   * Check if morning check-in is done
   */
  isMorningCheckInDone(): boolean {
    return this.getTodayCheckIns().some(r => r.type === 'morning')
  }

  /**
   * Check if evening check-in is done
   */
  isEveningCheckInDone(): boolean {
    return this.getTodayCheckIns().some(r => r.type === 'evening')
  }

  /**
   * Get daily insights
   */
  getInsights(days: number = 7): DailyInsights {
    const records = this.getHistory(days)

    // Calculate averages
    const moods = records.filter(r => r.overallMood).map(r => r.overallMood as number)
    const averageMood = moods.length > 0
      ? moods.reduce((a, b) => a + b, 0) / moods.length
      : 3

    const energyMap: Record<EnergyLevel, number> = {
      depleted: 1, low: 2, moderate: 3, good: 4, excellent: 5
    }
    const energies = records
      .filter(r => r.energyLevel)
      .map(r => energyMap[r.energyLevel as EnergyLevel])
    const averageEnergy = energies.length > 0
      ? energies.reduce((a, b) => a + b, 0) / energies.length
      : 3

    // Determine mood trend
    let moodTrend: 'improving' | 'stable' | 'declining' = 'stable'
    if (moods.length >= 3) {
      const recentAvg = moods.slice(-3).reduce((a, b) => a + b, 0) / 3
      const olderAvg = moods.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(1, moods.length - 3)
      if (recentAvg > olderAvg + 0.3) moodTrend = 'improving'
      else if (recentAvg < olderAvg - 0.3) moodTrend = 'declining'
    }

    // Collect gratitudes
    const allGratitudes = records.flatMap(r => r.gratitudes ?? [])
    const gratitudeCounts: Record<string, number> = {}
    allGratitudes.forEach(g => {
      const key = g.toLowerCase()
      gratitudeCounts[key] = (gratitudeCounts[key] ?? 0) + 1
    })
    const commonGratitudes = Object.entries(gratitudeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([g]) => g)

    // Calculate streak
    let streakDays = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const hasCheckIn = this.history.some(r => {
        const recordDate = new Date(r.date)
        recordDate.setHours(0, 0, 0, 0)
        return recordDate.getTime() === checkDate.getTime()
      })
      if (hasCheckIn) {
        streakDays++
      } else if (i > 0) {
        break
      }
    }

    // Generate suggestions
    const suggestions: string[] = []
    if (averageMood < 3) {
      suggestions.push('Consider a gratitude practice to boost mood')
    }
    if (averageEnergy < 3) {
      suggestions.push('Focus on sleep quality and hydration')
    }
    if (moodTrend === 'declining') {
      suggestions.push('Your mood has been trending down. Consider talking to someone you trust.')
    }
    if (streakDays >= 7) {
      suggestions.push(`Great job! You\'ve checked in ${streakDays} days in a row!`)
    }

    return {
      averageMood,
      averageEnergy,
      moodTrend,
      commonGratitudes,
      streakDays,
      bestTimeOfDay: 'morning',  // Could calculate from data
      suggestions
    }
  }

  /**
   * Get state
   */
  getState(): CheckInState {
    return { ...this.state }
  }

  /**
   * Get available flows
   */
  getFlows(): CheckInFlow[] {
    return Object.values(CHECK_IN_FLOWS)
  }

  // ============ Private Methods ============

  private completeCheckIn(): void {
    if (!this.state.currentFlow || !this.state.startTime) return

    const flow = CHECK_IN_FLOWS[this.state.currentFlow]
    const duration = Math.round((Date.now() - this.state.startTime.getTime()) / 1000)

    // Extract specific values from responses
    const moodResponse = this.state.responses.find(r =>
      r.questionId.includes('mood')
    )
    const energyResponse = this.state.responses.find(r =>
      r.questionId.includes('energy')
    )
    const sleepResponse = this.state.responses.find(r =>
      r.questionId.includes('sleep')
    )
    const gratitudeResponses = this.state.responses.filter(r =>
      r.questionId.includes('gratitude')
    )
    const intentionResponses = this.state.responses.filter(r =>
      r.questionId.includes('intention')
    )

    const record: CheckInRecord = {
      id: `checkin_${Date.now()}`,
      type: this.state.currentFlow,
      date: new Date(),
      responses: [...this.state.responses],
      overallMood: moodResponse?.value as MoodLevel,
      energyLevel: energyResponse?.value as EnergyLevel,
      sleepQuality: sleepResponse?.value as SleepQuality,
      gratitudes: gratitudeResponses.map(r => String(r.value)),
      intentions: intentionResponses.map(r => String(r.value)),
      duration
    }

    this.history.push(record)
    this.saveHistory()

    if (this.config.onComplete) {
      this.config.onComplete(record)
    }

    // Generate insight
    const insights = this.getInsights(7)
    if (this.config.onInsight && insights.suggestions.length > 0) {
      this.config.onInsight(insights.suggestions[0])
    }

    // Reset state
    this.state = {
      isActive: false,
      currentFlow: null,
      currentQuestionIndex: 0,
      responses: [],
      startTime: null
    }
  }

  private loadHistory(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        this.history = parsed.map((r: CheckInRecord) => ({
          ...r,
          date: new Date(r.date)
        }))
      }
    } catch (error) {
      console.error('DailyCheckInEngine: Failed to load history', error)
    }
  }

  private saveHistory(): void {
    if (typeof window === 'undefined') return

    try {
      // Keep last 90 days
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 90)
      this.history = this.history.filter(r => r.date >= cutoff)

      localStorage.setItem(this.storageKey, JSON.stringify(this.history))
    } catch (error) {
      console.error('DailyCheckInEngine: Failed to save history', error)
    }
  }
}

// ============ Factory & Singleton ============

let checkInInstance: DailyCheckInEngine | null = null

export function getDailyCheckInEngine(): DailyCheckInEngine {
  if (!checkInInstance) {
    checkInInstance = new DailyCheckInEngine()
  }
  return checkInInstance
}

export function createDailyCheckInEngine(
  options?: CheckInConfig
): DailyCheckInEngine {
  return new DailyCheckInEngine(options)
}

export const dailyCheckInEngine = getDailyCheckInEngine()
