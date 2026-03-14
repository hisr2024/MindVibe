/**
 * AudioWorklet Processor for KIAAN On-Device STT
 *
 * Captures microphone PCM audio on the audio thread (no main-thread jank).
 * Two modes controlled via message:
 * - 'moonshine': posts ~1s chunks for streaming Moonshine inference
 * - 'whisper':   posts ~5s chunks with 1s overlap for Whisper inference
 */

class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._buffer = []
    this._sampleCount = 0
    this._mode = 'moonshine' // default
    this._chunkSamples = 16000 // 1s at 16kHz
    this._overlapSamples = 0
    this._overlapBuffer = []
    this._stopped = false

    this.port.onmessage = (event) => {
      if (event.data.type === 'configure') {
        this._mode = event.data.mode || 'moonshine'
        if (this._mode === 'whisper') {
          this._chunkSamples = 80000 // 5s at 16kHz
          this._overlapSamples = 16000 // 1s overlap
        } else {
          this._chunkSamples = 16000 // 1s at 16kHz
          this._overlapSamples = 0
        }
      } else if (event.data.type === 'stop') {
        // Flush remaining buffer
        if (this._buffer.length > 0) {
          this._flush()
        }
        this._stopped = true
      } else if (event.data.type === 'reset') {
        this._buffer = []
        this._sampleCount = 0
        this._overlapBuffer = []
        this._stopped = false
      }
    }
  }

  process(inputs) {
    if (this._stopped) return true

    const input = inputs[0]
    if (!input || !input[0]) return true

    const channelData = input[0]

    // Downsample from AudioContext sampleRate (usually 44100/48000) to 16kHz
    const ratio = sampleRate / 16000
    for (let i = 0; i < channelData.length; i += ratio) {
      const idx = Math.floor(i)
      if (idx < channelData.length) {
        this._buffer.push(channelData[idx])
        this._sampleCount++
      }
    }

    // When we have enough samples, send chunk
    if (this._sampleCount >= this._chunkSamples) {
      this._flush()
    }

    return true
  }

  _flush() {
    const samples = new Float32Array(this._overlapBuffer.length + this._buffer.length)
    samples.set(this._overlapBuffer, 0)
    samples.set(this._buffer, this._overlapBuffer.length)

    this.port.postMessage(
      { type: 'audio-chunk', samples, timestamp: currentTime },
      [samples.buffer]
    )

    // Keep overlap for whisper mode
    if (this._overlapSamples > 0) {
      this._overlapBuffer = Array.from(
        this._buffer.slice(-this._overlapSamples)
      )
    } else {
      this._overlapBuffer = []
    }

    this._buffer = []
    this._sampleCount = 0
  }
}

registerProcessor('audio-capture-processor', AudioCaptureProcessor)
