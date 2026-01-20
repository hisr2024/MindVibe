/**
 * Elite KIAAN Voice AI Services
 *
 * Export all elite voice AI components for easy importing.
 *
 * Services:
 * - GitaKnowledgeBase: Offline-first database with 700 verses
 * - OfflineAIEngine: Template-based response generation
 * - EliteNeuralTTS: Neural TTS with emotional prosody
 * - ConversationManager: Cross-session memory management
 */

// Core services
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

/**
 * Initialize all elite voice services
 *
 * Call this on app startup to warm caches and prepare services.
 */
export async function initializeEliteVoiceServices(): Promise<void> {
  const { gitaKnowledgeBase } = await import('./GitaKnowledgeBase')
  const { conversationManager } = await import('./ConversationManager')

  console.log('🚀 Initializing Elite KIAAN Voice Services...')

  try {
    // Initialize Gita knowledge base (seeds verses if needed)
    await gitaKnowledgeBase.initialize()

    // Initialize conversation manager
    await conversationManager.initialize()

    console.log('✅ Elite Voice Services initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize Elite Voice Services:', error)
    throw error
  }
}

/**
 * Get voice service status
 */
export function getVoiceServiceStatus(): {
  gitaDbReady: boolean
  ttsSupported: boolean
  conversationReady: boolean
} {
  const { eliteNeuralTTS } = require('./EliteNeuralTTS')

  return {
    gitaDbReady: true, // Will be set after initialization
    ttsSupported: eliteNeuralTTS.isSupported(),
    conversationReady: true
  }
}
