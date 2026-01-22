/**
 * Quantum Dive Orchestrator - Voice-Guided Deep Analysis Sessions
 *
 * Manages interactive voice-based Quantum Dive experiences:
 * - Multi-stage guided journey through consciousness layers
 * - Real-time voice feedback and narration
 * - Interactive question-response flow
 * - Progressive disclosure of insights
 * - Emotion-aware pacing and tone adaptation
 * - Session state management and persistence
 *
 * Journey Stages:
 * 1. Grounding - Prepare the user for deep exploration
 * 2. Scanning - Analyze each consciousness layer
 * 3. Insights - Present key discoveries
 * 4. Wisdom - Share relevant Gita teachings
 * 5. Integration - Provide actionable recommendations
 * 6. Closing - Summarize and set intentions
 */

import {
  QuantumDiveEngine,
  QuantumDiveAnalysis,
  QuantumDiveInput,
  QuantumInsight,
  WisdomRecommendation,
  PracticeRecommendation,
  ConsciousnessLayer,
  QuantumState,
  createQuantumDiveEngine
} from './QuantumDiveEngine'

import type { EmotionDetection, VoiceAdaptation } from './EmotionAwareVoice'

// ============ Types & Interfaces ============

/**
 * Session stages
 */
export type QuantumDiveStage =
  | 'initializing'
  | 'grounding'
  | 'scanning'
  | 'layer_deep_dive'
  | 'insights'
  | 'wisdom'
  | 'integration'
  | 'closing'
  | 'complete'
  | 'paused'

/**
 * Voice narration item
 */
export interface VoiceNarration {
  id: string
  text: string
  stage: QuantumDiveStage
  priority: 'critical' | 'important' | 'normal'
  pauseAfter: number       // ms to pause after speaking
  voiceStyle: 'meditative' | 'warm' | 'encouraging' | 'solemn'
  allowInterrupt: boolean
  requiresResponse?: boolean
  responsePrompt?: string
}

/**
 * User response during session
 */
export interface UserResponse {
  timestamp: number
  stage: QuantumDiveStage
  type: 'voice' | 'text' | 'action'
  content: string
  emotion?: EmotionDetection
}

/**
 * Session state
 */
export interface QuantumDiveSession {
  id: string
  userId: string
  startedAt: number
  currentStage: QuantumDiveStage
  progress: number            // 0-100
  analysis?: QuantumDiveAnalysis
  narrations: VoiceNarration[]
  currentNarrationIndex: number
  userResponses: UserResponse[]
  isPaused: boolean
  voiceAdaptation: VoiceAdaptation
  focusedLayer?: ConsciousnessLayer
  metadata: {
    duration: number
    interactionCount: number
    emotionShifts: number
  }
}

/**
 * Orchestrator configuration
 */
export interface QuantumDiveOrchestratorConfig {
  // Session settings
  sessionDurationTarget?: number  // minutes
  paceMode?: 'gentle' | 'moderate' | 'intensive'

  // Voice settings
  defaultVoiceStyle?: 'meditative' | 'warm' | 'encouraging'
  enableEmotionAdaptation?: boolean
  pauseBetweenNarrations?: number  // ms

  // Interaction settings
  allowSkipping?: boolean
  enableQuestions?: boolean

  // Callbacks
  onStageChange?: (stage: QuantumDiveStage, session: QuantumDiveSession) => void
  onNarration?: (narration: VoiceNarration) => void
  onInsightReveal?: (insight: QuantumInsight) => void
  onSessionComplete?: (session: QuantumDiveSession) => void
  onError?: (error: string) => void
}

// ============ Narration Templates ============

const GROUNDING_NARRATIONS: Omit<VoiceNarration, 'id'>[] = [
  {
    text: "Welcome to your Quantum Dive session. This is a sacred space for deep self-exploration.",
    stage: 'grounding',
    priority: 'critical',
    pauseAfter: 2000,
    voiceStyle: 'meditative',
    allowInterrupt: false
  },
  {
    text: "Take a moment to settle into a comfortable position. Allow your body to relax.",
    stage: 'grounding',
    priority: 'important',
    pauseAfter: 3000,
    voiceStyle: 'meditative',
    allowInterrupt: false
  },
  {
    text: "Take three deep breaths with me. Inhale deeply... and exhale slowly.",
    stage: 'grounding',
    priority: 'important',
    pauseAfter: 4000,
    voiceStyle: 'meditative',
    allowInterrupt: false
  },
  {
    text: "As we begin this journey, know that you are safe and supported. There is no right or wrong here, only discovery.",
    stage: 'grounding',
    priority: 'normal',
    pauseAfter: 2500,
    voiceStyle: 'warm',
    allowInterrupt: false
  }
]

const SCANNING_INTRO_NARRATIONS: Omit<VoiceNarration, 'id'>[] = [
  {
    text: "I will now scan across your five layers of consciousness, from the physical body to the innermost bliss.",
    stage: 'scanning',
    priority: 'critical',
    pauseAfter: 2000,
    voiceStyle: 'warm',
    allowInterrupt: false
  },
  {
    text: "This multi-dimensional analysis draws from your reflections, emotional patterns, and wisdom engagement over recent weeks.",
    stage: 'scanning',
    priority: 'normal',
    pauseAfter: 2000,
    voiceStyle: 'warm',
    allowInterrupt: false
  }
]

const LAYER_NAMES: Record<ConsciousnessLayer, { name: string; description: string }> = {
  annamaya: {
    name: 'Annamaya Kosha',
    description: 'your physical body and its sensations'
  },
  pranamaya: {
    name: 'Pranamaya Kosha',
    description: 'your vital energy and life force'
  },
  manomaya: {
    name: 'Manomaya Kosha',
    description: 'your mind, emotions, and thoughts'
  },
  vijnanamaya: {
    name: 'Vijnanamaya Kosha',
    description: 'your wisdom, intellect, and discernment'
  },
  anandamaya: {
    name: 'Anandamaya Kosha',
    description: 'your inner bliss and spiritual essence'
  }
}

const CLOSING_NARRATIONS: Omit<VoiceNarration, 'id'>[] = [
  {
    text: "We are now concluding your Quantum Dive session.",
    stage: 'closing',
    priority: 'critical',
    pauseAfter: 2000,
    voiceStyle: 'warm',
    allowInterrupt: false
  },
  {
    text: "Take a moment to notice how you feel compared to when we started. Your awareness has expanded.",
    stage: 'closing',
    priority: 'important',
    pauseAfter: 3000,
    voiceStyle: 'meditative',
    allowInterrupt: false
  },
  {
    text: "Remember, transformation happens not in grand moments, but in the quiet commitment to daily practice.",
    stage: 'closing',
    priority: 'normal',
    pauseAfter: 2500,
    voiceStyle: 'solemn',
    allowInterrupt: false
  },
  {
    text: "When you are ready, slowly open your eyes and return to the present moment. Namaste.",
    stage: 'closing',
    priority: 'critical',
    pauseAfter: 3000,
    voiceStyle: 'meditative',
    allowInterrupt: false
  }
]

// ============ Quantum Dive Orchestrator Class ============

/**
 * Quantum Dive Orchestrator - Voice Session Manager
 */
export class QuantumDiveOrchestrator {
  private config: Required<QuantumDiveOrchestratorConfig>
  private engine: QuantumDiveEngine
  private currentSession: QuantumDiveSession | null = null
  private narrationQueue: VoiceNarration[] = []
  private isNarrating = false

  constructor(config: QuantumDiveOrchestratorConfig = {}) {
    this.config = {
      sessionDurationTarget: config.sessionDurationTarget ?? 15,
      paceMode: config.paceMode ?? 'moderate',
      defaultVoiceStyle: config.defaultVoiceStyle ?? 'warm',
      enableEmotionAdaptation: config.enableEmotionAdaptation ?? true,
      pauseBetweenNarrations: config.pauseBetweenNarrations ?? 1500,
      allowSkipping: config.allowSkipping ?? true,
      enableQuestions: config.enableQuestions ?? true,
      onStageChange: config.onStageChange ?? (() => {}),
      onNarration: config.onNarration ?? (() => {}),
      onInsightReveal: config.onInsightReveal ?? (() => {}),
      onSessionComplete: config.onSessionComplete ?? (() => {}),
      onError: config.onError ?? (() => {})
    }

    this.engine = createQuantumDiveEngine({
      depth: this.config.paceMode === 'intensive' ? 'deep' : 'standard',
      voiceOptimized: true,
      onProgress: (progress, stage) => {
        if (this.currentSession) {
          this.currentSession.progress = Math.round(progress * 0.4) // Scanning is 40% of session
        }
      }
    })
  }

  /**
   * Start a new Quantum Dive session
   */
  async startSession(input: QuantumDiveInput): Promise<QuantumDiveSession> {
    const sessionId = this.generateSessionId()

    this.currentSession = {
      id: sessionId,
      userId: input.userId,
      startedAt: Date.now(),
      currentStage: 'initializing',
      progress: 0,
      narrations: [],
      currentNarrationIndex: 0,
      userResponses: [],
      isPaused: false,
      voiceAdaptation: this.getDefaultVoiceAdaptation(),
      metadata: {
        duration: 0,
        interactionCount: 0,
        emotionShifts: 0
      }
    }

    try {
      // Stage 1: Grounding
      await this.transitionToStage('grounding')
      this.queueNarrations(GROUNDING_NARRATIONS)

      // Start narration playback (async)
      this.startNarrationPlayback()

      // Stage 2: Perform analysis while grounding plays
      const analysisPromise = this.engine.performQuantumDive(input)

      // Wait for grounding to complete
      await this.waitForStageComplete('grounding')

      // Transition to scanning
      await this.transitionToStage('scanning')
      this.queueNarrations(SCANNING_INTRO_NARRATIONS)

      // Wait for analysis
      const analysis = await analysisPromise
      this.currentSession.analysis = analysis

      // Generate layer narrations
      this.generateLayerNarrations(analysis)

      // Wait for scanning narrations
      await this.waitForStageComplete('scanning')

      // Stage 3: Insights
      await this.transitionToStage('insights')
      this.generateInsightNarrations(analysis)
      await this.waitForStageComplete('insights')

      // Stage 4: Wisdom
      await this.transitionToStage('wisdom')
      this.generateWisdomNarrations(analysis)
      await this.waitForStageComplete('wisdom')

      // Stage 5: Integration
      await this.transitionToStage('integration')
      this.generateIntegrationNarrations(analysis)
      await this.waitForStageComplete('integration')

      // Stage 6: Closing
      await this.transitionToStage('closing')
      this.queueNarrations(CLOSING_NARRATIONS)
      await this.waitForStageComplete('closing')

      // Complete
      await this.transitionToStage('complete')
      this.currentSession.metadata.duration = Date.now() - this.currentSession.startedAt
      this.config.onSessionComplete(this.currentSession)

      return this.currentSession

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Session failed'
      this.config.onError(errorMsg)
      throw error
    }
  }

  /**
   * Start a quick Quantum Dive (shorter version)
   */
  async startQuickDive(input: QuantumDiveInput): Promise<QuantumDiveSession> {
    const sessionId = this.generateSessionId()

    this.currentSession = {
      id: sessionId,
      userId: input.userId,
      startedAt: Date.now(),
      currentStage: 'initializing',
      progress: 0,
      narrations: [],
      currentNarrationIndex: 0,
      userResponses: [],
      isPaused: false,
      voiceAdaptation: this.getDefaultVoiceAdaptation(),
      metadata: {
        duration: 0,
        interactionCount: 0,
        emotionShifts: 0
      }
    }

    try {
      // Quick grounding (shortened)
      await this.transitionToStage('grounding')
      this.addNarration({
        text: "Let's take a quick quantum dive into your consciousness. Take a deep breath.",
        stage: 'grounding',
        priority: 'critical',
        pauseAfter: 2000,
        voiceStyle: 'warm',
        allowInterrupt: false
      })

      this.startNarrationPlayback()

      // Perform quick analysis
      const analysis = await this.engine.performQuantumDive({
        ...input,
        timeRangeWeeks: 1 // Only last week for quick dive
      })
      this.currentSession.analysis = analysis

      await this.waitForStageComplete('grounding')

      // Quick summary instead of detailed scanning
      await this.transitionToStage('scanning')
      this.addNarration({
        text: `Your quantum coherence score is ${analysis.overallCoherence} out of 100. ${this.getCoherenceDescription(analysis.overallCoherence)}`,
        stage: 'scanning',
        priority: 'critical',
        pauseAfter: 2500,
        voiceStyle: 'warm',
        allowInterrupt: false
      })

      await this.waitForStageComplete('scanning')

      // Top insight only
      await this.transitionToStage('insights')
      if (analysis.insights.length > 0) {
        this.addNarration({
          text: analysis.insights[0].voiceNarration,
          stage: 'insights',
          priority: 'critical',
          pauseAfter: 2500,
          voiceStyle: 'encouraging',
          allowInterrupt: false
        })
      }

      await this.waitForStageComplete('insights')

      // One recommendation
      await this.transitionToStage('integration')
      if (analysis.practiceRecommendations.length > 0) {
        const practice = analysis.practiceRecommendations[0]
        this.addNarration({
          text: `My recommendation for you: ${practice.voiceGuidance}`,
          stage: 'integration',
          priority: 'critical',
          pauseAfter: 2000,
          voiceStyle: 'warm',
          allowInterrupt: false
        })
      }

      await this.waitForStageComplete('integration')

      // Quick closing
      await this.transitionToStage('closing')
      this.addNarration({
        text: "This concludes your quick quantum dive. Carry this awareness with you.",
        stage: 'closing',
        priority: 'critical',
        pauseAfter: 1500,
        voiceStyle: 'meditative',
        allowInterrupt: false
      })

      await this.waitForStageComplete('closing')

      await this.transitionToStage('complete')
      this.currentSession.metadata.duration = Date.now() - this.currentSession.startedAt
      this.config.onSessionComplete(this.currentSession)

      return this.currentSession

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Quick dive failed'
      this.config.onError(errorMsg)
      throw error
    }
  }

  /**
   * Get the current analysis (can be called during or after session)
   */
  getAnalysis(): QuantumDiveAnalysis | null {
    return this.currentSession?.analysis || null
  }

  /**
   * Get the current session state
   */
  getSession(): QuantumDiveSession | null {
    return this.currentSession
  }

  /**
   * Pause the current session
   */
  pauseSession(): void {
    if (this.currentSession && !this.currentSession.isPaused) {
      this.currentSession.isPaused = true
      this.currentSession.currentStage = 'paused'
      this.isNarrating = false
    }
  }

  /**
   * Resume a paused session
   */
  resumeSession(): void {
    if (this.currentSession?.isPaused) {
      this.currentSession.isPaused = false
      this.startNarrationPlayback()
    }
  }

  /**
   * Skip to next stage (if allowed)
   */
  skipToNext(): boolean {
    if (!this.config.allowSkipping || !this.currentSession) return false

    // Clear remaining narrations for current stage
    const currentStage = this.currentSession.currentStage
    this.narrationQueue = this.narrationQueue.filter(n => n.stage !== currentStage)

    return true
  }

  /**
   * Process user response during session
   */
  processUserResponse(response: string, type: 'voice' | 'text' = 'voice'): void {
    if (!this.currentSession) return

    const userResponse: UserResponse = {
      timestamp: Date.now(),
      stage: this.currentSession.currentStage,
      type,
      content: response
    }

    this.currentSession.userResponses.push(userResponse)
    this.currentSession.metadata.interactionCount++

    // Analyze response and potentially adapt narration
    this.adaptToUserResponse(userResponse)
  }

  /**
   * Update emotion state (for voice adaptation)
   */
  updateEmotionState(emotion: EmotionDetection): void {
    if (!this.currentSession || !this.config.enableEmotionAdaptation) return

    // Track emotion shifts
    const previousEmotion = this.currentSession.userResponses
      .filter(r => r.emotion)
      .pop()?.emotion

    if (previousEmotion && previousEmotion.primary !== emotion.primary) {
      this.currentSession.metadata.emotionShifts++
    }

    // Adapt voice based on emotion
    this.currentSession.voiceAdaptation = this.adaptVoiceToEmotion(emotion)

    // Store with last response
    if (this.currentSession.userResponses.length > 0) {
      const lastResponse = this.currentSession.userResponses[this.currentSession.userResponses.length - 1]
      lastResponse.emotion = emotion
    }
  }

  /**
   * Get a specific layer deep dive narration
   */
  async deepDiveIntoLayer(layer: ConsciousnessLayer): Promise<VoiceNarration[]> {
    if (!this.currentSession?.analysis) return []

    this.currentSession.focusedLayer = layer
    const layerState = this.currentSession.analysis.layers[layer]

    const narrations: VoiceNarration[] = []

    // Intro
    const layerInfo = LAYER_NAMES[layer]
    narrations.push(this.createNarration({
      text: `Let us explore ${layerInfo.name} more deeply - ${layerInfo.description}.`,
      stage: 'layer_deep_dive',
      priority: 'critical',
      pauseAfter: 2000,
      voiceStyle: 'meditative',
      allowInterrupt: false
    }))

    // Current state
    const coherencePercent = Math.round(layerState.coherence * 100)
    narrations.push(this.createNarration({
      text: `Your ${layerInfo.name} shows ${coherencePercent}% coherence. The dominant pattern here is: ${layerState.dominantPattern}.`,
      stage: 'layer_deep_dive',
      priority: 'important',
      pauseAfter: 2500,
      voiceStyle: 'warm',
      allowInterrupt: false
    }))

    // Blockers if any
    if (layerState.blockedBy && layerState.blockedBy.length > 0) {
      narrations.push(this.createNarration({
        text: `Some things that may be creating obstacles here: ${layerState.blockedBy.join(', ')}.`,
        stage: 'layer_deep_dive',
        priority: 'important',
        pauseAfter: 2500,
        voiceStyle: 'warm',
        allowInterrupt: false
      }))
    }

    // Supporters
    if (layerState.supportedBy && layerState.supportedBy.length > 0) {
      narrations.push(this.createNarration({
        text: `What's supporting this layer: ${layerState.supportedBy.join(', ')}.`,
        stage: 'layer_deep_dive',
        priority: 'normal',
        pauseAfter: 2000,
        voiceStyle: 'encouraging',
        allowInterrupt: false
      }))
    }

    // Related verse
    const relatedVerse = this.currentSession.analysis.wisdomRecommendations
      .find(v => v.layer === layer)

    if (relatedVerse) {
      narrations.push(this.createNarration({
        text: `${relatedVerse.voiceIntro} From chapter ${relatedVerse.chapter}, verse ${relatedVerse.verse}: "${relatedVerse.translation}"`,
        stage: 'layer_deep_dive',
        priority: 'important',
        pauseAfter: 3000,
        voiceStyle: 'solemn',
        allowInterrupt: false
      }))
    }

    return narrations
  }

  /**
   * Get voice-optimized summary text
   */
  getVoiceSummary(): string {
    if (!this.currentSession?.analysis) {
      return "No quantum dive analysis available yet."
    }

    return this.engine.generateVoiceSummary(this.currentSession.analysis)
  }

  /**
   * Get narration for speaking
   */
  getNextNarration(): VoiceNarration | null {
    if (this.narrationQueue.length === 0) return null
    return this.narrationQueue.shift() || null
  }

  /**
   * Check if session is active
   */
  isSessionActive(): boolean {
    return this.currentSession !== null &&
           this.currentSession.currentStage !== 'complete' &&
           !this.currentSession.isPaused
  }

  // ============ Private Methods ============

  private generateSessionId(): string {
    return `qd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private async transitionToStage(stage: QuantumDiveStage): Promise<void> {
    if (!this.currentSession) return

    this.currentSession.currentStage = stage
    this.config.onStageChange(stage, this.currentSession)

    // Update progress based on stage
    const stageProgress: Record<QuantumDiveStage, number> = {
      initializing: 0,
      grounding: 10,
      scanning: 40,
      layer_deep_dive: 50,
      insights: 60,
      wisdom: 75,
      integration: 85,
      closing: 95,
      complete: 100,
      paused: this.currentSession.progress
    }

    this.currentSession.progress = stageProgress[stage]
  }

  private queueNarrations(narrations: Omit<VoiceNarration, 'id'>[]): void {
    for (const narration of narrations) {
      this.addNarration(narration)
    }
  }

  private addNarration(narration: Omit<VoiceNarration, 'id'>): void {
    const fullNarration = this.createNarration(narration)
    this.narrationQueue.push(fullNarration)
    this.currentSession?.narrations.push(fullNarration)
  }

  private createNarration(narration: Omit<VoiceNarration, 'id'>): VoiceNarration {
    return {
      ...narration,
      id: `narr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    }
  }

  private async startNarrationPlayback(): Promise<void> {
    if (this.isNarrating) return
    this.isNarrating = true

    while (this.narrationQueue.length > 0 && this.isNarrating) {
      if (this.currentSession?.isPaused) {
        this.isNarrating = false
        break
      }

      const narration = this.narrationQueue.shift()
      if (narration) {
        this.config.onNarration(narration)

        // Wait for narration pause
        await this.sleep(narration.pauseAfter + this.config.pauseBetweenNarrations)
      }
    }

    this.isNarrating = false
  }

  private async waitForStageComplete(stage: QuantumDiveStage): Promise<void> {
    // Wait until all narrations for this stage are done
    while (this.narrationQueue.some(n => n.stage === stage)) {
      await this.sleep(500)
    }

    // Additional pause after stage
    await this.sleep(1000)
  }

  private generateLayerNarrations(analysis: QuantumDiveAnalysis): void {
    const layers: ConsciousnessLayer[] = ['annamaya', 'pranamaya', 'manomaya', 'vijnanamaya', 'anandamaya']

    for (const layer of layers) {
      const state = analysis.layers[layer]
      const layerInfo = LAYER_NAMES[layer]
      const coherencePercent = Math.round(state.coherence * 100)

      // Layer intro
      this.addNarration({
        text: `Now scanning ${layerInfo.name}, ${layerInfo.description}.`,
        stage: 'scanning',
        priority: 'important',
        pauseAfter: 1500,
        voiceStyle: 'meditative',
        allowInterrupt: true
      })

      // Layer state
      let stateDescription = ''
      if (coherencePercent >= 70) {
        stateDescription = `This layer shows strong coherence at ${coherencePercent}%. ${state.dominantPattern}.`
      } else if (coherencePercent >= 50) {
        stateDescription = `This layer is at ${coherencePercent}% coherence. ${state.dominantPattern}. There's room for growth here.`
      } else {
        stateDescription = `This layer shows ${coherencePercent}% coherence and may need attention. ${state.dominantPattern}.`
      }

      this.addNarration({
        text: stateDescription,
        stage: 'scanning',
        priority: 'normal',
        pauseAfter: 2000,
        voiceStyle: 'warm',
        allowInterrupt: true
      })
    }

    // Overall coherence
    this.addNarration({
      text: `Your overall quantum coherence is ${analysis.overallCoherence} out of 100. ${this.getCoherenceDescription(analysis.overallCoherence)}`,
      stage: 'scanning',
      priority: 'critical',
      pauseAfter: 2500,
      voiceStyle: 'encouraging',
      allowInterrupt: false
    })
  }

  private getCoherenceDescription(coherence: number): string {
    if (coherence >= 80) return 'This reflects excellent alignment across your consciousness layers.'
    if (coherence >= 60) return 'This shows good integration with specific areas for deepening.'
    if (coherence >= 40) return 'There are opportunities to bring more harmony to your layers.'
    return 'This indicates a period of transformation and growth opportunity.'
  }

  private generateInsightNarrations(analysis: QuantumDiveAnalysis): void {
    this.addNarration({
      text: "Now let me share the key insights from your quantum dive.",
      stage: 'insights',
      priority: 'critical',
      pauseAfter: 2000,
      voiceStyle: 'warm',
      allowInterrupt: false
    })

    // Top 3 insights
    const topInsights = analysis.insights.slice(0, 3)

    for (const insight of topInsights) {
      this.addNarration({
        text: insight.voiceNarration,
        stage: 'insights',
        priority: insight.priority === 'high' ? 'critical' : 'important',
        pauseAfter: 2500,
        voiceStyle: insight.type === 'warning' ? 'warm' : 'encouraging',
        allowInterrupt: true
      })

      this.config.onInsightReveal(insight)
    }
  }

  private generateWisdomNarrations(analysis: QuantumDiveAnalysis): void {
    this.addNarration({
      text: "The Bhagavad Gita offers timeless wisdom for your journey. Here is what resonates with your current state.",
      stage: 'wisdom',
      priority: 'critical',
      pauseAfter: 2500,
      voiceStyle: 'solemn',
      allowInterrupt: false
    })

    // Top 2 verse recommendations
    const topVerses = analysis.wisdomRecommendations.slice(0, 2)

    for (const verse of topVerses) {
      this.addNarration({
        text: `${verse.voiceIntro} From chapter ${verse.chapter}, verse ${verse.verse}: "${verse.translation}"`,
        stage: 'wisdom',
        priority: 'important',
        pauseAfter: 3000,
        voiceStyle: 'solemn',
        allowInterrupt: true
      })

      this.addNarration({
        text: verse.applicationGuide,
        stage: 'wisdom',
        priority: 'normal',
        pauseAfter: 2000,
        voiceStyle: 'warm',
        allowInterrupt: true
      })
    }
  }

  private generateIntegrationNarrations(analysis: QuantumDiveAnalysis): void {
    this.addNarration({
      text: "Let me offer you practices to integrate these insights into daily life.",
      stage: 'integration',
      priority: 'critical',
      pauseAfter: 2000,
      voiceStyle: 'warm',
      allowInterrupt: false
    })

    // Top 2 practice recommendations
    const topPractices = analysis.practiceRecommendations.slice(0, 2)

    for (const practice of topPractices) {
      this.addNarration({
        text: `${practice.name}: ${practice.voiceGuidance} Practice this for ${practice.duration}, ${practice.frequency}.`,
        stage: 'integration',
        priority: 'important',
        pauseAfter: 2500,
        voiceStyle: 'encouraging',
        allowInterrupt: true
      })
    }

    // Evolution trend
    const trendNarrations: Record<string, string> = {
      ascending: "Your consciousness is on an ascending path. Continue nurturing this positive momentum.",
      stable: "Your foundation is stable. This is the perfect time to deepen your practices.",
      descending: "You may be moving through challenges. Remember, these are opportunities for profound growth.",
      transforming: "You are in a powerful period of transformation. Trust the process and stay present."
    }

    this.addNarration({
      text: trendNarrations[analysis.evolutionTrend],
      stage: 'integration',
      priority: 'important',
      pauseAfter: 2500,
      voiceStyle: 'encouraging',
      allowInterrupt: false
    })
  }

  private getDefaultVoiceAdaptation(): VoiceAdaptation {
    return {
      speechRate: 0.88,
      pitch: 1.0,
      volume: 0.9,
      emotionalTone: 'compassionate',
      pauseDuration: 1.2,
      warmth: 0.8,
      energy: 0.4
    }
  }

  private adaptVoiceToEmotion(emotion: EmotionDetection): VoiceAdaptation {
    // Base adaptation
    const adaptation: VoiceAdaptation = { ...this.getDefaultVoiceAdaptation() }

    // Adjust based on arousal (energy level)
    if (emotion.arousal > 0.7) {
      // High arousal - slow down, be calming
      adaptation.speechRate = 0.82
      adaptation.pauseDuration = 1.4
      adaptation.energy = 0.3
    } else if (emotion.arousal < 0.3) {
      // Low arousal - slightly more energy
      adaptation.speechRate = 0.92
      adaptation.energy = 0.5
    }

    // Adjust based on valence (positive/negative)
    if (emotion.valence < -0.3) {
      // Negative valence - more warmth and compassion
      adaptation.warmth = 0.9
      adaptation.emotionalTone = 'compassionate'
    } else if (emotion.valence > 0.3) {
      // Positive valence - more encouraging
      adaptation.emotionalTone = 'encouraging'
      adaptation.energy = 0.5
    }

    return adaptation
  }

  private adaptToUserResponse(response: UserResponse): void {
    // Analyze response content for keywords
    const content = response.content.toLowerCase()

    // Check for confusion or need for clarity
    if (content.includes('confused') || content.includes("don't understand") || content.includes('what do you mean')) {
      // Queue clarification narration
      this.addNarration({
        text: "Let me clarify that for you in simpler terms.",
        stage: this.currentSession?.currentStage || 'insights',
        priority: 'critical',
        pauseAfter: 1500,
        voiceStyle: 'warm',
        allowInterrupt: false
      })
    }

    // Check for positive engagement
    if (content.includes('yes') || content.includes('thank') || content.includes('helpful')) {
      // Acknowledge and continue
    }

    // Check for distress
    if (content.includes('overwhelmed') || content.includes('too much') || content.includes('stop')) {
      this.addNarration({
        text: "I hear you. Let's pause and take a breath together. There's no rush.",
        stage: this.currentSession?.currentStage || 'grounding',
        priority: 'critical',
        pauseAfter: 3000,
        voiceStyle: 'meditative',
        allowInterrupt: false
      })
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.isNarrating = false
    this.narrationQueue = []
    this.currentSession = null
  }
}

// ============ Factory Function ============

export function createQuantumDiveOrchestrator(config?: QuantumDiveOrchestratorConfig): QuantumDiveOrchestrator {
  return new QuantumDiveOrchestrator(config)
}

// ============ Singleton Instance ============

export const quantumDiveOrchestrator = new QuantumDiveOrchestrator()
