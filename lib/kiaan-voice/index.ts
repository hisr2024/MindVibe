/**
 * KIAAN Voice Engine — Browser Entry Point
 *
 * Exports the WebGPU/WebNN/AudioWorklet voice engine for use
 * in the Next.js frontend and React components.
 *
 * Usage:
 *   import { getWebVoiceEngine, detectCapabilities } from '@/lib/kiaan-voice'
 *
 *   const caps = await detectCapabilities()
 *   const engine = getWebVoiceEngine({ language: 'en' })
 *   await engine.initialize()
 */

export {
  KiaanWebVoiceEngine,
  getWebVoiceEngine,
  detectCapabilities,
  createSacredAudioPipeline,
  connectSacredReverb,
  WAKE_WORD_PROCESSOR_CODE,
} from './web-engine'

export type {
  WebGPUStatus,
  WebNNStatus,
  WebEngineCapabilities,
  VoiceEngineConfig,
  EmotionDetectionResult,
  TranscriptionResult,
  SacredAudioNodes,
  WakeWordCallback,
  EmotionCallback,
  TranscriptCallback,
} from './web-engine'
