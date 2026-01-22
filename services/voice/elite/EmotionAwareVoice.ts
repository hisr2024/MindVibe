/**
 * Emotion-Aware Voice Adaptation System
 *
 * World-class emotional intelligence for voice interaction:
 * - Real-time emotion detection from voice
 * - Adaptive TTS response based on user emotion
 * - Empathetic voice modulation
 * - Sentiment tracking over conversation
 * - Context-aware tone adjustment
 *
 * Supported emotions:
 * - Happy, Sad, Angry, Fearful, Surprised
 * - Calm, Anxious, Frustrated, Hopeful
 * - Neutral
 */

// Emotion types
export type PrimaryEmotion =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'fearful'
  | 'surprised'
  | 'calm'
  | 'anxious'
  | 'frustrated'
  | 'hopeful'
  | 'neutral'

// Emotion detection result
export interface EmotionDetection {
  primary: PrimaryEmotion
  confidence: number
  secondary?: PrimaryEmotion
  secondaryConfidence?: number
  arousal: number      // Energy level (0-1, low to high)
  valence: number      // Positivity (-1 to 1, negative to positive)
  dominance: number    // Control feeling (0-1, submissive to dominant)
  timestamp: number
}

// Voice adaptation settings
export interface VoiceAdaptation {
  speechRate: number       // 0.5 - 1.5
  pitch: number            // 0.5 - 1.5
  volume: number           // 0.5 - 1.0
  emotionalTone: 'compassionate' | 'encouraging' | 'meditative' | 'energetic' | 'calm'
  pauseDuration: number    // Multiplier for pauses
  warmth: number           // 0-1
  energy: number           // 0-1
}

// Configuration
export interface EmotionAwareConfig {
  // Detection settings
  enableEmotionDetection?: boolean
  detectionInterval?: number      // ms between detections

  // Adaptation settings
  enableAdaptation?: boolean
  adaptationSmoothness?: number   // 0-1, how gradually to change

  // Thresholds
  confidenceThreshold?: number    // Min confidence to act on emotion

  // Callbacks
  onEmotionDetected?: (emotion: EmotionDetection) => void
  onAdaptationChanged?: (adaptation: VoiceAdaptation) => void
  onError?: (error: string) => void
}

// Audio features for emotion detection
interface AudioFeatures {
  pitch: number
  pitchVariability: number
  energy: number
  energyVariability: number
  spectralCentroid: number
  speechRate: number
  pauseRatio: number
  zeroCrossingRate: number
}

// Emotion history entry
interface EmotionHistoryEntry {
  emotion: EmotionDetection
  timestamp: number
}

/**
 * Emotion-Aware Voice System Class
 */
export class EmotionAwareVoice {
  private config: Required<EmotionAwareConfig>

  // Audio analysis
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private mediaStream: MediaStream | null = null

  // Detection state
  private isAnalyzing = false
  private analysisInterval: ReturnType<typeof setInterval> | null = null

  // Emotion state
  private currentEmotion: EmotionDetection = this.createNeutralEmotion()
  private emotionHistory: EmotionHistoryEntry[] = []
  private readonly maxHistorySize = 20

  // Voice adaptation
  private currentAdaptation: VoiceAdaptation = this.createDefaultAdaptation()
  private targetAdaptation: VoiceAdaptation = this.createDefaultAdaptation()

  // Feature buffers for analysis
  private pitchBuffer: number[] = []
  private energyBuffer: number[] = []
  private spectralBuffer: number[] = []

  // Baseline calibration
  private baselinePitch = 150
  private baselineEnergy = 0.1
  private isCalibrated = false

  constructor(config: EmotionAwareConfig = {}) {
    this.config = {
      enableEmotionDetection: config.enableEmotionDetection ?? true,
      detectionInterval: config.detectionInterval ?? 500,
      enableAdaptation: config.enableAdaptation ?? true,
      adaptationSmoothness: config.adaptationSmoothness ?? 0.3,
      confidenceThreshold: config.confidenceThreshold ?? 0.6,
      onEmotionDetected: config.onEmotionDetected ?? (() => {}),
      onAdaptationChanged: config.onAdaptationChanged ?? (() => {}),
      onError: config.onError ?? (() => {})
    }
  }

  /**
   * Create neutral emotion state
   */
  private createNeutralEmotion(): EmotionDetection {
    return {
      primary: 'neutral',
      confidence: 1.0,
      arousal: 0.5,
      valence: 0,
      dominance: 0.5,
      timestamp: Date.now()
    }
  }

  /**
   * Create default voice adaptation
   */
  private createDefaultAdaptation(): VoiceAdaptation {
    return {
      speechRate: 0.95,
      pitch: 1.0,
      volume: 0.9,
      emotionalTone: 'compassionate',
      pauseDuration: 1.0,
      warmth: 0.7,
      energy: 0.5
    }
  }

  /**
   * Start emotion analysis
   */
  async startAnalysis(mediaStream?: MediaStream): Promise<void> {
    if (this.isAnalyzing) {
      console.warn('Emotion analysis already running')
      return
    }

    try {
      // Get or use provided stream
      this.mediaStream = mediaStream || await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false
        }
      })

      // Create audio context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      this.audioContext = new AudioContextClass()

      // Create analyser
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 2048
      this.analyser.smoothingTimeConstant = 0.5

      // Connect source
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream)
      this.source.connect(this.analyser)

      // Start periodic analysis
      this.isAnalyzing = true
      this.analysisInterval = setInterval(() => {
        this.analyzeEmotion()
      }, this.config.detectionInterval)

      // Calibrate baseline
      await this.calibrateBaseline()

      console.log('✅ Emotion analysis started')

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to start emotion analysis'
      this.config.onError(errorMsg)
      throw error
    }
  }

  /**
   * Stop emotion analysis
   */
  stopAnalysis(): void {
    this.isAnalyzing = false

    if (this.analysisInterval) {
      clearInterval(this.analysisInterval)
      this.analysisInterval = null
    }

    if (this.source) {
      this.source.disconnect()
      this.source = null
    }

    if (this.analyser) {
      this.analyser.disconnect()
      this.analyser = null
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {})
      this.audioContext = null
    }

    // Don't stop media stream if it was provided externally
    this.mediaStream = null

    console.log('Emotion analysis stopped')
  }

  /**
   * Calibrate baseline for user's voice
   */
  private async calibrateBaseline(): Promise<void> {
    return new Promise((resolve) => {
      let sampleCount = 0
      const maxSamples = 10
      let pitchSum = 0
      let energySum = 0

      const calibrationInterval = setInterval(() => {
        if (!this.analyser) {
          clearInterval(calibrationInterval)
          resolve()
          return
        }

        const features = this.extractFeatures()
        if (features.energy > 0.01) {
          pitchSum += features.pitch
          energySum += features.energy
          sampleCount++
        }

        if (sampleCount >= maxSamples) {
          clearInterval(calibrationInterval)
          this.baselinePitch = pitchSum / sampleCount
          this.baselineEnergy = energySum / sampleCount
          this.isCalibrated = true
          console.log(`Baseline calibrated: pitch=${this.baselinePitch.toFixed(1)}Hz, energy=${this.baselineEnergy.toFixed(3)}`)
          resolve()
        }
      }, 200)

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(calibrationInterval)
        if (!this.isCalibrated) {
          // Use defaults
          this.isCalibrated = true
          resolve()
        }
      }, 5000)
    })
  }

  /**
   * Analyze current audio for emotion
   */
  private analyzeEmotion(): void {
    if (!this.analyser || !this.isAnalyzing) return

    // Extract features
    const features = this.extractFeatures()

    // Skip if too quiet (no speech)
    if (features.energy < 0.01) return

    // Update feature buffers
    this.updateFeatureBuffers(features)

    // Detect emotion from features
    const emotion = this.detectEmotionFromFeatures(features)

    // Only update if confident enough
    if (emotion.confidence >= this.config.confidenceThreshold) {
      this.currentEmotion = emotion

      // Add to history
      this.emotionHistory.push({
        emotion,
        timestamp: Date.now()
      })

      // Trim history
      if (this.emotionHistory.length > this.maxHistorySize) {
        this.emotionHistory.shift()
      }

      // Notify listeners
      this.config.onEmotionDetected(emotion)

      // Update voice adaptation if enabled
      if (this.config.enableAdaptation) {
        this.updateVoiceAdaptation(emotion)
      }
    }
  }

  /**
   * Extract audio features for emotion detection
   */
  private extractFeatures(): AudioFeatures {
    if (!this.analyser) {
      return this.createDefaultFeatures()
    }

    const bufferLength = this.analyser.frequencyBinCount
    const timeData = new Float32Array(bufferLength)
    const freqData = new Float32Array(bufferLength)

    this.analyser.getFloatTimeDomainData(timeData)
    this.analyser.getFloatFrequencyData(freqData)

    // Calculate features
    const energy = this.calculateEnergy(timeData)
    const pitch = this.estimatePitch(timeData)
    const spectralCentroid = this.calculateSpectralCentroid(freqData)
    const zeroCrossingRate = this.calculateZeroCrossingRate(timeData)

    // Variability from buffer history
    const pitchVariability = this.calculateVariability(this.pitchBuffer)
    const energyVariability = this.calculateVariability(this.energyBuffer)

    // Estimate speech rate (simplified)
    const speechRate = this.estimateSpeechRate(timeData)

    // Pause ratio (simplified)
    const pauseRatio = energy < 0.02 ? 1 : 0

    return {
      pitch,
      pitchVariability,
      energy,
      energyVariability,
      spectralCentroid,
      speechRate,
      pauseRatio,
      zeroCrossingRate
    }
  }

  /**
   * Create default features
   */
  private createDefaultFeatures(): AudioFeatures {
    return {
      pitch: 150,
      pitchVariability: 0,
      energy: 0,
      energyVariability: 0,
      spectralCentroid: 0,
      speechRate: 0,
      pauseRatio: 1,
      zeroCrossingRate: 0
    }
  }

  /**
   * Calculate RMS energy
   */
  private calculateEnergy(samples: Float32Array): number {
    let sum = 0
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i]
    }
    return Math.sqrt(sum / samples.length)
  }

  /**
   * Estimate fundamental frequency (pitch)
   */
  private estimatePitch(samples: Float32Array): number {
    // Autocorrelation-based pitch detection
    const sampleRate = this.audioContext?.sampleRate ?? 44100
    const minPeriod = Math.floor(sampleRate / 500) // Max 500Hz
    const maxPeriod = Math.floor(sampleRate / 60)  // Min 60Hz

    let bestCorrelation = 0
    let bestPeriod = 0

    for (let period = minPeriod; period < maxPeriod && period < samples.length / 2; period++) {
      let correlation = 0
      for (let i = 0; i < samples.length - period; i++) {
        correlation += samples[i] * samples[i + period]
      }
      correlation /= (samples.length - period)

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation
        bestPeriod = period
      }
    }

    return bestPeriod > 0 ? sampleRate / bestPeriod : 150
  }

  /**
   * Calculate spectral centroid
   */
  private calculateSpectralCentroid(freqData: Float32Array): number {
    let weightedSum = 0
    let sum = 0
    const sampleRate = this.audioContext?.sampleRate ?? 44100
    const binWidth = sampleRate / (freqData.length * 2)

    for (let i = 0; i < freqData.length; i++) {
      const magnitude = Math.pow(10, freqData[i] / 20)
      const frequency = i * binWidth
      weightedSum += frequency * magnitude
      sum += magnitude
    }

    return sum > 0 ? weightedSum / sum : 0
  }

  /**
   * Calculate zero-crossing rate
   */
  private calculateZeroCrossingRate(samples: Float32Array): number {
    let crossings = 0
    for (let i = 1; i < samples.length; i++) {
      if ((samples[i] >= 0) !== (samples[i - 1] >= 0)) {
        crossings++
      }
    }
    return crossings / samples.length
  }

  /**
   * Estimate speech rate
   */
  private estimateSpeechRate(samples: Float32Array): number {
    // Count energy peaks (syllables)
    const windowSize = 256
    let peaks = 0
    let prevEnergy = 0

    for (let i = 0; i < samples.length - windowSize; i += windowSize) {
      let energy = 0
      for (let j = 0; j < windowSize; j++) {
        energy += samples[i + j] * samples[i + j]
      }
      energy = Math.sqrt(energy / windowSize)

      if (energy > 0.02 && energy > prevEnergy * 1.2) {
        peaks++
      }
      prevEnergy = energy
    }

    return peaks
  }

  /**
   * Calculate variability of buffer
   */
  private calculateVariability(buffer: number[]): number {
    if (buffer.length < 2) return 0

    const mean = buffer.reduce((a, b) => a + b, 0) / buffer.length
    const variance = buffer.reduce((sum, val) => sum + (val - mean) ** 2, 0) / buffer.length
    return Math.sqrt(variance)
  }

  /**
   * Update feature buffers
   */
  private updateFeatureBuffers(features: AudioFeatures): void {
    const maxBufferSize = 20

    this.pitchBuffer.push(features.pitch)
    this.energyBuffer.push(features.energy)
    this.spectralBuffer.push(features.spectralCentroid)

    if (this.pitchBuffer.length > maxBufferSize) this.pitchBuffer.shift()
    if (this.energyBuffer.length > maxBufferSize) this.energyBuffer.shift()
    if (this.spectralBuffer.length > maxBufferSize) this.spectralBuffer.shift()
  }

  /**
   * Detect emotion from audio features
   */
  private detectEmotionFromFeatures(features: AudioFeatures): EmotionDetection {
    // Normalize features relative to baseline
    const normalizedPitch = this.isCalibrated ? features.pitch / this.baselinePitch : 1
    const normalizedEnergy = this.isCalibrated ? features.energy / Math.max(this.baselineEnergy, 0.01) : 1

    // Calculate arousal (energy/activation)
    const arousal = Math.min(1, Math.max(0,
      0.4 * normalizedEnergy +
      0.3 * (features.speechRate / 5) +
      0.3 * (features.pitchVariability / 50)
    ))

    // Calculate valence (positive/negative)
    // Higher pitch + higher pitch variability tends to indicate positive emotions
    const valence = Math.min(1, Math.max(-1,
      0.4 * (normalizedPitch - 1) +
      0.3 * (features.pitchVariability / 30 - 0.5) +
      0.3 * (features.spectralCentroid / 2000 - 0.5)
    ))

    // Calculate dominance
    const dominance = Math.min(1, Math.max(0,
      0.5 * normalizedEnergy +
      0.3 * (1 - features.pauseRatio) +
      0.2 * (features.spectralCentroid / 3000)
    ))

    // Classify emotion based on arousal/valence/dominance
    const emotion = this.classifyEmotion(arousal, valence, dominance, features)

    return {
      ...emotion,
      arousal,
      valence,
      dominance,
      timestamp: Date.now()
    }
  }

  /**
   * Classify emotion based on dimensions
   */
  private classifyEmotion(
    arousal: number,
    valence: number,
    dominance: number,
    features: AudioFeatures
  ): Pick<EmotionDetection, 'primary' | 'confidence' | 'secondary' | 'secondaryConfidence'> {
    // Emotion classification rules
    const scores: Record<PrimaryEmotion, number> = {
      happy: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      surprised: 0,
      calm: 0,
      anxious: 0,
      frustrated: 0,
      hopeful: 0,
      neutral: 0.3 // Base score
    }

    // Happy: high arousal, positive valence
    if (arousal > 0.5 && valence > 0.2) {
      scores.happy = 0.4 + arousal * 0.3 + valence * 0.3
    }

    // Sad: low arousal, negative valence, low dominance
    if (arousal < 0.4 && valence < -0.2 && dominance < 0.5) {
      scores.sad = 0.4 + (1 - arousal) * 0.3 + (-valence) * 0.3
    }

    // Angry: high arousal, negative valence, high dominance
    if (arousal > 0.6 && valence < -0.1 && dominance > 0.5) {
      scores.angry = 0.3 + arousal * 0.3 + (-valence) * 0.2 + dominance * 0.2
    }

    // Fearful: high arousal, negative valence, low dominance
    if (arousal > 0.5 && valence < 0 && dominance < 0.4) {
      scores.fearful = 0.3 + arousal * 0.3 + (-valence) * 0.2 + (1 - dominance) * 0.2
    }

    // Surprised: high arousal, variable pitch
    if (arousal > 0.6 && features.pitchVariability > 40) {
      scores.surprised = 0.3 + arousal * 0.4 + (features.pitchVariability / 100) * 0.3
    }

    // Calm: low arousal, neutral-positive valence
    if (arousal < 0.4 && valence > -0.2 && valence < 0.3) {
      scores.calm = 0.4 + (1 - arousal) * 0.4 + (1 - Math.abs(valence)) * 0.2
    }

    // Anxious: moderate-high arousal, slight negative valence, low dominance
    if (arousal > 0.4 && arousal < 0.7 && valence < 0 && dominance < 0.5) {
      scores.anxious = 0.3 + arousal * 0.3 + (-valence) * 0.2 + (1 - dominance) * 0.2
    }

    // Frustrated: moderate arousal, negative valence
    if (arousal > 0.4 && valence < -0.1) {
      scores.frustrated = 0.2 + arousal * 0.3 + (-valence) * 0.4
    }

    // Hopeful: moderate arousal, positive valence
    if (arousal > 0.3 && arousal < 0.6 && valence > 0.1) {
      scores.hopeful = 0.3 + valence * 0.4 + arousal * 0.3
    }

    // Find primary and secondary emotions
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])
    const primary = sorted[0][0] as PrimaryEmotion
    const primaryScore = sorted[0][1]
    const secondary = sorted[1][0] as PrimaryEmotion
    const secondaryScore = sorted[1][1]

    return {
      primary,
      confidence: Math.min(1, primaryScore),
      secondary: secondaryScore > 0.3 ? secondary : undefined,
      secondaryConfidence: secondaryScore > 0.3 ? secondaryScore : undefined
    }
  }

  /**
   * Update voice adaptation based on detected emotion
   */
  private updateVoiceAdaptation(emotion: EmotionDetection): void {
    // Map emotions to voice adaptations
    const adaptationMap: Record<PrimaryEmotion, Partial<VoiceAdaptation>> = {
      happy: {
        speechRate: 1.0,
        pitch: 1.05,
        emotionalTone: 'energetic',
        warmth: 0.8,
        energy: 0.7
      },
      sad: {
        speechRate: 0.85,
        pitch: 0.95,
        emotionalTone: 'compassionate',
        warmth: 0.9,
        energy: 0.3,
        pauseDuration: 1.3
      },
      angry: {
        speechRate: 0.9,
        pitch: 1.0,
        emotionalTone: 'calm',
        warmth: 0.6,
        energy: 0.4,
        pauseDuration: 1.2
      },
      fearful: {
        speechRate: 0.9,
        pitch: 1.0,
        emotionalTone: 'compassionate',
        warmth: 0.85,
        energy: 0.4,
        pauseDuration: 1.2
      },
      surprised: {
        speechRate: 0.95,
        pitch: 1.0,
        emotionalTone: 'encouraging',
        warmth: 0.7,
        energy: 0.6
      },
      calm: {
        speechRate: 0.95,
        pitch: 1.0,
        emotionalTone: 'meditative',
        warmth: 0.7,
        energy: 0.5
      },
      anxious: {
        speechRate: 0.85,
        pitch: 0.98,
        emotionalTone: 'compassionate',
        warmth: 0.85,
        energy: 0.35,
        pauseDuration: 1.4
      },
      frustrated: {
        speechRate: 0.88,
        pitch: 0.98,
        emotionalTone: 'compassionate',
        warmth: 0.8,
        energy: 0.4,
        pauseDuration: 1.3
      },
      hopeful: {
        speechRate: 0.95,
        pitch: 1.02,
        emotionalTone: 'encouraging',
        warmth: 0.8,
        energy: 0.6
      },
      neutral: {
        speechRate: 0.95,
        pitch: 1.0,
        emotionalTone: 'compassionate',
        warmth: 0.7,
        energy: 0.5
      }
    }

    const newAdaptation = {
      ...this.createDefaultAdaptation(),
      ...adaptationMap[emotion.primary]
    }

    // Smooth transition
    this.targetAdaptation = newAdaptation
    this.smoothAdaptation()

    this.config.onAdaptationChanged(this.currentAdaptation)
  }

  /**
   * Smooth transition to target adaptation
   */
  private smoothAdaptation(): void {
    const smoothness = this.config.adaptationSmoothness

    this.currentAdaptation = {
      speechRate: this.lerp(this.currentAdaptation.speechRate, this.targetAdaptation.speechRate, smoothness),
      pitch: this.lerp(this.currentAdaptation.pitch, this.targetAdaptation.pitch, smoothness),
      volume: this.lerp(this.currentAdaptation.volume, this.targetAdaptation.volume, smoothness),
      emotionalTone: this.targetAdaptation.emotionalTone,
      pauseDuration: this.lerp(this.currentAdaptation.pauseDuration, this.targetAdaptation.pauseDuration, smoothness),
      warmth: this.lerp(this.currentAdaptation.warmth, this.targetAdaptation.warmth, smoothness),
      energy: this.lerp(this.currentAdaptation.energy, this.targetAdaptation.energy, smoothness)
    }
  }

  /**
   * Linear interpolation
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
  }

  /**
   * Get current emotion
   */
  getCurrentEmotion(): EmotionDetection {
    return { ...this.currentEmotion }
  }

  /**
   * Get current voice adaptation
   */
  getCurrentAdaptation(): VoiceAdaptation {
    return { ...this.currentAdaptation }
  }

  /**
   * Get emotion history
   */
  getEmotionHistory(): EmotionHistoryEntry[] {
    return [...this.emotionHistory]
  }

  /**
   * Get emotional trend over history
   */
  getEmotionalTrend(): { arousal: 'increasing' | 'stable' | 'decreasing'; valence: 'improving' | 'stable' | 'declining' } {
    if (this.emotionHistory.length < 5) {
      return { arousal: 'stable', valence: 'stable' }
    }

    const recent = this.emotionHistory.slice(-5)
    const older = this.emotionHistory.slice(-10, -5)

    if (older.length === 0) {
      return { arousal: 'stable', valence: 'stable' }
    }

    const recentArousal = recent.reduce((sum, e) => sum + e.emotion.arousal, 0) / recent.length
    const olderArousal = older.reduce((sum, e) => sum + e.emotion.arousal, 0) / older.length
    const recentValence = recent.reduce((sum, e) => sum + e.emotion.valence, 0) / recent.length
    const olderValence = older.reduce((sum, e) => sum + e.emotion.valence, 0) / older.length

    const arousalDiff = recentArousal - olderArousal
    const valenceDiff = recentValence - olderValence

    return {
      arousal: arousalDiff > 0.1 ? 'increasing' : arousalDiff < -0.1 ? 'decreasing' : 'stable',
      valence: valenceDiff > 0.1 ? 'improving' : valenceDiff < -0.1 ? 'declining' : 'stable'
    }
  }

  /**
   * Manually set emotion (for text-based detection)
   */
  setDetectedEmotion(emotion: Partial<EmotionDetection>): void {
    this.currentEmotion = {
      ...this.currentEmotion,
      ...emotion,
      timestamp: Date.now()
    }

    this.emotionHistory.push({
      emotion: this.currentEmotion,
      timestamp: Date.now()
    })

    if (this.emotionHistory.length > this.maxHistorySize) {
      this.emotionHistory.shift()
    }

    this.config.onEmotionDetected(this.currentEmotion)

    if (this.config.enableAdaptation) {
      this.updateVoiceAdaptation(this.currentEmotion)
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<EmotionAwareConfig>): void {
    this.config = { ...this.config, ...config } as Required<EmotionAwareConfig>
  }

  /**
   * Check if supported
   */
  static isSupported(): boolean {
    return !!(
      typeof window !== 'undefined' &&
      typeof navigator?.mediaDevices?.getUserMedia === 'function' &&
      (window.AudioContext || (window as any).webkitAudioContext)
    )
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAnalysis()
    this.emotionHistory = []
    this.pitchBuffer = []
    this.energyBuffer = []
    this.spectralBuffer = []
  }
}

// Export factory function
export function createEmotionAwareVoice(config?: EmotionAwareConfig): EmotionAwareVoice {
  return new EmotionAwareVoice(config)
}
