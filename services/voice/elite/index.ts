/**
 * Elite KIAAN Voice AI Services
 *
 * World-class voice AI system with comprehensive features:
 *
 * Core Services:
 * - GitaKnowledgeBase: Offline-first database with 700 verses
 * - OfflineAIEngine: Template-based response generation
 * - EliteNeuralTTS: Neural TTS with emotional prosody
 * - ConversationManager: Cross-session memory management
 *
 * Advanced Services:
 * - NeuralWakeWordEngine: TensorFlow.js-powered wake word detection
 * - VoiceActivityDetector: Real-time VAD with adaptive thresholds
 * - StreamingTTSEngine: Progressive audio playback
 * - AudioProcessingPipeline: Noise suppression & enhancement
 * - EmotionAwareVoice: Real-time emotion detection & adaptation
 * - UnifiedLanguageSupport: 17-language full-stack support
 * - OnDeviceWhisperSTT: Offline speech-to-text
 * - VectorConversationMemory: Semantic memory with embeddings
 * - VoiceAnalytics: Real-time metrics and monitoring
 */

// Type imports for function signatures
import type { NeuralWakeWordEngine } from './NeuralWakeWordEngine'
import type { OnDeviceWhisperSTT } from './OnDeviceWhisperSTT'
import type { VoiceAnalytics } from './VoiceAnalytics'
import type { VectorConversationMemory } from './VectorConversationMemory'
import type { LanguageConfig } from './UnifiedLanguageSupport'

// ============ Core Services ============

export {
  gitaKnowledgeBase,
  GitaKnowledgeBase,
  type EliteGitaVerse,
  type VoiceUserProfile,
  type VoiceConversation,
  type VerseSearchResult,
  type ConcernDetection
} from './GitaKnowledgeBase'

export {
  offlineAIEngine,
  OfflineAIEngine,
  type GeneratedResponse,
  type ResponseContext
} from './OfflineAIEngine'

export {
  eliteNeuralTTS,
  EliteNeuralTTS,
  type TTSConfig,
  type TTSCallbacks,
  type TTSState,
  type VoiceOption
} from './EliteNeuralTTS'

export {
  conversationManager,
  ConversationManager,
  createConversationManager,
  type ConversationContext,
  type AddMessageOptions,
  type ConversationSummary
} from './ConversationManager'

// ============ Advanced Services ============

// Neural Wake Word Detection
export {
  NeuralWakeWordEngine,
  createNeuralWakeWordEngine,
  type NeuralWakeWordConfig,
  type WakeWordDetection,
  type WakeWordVariant
} from './NeuralWakeWordEngine'

// Voice Activity Detection
export {
  VoiceActivityDetector,
  createVoiceActivityDetector,
  type VADConfig,
  type VADState
} from './VoiceActivityDetector'

// Streaming TTS Engine
export {
  StreamingTTSEngine,
  createStreamingTTSEngine,
  type StreamingTTSConfig,
  type StreamingState,
  type AudioChunk
} from './StreamingTTSEngine'

// Audio Processing Pipeline
export {
  AudioProcessingPipeline,
  createAudioProcessingPipeline,
  type AudioPipelineConfig,
  type ProcessingMetrics
} from './AudioProcessingPipeline'

// Emotion-Aware Voice
export {
  EmotionAwareVoice,
  createEmotionAwareVoice,
  type EmotionAwareConfig,
  type EmotionDetection,
  type VoiceAdaptation,
  type PrimaryEmotion
} from './EmotionAwareVoice'

// Unified Language Support
export {
  UnifiedLanguageSupport,
  languageSupport,
  createLanguageSupport,
  SUPPORTED_LANGUAGES,
  type LanguageConfig,
  type LanguageVoiceProfile,
  type LanguageDetection
} from './UnifiedLanguageSupport'

// On-Device Whisper STT
export {
  OnDeviceWhisperSTT,
  createOnDeviceWhisperSTT,
  type WhisperSTTConfig,
  type WhisperSTTState,
  type TranscriptionResult,
  type TranscriptionSegment,
  type WhisperModelSize
} from './OnDeviceWhisperSTT'

// Vector Conversation Memory
export {
  VectorConversationMemory,
  createVectorConversationMemory,
  type VectorMemoryConfig,
  type MemoryEntry,
  type MemorySearchResult,
  type MemorySummary
} from './VectorConversationMemory'

// Voice Analytics
export {
  VoiceAnalytics,
  voiceAnalytics,
  createVoiceAnalytics,
  type VoiceAnalyticsConfig,
  type AnalyticsSummary,
  type PerformanceMetrics,
  type QualityMetrics,
  type EngagementMetrics,
  type HealthMetrics
} from './VoiceAnalytics'

// Quantum Dive Engine
export {
  QuantumDiveEngine,
  quantumDiveEngine,
  createQuantumDiveEngine,
  type QuantumDiveConfig,
  type QuantumDiveInput,
  type QuantumDiveAnalysis,
  type QuantumState,
  type QuantumInsight,
  type WisdomRecommendation,
  type PracticeRecommendation,
  type ConsciousnessLayer,
  type TemporalPattern,
  type WeeklyReflectionData,
  type DailyAnalysisData
} from './QuantumDiveEngine'

// Quantum Dive Orchestrator
export {
  QuantumDiveOrchestrator,
  quantumDiveOrchestrator,
  createQuantumDiveOrchestrator,
  type QuantumDiveOrchestratorConfig,
  type QuantumDiveSession,
  type QuantumDiveStage,
  type VoiceNarration,
  type UserResponse
} from './QuantumDiveOrchestrator'

// ============ Initialization ============

/**
 * Initialize all elite voice services
 *
 * Call this on app startup to warm caches and prepare services.
 */
export async function initializeEliteVoiceServices(): Promise<void> {
  const { gitaKnowledgeBase } = await import('./GitaKnowledgeBase')
  const { conversationManager } = await import('./ConversationManager')
  const { languageSupport } = await import('./UnifiedLanguageSupport')

  console.log('Initializing Elite KIAAN Voice Services...')

  try {
    // Initialize Gita knowledge base (seeds verses if needed)
    await gitaKnowledgeBase.initialize()

    // Initialize conversation manager
    await conversationManager.initialize()

    // Language support initializes automatically
    console.log(`Language support ready: ${languageSupport.getSupportedLanguages().length} languages`)

    console.log('Elite Voice Services initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Elite Voice Services:', error)
    throw error
  }
}

/**
 * Initialize advanced voice features
 *
 * Call this for full voice experience with all advanced features.
 */
export async function initializeAdvancedVoiceFeatures(options?: {
  enableWakeWord?: boolean
  enableWhisper?: boolean
  enableAnalytics?: boolean
  enableVectorMemory?: boolean
}): Promise<{
  wakeWord?: NeuralWakeWordEngine
  whisper?: OnDeviceWhisperSTT
  analytics?: VoiceAnalytics
  memory?: VectorConversationMemory
}> {
  const result: {
    wakeWord?: NeuralWakeWordEngine
    whisper?: OnDeviceWhisperSTT
    analytics?: VoiceAnalytics
    memory?: VectorConversationMemory
  } = {}

  console.log('Initializing Advanced Voice Features...')

  // Wake word detection
  if (options?.enableWakeWord !== false) {
    const { createNeuralWakeWordEngine, NeuralWakeWordEngine } = await import('./NeuralWakeWordEngine')
    if (NeuralWakeWordEngine.isSupported()) {
      result.wakeWord = createNeuralWakeWordEngine()
      console.log('Wake word detection ready')
    }
  }

  // Whisper STT
  if (options?.enableWhisper) {
    const { createOnDeviceWhisperSTT, OnDeviceWhisperSTT } = await import('./OnDeviceWhisperSTT')
    if (OnDeviceWhisperSTT.isSupported()) {
      result.whisper = createOnDeviceWhisperSTT()
      console.log('On-device Whisper STT ready')
    }
  }

  // Analytics
  if (options?.enableAnalytics !== false) {
    const { createVoiceAnalytics } = await import('./VoiceAnalytics')
    result.analytics = createVoiceAnalytics({ enabled: true })
    console.log('Voice analytics ready')
  }

  // Vector memory
  if (options?.enableVectorMemory !== false) {
    const { createVectorConversationMemory } = await import('./VectorConversationMemory')
    result.memory = createVectorConversationMemory()
    await result.memory.initialize()
    console.log('Vector conversation memory ready')
  }

  console.log('Advanced Voice Features initialized')

  return result
}

/**
 * Get comprehensive voice service status
 */
export function getVoiceServiceStatus(): {
  core: {
    gitaDbReady: boolean
    ttsSupported: boolean
    conversationReady: boolean
  }
  advanced: {
    wakeWordSupported: boolean
    vadSupported: boolean
    streamingTtsSupported: boolean
    audioProcessingSupported: boolean
    emotionDetectionSupported: boolean
    whisperSupported: boolean
    vectorMemorySupported: boolean
  }
  languages: {
    total: number
    sttSupported: number
    ttsSupported: number
    offlineSupported: number
  }
} {
  const { eliteNeuralTTS } = require('./EliteNeuralTTS')
  const { NeuralWakeWordEngine } = require('./NeuralWakeWordEngine')
  const { VoiceActivityDetector } = require('./VoiceActivityDetector')
  const { StreamingTTSEngine } = require('./StreamingTTSEngine')
  const { AudioProcessingPipeline } = require('./AudioProcessingPipeline')
  const { EmotionAwareVoice } = require('./EmotionAwareVoice')
  const { OnDeviceWhisperSTT } = require('./OnDeviceWhisperSTT')
  const { SUPPORTED_LANGUAGES } = require('./UnifiedLanguageSupport')

  const languages = Object.values(SUPPORTED_LANGUAGES) as LanguageConfig[]

  return {
    core: {
      gitaDbReady: true,
      ttsSupported: eliteNeuralTTS.isSupported(),
      conversationReady: true
    },
    advanced: {
      wakeWordSupported: NeuralWakeWordEngine.isSupported(),
      vadSupported: VoiceActivityDetector.isSupported(),
      streamingTtsSupported: StreamingTTSEngine.isSupported(),
      audioProcessingSupported: AudioProcessingPipeline.isSupported(),
      emotionDetectionSupported: EmotionAwareVoice.isSupported(),
      whisperSupported: OnDeviceWhisperSTT.isSupported(),
      vectorMemorySupported: true
    },
    languages: {
      total: languages.length,
      sttSupported: languages.filter(l => l.sttSupported).length,
      ttsSupported: languages.filter(l => l.ttsSupported).length,
      offlineSupported: languages.filter(l => l.offlineSupported).length
    }
  }
}
