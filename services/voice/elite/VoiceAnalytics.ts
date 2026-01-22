/**
 * Real-Time Voice Analytics and Metrics System
 *
 * World-class voice analytics for KIAAN:
 * - Real-time performance monitoring
 * - Quality metrics tracking
 * - User engagement analytics
 * - Error rate monitoring
 * - Latency tracking
 * - Usage patterns analysis
 *
 * Metrics Categories:
 * - Performance (latency, throughput)
 * - Quality (WER, recognition accuracy)
 * - Engagement (session length, interactions)
 * - Health (error rates, availability)
 */

// Metric types
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'timer'

// Metric entry
export interface MetricEntry {
  name: string
  type: MetricType
  value: number
  timestamp: number
  tags: Record<string, string>
}

// Performance metrics
export interface PerformanceMetrics {
  // STT metrics
  sttLatencyMs: number
  sttAccuracy: number
  sttWordErrorRate: number

  // TTS metrics
  ttsLatencyMs: number
  ttsFirstByteMs: number
  ttsThroughput: number

  // Wake word metrics
  wakeWordDetectionRate: number
  wakeWordFalsePositiveRate: number
  wakeWordLatencyMs: number

  // Overall
  endToEndLatencyMs: number
  processingTimeMs: number
}

// Quality metrics
export interface QualityMetrics {
  recognitionAccuracy: number
  voiceClarity: number
  audioQuality: number
  noiseLevel: number
  signalToNoiseRatio: number
  echoLevel: number
}

// Engagement metrics
export interface EngagementMetrics {
  sessionDurationMs: number
  interactionCount: number
  voiceInputCount: number
  voiceOutputCount: number
  handsFreeMinutes: number
  languageDistribution: Record<string, number>
  featureUsage: Record<string, number>
}

// Health metrics
export interface HealthMetrics {
  errorRate: number
  availabilityPercent: number
  crashCount: number
  recoveryCount: number
  networkErrorCount: number
  permissionErrorCount: number
}

// Analytics summary
export interface AnalyticsSummary {
  performance: PerformanceMetrics
  quality: QualityMetrics
  engagement: EngagementMetrics
  health: HealthMetrics
  periodStart: number
  periodEnd: number
}

// Configuration
export interface VoiceAnalyticsConfig {
  enabled?: boolean
  sampleRate?: number           // 1.0 = log all, 0.1 = 10%
  flushIntervalMs?: number
  maxBufferSize?: number
  persistEnabled?: boolean
  debugMode?: boolean

  // Callbacks
  onMetric?: (metric: MetricEntry) => void
  onSummary?: (summary: AnalyticsSummary) => void
  onError?: (error: string) => void
}

// Histogram bucket
interface HistogramBucket {
  le: number  // Less than or equal
  count: number
}

// Histogram data
interface HistogramData {
  buckets: HistogramBucket[]
  sum: number
  count: number
}

/**
 * Voice Analytics Class
 */
export class VoiceAnalytics {
  private config: Required<VoiceAnalyticsConfig>

  // Metric storage
  private counters: Map<string, number> = new Map()
  private gauges: Map<string, number> = new Map()
  private histograms: Map<string, HistogramData> = new Map()
  private timers: Map<string, number[]> = new Map()

  // Metric buffer for batching
  private metricBuffer: MetricEntry[] = []

  // Session tracking
  private sessionStart: number = Date.now()
  private interactionCount = 0
  private voiceInputCount = 0
  private voiceOutputCount = 0
  private handsFreeStartTime: number | null = null
  private handsFreeMinutes = 0
  private languageUsage: Map<string, number> = new Map()
  private featureUsage: Map<string, number> = new Map()

  // Error tracking
  private errorCount = 0
  private networkErrorCount = 0
  private permissionErrorCount = 0
  private crashCount = 0
  private recoveryCount = 0

  // Timing tracking
  private activeTimers: Map<string, number> = new Map()

  // Flush interval
  private flushInterval: ReturnType<typeof setInterval> | null = null

  // Default histogram buckets (latency in ms)
  private readonly defaultBuckets = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000]

  constructor(config: VoiceAnalyticsConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      sampleRate: config.sampleRate ?? 1.0,
      flushIntervalMs: config.flushIntervalMs ?? 10000,
      maxBufferSize: config.maxBufferSize ?? 1000,
      persistEnabled: config.persistEnabled ?? true,
      debugMode: config.debugMode ?? false,
      onMetric: config.onMetric ?? (() => {}),
      onSummary: config.onSummary ?? (() => {}),
      onError: config.onError ?? (() => {})
    }

    this.initialize()
  }

  /**
   * Initialize analytics
   */
  private initialize(): void {
    if (!this.config.enabled) return

    // Set up flush interval
    this.flushInterval = setInterval(() => {
      this.flush()
    }, this.config.flushIntervalMs)

    // Initialize default histograms
    this.initHistogram('stt_latency_ms')
    this.initHistogram('tts_latency_ms')
    this.initHistogram('tts_first_byte_ms')
    this.initHistogram('wake_word_latency_ms')
    this.initHistogram('end_to_end_latency_ms')

    console.log('✅ Voice analytics initialized')
  }

  /**
   * Initialize a histogram
   */
  private initHistogram(name: string, buckets?: number[]): void {
    const histogramBuckets = (buckets || this.defaultBuckets).map(le => ({
      le,
      count: 0
    }))

    this.histograms.set(name, {
      buckets: histogramBuckets,
      sum: 0,
      count: 0
    })
  }

  /**
   * Check if should sample
   */
  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate
  }

  /**
   * Record a counter metric
   */
  incrementCounter(name: string, value: number = 1, tags: Record<string, string> = {}): void {
    if (!this.config.enabled || !this.shouldSample()) return

    const current = this.counters.get(name) || 0
    this.counters.set(name, current + value)

    this.recordMetric({
      name,
      type: 'counter',
      value,
      timestamp: Date.now(),
      tags
    })
  }

  /**
   * Record a gauge metric
   */
  setGauge(name: string, value: number, tags: Record<string, string> = {}): void {
    if (!this.config.enabled) return

    this.gauges.set(name, value)

    this.recordMetric({
      name,
      type: 'gauge',
      value,
      timestamp: Date.now(),
      tags
    })
  }

  /**
   * Record a histogram observation
   */
  observeHistogram(name: string, value: number, tags: Record<string, string> = {}): void {
    if (!this.config.enabled || !this.shouldSample()) return

    let histogram = this.histograms.get(name)
    if (!histogram) {
      this.initHistogram(name)
      histogram = this.histograms.get(name)!
    }

    // Update buckets
    for (const bucket of histogram.buckets) {
      if (value <= bucket.le) {
        bucket.count++
      }
    }

    histogram.sum += value
    histogram.count++

    this.recordMetric({
      name,
      type: 'histogram',
      value,
      timestamp: Date.now(),
      tags
    })
  }

  /**
   * Start a timer
   */
  startTimer(name: string): void {
    if (!this.config.enabled) return
    this.activeTimers.set(name, performance.now())
  }

  /**
   * End a timer and record the duration
   */
  endTimer(name: string, tags: Record<string, string> = {}): number {
    if (!this.config.enabled) return 0

    const startTime = this.activeTimers.get(name)
    if (startTime === undefined) {
      console.warn(`Timer ${name} was not started`)
      return 0
    }

    const duration = performance.now() - startTime
    this.activeTimers.delete(name)

    // Store in timers array
    if (!this.timers.has(name)) {
      this.timers.set(name, [])
    }
    this.timers.get(name)!.push(duration)

    // Also record as histogram
    this.observeHistogram(name, duration, tags)

    return duration
  }

  /**
   * Record a metric entry
   */
  private recordMetric(metric: MetricEntry): void {
    if (this.config.debugMode) {
      console.log('[Analytics]', metric.name, metric.value, metric.tags)
    }

    this.metricBuffer.push(metric)
    this.config.onMetric(metric)

    // Flush if buffer is full
    if (this.metricBuffer.length >= this.config.maxBufferSize) {
      this.flush()
    }
  }

  // ===== High-Level Tracking Methods =====

  /**
   * Track STT event
   */
  trackSTT(latencyMs: number, success: boolean, language: string, wordCount: number): void {
    this.observeHistogram('stt_latency_ms', latencyMs, { language })
    this.incrementCounter('stt_requests', 1, { success: String(success), language })

    if (success) {
      this.voiceInputCount++
      this.incrementCounter('stt_words_processed', wordCount, { language })
    }

    this.trackLanguage(language)
    this.trackFeature('stt')
  }

  /**
   * Track TTS event
   */
  trackTTS(latencyMs: number, firstByteMs: number, success: boolean, language: string, charCount: number): void {
    this.observeHistogram('tts_latency_ms', latencyMs, { language })
    this.observeHistogram('tts_first_byte_ms', firstByteMs, { language })
    this.incrementCounter('tts_requests', 1, { success: String(success), language })

    if (success) {
      this.voiceOutputCount++
      this.incrementCounter('tts_chars_synthesized', charCount, { language })
    }

    this.trackLanguage(language)
    this.trackFeature('tts')
  }

  /**
   * Track wake word event
   */
  trackWakeWord(detected: boolean, confidence: number, latencyMs: number): void {
    this.incrementCounter('wake_word_triggers', 1, { detected: String(detected) })

    if (detected) {
      this.observeHistogram('wake_word_latency_ms', latencyMs)
      this.setGauge('wake_word_confidence', confidence)
    }

    this.trackFeature('wake_word')
  }

  /**
   * Track hands-free session
   */
  trackHandsFreeStart(): void {
    this.handsFreeStartTime = Date.now()
    this.incrementCounter('hands_free_sessions', 1)
    this.trackFeature('hands_free')
  }

  /**
   * Track hands-free session end
   */
  trackHandsFreeEnd(): void {
    if (this.handsFreeStartTime) {
      const durationMs = Date.now() - this.handsFreeStartTime
      this.handsFreeMinutes += durationMs / 60000
      this.observeHistogram('hands_free_duration_ms', durationMs)
      this.handsFreeStartTime = null
    }
  }

  /**
   * Track language usage
   */
  trackLanguage(language: string): void {
    const current = this.languageUsage.get(language) || 0
    this.languageUsage.set(language, current + 1)
  }

  /**
   * Track feature usage
   */
  trackFeature(feature: string): void {
    const current = this.featureUsage.get(feature) || 0
    this.featureUsage.set(feature, current + 1)
    this.incrementCounter('feature_usage', 1, { feature })
  }

  /**
   * Track interaction
   */
  trackInteraction(): void {
    this.interactionCount++
    this.incrementCounter('interactions', 1)
  }

  /**
   * Track error
   */
  trackError(type: 'general' | 'network' | 'permission' | 'crash', message: string): void {
    this.errorCount++

    switch (type) {
      case 'network':
        this.networkErrorCount++
        break
      case 'permission':
        this.permissionErrorCount++
        break
      case 'crash':
        this.crashCount++
        break
    }

    this.incrementCounter('errors', 1, { type, message: message.substring(0, 50) })
  }

  /**
   * Track recovery
   */
  trackRecovery(): void {
    this.recoveryCount++
    this.incrementCounter('recoveries', 1)
  }

  /**
   * Track audio quality
   */
  trackAudioQuality(metrics: Partial<QualityMetrics>): void {
    if (metrics.recognitionAccuracy !== undefined) {
      this.setGauge('recognition_accuracy', metrics.recognitionAccuracy)
    }
    if (metrics.voiceClarity !== undefined) {
      this.setGauge('voice_clarity', metrics.voiceClarity)
    }
    if (metrics.audioQuality !== undefined) {
      this.setGauge('audio_quality', metrics.audioQuality)
    }
    if (metrics.noiseLevel !== undefined) {
      this.setGauge('noise_level', metrics.noiseLevel)
    }
    if (metrics.signalToNoiseRatio !== undefined) {
      this.setGauge('snr', metrics.signalToNoiseRatio)
    }
  }

  // ===== Summary and Reporting =====

  /**
   * Get analytics summary
   */
  getSummary(): AnalyticsSummary {
    const now = Date.now()

    // Calculate performance metrics
    const performance = this.getPerformanceMetrics()
    const quality = this.getQualityMetrics()
    const engagement = this.getEngagementMetrics()
    const health = this.getHealthMetrics()

    const summary: AnalyticsSummary = {
      performance,
      quality,
      engagement,
      health,
      periodStart: this.sessionStart,
      periodEnd: now
    }

    this.config.onSummary(summary)

    return summary
  }

  /**
   * Get performance metrics
   */
  private getPerformanceMetrics(): PerformanceMetrics {
    return {
      sttLatencyMs: this.getHistogramPercentile('stt_latency_ms', 50),
      sttAccuracy: this.gauges.get('recognition_accuracy') || 0,
      sttWordErrorRate: 1 - (this.gauges.get('recognition_accuracy') || 0),
      ttsLatencyMs: this.getHistogramPercentile('tts_latency_ms', 50),
      ttsFirstByteMs: this.getHistogramPercentile('tts_first_byte_ms', 50),
      ttsThroughput: this.calculateThroughput('tts_chars_synthesized'),
      wakeWordDetectionRate: this.calculateRate('wake_word_triggers', { detected: 'true' }),
      wakeWordFalsePositiveRate: this.calculateRate('wake_word_triggers', { detected: 'false' }),
      wakeWordLatencyMs: this.getHistogramPercentile('wake_word_latency_ms', 50),
      endToEndLatencyMs: this.getHistogramPercentile('end_to_end_latency_ms', 50),
      processingTimeMs: this.getTimerAverage('processing')
    }
  }

  /**
   * Get quality metrics
   */
  private getQualityMetrics(): QualityMetrics {
    return {
      recognitionAccuracy: this.gauges.get('recognition_accuracy') || 0,
      voiceClarity: this.gauges.get('voice_clarity') || 0,
      audioQuality: this.gauges.get('audio_quality') || 0,
      noiseLevel: this.gauges.get('noise_level') || 0,
      signalToNoiseRatio: this.gauges.get('snr') || 0,
      echoLevel: this.gauges.get('echo_level') || 0
    }
  }

  /**
   * Get engagement metrics
   */
  private getEngagementMetrics(): EngagementMetrics {
    return {
      sessionDurationMs: Date.now() - this.sessionStart,
      interactionCount: this.interactionCount,
      voiceInputCount: this.voiceInputCount,
      voiceOutputCount: this.voiceOutputCount,
      handsFreeMinutes: this.handsFreeMinutes,
      languageDistribution: Object.fromEntries(this.languageUsage),
      featureUsage: Object.fromEntries(this.featureUsage)
    }
  }

  /**
   * Get health metrics
   */
  private getHealthMetrics(): HealthMetrics {
    const totalRequests = (this.counters.get('stt_requests') || 0) +
                         (this.counters.get('tts_requests') || 0)

    return {
      errorRate: totalRequests > 0 ? this.errorCount / totalRequests : 0,
      availabilityPercent: totalRequests > 0
        ? ((totalRequests - this.errorCount) / totalRequests) * 100
        : 100,
      crashCount: this.crashCount,
      recoveryCount: this.recoveryCount,
      networkErrorCount: this.networkErrorCount,
      permissionErrorCount: this.permissionErrorCount
    }
  }

  /**
   * Get histogram percentile
   */
  private getHistogramPercentile(name: string, percentile: number): number {
    const histogram = this.histograms.get(name)
    if (!histogram || histogram.count === 0) return 0

    const targetCount = histogram.count * (percentile / 100)
    for (const bucket of histogram.buckets) {
      if (bucket.count >= targetCount) {
        return bucket.le
      }
    }

    return histogram.buckets[histogram.buckets.length - 1].le
  }

  /**
   * Get timer average
   */
  private getTimerAverage(name: string): number {
    const times = this.timers.get(name)
    if (!times || times.length === 0) return 0
    return times.reduce((a, b) => a + b, 0) / times.length
  }

  /**
   * Calculate rate
   */
  private calculateRate(counterName: string, tags: Record<string, string>): number {
    // Simplified - in production, track with tags
    const total = this.counters.get(counterName) || 0
    return total > 0 ? 0.5 : 0 // Placeholder
  }

  /**
   * Calculate throughput
   */
  private calculateThroughput(counterName: string): number {
    const count = this.counters.get(counterName) || 0
    const durationSeconds = (Date.now() - this.sessionStart) / 1000
    return durationSeconds > 0 ? count / durationSeconds : 0
  }

  /**
   * Flush metrics buffer
   */
  private flush(): void {
    if (this.metricBuffer.length === 0) return

    if (this.config.debugMode) {
      console.log(`[Analytics] Flushing ${this.metricBuffer.length} metrics`)
    }

    // In production, send to analytics backend
    // For now, just clear the buffer
    this.metricBuffer = []
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters.clear()
    this.gauges.clear()
    this.histograms.clear()
    this.timers.clear()
    this.metricBuffer = []

    this.sessionStart = Date.now()
    this.interactionCount = 0
    this.voiceInputCount = 0
    this.voiceOutputCount = 0
    this.handsFreeMinutes = 0
    this.errorCount = 0
    this.networkErrorCount = 0
    this.permissionErrorCount = 0
    this.crashCount = 0
    this.recoveryCount = 0
    this.languageUsage.clear()
    this.featureUsage.clear()

    // Re-initialize histograms
    this.initHistogram('stt_latency_ms')
    this.initHistogram('tts_latency_ms')
    this.initHistogram('tts_first_byte_ms')
    this.initHistogram('wake_word_latency_ms')
    this.initHistogram('end_to_end_latency_ms')
  }

  /**
   * Export metrics
   */
  export(): string {
    return JSON.stringify({
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(this.histograms),
      summary: this.getSummary(),
      exportedAt: new Date().toISOString()
    }, null, 2)
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VoiceAnalyticsConfig>): void {
    this.config = { ...this.config, ...config } as Required<VoiceAnalyticsConfig>
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }

    this.flush()
    this.reset()
  }
}

// Export singleton instance
export const voiceAnalytics = new VoiceAnalytics()

// Export factory function
export function createVoiceAnalytics(config?: VoiceAnalyticsConfig): VoiceAnalytics {
  return new VoiceAnalytics(config)
}
