/**
 * KIAAN Vibe - In-Browser Audio Synthesizer
 *
 * Generates meditation and ambient sounds entirely in the browser using the
 * Web Audio API. This guarantees the Vibe Player always has sound, even when
 * remote audio sources (archive.org, backend TTS) are unavailable or blocked
 * by the network.
 *
 * Preset types (URL scheme `synth://<preset>?<params>`):
 *   - om-mantra       Om fundamental (136.1 Hz) + tanpura-style drone
 *   - mantra-chant    Deeper sacred drone with slow beating
 *   - chakra          7-chakra Solfeggio tone cycle
 *   - binaural        Binaural beats (focus / sleep)
 *   - ambient         Warm pad with slow LFO filter sweep
 *   - nature-rain     Filtered pink noise that sounds like rainfall
 *   - nature-ocean    Slow amplitude-modulated brown noise (ocean waves)
 *   - nature-birds    Rain background + random bird chirp oscillators
 *   - zen             Low drone + occasional bowl chime
 *
 * The synth reuses a single AudioContext. play() returns a handle with stop().
 *
 * All functions are browser-only. Callers must gate with `typeof window`.
 */

export type SynthPreset =
  | 'om-mantra'
  | 'mantra-chant'
  | 'chakra'
  | 'binaural-focus'
  | 'binaural-sleep'
  | 'ambient-warm'
  | 'ambient-cosmic'
  | 'nature-rain'
  | 'nature-ocean'
  | 'nature-forest'
  | 'nature-thunder'
  | 'nature-stream'
  | 'zen-bowl'
  | 'samurai'
  | 'japanese-garden'

export interface SynthHandle {
  /** Stop playback immediately and release all nodes. */
  stop: () => void
  /** Change output gain (0-1). */
  setVolume: (v: number) => void
  /** Pause/resume without losing node state. */
  setPaused: (paused: boolean) => void
}

// ============ AudioContext singleton ============

let _ctx: AudioContext | null = null

function getContext(): AudioContext {
  if (typeof window === 'undefined') {
    throw new Error('AudioContext unavailable on server')
  }
  if (!_ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    _ctx = new Ctor()
  }
  return _ctx
}

/**
 * Mobile browsers suspend the AudioContext until a user gesture resumes it.
 * Call this from inside a click/tap handler to unlock audio.
 */
export async function unlockAudio(): Promise<void> {
  try {
    const ctx = getContext()
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    // Play a tiny silent buffer to fully unlock iOS Safari.
    const buffer = ctx.createBuffer(1, 1, 22050)
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.connect(ctx.destination)
    src.start(0)
  } catch {
    // Ignore - will retry on next interaction
  }
}

// ============ Noise generators ============

function createPinkNoise(ctx: AudioContext, durationSec = 4): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const length = Math.floor(sampleRate * durationSec)
  const buffer = ctx.createBuffer(2, length, sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
      b6 = white * 0.115926
    }
  }
  return buffer
}

function createBrownNoise(ctx: AudioContext, durationSec = 4): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const length = Math.floor(sampleRate * durationSec)
  const buffer = ctx.createBuffer(2, length, sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    let lastOut = 0
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1
      lastOut = (lastOut + (0.02 * white)) / 1.02
      data[i] = lastOut * 3.5
    }
  }
  return buffer
}

function loopingNoiseSource(ctx: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.loop = true
  return src
}

// ============ Preset definitions ============

interface PresetInternals {
  nodes: AudioNode[]
  sources: AudioScheduledSourceNode[]
  gain: GainNode
  lfos?: OscillatorNode[]
}

function startOmMantra(ctx: AudioContext, out: GainNode): PresetInternals {
  // Om fundamental ~136.1 Hz (Sa of Indian music). Add 2nd & 3rd harmonics
  // and a slow-pulsing tanpura-style drone on the 4th.
  const fundamental = 136.1
  const harmonics = [1, 2, 3, 4]
  const gains = [0.3, 0.15, 0.08, 0.05]
  const oscs: OscillatorNode[] = []
  const gainNodes: AudioNode[] = []
  harmonics.forEach((h, i) => {
    const osc = ctx.createOscillator()
    osc.type = i === 0 ? 'sine' : 'triangle'
    osc.frequency.value = fundamental * h
    // Slow detune to create organic movement
    osc.detune.setValueAtTime(0, ctx.currentTime)
    const g = ctx.createGain()
    g.gain.value = gains[i]
    osc.connect(g).connect(out)
    osc.start()
    oscs.push(osc)
    gainNodes.push(g)
  })
  // LFO for gentle amplitude breathing
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.1
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 0.05
  lfo.connect(lfoGain).connect(out.gain)
  lfo.start()
  return { nodes: gainNodes, sources: [...oscs, lfo], gain: out, lfos: [lfo] }
}

function startMantraChant(ctx: AudioContext, out: GainNode): PresetInternals {
  // Deep sacred drone: two close-tuned oscillators for natural beating.
  const base = 98 // G2 - deep meditative
  const freqs = [base, base * 1.005, base * 2, base * 3]
  const oscs: OscillatorNode[] = []
  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator()
    osc.type = i < 2 ? 'sawtooth' : 'triangle'
    osc.frequency.value = f
    const g = ctx.createGain()
    g.gain.value = i < 2 ? 0.12 : 0.06
    osc.connect(g).connect(out)
    osc.start()
    oscs.push(osc)
  })
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 1200
  return { nodes: [filter], sources: oscs, gain: out }
}

function startChakraCycle(ctx: AudioContext, out: GainNode): PresetInternals {
  // Solfeggio frequencies - 7 chakras, cycle every ~30 seconds each.
  const chakras = [396, 417, 528, 639, 741, 852, 963]
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = chakras[0]
  const now = ctx.currentTime
  chakras.forEach((f, i) => {
    osc.frequency.setValueAtTime(f, now + i * 30)
  })
  // Loop back
  osc.frequency.setValueAtTime(chakras[0], now + chakras.length * 30)
  osc.connect(out)
  osc.start()

  // Supporting drone
  const drone = ctx.createOscillator()
  drone.type = 'triangle'
  drone.frequency.value = 110
  const droneGain = ctx.createGain()
  droneGain.gain.value = 0.3
  drone.connect(droneGain).connect(out)
  drone.start()

  return { nodes: [droneGain], sources: [osc, drone], gain: out }
}

function startBinaural(ctx: AudioContext, out: GainNode, baseFreq: number, beatHz: number): PresetInternals {
  // Binaural beats require stereo separation; use a ChannelMerger.
  const merger = ctx.createChannelMerger(2)
  const oscL = ctx.createOscillator()
  const oscR = ctx.createOscillator()
  oscL.frequency.value = baseFreq
  oscR.frequency.value = baseFreq + beatHz
  oscL.type = 'sine'
  oscR.type = 'sine'
  const gL = ctx.createGain(); gL.gain.value = 0.4
  const gR = ctx.createGain(); gR.gain.value = 0.4
  oscL.connect(gL).connect(merger, 0, 0)
  oscR.connect(gR).connect(merger, 0, 1)
  merger.connect(out)
  oscL.start(); oscR.start()

  // Warm pad underneath
  const pad = ctx.createOscillator()
  pad.type = 'triangle'
  pad.frequency.value = baseFreq / 2
  const padGain = ctx.createGain()
  padGain.gain.value = 0.15
  pad.connect(padGain).connect(out)
  pad.start()

  return { nodes: [merger, gL, gR, padGain], sources: [oscL, oscR, pad], gain: out }
}

function startAmbientPad(ctx: AudioContext, out: GainNode, warm = true): PresetInternals {
  const chords = warm
    ? [220, 261.63, 329.63, 392]  // A3 C4 E4 G4 - warm Amin7
    : [146.83, 220, 329.63, 440]  // D3 A3 E4 A4 - cosmic open
  const oscs: OscillatorNode[] = []
  const gains: GainNode[] = []
  chords.forEach(f => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = f
    const g = ctx.createGain()
    g.gain.value = 0.1
    osc.connect(g)
    gains.push(g)
    oscs.push(osc)
    osc.start()
  })
  // Shared lowpass filter with slow LFO sweep
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 800
  filter.Q.value = 1
  gains.forEach(g => g.connect(filter))
  filter.connect(out)
  // LFO sweep
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.05
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 400
  lfo.connect(lfoGain).connect(filter.frequency)
  lfo.start()
  return { nodes: [filter, lfoGain], sources: [...oscs, lfo], gain: out, lfos: [lfo] }
}

function startNatureRain(ctx: AudioContext, out: GainNode, heavy = false): PresetInternals {
  const pink = createPinkNoise(ctx, 8)
  const src = loopingNoiseSource(ctx, pink)
  const bandpass = ctx.createBiquadFilter()
  bandpass.type = heavy ? 'lowpass' : 'highpass'
  bandpass.frequency.value = heavy ? 2000 : 800
  bandpass.Q.value = 0.7
  const gain = ctx.createGain()
  gain.gain.value = heavy ? 0.6 : 0.4
  src.connect(bandpass).connect(gain).connect(out)
  src.start()
  return { nodes: [bandpass, gain], sources: [src], gain: out }
}

function startNatureOcean(ctx: AudioContext, out: GainNode): PresetInternals {
  const brown = createBrownNoise(ctx, 8)
  const src = loopingNoiseSource(ctx, brown)
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 500
  filter.Q.value = 0.7
  // Slow LFO on amplitude for wave-like swells
  const gain = ctx.createGain()
  gain.gain.value = 0.5
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.12
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 0.3
  lfo.connect(lfoGain).connect(gain.gain)
  src.connect(filter).connect(gain).connect(out)
  src.start(); lfo.start()
  return { nodes: [filter, gain, lfoGain], sources: [src, lfo], gain: out }
}

function startNatureForest(ctx: AudioContext, out: GainNode): PresetInternals {
  // Soft pink noise bed + random bird chirps
  const rain = startNatureRain(ctx, out, false)
  const chirpInterval = 2500
  const chirpTimer: { id: number | null } = { id: null }
  const schedule = () => {
    const chirpOsc = ctx.createOscillator()
    const chirpGain = ctx.createGain()
    chirpOsc.type = 'sine'
    const freq = 1800 + Math.random() * 1500
    chirpOsc.frequency.setValueAtTime(freq, ctx.currentTime)
    chirpOsc.frequency.exponentialRampToValueAtTime(freq * 1.4, ctx.currentTime + 0.1)
    chirpGain.gain.setValueAtTime(0, ctx.currentTime)
    chirpGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02)
    chirpGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
    chirpOsc.connect(chirpGain).connect(out)
    chirpOsc.start()
    chirpOsc.stop(ctx.currentTime + 0.25)
    chirpTimer.id = window.setTimeout(schedule, chirpInterval + Math.random() * 3000)
  }
  chirpTimer.id = window.setTimeout(schedule, 1000)
  // Wrap stop to also clear the chirp scheduler
  const originalNodes = rain.nodes
  return {
    ...rain,
    nodes: [...originalNodes, {
      disconnect() { if (chirpTimer.id !== null) window.clearTimeout(chirpTimer.id) },
    } as unknown as AudioNode],
  }
}

function startNatureThunder(ctx: AudioContext, out: GainNode): PresetInternals {
  // Heavy rain + occasional thunder rumble
  const rain = startNatureRain(ctx, out, true)
  const thunderInterval = 12000
  const thunderTimer: { id: number | null } = { id: null }
  const schedule = () => {
    const thunderOsc = ctx.createOscillator()
    const thunderGain = ctx.createGain()
    thunderOsc.type = 'sawtooth'
    thunderOsc.frequency.value = 40 + Math.random() * 30
    thunderGain.gain.setValueAtTime(0, ctx.currentTime)
    thunderGain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.5)
    thunderGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4)
    thunderOsc.connect(thunderGain).connect(out)
    thunderOsc.start()
    thunderOsc.stop(ctx.currentTime + 4.5)
    thunderTimer.id = window.setTimeout(schedule, thunderInterval + Math.random() * 10000)
  }
  thunderTimer.id = window.setTimeout(schedule, 5000)
  return {
    ...rain,
    nodes: [...rain.nodes, {
      disconnect() { if (thunderTimer.id !== null) window.clearTimeout(thunderTimer.id) },
    } as unknown as AudioNode],
  }
}

function startNatureStream(ctx: AudioContext, out: GainNode): PresetInternals {
  const pink = createPinkNoise(ctx, 6)
  const src = loopingNoiseSource(ctx, pink)
  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 1400
  bandpass.Q.value = 0.5
  const gain = ctx.createGain()
  gain.gain.value = 0.45
  src.connect(bandpass).connect(gain).connect(out)
  src.start()
  return { nodes: [bandpass, gain], sources: [src], gain: out }
}

function startZenBowl(ctx: AudioContext, out: GainNode): PresetInternals {
  // Low drone + periodic bowl chime
  const drone = ctx.createOscillator()
  drone.type = 'sine'
  drone.frequency.value = 110
  const droneGain = ctx.createGain()
  droneGain.gain.value = 0.25
  drone.connect(droneGain).connect(out)
  drone.start()

  const bowlInterval = 15000
  const bowlTimer: { id: number | null } = { id: null }
  const ring = () => {
    const bowl = ctx.createOscillator()
    const bowlG = ctx.createGain()
    bowl.type = 'sine'
    bowl.frequency.value = 528 // Heart chakra
    bowlG.gain.setValueAtTime(0, ctx.currentTime)
    bowlG.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.1)
    bowlG.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 6)
    bowl.connect(bowlG).connect(out)
    bowl.start()
    bowl.stop(ctx.currentTime + 6.2)
    bowlTimer.id = window.setTimeout(ring, bowlInterval)
  }
  bowlTimer.id = window.setTimeout(ring, 3000)

  return {
    nodes: [droneGain, {
      disconnect() { if (bowlTimer.id !== null) window.clearTimeout(bowlTimer.id) },
    } as unknown as AudioNode],
    sources: [drone],
    gain: out,
  }
}

// ============ Dispatcher ============

function startPreset(preset: SynthPreset, out: GainNode, ctx: AudioContext): PresetInternals {
  switch (preset) {
    case 'om-mantra':        return startOmMantra(ctx, out)
    case 'mantra-chant':     return startMantraChant(ctx, out)
    case 'chakra':           return startChakraCycle(ctx, out)
    case 'binaural-focus':   return startBinaural(ctx, out, 200, 10)  // 10 Hz alpha for focus
    case 'binaural-sleep':   return startBinaural(ctx, out, 150, 4)   // 4 Hz theta for sleep
    case 'ambient-warm':     return startAmbientPad(ctx, out, true)
    case 'ambient-cosmic':   return startAmbientPad(ctx, out, false)
    case 'nature-rain':      return startNatureRain(ctx, out, false)
    case 'nature-ocean':     return startNatureOcean(ctx, out)
    case 'nature-forest':    return startNatureForest(ctx, out)
    case 'nature-thunder':   return startNatureThunder(ctx, out)
    case 'nature-stream':    return startNatureStream(ctx, out)
    case 'zen-bowl':         return startZenBowl(ctx, out)
    case 'samurai':          return startAmbientPad(ctx, out, true)  // reuse warm pad
    case 'japanese-garden':  return startNatureStream(ctx, out)
    default:                 return startAmbientPad(ctx, out, true)
  }
}

export function playSynth(preset: SynthPreset, volume = 0.7): SynthHandle {
  const ctx = getContext()
  const master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)
  // Gentle fade-in over 1.5s prevents clicks
  const now = ctx.currentTime
  master.gain.setValueAtTime(0, now)
  master.gain.linearRampToValueAtTime(volume, now + 1.5)

  const internals = startPreset(preset, master, ctx)

  let paused = false
  let stored = volume

  return {
    stop: () => {
      const stopTime = ctx.currentTime + 0.4
      master.gain.cancelScheduledValues(ctx.currentTime)
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime)
      master.gain.linearRampToValueAtTime(0, stopTime)
      internals.sources.forEach(s => {
        try { s.stop(stopTime + 0.05) } catch { /* already stopped */ }
      })
      window.setTimeout(() => {
        try { master.disconnect() } catch { /* ignore */ }
        internals.nodes.forEach(n => { try { n.disconnect() } catch { /* ignore */ } })
      }, (stopTime + 0.1 - ctx.currentTime) * 1000)
    },
    setVolume: (v: number) => {
      stored = v
      if (!paused) {
        master.gain.cancelScheduledValues(ctx.currentTime)
        master.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.1)
      }
    },
    setPaused: (p: boolean) => {
      paused = p
      master.gain.cancelScheduledValues(ctx.currentTime)
      master.gain.linearRampToValueAtTime(p ? 0 : stored, ctx.currentTime + 0.2)
    },
  }
}

// ============ URL helpers ============

/** Parse a `synth://preset` URL and extract the preset name. */
export function parseSynthUrl(url: string): SynthPreset | null {
  if (!url.startsWith('synth://')) return null
  const preset = url.slice('synth://'.length).split('?')[0] as SynthPreset
  return preset || null
}

export function isSynthUrl(url: string | undefined | null): boolean {
  return !!url && url.startsWith('synth://')
}
