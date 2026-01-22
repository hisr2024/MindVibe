/**
 * Sleep Induction Engine - Gradual Sleep Guidance System
 *
 * Practical voice-guided sleep assistance for KIAAN:
 * - Progressive volume reduction (voice fades as user falls asleep)
 * - Sleep-optimized content (calming stories, body scans, gratitude)
 * - Automatic shutoff with motion detection awareness
 * - Sleep tracking integration
 * - Wake-up gentle alarm with gradual volume increase
 *
 * Practical Use Cases:
 * - "KIAAN, help me sleep" - Starts sleep session
 * - "Wake me at 6am" - Sets gentle alarm
 * - Automatic pause when user falls asleep (detected via silence)
 * - Morning mood check-in
 */

// ============ Types & Interfaces ============

/**
 * Sleep session type
 */
export type SleepSessionType =
  | 'sleep_story'        // Calming bedtime story
  | 'body_scan'          // Progressive relaxation
  | 'gratitude'          // Gratitude reflection
  | 'breath_count'       // Counting breaths
  | 'visualization'      // Peaceful scene visualization
  | 'mantra'             // Repeated calming phrase
  | 'rain_sounds'        // Just ambient sounds
  | 'custom'

/**
 * Sleep phase
 */
export type SleepPhase =
  | 'preparing'          // Getting ready
  | 'relaxation'         // Initial relaxation
  | 'deepening'          // Going deeper
  | 'maintenance'        // Maintaining sleep state
  | 'fading'             // Voice fading out
  | 'silent'             // Complete silence
  | 'waking'             // Gentle wake-up

/**
 * Sleep session configuration
 */
export interface SleepSessionConfig {
  type: SleepSessionType
  duration?: number               // Target duration in minutes (default 30)
  fadeStartMinutes?: number       // When to start fading (default 15)
  fadeDurationMinutes?: number    // How long to fade (default 10)
  includeAmbientSounds?: boolean  // Add rain/nature sounds
  wakeTime?: Date                 // Optional wake alarm
  gentleWakeDuration?: number     // Wake-up fade-in duration (minutes)
  voiceSpeed?: number             // 0.8-1.2 (slower is calmer)
  voicePitch?: number             // 0.8-1.0 (lower is calmer)
}

/**
 * Sleep content item
 */
export interface SleepContent {
  id: string
  type: SleepSessionType
  title: string
  description: string
  durationMinutes: number
  narrationSegments: SleepNarration[]
  ambientSound?: string
}

/**
 * Narration segment for sleep
 */
export interface SleepNarration {
  text: string
  pauseAfterSeconds: number    // Pause duration after speaking
  volumeLevel: number          // 0-1, relative to current fade level
  breathCue?: boolean          // Include breath timing
}

/**
 * Engine state
 */
export interface SleepInductionState {
  isActive: boolean
  phase: SleepPhase
  currentContent: string | null
  elapsedMinutes: number
  volumeLevel: number          // Current volume (0-1)
  wakeAlarmSet: boolean
  wakeTime: Date | null
  estimatedSleepTime: Date | null
  userAsleep: boolean          // Detected via inactivity
}

/**
 * Engine configuration
 */
export interface SleepInductionConfig {
  defaultDuration?: number
  defaultFadeStart?: number
  silenceThresholdSeconds?: number  // Seconds of silence to detect sleep
  onPhaseChange?: (phase: SleepPhase) => void
  onSleepDetected?: () => void
  onWakeAlarm?: () => void
  onNarration?: (text: string) => void
  onStateChange?: (state: SleepInductionState) => void
}

// ============ Sleep Content Library ============

/**
 * Built-in sleep content
 */
export const SLEEP_CONTENT: SleepContent[] = [
  {
    id: 'peaceful_meadow',
    type: 'visualization',
    title: 'Peaceful Meadow',
    description: 'A gentle journey through a tranquil meadow',
    durationMinutes: 20,
    ambientSound: 'wind_gentle',
    narrationSegments: [
      { text: "Find a comfortable position and let your body begin to relax.", pauseAfterSeconds: 5, volumeLevel: 1 },
      { text: "Take a slow, deep breath in... and let it out gently.", pauseAfterSeconds: 8, volumeLevel: 1, breathCue: true },
      { text: "Imagine yourself standing at the edge of a beautiful meadow.", pauseAfterSeconds: 6, volumeLevel: 0.95 },
      { text: "The sun is setting, painting the sky in soft oranges and pinks.", pauseAfterSeconds: 7, volumeLevel: 0.9 },
      { text: "A gentle breeze carries the sweet scent of wildflowers.", pauseAfterSeconds: 8, volumeLevel: 0.85 },
      { text: "You begin walking slowly through the tall grass.", pauseAfterSeconds: 6, volumeLevel: 0.8 },
      { text: "Each step feels lighter... more peaceful.", pauseAfterSeconds: 8, volumeLevel: 0.75 },
      { text: "The grass brushes softly against your hands.", pauseAfterSeconds: 7, volumeLevel: 0.7 },
      { text: "In the distance, you see a comfortable place to rest.", pauseAfterSeconds: 8, volumeLevel: 0.65 },
      { text: "A soft blanket laid out under a gentle tree.", pauseAfterSeconds: 9, volumeLevel: 0.6 },
      { text: "You lie down, feeling completely safe and at peace.", pauseAfterSeconds: 10, volumeLevel: 0.55 },
      { text: "The stars begin to appear, one by one.", pauseAfterSeconds: 12, volumeLevel: 0.5 },
      { text: "Each star carries away a worry... a thought... a tension.", pauseAfterSeconds: 15, volumeLevel: 0.4 },
      { text: "You are completely relaxed now.", pauseAfterSeconds: 20, volumeLevel: 0.3 },
      { text: "Safe... peaceful... drifting...", pauseAfterSeconds: 30, volumeLevel: 0.2 },
      { text: "Sleep comes easily now...", pauseAfterSeconds: 60, volumeLevel: 0.1 }
    ]
  },
  {
    id: 'body_scan_sleep',
    type: 'body_scan',
    title: 'Sleep Body Scan',
    description: 'Progressive relaxation from head to toe',
    durationMinutes: 25,
    narrationSegments: [
      { text: "Let's begin by bringing awareness to your body.", pauseAfterSeconds: 5, volumeLevel: 1 },
      { text: "Take a deep breath in... and release.", pauseAfterSeconds: 6, volumeLevel: 1, breathCue: true },
      { text: "Focus on the top of your head. Feel any tension there... and let it melt away.", pauseAfterSeconds: 8, volumeLevel: 0.95 },
      { text: "Your forehead softens... your eyebrows relax.", pauseAfterSeconds: 7, volumeLevel: 0.9 },
      { text: "Feel your eyes becoming heavy... resting in their sockets.", pauseAfterSeconds: 8, volumeLevel: 0.85 },
      { text: "Your jaw unclenches... your tongue rests gently.", pauseAfterSeconds: 7, volumeLevel: 0.8 },
      { text: "Warmth flows down through your neck... releasing all tension.", pauseAfterSeconds: 8, volumeLevel: 0.75 },
      { text: "Your shoulders drop... heavy and relaxed.", pauseAfterSeconds: 9, volumeLevel: 0.7 },
      { text: "This relaxation flows down your arms... to your fingertips.", pauseAfterSeconds: 10, volumeLevel: 0.65 },
      { text: "Your chest rises and falls... effortlessly.", pauseAfterSeconds: 8, volumeLevel: 0.6 },
      { text: "Your stomach softens... your lower back releases.", pauseAfterSeconds: 9, volumeLevel: 0.55 },
      { text: "Warmth spreads through your hips... your thighs.", pauseAfterSeconds: 10, volumeLevel: 0.5 },
      { text: "Your knees relax... your calves grow heavy.", pauseAfterSeconds: 10, volumeLevel: 0.45 },
      { text: "Your feet feel warm and peaceful.", pauseAfterSeconds: 12, volumeLevel: 0.4 },
      { text: "Your entire body is now deeply relaxed.", pauseAfterSeconds: 15, volumeLevel: 0.3 },
      { text: "Rest now... peaceful and calm.", pauseAfterSeconds: 30, volumeLevel: 0.2 },
      { text: "Sleep...", pauseAfterSeconds: 60, volumeLevel: 0.1 }
    ]
  },
  {
    id: 'gratitude_sleep',
    type: 'gratitude',
    title: 'Gratitude for Sleep',
    description: 'Reflect on the day with gratitude',
    durationMinutes: 15,
    narrationSegments: [
      { text: "As you settle in for the night, let's take a moment for gratitude.", pauseAfterSeconds: 5, volumeLevel: 1 },
      { text: "Think of one small thing from today that brought you comfort.", pauseAfterSeconds: 10, volumeLevel: 0.9 },
      { text: "Perhaps a warm cup of tea... a kind word... a moment of peace.", pauseAfterSeconds: 12, volumeLevel: 0.85 },
      { text: "Let that feeling of gratitude warm your heart.", pauseAfterSeconds: 8, volumeLevel: 0.8 },
      { text: "Think of someone who cares about you.", pauseAfterSeconds: 10, volumeLevel: 0.75 },
      { text: "Feel their presence... their love surrounding you.", pauseAfterSeconds: 12, volumeLevel: 0.7 },
      { text: "You are worthy of rest... of peace... of sleep.", pauseAfterSeconds: 10, volumeLevel: 0.6 },
      { text: "Tomorrow is a new day... full of possibilities.", pauseAfterSeconds: 12, volumeLevel: 0.5 },
      { text: "For now, simply rest.", pauseAfterSeconds: 15, volumeLevel: 0.4 },
      { text: "Grateful... peaceful... sleepy...", pauseAfterSeconds: 30, volumeLevel: 0.25 },
      { text: "Good night...", pauseAfterSeconds: 60, volumeLevel: 0.1 }
    ]
  },
  {
    id: 'breath_counting',
    type: 'breath_count',
    title: 'Breath Counting',
    description: 'Simple breath counting to quiet the mind',
    durationMinutes: 15,
    narrationSegments: [
      { text: "We'll count our breaths together, letting each one carry us deeper into relaxation.", pauseAfterSeconds: 5, volumeLevel: 1 },
      { text: "Breathe in slowly... and out. That's one.", pauseAfterSeconds: 8, volumeLevel: 0.95, breathCue: true },
      { text: "In... and out. Two.", pauseAfterSeconds: 8, volumeLevel: 0.9, breathCue: true },
      { text: "In... and out. Three.", pauseAfterSeconds: 8, volumeLevel: 0.85, breathCue: true },
      { text: "In... and out. Four.", pauseAfterSeconds: 9, volumeLevel: 0.8, breathCue: true },
      { text: "In... and out. Five.", pauseAfterSeconds: 9, volumeLevel: 0.75, breathCue: true },
      { text: "Continue breathing... six.", pauseAfterSeconds: 10, volumeLevel: 0.7, breathCue: true },
      { text: "Seven...", pauseAfterSeconds: 10, volumeLevel: 0.6, breathCue: true },
      { text: "Eight...", pauseAfterSeconds: 12, volumeLevel: 0.5, breathCue: true },
      { text: "Nine...", pauseAfterSeconds: 14, volumeLevel: 0.4, breathCue: true },
      { text: "Ten...", pauseAfterSeconds: 20, volumeLevel: 0.3, breathCue: true },
      { text: "Keep breathing gently... drift away...", pauseAfterSeconds: 30, volumeLevel: 0.2 },
      { text: "Sleep...", pauseAfterSeconds: 60, volumeLevel: 0.1 }
    ]
  }
]

/**
 * Wake-up content
 */
export const WAKE_UP_NARRATIONS: SleepNarration[] = [
  { text: "Good morning...", pauseAfterSeconds: 10, volumeLevel: 0.2 },
  { text: "It's time to gently begin waking up.", pauseAfterSeconds: 8, volumeLevel: 0.3 },
  { text: "Take a slow, deep breath.", pauseAfterSeconds: 6, volumeLevel: 0.4, breathCue: true },
  { text: "Wiggle your fingers and toes.", pauseAfterSeconds: 5, volumeLevel: 0.5 },
  { text: "Stretch your body gently.", pauseAfterSeconds: 8, volumeLevel: 0.6 },
  { text: "When you're ready, slowly open your eyes.", pauseAfterSeconds: 10, volumeLevel: 0.7 },
  { text: "Welcome to a new day.", pauseAfterSeconds: 5, volumeLevel: 0.8 }
]

// ============ Engine Class ============

/**
 * Sleep Induction Engine
 *
 * Provides practical sleep assistance with gradual voice fading.
 */
export class SleepInductionEngine {
  private state: SleepInductionState = {
    isActive: false,
    phase: 'preparing',
    currentContent: null,
    elapsedMinutes: 0,
    volumeLevel: 1,
    wakeAlarmSet: false,
    wakeTime: null,
    estimatedSleepTime: null,
    userAsleep: false
  }

  private config: SleepInductionConfig = {
    defaultDuration: 30,
    defaultFadeStart: 15,
    silenceThresholdSeconds: 120  // 2 minutes of no interaction = asleep
  }

  private sessionConfig: SleepSessionConfig | null = null
  private currentSegmentIndex: number = 0
  private sessionTimer: ReturnType<typeof setInterval> | null = null
  private narrationTimer: ReturnType<typeof setTimeout> | null = null
  private wakeTimer: ReturnType<typeof setTimeout> | null = null
  private lastInteractionTime: number = Date.now()

  constructor(options?: SleepInductionConfig) {
    if (options) {
      this.config = { ...this.config, ...options }
    }
  }

  /**
   * Start a sleep session
   */
  async startSession(contentId: string, config?: Partial<SleepSessionConfig>): Promise<void> {
    const content = SLEEP_CONTENT.find(c => c.id === contentId)
    if (!content) {
      console.warn(`SleepInductionEngine: Content '${contentId}' not found`)
      return
    }

    // Stop any existing session
    await this.stopSession()

    this.sessionConfig = {
      type: content.type,
      duration: config?.duration ?? this.config.defaultDuration,
      fadeStartMinutes: config?.fadeStartMinutes ?? this.config.defaultFadeStart,
      fadeDurationMinutes: config?.fadeDurationMinutes ?? 10,
      includeAmbientSounds: config?.includeAmbientSounds ?? true,
      wakeTime: config?.wakeTime,
      gentleWakeDuration: config?.gentleWakeDuration ?? 5,
      voiceSpeed: config?.voiceSpeed ?? 0.9,
      voicePitch: config?.voicePitch ?? 0.9
    }

    this.state = {
      isActive: true,
      phase: 'preparing',
      currentContent: contentId,
      elapsedMinutes: 0,
      volumeLevel: 1,
      wakeAlarmSet: !!config?.wakeTime,
      wakeTime: config?.wakeTime ?? null,
      estimatedSleepTime: null,
      userAsleep: false
    }

    this.currentSegmentIndex = 0
    this.lastInteractionTime = Date.now()

    // Set wake alarm if specified
    if (config?.wakeTime) {
      this.setWakeAlarm(config.wakeTime)
    }

    // Start session timer (updates every minute)
    this.sessionTimer = setInterval(() => this.updateSession(), 60000)

    // Start narration
    this.transitionToPhase('relaxation')
    this.playNextNarration(content)

    this.emitState()
  }

  /**
   * Quick start with recommended content
   */
  async quickStart(type?: SleepSessionType): Promise<void> {
    const contentType = type ?? 'visualization'
    const content = SLEEP_CONTENT.find(c => c.type === contentType)
    if (content) {
      await this.startSession(content.id)
    }
  }

  /**
   * Stop current session
   */
  async stopSession(): Promise<void> {
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer)
      this.sessionTimer = null
    }
    if (this.narrationTimer) {
      clearTimeout(this.narrationTimer)
      this.narrationTimer = null
    }
    if (this.wakeTimer) {
      clearTimeout(this.wakeTimer)
      this.wakeTimer = null
    }

    this.state.isActive = false
    this.state.phase = 'preparing'
    this.sessionConfig = null
    this.emitState()
  }

  /**
   * Set wake alarm
   */
  setWakeAlarm(wakeTime: Date): void {
    if (this.wakeTimer) {
      clearTimeout(this.wakeTimer)
    }

    const now = new Date()
    const msUntilWake = wakeTime.getTime() - now.getTime()

    if (msUntilWake <= 0) {
      console.warn('SleepInductionEngine: Wake time is in the past')
      return
    }

    this.state.wakeAlarmSet = true
    this.state.wakeTime = wakeTime

    // Start gentle wake slightly before target time
    const gentleStartMs = msUntilWake - ((this.sessionConfig?.gentleWakeDuration ?? 5) * 60000)

    this.wakeTimer = setTimeout(() => {
      this.startWakeUp()
    }, Math.max(0, gentleStartMs))

    this.emitState()
  }

  /**
   * Cancel wake alarm
   */
  cancelWakeAlarm(): void {
    if (this.wakeTimer) {
      clearTimeout(this.wakeTimer)
      this.wakeTimer = null
    }
    this.state.wakeAlarmSet = false
    this.state.wakeTime = null
    this.emitState()
  }

  /**
   * Record user interaction (resets sleep detection)
   */
  recordInteraction(): void {
    this.lastInteractionTime = Date.now()
    this.state.userAsleep = false
  }

  /**
   * Get available content
   */
  getContent(): SleepContent[] {
    return [...SLEEP_CONTENT]
  }

  /**
   * Get content by type
   */
  getContentByType(type: SleepSessionType): SleepContent[] {
    return SLEEP_CONTENT.filter(c => c.type === type)
  }

  /**
   * Get current state
   */
  getState(): SleepInductionState {
    return { ...this.state }
  }

  /**
   * Dispose
   */
  dispose(): void {
    this.stopSession()
  }

  // ============ Private Methods ============

  private transitionToPhase(phase: SleepPhase): void {
    this.state.phase = phase

    if (this.config.onPhaseChange) {
      this.config.onPhaseChange(phase)
    }

    this.emitState()
  }

  private updateSession(): void {
    if (!this.state.isActive || !this.sessionConfig) return

    this.state.elapsedMinutes++

    // Check for sleep detection
    const secondsSinceInteraction = (Date.now() - this.lastInteractionTime) / 1000
    if (secondsSinceInteraction > (this.config.silenceThresholdSeconds ?? 120)) {
      if (!this.state.userAsleep) {
        this.state.userAsleep = true
        this.state.estimatedSleepTime = new Date(
          this.lastInteractionTime + (this.config.silenceThresholdSeconds ?? 120) * 1000
        )

        if (this.config.onSleepDetected) {
          this.config.onSleepDetected()
        }
      }
    }

    // Update volume based on fade schedule
    const fadeStart = this.sessionConfig.fadeStartMinutes ?? 15
    const fadeDuration = this.sessionConfig.fadeDurationMinutes ?? 10

    if (this.state.elapsedMinutes >= fadeStart) {
      const fadeElapsed = this.state.elapsedMinutes - fadeStart
      const fadeProgress = Math.min(1, fadeElapsed / fadeDuration)
      this.state.volumeLevel = Math.max(0, 1 - fadeProgress)

      if (this.state.volumeLevel === 0 && this.state.phase !== 'silent') {
        this.transitionToPhase('silent')
      } else if (this.state.phase !== 'fading' && this.state.phase !== 'silent') {
        this.transitionToPhase('fading')
      }
    }

    this.emitState()
  }

  private playNextNarration(content: SleepContent): void {
    if (!this.state.isActive) return

    if (this.currentSegmentIndex >= content.narrationSegments.length) {
      // All segments complete, transition to silent
      this.transitionToPhase('silent')
      return
    }

    const segment = content.narrationSegments[this.currentSegmentIndex]
    const adjustedVolume = segment.volumeLevel * this.state.volumeLevel

    // Only speak if volume is above threshold
    if (adjustedVolume > 0.05) {
      if (this.config.onNarration) {
        this.config.onNarration(segment.text)
      }
    }

    // Schedule next segment
    this.narrationTimer = setTimeout(() => {
      this.currentSegmentIndex++
      this.playNextNarration(content)
    }, segment.pauseAfterSeconds * 1000)
  }

  private startWakeUp(): void {
    this.transitionToPhase('waking')
    this.state.volumeLevel = 0

    // Gradually increase volume and play wake-up narrations
    let wakeIndex = 0
    const playWakeNarration = () => {
      if (wakeIndex >= WAKE_UP_NARRATIONS.length) {
        // Wake complete
        if (this.config.onWakeAlarm) {
          this.config.onWakeAlarm()
        }
        return
      }

      const segment = WAKE_UP_NARRATIONS[wakeIndex]
      this.state.volumeLevel = segment.volumeLevel

      if (this.config.onNarration) {
        this.config.onNarration(segment.text)
      }

      this.narrationTimer = setTimeout(() => {
        wakeIndex++
        playWakeNarration()
      }, segment.pauseAfterSeconds * 1000)
    }

    playWakeNarration()
    this.emitState()
  }

  private emitState(): void {
    if (this.config.onStateChange) {
      this.config.onStateChange({ ...this.state })
    }
  }
}

// ============ Factory & Singleton ============

let sleepInductionInstance: SleepInductionEngine | null = null

export function getSleepInductionEngine(): SleepInductionEngine {
  if (!sleepInductionInstance) {
    sleepInductionInstance = new SleepInductionEngine()
  }
  return sleepInductionInstance
}

export function createSleepInductionEngine(
  options?: SleepInductionConfig
): SleepInductionEngine {
  return new SleepInductionEngine(options)
}

export const sleepInductionEngine = getSleepInductionEngine()
