/**
 * Web Audio API Sound Generator
 *
 * Synthesizes UI and meditation sounds programmatically using the Web Audio API.
 * Eliminates dependency on external MP3 files — zero network requests, works offline.
 *
 * Sound categories:
 * - UI sounds: click, toggle, select, deselect, success, error, notification, transition, open, close, complete
 * - Meditation sounds: om, bell, singing-bowl, gong, chime
 */

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  if (!audioContext || audioContext.state === 'closed') {
    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch {
      return null
    }
  }

  // Resume if suspended due to browser autoplay policy
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {})
  }

  return audioContext
}

export type SynthSoundType =
  | 'click'
  | 'toggle'
  | 'select'
  | 'deselect'
  | 'success'
  | 'error'
  | 'notification'
  | 'transition'
  | 'open'
  | 'close'
  | 'complete'
  | 'om'
  | 'bell'
  | 'singing-bowl'
  | 'gong'
  | 'chime'

interface ToneConfig {
  frequency: number
  endFrequency?: number
  duration: number
  waveform: OscillatorType
  attackTime?: number
  decayTime: number
}

/**
 * Play a simple oscillator tone with envelope shaping.
 */
function playTone(
  ctx: AudioContext,
  destination: AudioNode,
  startTime: number,
  config: ToneConfig,
): void {
  const osc = ctx.createOscillator()
  const env = ctx.createGain()

  osc.type = config.waveform
  osc.frequency.setValueAtTime(config.frequency, startTime)
  if (config.endFrequency) {
    osc.frequency.linearRampToValueAtTime(config.endFrequency, startTime + config.duration)
  }

  const attack = config.attackTime ?? 0.005
  env.gain.setValueAtTime(0.001, startTime)
  env.gain.linearRampToValueAtTime(1, startTime + attack)
  env.gain.exponentialRampToValueAtTime(0.001, startTime + config.decayTime)

  osc.connect(env)
  env.connect(destination)

  osc.start(startTime)
  osc.stop(startTime + config.duration)
}

/**
 * Om sound: 136.1 Hz fundamental (cosmic Om frequency) with harmonics.
 * Slow attack, long sustain, gentle decay.
 */
function playOmSound(ctx: AudioContext, destination: AudioNode, now: number): void {
  const baseFreq = 136.1
  const duration = 2.5

  const frequencies = [baseFreq, baseFreq * 2, baseFreq * 3]
  const gains = [1.0, 0.3, 0.1]

  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const env = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.value = freq

    env.gain.setValueAtTime(0.001, now)
    env.gain.linearRampToValueAtTime(gains[i], now + 0.4)
    env.gain.setValueAtTime(gains[i], now + 1.0)
    env.gain.exponentialRampToValueAtTime(0.001, now + duration)

    osc.connect(env)
    env.connect(destination)
    osc.start(now)
    osc.stop(now + duration)
  })
}

/**
 * Bell sound: metallic strike with harmonic overtones and quick decay.
 */
function playBellSound(ctx: AudioContext, destination: AudioNode, now: number): void {
  const partials = [
    { freq: 800, gain: 1.0, decay: 1.5 },
    { freq: 1600, gain: 0.5, decay: 1.0 },
    { freq: 2400, gain: 0.25, decay: 0.7 },
    { freq: 3200, gain: 0.12, decay: 0.5 },
  ]

  partials.forEach((p) => {
    const osc = ctx.createOscillator()
    const env = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.value = p.freq

    env.gain.setValueAtTime(p.gain, now)
    env.gain.exponentialRampToValueAtTime(0.001, now + p.decay)

    osc.connect(env)
    env.connect(destination)
    osc.start(now)
    osc.stop(now + p.decay + 0.05)
  })
}

/**
 * Singing bowl: rich low tone with beating harmonics and long sustain.
 */
function playSingingBowlSound(ctx: AudioContext, destination: AudioNode, now: number): void {
  const duration = 3.0
  const partials = [
    { freq: 256, gain: 0.8, decay: duration },
    { freq: 512, gain: 0.4, decay: duration * 0.8 },
    { freq: 770, gain: 0.2, decay: duration * 0.6 },
    // Slight detuning for beating effect
    { freq: 258, gain: 0.3, decay: duration * 0.9 },
  ]

  partials.forEach((p) => {
    const osc = ctx.createOscillator()
    const env = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.value = p.freq

    env.gain.setValueAtTime(0.001, now)
    env.gain.linearRampToValueAtTime(p.gain, now + 0.05)
    env.gain.exponentialRampToValueAtTime(0.001, now + p.decay)

    osc.connect(env)
    env.connect(destination)
    osc.start(now)
    osc.stop(now + p.decay + 0.05)
  })
}

/**
 * Gong sound: deep resonant strike with complex harmonics and slow decay.
 */
function playGongSound(ctx: AudioContext, destination: AudioNode, now: number): void {
  const duration = 3.0
  const partials = [
    { freq: 100, gain: 1.0, decay: duration },
    { freq: 200, gain: 0.6, decay: duration * 0.8 },
    { freq: 350, gain: 0.3, decay: duration * 0.6 },
    { freq: 550, gain: 0.15, decay: duration * 0.4 },
    // Inharmonic partial for metallic character
    { freq: 137, gain: 0.4, decay: duration * 0.7 },
  ]

  partials.forEach((p) => {
    const osc = ctx.createOscillator()
    const env = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.value = p.freq

    env.gain.setValueAtTime(0.001, now)
    env.gain.linearRampToValueAtTime(p.gain, now + 0.02)
    env.gain.exponentialRampToValueAtTime(0.001, now + p.decay)

    osc.connect(env)
    env.connect(destination)
    osc.start(now)
    osc.stop(now + p.decay + 0.05)
  })
}

/**
 * Chime sound: bright high-pitched metallic ring.
 */
function playChimeSound(ctx: AudioContext, destination: AudioNode, now: number): void {
  const partials = [
    { freq: 1047, gain: 1.0, decay: 1.2 },
    { freq: 2094, gain: 0.4, decay: 0.8 },
    { freq: 3141, gain: 0.15, decay: 0.5 },
  ]

  partials.forEach((p) => {
    const osc = ctx.createOscillator()
    const env = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.value = p.freq

    env.gain.setValueAtTime(p.gain, now)
    env.gain.exponentialRampToValueAtTime(0.001, now + p.decay)

    osc.connect(env)
    env.connect(destination)
    osc.start(now)
    osc.stop(now + p.decay + 0.05)
  })
}

/**
 * Play a synthesized sound by name.
 *
 * Uses Web Audio API — no external files needed, zero 404 errors, works offline.
 */
export function playSynthSound(type: SynthSoundType, volume: number = 0.5): void {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    const masterGain = ctx.createGain()
    masterGain.gain.value = Math.max(0, Math.min(1, volume))
    masterGain.connect(ctx.destination)

    switch (type) {
      case 'click':
        playTone(ctx, masterGain, now, { frequency: 800, duration: 0.06, waveform: 'sine', decayTime: 0.04 })
        break
      case 'toggle':
        playTone(ctx, masterGain, now, { frequency: 600, duration: 0.08, waveform: 'sine', decayTime: 0.06 })
        break
      case 'select':
        playTone(ctx, masterGain, now, { frequency: 500, endFrequency: 700, duration: 0.1, waveform: 'sine', decayTime: 0.08 })
        break
      case 'deselect':
        playTone(ctx, masterGain, now, { frequency: 700, endFrequency: 500, duration: 0.1, waveform: 'sine', decayTime: 0.08 })
        break
      case 'success':
        playTone(ctx, masterGain, now, { frequency: 523, duration: 0.2, waveform: 'sine', decayTime: 0.18 })
        playTone(ctx, masterGain, now, { frequency: 659, duration: 0.2, waveform: 'sine', decayTime: 0.18 })
        break
      case 'error':
        playTone(ctx, masterGain, now, { frequency: 200, duration: 0.25, waveform: 'sawtooth', decayTime: 0.2 })
        break
      case 'notification':
        playTone(ctx, masterGain, now, { frequency: 880, duration: 0.12, waveform: 'sine', decayTime: 0.1 })
        playTone(ctx, masterGain, now + 0.13, { frequency: 1100, duration: 0.12, waveform: 'sine', decayTime: 0.1 })
        break
      case 'transition':
        playTone(ctx, masterGain, now, { frequency: 400, endFrequency: 600, duration: 0.15, waveform: 'sine', decayTime: 0.12 })
        break
      case 'open':
        playTone(ctx, masterGain, now, { frequency: 300, endFrequency: 500, duration: 0.12, waveform: 'sine', decayTime: 0.1 })
        break
      case 'close':
        playTone(ctx, masterGain, now, { frequency: 500, endFrequency: 300, duration: 0.12, waveform: 'sine', decayTime: 0.1 })
        break
      case 'complete':
        playTone(ctx, masterGain, now, { frequency: 523, duration: 0.15, waveform: 'sine', decayTime: 0.13 })
        playTone(ctx, masterGain, now + 0.1, { frequency: 659, duration: 0.15, waveform: 'sine', decayTime: 0.13 })
        playTone(ctx, masterGain, now + 0.2, { frequency: 784, duration: 0.3, waveform: 'sine', decayTime: 0.25 })
        break
      case 'om':
        playOmSound(ctx, masterGain, now)
        break
      case 'bell':
        playBellSound(ctx, masterGain, now)
        break
      case 'singing-bowl':
        playSingingBowlSound(ctx, masterGain, now)
        break
      case 'gong':
        playGongSound(ctx, masterGain, now)
        break
      case 'chime':
        playChimeSound(ctx, masterGain, now)
        break
    }
  } catch {
    // Silently fail if Web Audio API has issues
  }
}

/**
 * Clean up the shared AudioContext.
 */
export function cleanupSynthAudio(): void {
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close().catch(() => {})
    audioContext = null
  }
}
