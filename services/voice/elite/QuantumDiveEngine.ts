/**
 * Quantum Dive Engine - Multi-Dimensional Consciousness Analysis
 *
 * World-class deep analytical engine for KIAAN Voice that provides:
 * - Multi-layer consciousness mapping (physical, emotional, mental, spiritual)
 * - Temporal pattern analysis across sessions
 * - Quantum coherence scoring for wellbeing states
 * - Deep insight generation from aggregated data
 * - Gita wisdom integration at each consciousness layer
 * - Voice-optimized output formatting
 *
 * The "Quantum" metaphor represents the interconnected, probabilistic
 * nature of human consciousness where multiple states coexist and
 * observation (self-reflection) collapses them into clarity.
 */

import type { MemoryEntry, MemorySummary } from './VectorConversationMemory'
import type { EmotionDetection, PrimaryEmotion } from './EmotionAwareVoice'

// ============ Types & Interfaces ============

/**
 * Consciousness layers based on Vedantic philosophy
 */
export type ConsciousnessLayer =
  | 'annamaya'    // Physical/Body layer
  | 'pranamaya'   // Energy/Vitality layer
  | 'manomaya'    // Mental/Emotional layer
  | 'vijnanamaya' // Wisdom/Intellect layer
  | 'anandamaya'  // Bliss/Spiritual layer

/**
 * Quantum state representing a snapshot of consciousness
 */
export interface QuantumState {
  layer: ConsciousnessLayer
  coherence: number       // 0-1, how aligned/balanced this layer is
  amplitude: number       // 0-1, strength/presence of this layer
  phase: number          // -1 to 1, direction (negative=contracting, positive=expanding)
  dominantPattern: string
  blockedBy?: string[]   // What's blocking coherence
  supportedBy?: string[] // What's supporting coherence
}

/**
 * Multi-dimensional analysis result
 */
export interface QuantumDiveAnalysis {
  // Overall scores
  overallCoherence: number          // 0-100, quantum coherence score
  consciousnessSignature: string    // Unique pattern identifier
  evolutionTrend: 'ascending' | 'stable' | 'descending' | 'transforming'

  // Layer-by-layer analysis
  layers: Record<ConsciousnessLayer, QuantumState>

  // Temporal patterns
  temporalPatterns: TemporalPattern[]

  // Key insights
  insights: QuantumInsight[]

  // Gita wisdom recommendations
  wisdomRecommendations: WisdomRecommendation[]

  // Action items
  practiceRecommendations: PracticeRecommendation[]

  // Metadata
  analyzedAt: number
  dataPoints: number
  confidenceScore: number
}

/**
 * Pattern detected across time
 */
export interface TemporalPattern {
  id: string
  name: string
  description: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'sporadic'
  strength: number        // 0-1
  trend: 'increasing' | 'stable' | 'decreasing'
  relatedEmotions: PrimaryEmotion[]
  peakTimes?: string[]    // e.g., "morning", "evening"
}

/**
 * Deep insight from analysis
 */
export interface QuantumInsight {
  id: string
  type: 'revelation' | 'pattern' | 'warning' | 'encouragement' | 'growth'
  title: string
  content: string
  voiceNarration: string  // Optimized for TTS
  confidence: number
  layer: ConsciousnessLayer
  actionable: boolean
  priority: 'high' | 'medium' | 'low'
}

/**
 * Gita wisdom recommendation
 */
export interface WisdomRecommendation {
  verseId: string
  chapter: number
  verse: number
  sanskrit?: string
  translation: string
  relevance: string       // Why this verse is relevant
  layer: ConsciousnessLayer
  applicationGuide: string
  voiceIntro: string      // Short intro for voice
}

/**
 * Practice recommendation
 */
export interface PracticeRecommendation {
  id: string
  name: string
  description: string
  duration: string        // e.g., "5 minutes", "10-15 minutes"
  frequency: string       // e.g., "daily", "twice daily"
  targetLayer: ConsciousnessLayer
  expectedBenefit: string
  voiceGuidance: string   // Short guidance for voice
}

/**
 * Input data for quantum dive
 */
export interface QuantumDiveInput {
  // Required
  userId: string

  // Optional data sources
  weeklyReflections?: WeeklyReflectionData[]
  dailyAnalyses?: DailyAnalysisData[]
  conversationMemory?: MemorySummary
  recentEmotions?: EmotionDetection[]
  currentMood?: PrimaryEmotion

  // Time range
  timeRangeWeeks?: number
}

/**
 * Weekly reflection data (from sacred reflections)
 */
export interface WeeklyReflectionData {
  weekStart: Date
  weekEnd: Date
  emotionalSummary: string
  insights: string[]
  wellbeingScore: number | null
  versesExplored: { chapter: number; verse: number }[]
  milestones: string[]
  growthAreas: string[]
}

/**
 * Daily analysis data
 */
export interface DailyAnalysisData {
  date: Date
  moodScore: number       // 1-10
  emotions: string[]
  concerns: string[]
  gratitude?: string[]
}

/**
 * Configuration for Quantum Dive Engine
 */
export interface QuantumDiveConfig {
  // Analysis depth
  depth: 'quick' | 'standard' | 'deep' | 'transcendent'

  // Focus areas
  focusLayers?: ConsciousnessLayer[]

  // Output format
  voiceOptimized?: boolean
  includeVisualizations?: boolean

  // Callbacks
  onLayerAnalyzed?: (layer: ConsciousnessLayer, state: QuantumState) => void
  onInsightGenerated?: (insight: QuantumInsight) => void
  onProgress?: (progress: number, stage: string) => void
  onError?: (error: string) => void
}

// ============ Gita Verse Database for Quantum Dive ============

const QUANTUM_GITA_VERSES: Record<ConsciousnessLayer, WisdomRecommendation[]> = {
  annamaya: [
    {
      verseId: 'BG_6_17',
      chapter: 6,
      verse: 17,
      translation: 'One who is moderate in eating, sleeping, working, and recreation can mitigate all material pains by practicing yoga.',
      relevance: 'Physical balance through moderation',
      layer: 'annamaya',
      applicationGuide: 'Establish regular routines for eating, sleeping, and activity.',
      voiceIntro: 'For physical wellbeing, the Gita teaches us about moderation.'
    },
    {
      verseId: 'BG_17_8',
      chapter: 17,
      verse: 8,
      translation: 'Foods that promote longevity, vitality, strength, health, happiness, and satisfaction are dear to those in goodness.',
      relevance: 'Nourishment of the body',
      layer: 'annamaya',
      applicationGuide: 'Choose foods that give energy and clarity, not lethargy.',
      voiceIntro: 'The Gita speaks of nourishing foods that bring vitality.'
    }
  ],
  pranamaya: [
    {
      verseId: 'BG_4_29',
      chapter: 4,
      verse: 29,
      translation: 'Still others practice breath control as sacrifice, regulating the incoming and outgoing breath.',
      relevance: 'Vital energy through breath',
      layer: 'pranamaya',
      applicationGuide: 'Practice conscious breathing to regulate life force.',
      voiceIntro: 'For energy balance, ancient wisdom guides us to the breath.'
    },
    {
      verseId: 'BG_5_27',
      chapter: 5,
      verse: 27,
      translation: 'Shutting out external sense contacts, fixing the gaze between the eyebrows, equalizing the inward and outward breaths.',
      relevance: 'Pranayama for inner peace',
      layer: 'pranamaya',
      applicationGuide: 'Practice equalizing your breath to balance your energy.',
      voiceIntro: 'Balancing the breath brings balance to life energy.'
    }
  ],
  manomaya: [
    {
      verseId: 'BG_6_5',
      chapter: 6,
      verse: 5,
      translation: 'One must elevate oneself by one\'s own mind, not degrade oneself. The mind is the friend of the conditioned soul, and its enemy as well.',
      relevance: 'Mind as friend or foe',
      layer: 'manomaya',
      applicationGuide: 'Train your mind to be your ally through positive self-talk.',
      voiceIntro: 'Your mind can be your greatest friend or your greatest challenge.'
    },
    {
      verseId: 'BG_6_35',
      chapter: 6,
      verse: 35,
      translation: 'The mind is restless and difficult to curb, but it can be controlled through practice and detachment.',
      relevance: 'Mastering the restless mind',
      layer: 'manomaya',
      applicationGuide: 'With consistent practice, the turbulent mind becomes still.',
      voiceIntro: 'Even the most restless mind can find peace through practice.'
    },
    {
      verseId: 'BG_2_62',
      chapter: 2,
      verse: 62,
      translation: 'While contemplating sense objects, one develops attachment. From attachment comes desire, and from desire arises anger.',
      relevance: 'Understanding emotional patterns',
      layer: 'manomaya',
      applicationGuide: 'Notice where your attachments lead your emotions.',
      voiceIntro: 'Understanding how emotions arise helps us master them.'
    }
  ],
  vijnanamaya: [
    {
      verseId: 'BG_2_47',
      chapter: 2,
      verse: 47,
      translation: 'You have a right to perform your duty, but not to the fruits of action. Never consider yourself the cause of results, nor be attached to inaction.',
      relevance: 'Wisdom of detached action',
      layer: 'vijnanamaya',
      applicationGuide: 'Focus on the quality of your actions, not the outcomes.',
      voiceIntro: 'True wisdom lies in acting without attachment to results.'
    },
    {
      verseId: 'BG_4_38',
      chapter: 4,
      verse: 38,
      translation: 'In this world, there is nothing as purifying as knowledge. One who has achieved perfection in yoga finds it within the self in due course.',
      relevance: 'Knowledge as purification',
      layer: 'vijnanamaya',
      applicationGuide: 'Seek understanding as the path to inner clarity.',
      voiceIntro: 'Knowledge purifies the intellect and reveals inner truth.'
    }
  ],
  anandamaya: [
    {
      verseId: 'BG_6_20',
      chapter: 6,
      verse: 20,
      translation: 'When the mind, disciplined through yoga, rests in the Self, free from all desires, one is said to be established in yoga.',
      relevance: 'Resting in blissful awareness',
      layer: 'anandamaya',
      applicationGuide: 'Allow moments of simply being, free from wanting.',
      voiceIntro: 'When desires quiet, natural bliss emerges.'
    },
    {
      verseId: 'BG_18_54',
      chapter: 18,
      verse: 54,
      translation: 'Established in Brahman, serene, neither grieving nor desiring, seeing all beings equally, one attains supreme devotion.',
      relevance: 'Unity consciousness',
      layer: 'anandamaya',
      applicationGuide: 'Practice seeing the divine in all beings.',
      voiceIntro: 'In the highest state, you see yourself in all and all in yourself.'
    }
  ]
}

// ============ Practice Recommendations Database ============

const LAYER_PRACTICES: Record<ConsciousnessLayer, PracticeRecommendation[]> = {
  annamaya: [
    {
      id: 'body-scan',
      name: 'Body Awareness Scan',
      description: 'Systematic awareness of physical sensations from head to toe',
      duration: '10 minutes',
      frequency: 'daily',
      targetLayer: 'annamaya',
      expectedBenefit: 'Increased body awareness and tension release',
      voiceGuidance: 'Start with a daily body scan to reconnect with physical sensations.'
    },
    {
      id: 'mindful-walking',
      name: 'Mindful Walking',
      description: 'Slow, conscious walking with attention to each step',
      duration: '15 minutes',
      frequency: 'daily',
      targetLayer: 'annamaya',
      expectedBenefit: 'Grounding and physical presence',
      voiceGuidance: 'Practice mindful walking to ground yourself in your body.'
    }
  ],
  pranamaya: [
    {
      id: 'alternate-nostril',
      name: 'Nadi Shodhana (Alternate Nostril Breathing)',
      description: 'Balancing breath through alternating nostrils',
      duration: '5-10 minutes',
      frequency: 'twice daily',
      targetLayer: 'pranamaya',
      expectedBenefit: 'Energy balance and calm nervous system',
      voiceGuidance: 'Alternate nostril breathing balances your energy channels.'
    },
    {
      id: 'box-breathing',
      name: 'Box Breathing',
      description: 'Equal count breathing: inhale, hold, exhale, hold',
      duration: '5 minutes',
      frequency: 'as needed',
      targetLayer: 'pranamaya',
      expectedBenefit: 'Immediate calm and focus',
      voiceGuidance: 'Box breathing quickly brings calm in stressful moments.'
    }
  ],
  manomaya: [
    {
      id: 'thought-observation',
      name: 'Witness Meditation',
      description: 'Observing thoughts without engagement or judgment',
      duration: '15-20 minutes',
      frequency: 'daily',
      targetLayer: 'manomaya',
      expectedBenefit: 'Mental clarity and emotional regulation',
      voiceGuidance: 'Practice witnessing your thoughts like clouds passing in the sky.'
    },
    {
      id: 'journaling',
      name: 'Reflective Journaling',
      description: 'Writing to process emotions and gain clarity',
      duration: '10-15 minutes',
      frequency: 'daily',
      targetLayer: 'manomaya',
      expectedBenefit: 'Emotional processing and self-understanding',
      voiceGuidance: 'Journaling helps bring unconscious patterns to light.'
    }
  ],
  vijnanamaya: [
    {
      id: 'self-inquiry',
      name: 'Self-Inquiry (Atma Vichara)',
      description: 'Asking "Who am I?" and resting in awareness',
      duration: '20 minutes',
      frequency: 'daily',
      targetLayer: 'vijnanamaya',
      expectedBenefit: 'Direct insight into true nature',
      voiceGuidance: 'Ask yourself "Who am I?" and rest in the silent awareness.'
    },
    {
      id: 'gita-contemplation',
      name: 'Verse Contemplation',
      description: 'Deep reflection on a single Gita verse',
      duration: '15 minutes',
      frequency: 'daily',
      targetLayer: 'vijnanamaya',
      expectedBenefit: 'Wisdom integration and discrimination',
      voiceGuidance: 'Contemplate one verse deeply, letting its meaning unfold.'
    }
  ],
  anandamaya: [
    {
      id: 'gratitude-meditation',
      name: 'Gratitude Meditation',
      description: 'Cultivating deep appreciation for existence',
      duration: '10 minutes',
      frequency: 'daily',
      targetLayer: 'anandamaya',
      expectedBenefit: 'Access to natural joy and contentment',
      voiceGuidance: 'Let gratitude open the door to your natural bliss.'
    },
    {
      id: 'loving-kindness',
      name: 'Metta (Loving-Kindness)',
      description: 'Radiating love and goodwill to all beings',
      duration: '15 minutes',
      frequency: 'daily',
      targetLayer: 'anandamaya',
      expectedBenefit: 'Heart opening and connection',
      voiceGuidance: 'Practicing loving-kindness connects you to the bliss of unity.'
    }
  ]
}

// ============ Quantum Dive Engine Class ============

/**
 * Quantum Dive Engine - Multi-Dimensional Consciousness Analyzer
 */
export class QuantumDiveEngine {
  private config: Required<QuantumDiveConfig>

  constructor(config: QuantumDiveConfig = {}) {
    this.config = {
      depth: config.depth ?? 'standard',
      focusLayers: config.focusLayers ?? ['annamaya', 'pranamaya', 'manomaya', 'vijnanamaya', 'anandamaya'],
      voiceOptimized: config.voiceOptimized ?? true,
      includeVisualizations: config.includeVisualizations ?? false,
      onLayerAnalyzed: config.onLayerAnalyzed ?? (() => {}),
      onInsightGenerated: config.onInsightGenerated ?? (() => {}),
      onProgress: config.onProgress ?? (() => {}),
      onError: config.onError ?? (() => {})
    }
  }

  /**
   * Perform a quantum dive analysis
   */
  async performQuantumDive(input: QuantumDiveInput): Promise<QuantumDiveAnalysis> {
    const startTime = Date.now()

    try {
      this.config.onProgress(0, 'Initializing quantum field analysis')

      // Step 1: Analyze each consciousness layer
      this.config.onProgress(10, 'Mapping consciousness layers')
      const layers = await this.analyzeLayers(input)

      // Step 2: Detect temporal patterns
      this.config.onProgress(40, 'Detecting temporal patterns')
      const temporalPatterns = this.detectTemporalPatterns(input)

      // Step 3: Calculate overall coherence
      this.config.onProgress(60, 'Calculating quantum coherence')
      const overallCoherence = this.calculateOverallCoherence(layers)

      // Step 4: Generate insights
      this.config.onProgress(75, 'Generating quantum insights')
      const insights = this.generateInsights(layers, temporalPatterns, input)

      // Step 5: Get wisdom recommendations
      this.config.onProgress(85, 'Aligning with Gita wisdom')
      const wisdomRecommendations = this.getWisdomRecommendations(layers, insights)

      // Step 6: Create practice recommendations
      this.config.onProgress(95, 'Formulating practice path')
      const practiceRecommendations = this.getPracticeRecommendations(layers, insights)

      // Step 7: Determine evolution trend
      const evolutionTrend = this.determineEvolutionTrend(input, temporalPatterns)

      // Step 8: Generate consciousness signature
      const consciousnessSignature = this.generateSignature(layers, overallCoherence)

      this.config.onProgress(100, 'Quantum dive complete')

      const dataPoints = this.countDataPoints(input)

      return {
        overallCoherence,
        consciousnessSignature,
        evolutionTrend,
        layers,
        temporalPatterns,
        insights,
        wisdomRecommendations,
        practiceRecommendations,
        analyzedAt: Date.now(),
        dataPoints,
        confidenceScore: this.calculateConfidence(dataPoints)
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Quantum dive failed'
      this.config.onError(errorMsg)
      throw error
    }
  }

  /**
   * Analyze all consciousness layers
   */
  private async analyzeLayers(input: QuantumDiveInput): Promise<Record<ConsciousnessLayer, QuantumState>> {
    const layers: Record<ConsciousnessLayer, QuantumState> = {
      annamaya: await this.analyzeAnnamaya(input),
      pranamaya: await this.analyzePranamaya(input),
      manomaya: await this.analyzeManomaya(input),
      vijnanamaya: await this.analyzeVijnanamaya(input),
      anandamaya: await this.analyzeAnandamaya(input)
    }

    // Notify for each layer
    for (const [layer, state] of Object.entries(layers)) {
      this.config.onLayerAnalyzed(layer as ConsciousnessLayer, state)
    }

    return layers
  }

  /**
   * Analyze Annamaya (Physical) layer
   */
  private async analyzeAnnamaya(input: QuantumDiveInput): Promise<QuantumState> {
    // Extract physical indicators from data
    const physicalIndicators = this.extractPhysicalIndicators(input)

    const coherence = physicalIndicators.sleepQuality * 0.3 +
                     physicalIndicators.energyLevel * 0.3 +
                     physicalIndicators.physicalComfort * 0.4

    const amplitude = physicalIndicators.awareness

    const phase = physicalIndicators.trend === 'improving' ? 0.5 :
                 physicalIndicators.trend === 'declining' ? -0.5 : 0

    return {
      layer: 'annamaya',
      coherence: Math.min(1, Math.max(0, coherence)),
      amplitude: Math.min(1, Math.max(0, amplitude)),
      phase,
      dominantPattern: this.getPhysicalPattern(physicalIndicators),
      blockedBy: physicalIndicators.blockers,
      supportedBy: physicalIndicators.supporters
    }
  }

  /**
   * Analyze Pranamaya (Energy) layer
   */
  private async analyzePranamaya(input: QuantumDiveInput): Promise<QuantumState> {
    const energyIndicators = this.extractEnergyIndicators(input)

    const coherence = energyIndicators.vitalityLevel * 0.4 +
                     energyIndicators.breathAwareness * 0.3 +
                     energyIndicators.energyBalance * 0.3

    return {
      layer: 'pranamaya',
      coherence: Math.min(1, Math.max(0, coherence)),
      amplitude: energyIndicators.presence,
      phase: energyIndicators.flow,
      dominantPattern: this.getEnergyPattern(energyIndicators),
      blockedBy: energyIndicators.blockers,
      supportedBy: energyIndicators.supporters
    }
  }

  /**
   * Analyze Manomaya (Mental/Emotional) layer
   */
  private async analyzeManomaya(input: QuantumDiveInput): Promise<QuantumState> {
    const emotionalIndicators = this.extractEmotionalIndicators(input)

    const coherence = emotionalIndicators.emotionalStability * 0.35 +
                     emotionalIndicators.mentalClarity * 0.35 +
                     emotionalIndicators.stressManagement * 0.3

    return {
      layer: 'manomaya',
      coherence: Math.min(1, Math.max(0, coherence)),
      amplitude: emotionalIndicators.emotionalPresence,
      phase: emotionalIndicators.emotionalTrend,
      dominantPattern: this.getEmotionalPattern(emotionalIndicators),
      blockedBy: emotionalIndicators.blockers,
      supportedBy: emotionalIndicators.supporters
    }
  }

  /**
   * Analyze Vijnanamaya (Wisdom/Intellect) layer
   */
  private async analyzeVijnanamaya(input: QuantumDiveInput): Promise<QuantumState> {
    const wisdomIndicators = this.extractWisdomIndicators(input)

    const coherence = wisdomIndicators.selfAwareness * 0.4 +
                     wisdomIndicators.wisdomIntegration * 0.3 +
                     wisdomIndicators.discernment * 0.3

    return {
      layer: 'vijnanamaya',
      coherence: Math.min(1, Math.max(0, coherence)),
      amplitude: wisdomIndicators.engagement,
      phase: wisdomIndicators.growth,
      dominantPattern: this.getWisdomPattern(wisdomIndicators),
      blockedBy: wisdomIndicators.blockers,
      supportedBy: wisdomIndicators.supporters
    }
  }

  /**
   * Analyze Anandamaya (Bliss) layer
   */
  private async analyzeAnandamaya(input: QuantumDiveInput): Promise<QuantumState> {
    const blissIndicators = this.extractBlissIndicators(input)

    const coherence = blissIndicators.contentment * 0.35 +
                     blissIndicators.gratitude * 0.35 +
                     blissIndicators.connection * 0.3

    return {
      layer: 'anandamaya',
      coherence: Math.min(1, Math.max(0, coherence)),
      amplitude: blissIndicators.presence,
      phase: blissIndicators.openness,
      dominantPattern: this.getBlissPattern(blissIndicators),
      blockedBy: blissIndicators.blockers,
      supportedBy: blissIndicators.supporters
    }
  }

  // ============ Indicator Extraction Methods ============

  private extractPhysicalIndicators(input: QuantumDiveInput): {
    sleepQuality: number
    energyLevel: number
    physicalComfort: number
    awareness: number
    trend: 'improving' | 'stable' | 'declining'
    blockers: string[]
    supporters: string[]
  } {
    // Analyze from daily data and recent emotions
    const dailyScores = input.dailyAnalyses?.map(d => d.moodScore) || []
    const avgScore = dailyScores.length > 0
      ? dailyScores.reduce((a, b) => a + b, 0) / dailyScores.length / 10
      : 0.5

    const concerns = input.dailyAnalyses?.flatMap(d => d.concerns) || []
    const hasPhysicalConcerns = concerns.some(c =>
      c.toLowerCase().includes('sleep') ||
      c.toLowerCase().includes('tired') ||
      c.toLowerCase().includes('pain') ||
      c.toLowerCase().includes('body')
    )

    return {
      sleepQuality: hasPhysicalConcerns ? 0.4 : 0.7,
      energyLevel: avgScore,
      physicalComfort: hasPhysicalConcerns ? 0.5 : 0.7,
      awareness: 0.6,
      trend: this.determineTrend(dailyScores),
      blockers: hasPhysicalConcerns ? ['Physical discomfort', 'Sleep issues'] : [],
      supporters: ['Daily routine', 'Awareness practice']
    }
  }

  private extractEnergyIndicators(input: QuantumDiveInput): {
    vitalityLevel: number
    breathAwareness: number
    energyBalance: number
    presence: number
    flow: number
    blockers: string[]
    supporters: string[]
  } {
    const recentEmotions = input.recentEmotions || []
    const avgArousal = recentEmotions.length > 0
      ? recentEmotions.reduce((sum, e) => sum + e.arousal, 0) / recentEmotions.length
      : 0.5

    const vitalityLevel = avgArousal > 0.3 && avgArousal < 0.7 ? 0.7 : 0.5

    return {
      vitalityLevel,
      breathAwareness: 0.5,
      energyBalance: avgArousal > 0.3 && avgArousal < 0.7 ? 0.7 : 0.4,
      presence: 0.6,
      flow: avgArousal > 0.5 ? 0.3 : -0.2,
      blockers: avgArousal > 0.7 ? ['High stress', 'Scattered energy'] : [],
      supporters: ['Breath practice', 'Physical activity']
    }
  }

  private extractEmotionalIndicators(input: QuantumDiveInput): {
    emotionalStability: number
    mentalClarity: number
    stressManagement: number
    emotionalPresence: number
    emotionalTrend: number
    blockers: string[]
    supporters: string[]
  } {
    const recentEmotions = input.recentEmotions || []
    const memorySummary = input.conversationMemory

    // Calculate emotional stability from variance
    const valences = recentEmotions.map(e => e.valence)
    const avgValence = valences.length > 0
      ? valences.reduce((a, b) => a + b, 0) / valences.length
      : 0

    const variance = valences.length > 0
      ? valences.reduce((sum, v) => sum + Math.pow(v - avgValence, 2), 0) / valences.length
      : 0

    const emotionalStability = Math.max(0, 1 - variance)

    // Check for negative patterns
    const negativeEmotions = recentEmotions.filter(e =>
      ['sad', 'angry', 'fearful', 'anxious', 'frustrated'].includes(e.primary)
    )
    const negativeRatio = recentEmotions.length > 0
      ? negativeEmotions.length / recentEmotions.length
      : 0

    const blockers: string[] = []
    if (negativeRatio > 0.5) blockers.push('Persistent negative emotions')
    if (memorySummary?.emotionTrend === 'declining') blockers.push('Declining emotional trend')

    return {
      emotionalStability,
      mentalClarity: 1 - variance,
      stressManagement: negativeRatio > 0.5 ? 0.4 : 0.7,
      emotionalPresence: 0.7,
      emotionalTrend: avgValence,
      blockers,
      supporters: memorySummary?.emotionTrend === 'improving'
        ? ['Improving emotional awareness', 'Regular reflection']
        : ['Emotional awareness practice']
    }
  }

  private extractWisdomIndicators(input: QuantumDiveInput): {
    selfAwareness: number
    wisdomIntegration: number
    discernment: number
    engagement: number
    growth: number
    blockers: string[]
    supporters: string[]
  } {
    const reflections = input.weeklyReflections || []
    const memorySummary = input.conversationMemory

    // Check wisdom engagement
    const versesExplored = reflections.flatMap(r => r.versesExplored).length
    const wisdomIntegration = Math.min(1, versesExplored / 10)

    const avgWellbeing = reflections.length > 0
      ? reflections.reduce((sum, r) => sum + (r.wellbeingScore || 5), 0) / reflections.length / 10
      : 0.5

    return {
      selfAwareness: reflections.length > 0 ? 0.7 : 0.4,
      wisdomIntegration,
      discernment: avgWellbeing,
      engagement: Math.min(1, (memorySummary?.totalEntries || 0) / 50),
      growth: reflections.length > 1 ? 0.5 : 0,
      blockers: reflections.length === 0 ? ['Limited self-reflection'] : [],
      supporters: versesExplored > 0 ? ['Gita wisdom engagement', 'Regular reflection'] : []
    }
  }

  private extractBlissIndicators(input: QuantumDiveInput): {
    contentment: number
    gratitude: number
    connection: number
    presence: number
    openness: number
    blockers: string[]
    supporters: string[]
  } {
    const dailyAnalyses = input.dailyAnalyses || []
    const recentEmotions = input.recentEmotions || []

    // Check for positive states
    const gratitudeItems = dailyAnalyses.flatMap(d => d.gratitude || [])
    const hasGratitude = gratitudeItems.length > 0

    const positiveEmotions = recentEmotions.filter(e =>
      ['happy', 'calm', 'hopeful'].includes(e.primary)
    )
    const positiveRatio = recentEmotions.length > 0
      ? positiveEmotions.length / recentEmotions.length
      : 0

    return {
      contentment: positiveRatio > 0.5 ? 0.7 : 0.4,
      gratitude: hasGratitude ? 0.7 : 0.3,
      connection: 0.5,
      presence: positiveRatio,
      openness: positiveRatio > 0.3 ? 0.5 : -0.3,
      blockers: !hasGratitude ? ['Limited gratitude practice'] : [],
      supporters: hasGratitude ? ['Gratitude practice', 'Positive outlook'] : []
    }
  }

  // ============ Pattern Detection ============

  private getPhysicalPattern(indicators: ReturnType<typeof this.extractPhysicalIndicators>): string {
    if (indicators.sleepQuality < 0.5) return 'Sleep-deprived'
    if (indicators.energyLevel > 0.7) return 'Vitally energized'
    if (indicators.physicalComfort < 0.5) return 'Physical tension'
    return 'Physically balanced'
  }

  private getEnergyPattern(indicators: ReturnType<typeof this.extractEnergyIndicators>): string {
    if (indicators.vitalityLevel > 0.7) return 'High vitality'
    if (indicators.energyBalance < 0.4) return 'Energy imbalance'
    if (indicators.flow > 0.3) return 'Energy expanding'
    if (indicators.flow < -0.3) return 'Energy contracting'
    return 'Stable energy'
  }

  private getEmotionalPattern(indicators: ReturnType<typeof this.extractEmotionalIndicators>): string {
    if (indicators.emotionalStability > 0.7) return 'Emotionally centered'
    if (indicators.emotionalTrend > 0.3) return 'Positive emotional flow'
    if (indicators.emotionalTrend < -0.3) return 'Emotional turbulence'
    if (indicators.stressManagement < 0.5) return 'Stress accumulation'
    return 'Processing emotions'
  }

  private getWisdomPattern(indicators: ReturnType<typeof this.extractWisdomIndicators>): string {
    if (indicators.wisdomIntegration > 0.7) return 'Deep wisdom integration'
    if (indicators.selfAwareness > 0.7) return 'High self-awareness'
    if (indicators.growth > 0.3) return 'Expanding understanding'
    if (indicators.engagement < 0.3) return 'Seeking guidance'
    return 'Developing discernment'
  }

  private getBlissPattern(indicators: ReturnType<typeof this.extractBlissIndicators>): string {
    if (indicators.contentment > 0.7 && indicators.gratitude > 0.7) return 'Natural joy'
    if (indicators.gratitude > 0.6) return 'Gratitude-centered'
    if (indicators.openness > 0.3) return 'Opening to joy'
    if (indicators.contentment < 0.4) return 'Seeking fulfillment'
    return 'Cultivating contentment'
  }

  private determineTrend(scores: number[]): 'improving' | 'stable' | 'declining' {
    if (scores.length < 3) return 'stable'

    const firstHalf = scores.slice(0, Math.floor(scores.length / 2))
    const secondHalf = scores.slice(Math.floor(scores.length / 2))

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

    if (secondAvg - firstAvg > 0.5) return 'improving'
    if (firstAvg - secondAvg > 0.5) return 'declining'
    return 'stable'
  }

  // ============ Temporal Pattern Detection ============

  private detectTemporalPatterns(input: QuantumDiveInput): TemporalPattern[] {
    const patterns: TemporalPattern[] = []

    // Analyze weekly patterns
    const weeklyData = input.weeklyReflections || []
    if (weeklyData.length > 0) {
      const wellbeingScores = weeklyData
        .filter(w => w.wellbeingScore !== null)
        .map(w => w.wellbeingScore!)

      if (wellbeingScores.length >= 2) {
        const trend = this.determineTrend(wellbeingScores)
        patterns.push({
          id: 'weekly-wellbeing',
          name: 'Weekly Wellbeing Pattern',
          description: `Your wellbeing has been ${trend} over recent weeks`,
          frequency: 'weekly',
          strength: 0.7,
          trend: trend === 'improving' ? 'increasing' : trend === 'declining' ? 'decreasing' : 'stable',
          relatedEmotions: ['calm', 'anxious']
        })
      }
    }

    // Analyze emotion patterns from recent data
    const recentEmotions = input.recentEmotions || []
    if (recentEmotions.length >= 5) {
      const emotionCounts: Record<string, number> = {}
      for (const emotion of recentEmotions) {
        emotionCounts[emotion.primary] = (emotionCounts[emotion.primary] || 0) + 1
      }

      const dominantEmotion = Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])[0]

      if (dominantEmotion) {
        patterns.push({
          id: 'dominant-emotion',
          name: 'Dominant Emotional Pattern',
          description: `${dominantEmotion[0]} appears frequently in your emotional landscape`,
          frequency: 'daily',
          strength: dominantEmotion[1] / recentEmotions.length,
          trend: 'stable',
          relatedEmotions: [dominantEmotion[0] as PrimaryEmotion]
        })
      }
    }

    // Check for concern patterns
    const concerns = input.dailyAnalyses?.flatMap(d => d.concerns) || []
    const concernCounts: Record<string, number> = {}
    for (const concern of concerns) {
      const normalized = concern.toLowerCase()
      concernCounts[normalized] = (concernCounts[normalized] || 0) + 1
    }

    const topConcerns = Object.entries(concernCounts)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    for (const [concern, count] of topConcerns) {
      patterns.push({
        id: `concern-${concern.replace(/\s+/g, '-')}`,
        name: `Recurring: ${concern}`,
        description: `${concern} has appeared ${count} times in your reflections`,
        frequency: 'sporadic',
        strength: Math.min(1, count / 5),
        trend: 'stable',
        relatedEmotions: ['anxious', 'frustrated']
      })
    }

    return patterns
  }

  // ============ Coherence Calculation ============

  private calculateOverallCoherence(layers: Record<ConsciousnessLayer, QuantumState>): number {
    // Weighted average of layer coherences
    const weights: Record<ConsciousnessLayer, number> = {
      annamaya: 0.15,
      pranamaya: 0.15,
      manomaya: 0.30,    // Mental/emotional weighted higher
      vijnanamaya: 0.20,
      anandamaya: 0.20
    }

    let totalCoherence = 0
    let totalWeight = 0

    for (const [layer, state] of Object.entries(layers)) {
      const weight = weights[layer as ConsciousnessLayer]
      totalCoherence += state.coherence * state.amplitude * weight
      totalWeight += weight
    }

    // Convert to 0-100 scale
    return Math.round((totalCoherence / totalWeight) * 100)
  }

  // ============ Insight Generation ============

  private generateInsights(
    layers: Record<ConsciousnessLayer, QuantumState>,
    patterns: TemporalPattern[],
    input: QuantumDiveInput
  ): QuantumInsight[] {
    const insights: QuantumInsight[] = []

    // Layer-based insights
    for (const [layerName, state] of Object.entries(layers)) {
      const layer = layerName as ConsciousnessLayer

      if (state.coherence < 0.4) {
        insights.push(this.createLayerInsight(layer, state, 'warning'))
      } else if (state.coherence > 0.7) {
        insights.push(this.createLayerInsight(layer, state, 'encouragement'))
      }

      if (state.phase > 0.3) {
        insights.push(this.createGrowthInsight(layer, state))
      }
    }

    // Pattern-based insights
    for (const pattern of patterns) {
      if (pattern.strength > 0.5) {
        insights.push(this.createPatternInsight(pattern))
      }
    }

    // Cross-layer insights
    const crossLayerInsight = this.analyzeCrossLayerRelationships(layers)
    if (crossLayerInsight) {
      insights.push(crossLayerInsight)
    }

    // Sort by priority
    insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    // Notify for each insight
    for (const insight of insights) {
      this.config.onInsightGenerated(insight)
    }

    return insights.slice(0, 7) // Limit to top 7 insights
  }

  private createLayerInsight(
    layer: ConsciousnessLayer,
    state: QuantumState,
    type: 'warning' | 'encouragement'
  ): QuantumInsight {
    const layerNames: Record<ConsciousnessLayer, string> = {
      annamaya: 'physical body',
      pranamaya: 'vital energy',
      manomaya: 'mind and emotions',
      vijnanamaya: 'wisdom and intellect',
      anandamaya: 'inner joy'
    }

    const layerName = layerNames[layer]

    if (type === 'warning') {
      return {
        id: `insight-${layer}-warning`,
        type: 'warning',
        title: `${layerName.charAt(0).toUpperCase() + layerName.slice(1)} Needs Attention`,
        content: `Your ${layerName} shows signs of imbalance. ${state.blockedBy?.join(', ') || 'Some aspects'} may need attention.`,
        voiceNarration: `I notice your ${layerName} needs some care. ${state.dominantPattern}. Let's work on bringing more balance here.`,
        confidence: 0.7,
        layer,
        actionable: true,
        priority: 'high'
      }
    } else {
      return {
        id: `insight-${layer}-strength`,
        type: 'encouragement',
        title: `Strong ${layerName.charAt(0).toUpperCase() + layerName.slice(1)}`,
        content: `Your ${layerName} is showing excellent coherence. ${state.supportedBy?.join(', ') || 'Your practices'} are supporting this.`,
        voiceNarration: `Your ${layerName} is flourishing. ${state.dominantPattern}. This is a wonderful foundation.`,
        confidence: 0.8,
        layer,
        actionable: false,
        priority: 'low'
      }
    }
  }

  private createGrowthInsight(layer: ConsciousnessLayer, state: QuantumState): QuantumInsight {
    return {
      id: `insight-${layer}-growth`,
      type: 'growth',
      title: 'Expansion Detected',
      content: `Your ${layer} consciousness is expanding. Continue nurturing this growth.`,
      voiceNarration: `I see beautiful growth happening in your ${layer} awareness. This expansion is a sign of positive transformation.`,
      confidence: 0.6,
      layer,
      actionable: true,
      priority: 'medium'
    }
  }

  private createPatternInsight(pattern: TemporalPattern): QuantumInsight {
    return {
      id: `insight-pattern-${pattern.id}`,
      type: 'pattern',
      title: pattern.name,
      content: pattern.description,
      voiceNarration: `I've noticed a pattern: ${pattern.description}. Understanding this can help guide your practice.`,
      confidence: pattern.strength,
      layer: 'manomaya',
      actionable: true,
      priority: pattern.strength > 0.7 ? 'high' : 'medium'
    }
  }

  private analyzeCrossLayerRelationships(layers: Record<ConsciousnessLayer, QuantumState>): QuantumInsight | null {
    // Check for mind-body disconnect
    const bodyCoherence = layers.annamaya.coherence
    const mindCoherence = layers.manomaya.coherence

    if (Math.abs(bodyCoherence - mindCoherence) > 0.3) {
      const stronger = bodyCoherence > mindCoherence ? 'body' : 'mind'
      const weaker = stronger === 'body' ? 'mind' : 'body'

      return {
        id: 'insight-cross-layer-disconnect',
        type: 'revelation',
        title: 'Mind-Body Integration Opportunity',
        content: `Your ${stronger} awareness is stronger than your ${weaker} awareness. Integrating these layers can enhance overall wellbeing.`,
        voiceNarration: `There's an opportunity to bring your ${stronger} and ${weaker} into greater harmony. When these layers align, you'll feel more whole and integrated.`,
        confidence: 0.7,
        layer: 'vijnanamaya',
        actionable: true,
        priority: 'high'
      }
    }

    return null
  }

  // ============ Recommendations ============

  private getWisdomRecommendations(
    layers: Record<ConsciousnessLayer, QuantumState>,
    insights: QuantumInsight[]
  ): WisdomRecommendation[] {
    const recommendations: WisdomRecommendation[] = []

    // Find layers needing attention (lowest coherence)
    const sortedLayers = Object.entries(layers)
      .sort((a, b) => a[1].coherence - b[1].coherence)
      .slice(0, 2)

    for (const [layerName] of sortedLayers) {
      const layer = layerName as ConsciousnessLayer
      const verses = QUANTUM_GITA_VERSES[layer]

      if (verses && verses.length > 0) {
        // Pick the most relevant verse
        const verse = verses[0]
        recommendations.push(verse)
      }
    }

    // Add verse for highest coherence layer (to reinforce)
    const strongestLayer = Object.entries(layers)
      .sort((a, b) => b[1].coherence - a[1].coherence)[0]

    if (strongestLayer) {
      const verses = QUANTUM_GITA_VERSES[strongestLayer[0] as ConsciousnessLayer]
      if (verses && verses.length > 1) {
        recommendations.push(verses[1])
      }
    }

    return recommendations.slice(0, 3) // Limit to 3 verses
  }

  private getPracticeRecommendations(
    layers: Record<ConsciousnessLayer, QuantumState>,
    insights: QuantumInsight[]
  ): PracticeRecommendation[] {
    const recommendations: PracticeRecommendation[] = []

    // Find layers needing work
    const layersNeedingWork = Object.entries(layers)
      .filter(([, state]) => state.coherence < 0.6)
      .sort((a, b) => a[1].coherence - b[1].coherence)

    for (const [layerName] of layersNeedingWork.slice(0, 2)) {
      const layer = layerName as ConsciousnessLayer
      const practices = LAYER_PRACTICES[layer]

      if (practices && practices.length > 0) {
        recommendations.push(practices[0])
      }
    }

    // Always include a mental/emotional practice if not already included
    const hasMentalPractice = recommendations.some(r => r.targetLayer === 'manomaya')
    if (!hasMentalPractice) {
      const mentalPractices = LAYER_PRACTICES.manomaya
      if (mentalPractices && mentalPractices.length > 0) {
        recommendations.push(mentalPractices[0])
      }
    }

    return recommendations.slice(0, 4)
  }

  // ============ Evolution & Signature ============

  private determineEvolutionTrend(
    input: QuantumDiveInput,
    patterns: TemporalPattern[]
  ): 'ascending' | 'stable' | 'descending' | 'transforming' {
    const weeklyTrend = patterns.find(p => p.id === 'weekly-wellbeing')
    const memorySummary = input.conversationMemory

    // Check for transformation (high variance but positive direction)
    const emotionTrend = memorySummary?.emotionTrend

    if (emotionTrend === 'improving' && weeklyTrend?.trend === 'increasing') {
      return 'ascending'
    }

    if (emotionTrend === 'declining' && weeklyTrend?.trend === 'decreasing') {
      return 'descending'
    }

    // Check for transformation (mixed signals indicating change)
    if ((emotionTrend === 'improving' && weeklyTrend?.trend === 'decreasing') ||
        (emotionTrend === 'declining' && weeklyTrend?.trend === 'increasing')) {
      return 'transforming'
    }

    return 'stable'
  }

  private generateSignature(
    layers: Record<ConsciousnessLayer, QuantumState>,
    coherence: number
  ): string {
    // Create a unique identifier based on layer states
    const patterns = Object.values(layers).map(l => l.dominantPattern.charAt(0))
    const signature = patterns.join('') + '-' + coherence

    // Map to a meaningful archetype
    const archetypes: Record<string, string> = {
      'ascending': 'Rising Phoenix',
      'stable': 'Steady Mountain',
      'descending': 'Transforming Lotus',
      'transforming': 'Dancing Flame'
    }

    const dominantCoherence = Object.values(layers)
      .reduce((sum, l) => sum + l.coherence, 0) / 5

    if (dominantCoherence > 0.7) return `Quantum Coherent (${coherence})`
    if (dominantCoherence > 0.5) return `Integrating Wave (${coherence})`
    if (dominantCoherence > 0.3) return `Emerging Light (${coherence})`
    return `Awakening Seed (${coherence})`
  }

  // ============ Utility Methods ============

  private countDataPoints(input: QuantumDiveInput): number {
    let count = 0
    count += input.weeklyReflections?.length || 0
    count += input.dailyAnalyses?.length || 0
    count += input.recentEmotions?.length || 0
    count += input.conversationMemory?.totalEntries || 0
    return count
  }

  private calculateConfidence(dataPoints: number): number {
    // More data = higher confidence, caps at 0.95
    return Math.min(0.95, 0.3 + (dataPoints / 100) * 0.65)
  }

  /**
   * Generate a voice-optimized summary of the analysis
   */
  generateVoiceSummary(analysis: QuantumDiveAnalysis): string {
    const lines: string[] = []

    // Opening
    lines.push(`Your Quantum Dive is complete. Your overall coherence score is ${analysis.overallCoherence} out of 100.`)

    // Evolution trend
    const trendDescriptions = {
      ascending: 'Your consciousness is on an ascending path, showing positive growth.',
      stable: 'Your state is stable, providing a solid foundation for deeper work.',
      descending: 'You may be experiencing some challenges. This is an opportunity for transformation.',
      transforming: 'You are in a period of transformation. Change is happening at deep levels.'
    }
    lines.push(trendDescriptions[analysis.evolutionTrend])

    // Top insight
    if (analysis.insights.length > 0) {
      lines.push(analysis.insights[0].voiceNarration)
    }

    // Key recommendation
    if (analysis.wisdomRecommendations.length > 0) {
      const verse = analysis.wisdomRecommendations[0]
      lines.push(verse.voiceIntro)
    }

    // Practice suggestion
    if (analysis.practiceRecommendations.length > 0) {
      const practice = analysis.practiceRecommendations[0]
      lines.push(practice.voiceGuidance)
    }

    // Closing
    lines.push('Remember, this journey is yours. Each moment of awareness is a step toward greater coherence.')

    return lines.join(' ')
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<QuantumDiveConfig>): void {
    this.config = { ...this.config, ...config } as Required<QuantumDiveConfig>
  }
}

// ============ Factory Function ============

export function createQuantumDiveEngine(config?: QuantumDiveConfig): QuantumDiveEngine {
  return new QuantumDiveEngine(config)
}

// ============ Singleton Instance ============

export const quantumDiveEngine = new QuantumDiveEngine()
