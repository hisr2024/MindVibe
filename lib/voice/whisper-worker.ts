/**
 * Whisper Tiny Web Worker — On-Device Indian Language STT
 *
 * Runs Whisper Tiny (~40MB, ~150MB RAM) via @huggingface/transformers.
 * Processes 5-second chunks with 1-second overlap.
 * Model: onnx-community/whisper-tiny (supports Hindi, Tamil, Telugu, etc.)
 *
 * Communication via postMessage:
 * IN:  { type: 'load', device: 'webgpu' | 'wasm', language: string }
 * IN:  { type: 'transcribe', samples: Float32Array }
 * IN:  { type: 'set-language', language: string }
 * IN:  { type: 'unload' }
 * OUT: { type: 'loading', progress: number }
 * OUT: { type: 'ready' }
 * OUT: { type: 'transcript', text: string, isFinal: boolean }
 * OUT: { type: 'error', message: string }
 */

// @ts-expect-error — Web Worker context, not DOM
const ctx: Worker = self as unknown as Worker

let pipeline: unknown = null
let isLoaded = false
let currentLanguage = 'hi'

/** Whisper language codes for Indian + major languages */
const WHISPER_LANGUAGES: Record<string, string> = {
  hi: 'hindi', sa: 'hindi', ta: 'tamil', te: 'telugu',
  bn: 'bengali', mr: 'marathi', gu: 'gujarati', kn: 'kannada',
  ml: 'malayalam', pa: 'punjabi', es: 'spanish', fr: 'french',
  de: 'german', pt: 'portuguese', ja: 'japanese', zh: 'chinese',
  ko: 'korean', ar: 'arabic', ru: 'russian', it: 'italian',
  en: 'english',
}

ctx.onmessage = async (event: MessageEvent) => {
  const { type } = event.data

  if (type === 'load') {
    currentLanguage = event.data.language || 'hi'
    await loadModel(event.data.device || 'webgpu')
  } else if (type === 'transcribe') {
    await transcribe(event.data.samples)
  } else if (type === 'set-language') {
    currentLanguage = event.data.language || 'hi'
  } else if (type === 'unload') {
    pipeline = null
    isLoaded = false
    ctx.postMessage({ type: 'unloaded' })
  }
}

async function loadModel(device: string) {
  try {
    ctx.postMessage({ type: 'loading', progress: 0 })

    const { pipeline: createPipeline } = await import('@huggingface/transformers')

    ctx.postMessage({ type: 'loading', progress: 20 })

    pipeline = await createPipeline(
      'automatic-speech-recognition',
      'onnx-community/whisper-tiny',
      {
        device: device as 'webgpu' | 'wasm',
        dtype: 'fp32',
        progress_callback: (progress: { progress?: number }) => {
          if (progress.progress !== undefined) {
            ctx.postMessage({
              type: 'loading',
              progress: 20 + Math.round(progress.progress * 0.8)
            })
          }
        }
      }
    )

    isLoaded = true
    ctx.postMessage({ type: 'ready' })
  } catch (err) {
    ctx.postMessage({
      type: 'error',
      message: `Whisper load failed: ${err instanceof Error ? err.message : String(err)}`
    })
  }
}

async function transcribe(samples: Float32Array) {
  if (!isLoaded || !pipeline) {
    ctx.postMessage({ type: 'error', message: 'Model not loaded' })
    return
  }

  try {
    const whisperLang = WHISPER_LANGUAGES[currentLanguage] || 'hindi'

    const result = await (pipeline as (input: Float32Array, options: Record<string, unknown>) => Promise<{ text: string }>)(
      samples,
      {
        language: whisperLang,
        task: 'transcribe',
        return_timestamps: false,
        chunk_length_s: 5,
        stride_length_s: 1,
      }
    )

    const text = result.text?.trim() || ''
    if (text) {
      ctx.postMessage({ type: 'transcript', text, isFinal: true })
    }
  } catch (err) {
    ctx.postMessage({
      type: 'error',
      message: `Whisper transcription failed: ${err instanceof Error ? err.message : String(err)}`
    })
  }
}
