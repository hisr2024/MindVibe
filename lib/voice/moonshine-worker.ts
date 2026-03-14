/**
 * Moonshine Tiny Web Worker — On-Device English STT
 *
 * Runs Moonshine Tiny (~26MB, ~120MB RAM) via @huggingface/transformers.
 * Streaming transcript output: words appear as they're spoken.
 * Model: onnx-community/moonshine-tiny (optimized for English)
 *
 * Communication via postMessage:
 * IN:  { type: 'load', device: 'webgpu' | 'wasm' }
 * IN:  { type: 'transcribe', samples: Float32Array }
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

ctx.onmessage = async (event: MessageEvent) => {
  const { type } = event.data

  if (type === 'load') {
    await loadModel(event.data.device || 'webgpu')
  } else if (type === 'transcribe') {
    await transcribe(event.data.samples)
  } else if (type === 'unload') {
    pipeline = null
    isLoaded = false
    ctx.postMessage({ type: 'unloaded' })
  }
}

async function loadModel(device: string) {
  try {
    ctx.postMessage({ type: 'loading', progress: 0 })

    // Dynamic import to avoid bundling in main thread
    const { pipeline: createPipeline } = await import('@huggingface/transformers')

    ctx.postMessage({ type: 'loading', progress: 30 })

    pipeline = await createPipeline(
      'automatic-speech-recognition',
      'onnx-community/moonshine-tiny',
      {
        device: device as 'webgpu' | 'wasm',
        dtype: 'fp32',
        progress_callback: (progress: { progress?: number }) => {
          if (progress.progress !== undefined) {
            ctx.postMessage({
              type: 'loading',
              progress: 30 + Math.round(progress.progress * 0.7)
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
      message: `Moonshine load failed: ${err instanceof Error ? err.message : String(err)}`
    })
  }
}

async function transcribe(samples: Float32Array) {
  if (!isLoaded || !pipeline) {
    ctx.postMessage({ type: 'error', message: 'Model not loaded' })
    return
  }

  try {
    const result = await (pipeline as (input: Float32Array, options: Record<string, unknown>) => Promise<{ text: string }>)(
      samples,
      {
        language: 'en',
        return_timestamps: false,
        chunk_length_s: 0, // Process full chunk at once
      }
    )

    const text = result.text?.trim() || ''
    if (text) {
      ctx.postMessage({ type: 'transcript', text, isFinal: true })
    }
  } catch (err) {
    ctx.postMessage({
      type: 'error',
      message: `Transcription failed: ${err instanceof Error ? err.message : String(err)}`
    })
  }
}
