/**
 * Spatial Audio Engine - 3D Immersive Sound Positioning
 *
 * Creates immersive 3D audio experiences for KIAAN Voice:
 * - HRTF-based spatial positioning (Head-Related Transfer Function)
 * - Virtual speaker placement around the user
 * - Dynamic sound movement and orbiting
 * - Room simulation with reverb
 * - Binaural rendering for headphone experiences
 *
 * Use Cases:
 * - Guided meditations with sounds moving around the head
 * - Nature soundscapes with directional positioning
 * - Wisdom voices appearing from different directions
 * - Chakra-aligned sounds at body positions
 */

import type { ConsciousnessLayer } from './QuantumDiveEngine'

// ============ Types & Interfaces ============

/**
 * 3D position in space
 */
export interface SpatialPosition {
  x: number  // -1 (left) to 1 (right)
  y: number  // -1 (below) to 1 (above)
  z: number  // -1 (behind) to 1 (front)
}

/**
 * Movement path for sounds
 */
export type MovementPath =
  | 'static'
  | 'orbit_horizontal'    // Circle around head horizontally
  | 'orbit_vertical'      // Circle around head vertically
  | 'spiral_up'           // Spiral upward
  | 'spiral_down'         // Spiral downward
  | 'figure_eight'        // Figure-8 pattern
  | 'random_drift'        // Gentle random movement
  | 'chakra_ascent'       // Move through chakra positions
  | 'breath_sync'         // Move with breathing
  | 'custom'

/**
 * Spatial sound source
 */
export interface SpatialSource {
  id: string
  position: SpatialPosition
  path: MovementPath
  speed: number           // Movement speed (0-1)
  volume: number          // 0-1
  spread: number          // Sound spread angle (0-360)
  doppler: boolean        // Enable Doppler effect
  reverb: number          // Reverb amount (0-1)
}

/**
 * Room preset for reverb simulation
 */
export interface RoomPreset {
  id: string
  name: string
  description: string
  decay: number           // Reverb decay time in seconds
  dampening: number       // High frequency dampening (0-1)
  size: number            // Room size factor
  diffusion: number       // Diffusion amount (0-1)
}

/**
 * Spatial audio scene
 */
export interface SpatialScene {
  id: string
  name: string
  description: string
  room: string            // Room preset ID
  sources: SpatialSource[]
  duration?: number       // Scene duration in ms
}

/**
 * Engine state
 */
export interface SpatialAudioState {
  isInitialized: boolean
  isPlaying: boolean
  currentScene: string | null
  listenerPosition: SpatialPosition
  sources: Map<string, SpatialSource>
  roomPreset: string
}

/**
 * Engine configuration
 */
export interface SpatialAudioConfig {
  enableHRTF?: boolean           // Use HRTF for realistic positioning
  maxSources?: number            // Maximum concurrent sources
  defaultRoom?: string           // Default room preset
  onSourceMove?: (sourceId: string, position: SpatialPosition) => void
  onStateChange?: (state: SpatialAudioState) => void
}

// ============ Constants ============

/**
 * Chakra positions in 3D space (front-facing)
 */
export const CHAKRA_POSITIONS: Record<string, SpatialPosition> = {
  root: { x: 0, y: -0.8, z: 0 },       // Base of spine
  sacral: { x: 0, y: -0.5, z: 0.1 },   // Lower abdomen
  solar: { x: 0, y: -0.2, z: 0.15 },   // Solar plexus
  heart: { x: 0, y: 0.1, z: 0.2 },     // Heart center
  throat: { x: 0, y: 0.4, z: 0.15 },   // Throat
  third_eye: { x: 0, y: 0.7, z: 0.3 }, // Forehead
  crown: { x: 0, y: 1, z: 0 }          // Top of head
}

/**
 * Layer-specific spatial positions
 */
export const LAYER_POSITIONS: Record<ConsciousnessLayer, SpatialPosition> = {
  annamaya: { x: 0, y: -0.5, z: 0 },      // Below, grounding
  pranamaya: { x: 0, y: 0, z: 0.5 },      // In front, flowing
  manomaya: { x: 0, y: 0.3, z: 0 },       // At head level
  vijnanamaya: { x: 0, y: 0.6, z: 0.2 },  // Third eye area
  anandamaya: { x: 0, y: 1, z: 0 }        // Above, transcendent
}

/**
 * Room presets
 */
export const ROOM_PRESETS: Record<string, RoomPreset> = {
  anechoic: {
    id: 'anechoic',
    name: 'Anechoic Chamber',
    description: 'No reverb, pure sound',
    decay: 0,
    dampening: 1,
    size: 0,
    diffusion: 0
  },
  small_room: {
    id: 'small_room',
    name: 'Small Room',
    description: 'Intimate meditation space',
    decay: 0.3,
    dampening: 0.5,
    size: 0.3,
    diffusion: 0.4
  },
  temple: {
    id: 'temple',
    name: 'Temple Hall',
    description: 'Sacred temple acoustics',
    decay: 2.5,
    dampening: 0.3,
    size: 0.8,
    diffusion: 0.7
  },
  cave: {
    id: 'cave',
    name: 'Sacred Cave',
    description: 'Deep cave resonance',
    decay: 4,
    dampening: 0.2,
    size: 0.9,
    diffusion: 0.5
  },
  forest: {
    id: 'forest',
    name: 'Open Forest',
    description: 'Natural outdoor space',
    decay: 0.5,
    dampening: 0.7,
    size: 1,
    diffusion: 0.9
  },
  cosmic: {
    id: 'cosmic',
    name: 'Cosmic Void',
    description: 'Infinite space ambience',
    decay: 8,
    dampening: 0.1,
    size: 1,
    diffusion: 1
  },
  heart: {
    id: 'heart',
    name: 'Heart Space',
    description: 'Warm, resonant inner space',
    decay: 1.5,
    dampening: 0.4,
    size: 0.5,
    diffusion: 0.6
  }
}

/**
 * Pre-built spatial scenes
 */
export const SPATIAL_SCENES: SpatialScene[] = [
  {
    id: 'chakra_journey',
    name: 'Chakra Journey',
    description: 'Sound moves through chakra points',
    room: 'temple',
    sources: [
      { id: 'main', position: CHAKRA_POSITIONS.root, path: 'chakra_ascent', speed: 0.1, volume: 0.7, spread: 60, doppler: false, reverb: 0.3 }
    ],
    duration: 300000 // 5 minutes
  },
  {
    id: 'orbiting_wisdom',
    name: 'Orbiting Wisdom',
    description: 'Wisdom voice circles around you',
    room: 'temple',
    sources: [
      { id: 'voice', position: { x: 1, y: 0, z: 0 }, path: 'orbit_horizontal', speed: 0.05, volume: 0.8, spread: 30, doppler: true, reverb: 0.4 }
    ]
  },
  {
    id: 'nature_surround',
    name: 'Nature Surround',
    description: 'Immersive nature soundscape',
    room: 'forest',
    sources: [
      { id: 'birds_left', position: { x: -0.8, y: 0.3, z: 0.5 }, path: 'random_drift', speed: 0.02, volume: 0.4, spread: 45, doppler: false, reverb: 0.2 },
      { id: 'birds_right', position: { x: 0.7, y: 0.4, z: 0.3 }, path: 'random_drift', speed: 0.03, volume: 0.35, spread: 45, doppler: false, reverb: 0.2 },
      { id: 'stream', position: { x: 0.3, y: -0.3, z: 0.8 }, path: 'static', speed: 0, volume: 0.5, spread: 90, doppler: false, reverb: 0.3 },
      { id: 'wind', position: { x: -0.5, y: 0.2, z: -0.5 }, path: 'random_drift', speed: 0.01, volume: 0.3, spread: 180, doppler: false, reverb: 0.1 }
    ]
  },
  {
    id: 'cosmic_meditation',
    name: 'Cosmic Meditation',
    description: 'Sounds from the cosmos',
    room: 'cosmic',
    sources: [
      { id: 'cosmic_drone', position: { x: 0, y: 1, z: 0 }, path: 'spiral_down', speed: 0.02, volume: 0.5, spread: 360, doppler: false, reverb: 0.8 },
      { id: 'stars', position: { x: 0.5, y: 0.8, z: 0.5 }, path: 'orbit_horizontal', speed: 0.01, volume: 0.3, spread: 20, doppler: true, reverb: 0.9 }
    ]
  },
  {
    id: 'breathing_guide',
    name: 'Breathing Guide',
    description: 'Sound moves with breath',
    room: 'heart',
    sources: [
      { id: 'breath', position: { x: 0, y: 0, z: 0.5 }, path: 'breath_sync', speed: 0.5, volume: 0.6, spread: 120, doppler: false, reverb: 0.4 }
    ]
  }
]

// ============ Engine Class ============

/**
 * Spatial Audio Engine
 *
 * Creates immersive 3D audio experiences using Web Audio API's
 * PannerNode and ConvolverNode for realistic spatial positioning.
 */
export class SpatialAudioEngine {
  private audioContext: AudioContext | null = null
  private listener: AudioListener | null = null
  private masterGain: GainNode | null = null
  private convolver: ConvolverNode | null = null

  private sources: Map<string, {
    source: SpatialSource
    panner: PannerNode
    gainNode: GainNode
    oscillator?: OscillatorNode
    animationFrame?: number
  }> = new Map()

  private state: SpatialAudioState = {
    isInitialized: false,
    isPlaying: false,
    currentScene: null,
    listenerPosition: { x: 0, y: 0, z: 0 },
    sources: new Map(),
    roomPreset: 'small_room'
  }

  private config: SpatialAudioConfig = {
    enableHRTF: true,
    maxSources: 8,
    defaultRoom: 'small_room'
  }

  private animationFrameId: number | null = null

  constructor(options?: SpatialAudioConfig) {
    if (options) {
      this.config = { ...this.config, ...options }
    }
  }

  /**
   * Check browser support
   */
  static isSupported(): boolean {
    if (typeof window === 'undefined') return false
    return 'AudioContext' in window && 'PannerNode' in window
  }

  /**
   * Initialize the spatial audio engine
   */
  async initialize(): Promise<boolean> {
    if (!SpatialAudioEngine.isSupported()) {
      console.warn('SpatialAudioEngine: Web Audio API not fully supported')
      return false
    }

    try {
      this.audioContext = new AudioContext()

      // Setup listener (user's head position)
      this.listener = this.audioContext.listener

      // Set listener position at origin
      if (this.listener.positionX) {
        this.listener.positionX.value = 0
        this.listener.positionY.value = 0
        this.listener.positionZ.value = 0
        this.listener.forwardX.value = 0
        this.listener.forwardY.value = 0
        this.listener.forwardZ.value = -1
        this.listener.upX.value = 0
        this.listener.upY.value = 1
        this.listener.upZ.value = 0
      }

      // Master gain
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = 1
      this.masterGain.connect(this.audioContext.destination)

      // Convolver for room reverb
      this.convolver = this.audioContext.createConvolver()
      await this.loadRoomPreset(this.config.defaultRoom ?? 'small_room')

      this.state.isInitialized = true
      console.log('SpatialAudioEngine: Initialized successfully')
      return true
    } catch (error) {
      console.error('SpatialAudioEngine: Initialization failed', error)
      return false
    }
  }

  /**
   * Load a spatial scene
   */
  async loadScene(sceneId: string): Promise<void> {
    const scene = SPATIAL_SCENES.find(s => s.id === sceneId)
    if (!scene) {
      console.warn(`SpatialAudioEngine: Scene '${sceneId}' not found`)
      return
    }

    // Stop current scene
    await this.stopAll()

    // Load room preset
    await this.loadRoomPreset(scene.room)

    // Create sources
    for (const sourceConfig of scene.sources) {
      await this.createSource(sourceConfig)
    }

    this.state.currentScene = sceneId
    this.emitState()
  }

  /**
   * Create a spatial audio source
   */
  async createSource(config: SpatialSource): Promise<void> {
    if (!this.audioContext || !this.masterGain) return
    if (this.sources.size >= (this.config.maxSources ?? 8)) {
      console.warn('SpatialAudioEngine: Maximum sources reached')
      return
    }

    // Create panner node
    const panner = this.audioContext.createPanner()
    panner.panningModel = this.config.enableHRTF ? 'HRTF' : 'equalpower'
    panner.distanceModel = 'inverse'
    panner.refDistance = 1
    panner.maxDistance = 10
    panner.rolloffFactor = 1
    panner.coneInnerAngle = config.spread
    panner.coneOuterAngle = config.spread * 2
    panner.coneOuterGain = 0.3

    // Set initial position
    this.setSourcePosition(panner, config.position)

    // Create gain node
    const gainNode = this.audioContext.createGain()
    gainNode.gain.value = config.volume

    // Connect: source -> gain -> panner -> master
    gainNode.connect(panner)

    // Mix dry and wet (reverb) signals
    const dryGain = this.audioContext.createGain()
    const wetGain = this.audioContext.createGain()
    dryGain.gain.value = 1 - config.reverb
    wetGain.gain.value = config.reverb

    panner.connect(dryGain)
    dryGain.connect(this.masterGain)

    if (this.convolver) {
      panner.connect(wetGain)
      wetGain.connect(this.convolver)
      this.convolver.connect(this.masterGain)
    }

    this.sources.set(config.id, {
      source: config,
      panner,
      gainNode
    })

    this.state.sources.set(config.id, config)
    this.emitState()
  }

  /**
   * Start playing all sources
   */
  async play(): Promise<void> {
    if (!this.audioContext) return

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

    // Start movement animation
    this.startAnimation()

    this.state.isPlaying = true
    this.emitState()
  }

  /**
   * Stop all sources
   */
  async stopAll(): Promise<void> {
    // Stop animation
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    // Stop and disconnect all sources
    for (const [id, source] of this.sources) {
      source.oscillator?.stop()
      source.oscillator?.disconnect()
      source.panner.disconnect()
      source.gainNode.disconnect()
    }

    this.sources.clear()
    this.state.sources.clear()
    this.state.isPlaying = false
    this.state.currentScene = null
    this.emitState()
  }

  /**
   * Move a source to a new position
   */
  moveSource(sourceId: string, position: SpatialPosition, duration: number = 1000): void {
    const source = this.sources.get(sourceId)
    if (!source || !this.audioContext) return

    const panner = source.panner
    const startTime = this.audioContext.currentTime
    const endTime = startTime + duration / 1000

    // Smooth transition using automation
    panner.positionX.linearRampToValueAtTime(position.x, endTime)
    panner.positionY.linearRampToValueAtTime(position.y, endTime)
    panner.positionZ.linearRampToValueAtTime(position.z, endTime)

    source.source.position = position

    if (this.config.onSourceMove) {
      this.config.onSourceMove(sourceId, position)
    }
  }

  /**
   * Set room preset
   */
  async setRoom(presetId: string): Promise<void> {
    await this.loadRoomPreset(presetId)
    this.state.roomPreset = presetId
    this.emitState()
  }

  /**
   * Set master volume
   */
  setVolume(volume: number): void {
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setTargetAtTime(
        Math.max(0, Math.min(1, volume)),
        this.audioContext.currentTime,
        0.1
      )
    }
  }

  /**
   * Get current state
   */
  getState(): SpatialAudioState {
    return {
      ...this.state,
      sources: new Map(this.state.sources)
    }
  }

  /**
   * Get available scenes
   */
  getScenes(): SpatialScene[] {
    return [...SPATIAL_SCENES]
  }

  /**
   * Get room presets
   */
  getRoomPresets(): RoomPreset[] {
    return Object.values(ROOM_PRESETS)
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.stopAll()

    if (this.convolver) {
      this.convolver.disconnect()
    }
    if (this.masterGain) {
      this.masterGain.disconnect()
    }
    if (this.audioContext) {
      this.audioContext.close()
    }

    this.audioContext = null
    this.state.isInitialized = false
  }

  // ============ Private Methods ============

  private setSourcePosition(panner: PannerNode, position: SpatialPosition): void {
    panner.positionX.value = position.x
    panner.positionY.value = position.y
    panner.positionZ.value = position.z
  }

  private async loadRoomPreset(presetId: string): Promise<void> {
    const preset = ROOM_PRESETS[presetId]
    if (!preset || !this.audioContext || !this.convolver) return

    // Generate impulse response for reverb
    const sampleRate = this.audioContext.sampleRate
    const length = sampleRate * preset.decay
    const impulse = this.audioContext.createBuffer(2, length, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        // Exponential decay with noise
        const decay = Math.pow(1 - i / length, preset.dampening * 10)
        const diffusion = preset.diffusion * (Math.random() * 2 - 1)
        channelData[i] = (Math.random() * 2 - 1) * decay * (1 + diffusion * 0.5)
      }
    }

    this.convolver.buffer = impulse
    this.state.roomPreset = presetId
  }

  private startAnimation(): void {
    const animate = () => {
      const now = Date.now()

      for (const [id, source] of this.sources) {
        if (source.source.path !== 'static') {
          const newPosition = this.calculatePosition(source.source, now)
          this.setSourcePosition(source.panner, newPosition)
          source.source.position = newPosition

          if (this.config.onSourceMove) {
            this.config.onSourceMove(id, newPosition)
          }
        }
      }

      if (this.state.isPlaying) {
        this.animationFrameId = requestAnimationFrame(animate)
      }
    }

    this.animationFrameId = requestAnimationFrame(animate)
  }

  private calculatePosition(source: SpatialSource, time: number): SpatialPosition {
    const t = (time / 1000) * source.speed
    const pos = { ...source.position }

    switch (source.path) {
      case 'orbit_horizontal':
        pos.x = Math.cos(t * Math.PI * 2)
        pos.z = Math.sin(t * Math.PI * 2)
        break

      case 'orbit_vertical':
        pos.y = Math.cos(t * Math.PI * 2)
        pos.z = Math.sin(t * Math.PI * 2)
        break

      case 'spiral_up':
        pos.x = Math.cos(t * Math.PI * 4) * (1 - (t % 1))
        pos.z = Math.sin(t * Math.PI * 4) * (1 - (t % 1))
        pos.y = (t % 1) * 2 - 1
        break

      case 'spiral_down':
        pos.x = Math.cos(t * Math.PI * 4) * (t % 1)
        pos.z = Math.sin(t * Math.PI * 4) * (t % 1)
        pos.y = 1 - (t % 1) * 2
        break

      case 'figure_eight':
        pos.x = Math.sin(t * Math.PI * 2)
        pos.z = Math.sin(t * Math.PI * 4) * 0.5
        break

      case 'random_drift':
        pos.x += (Math.random() - 0.5) * 0.02
        pos.y += (Math.random() - 0.5) * 0.01
        pos.z += (Math.random() - 0.5) * 0.02
        // Clamp to bounds
        pos.x = Math.max(-1, Math.min(1, pos.x))
        pos.y = Math.max(-1, Math.min(1, pos.y))
        pos.z = Math.max(-1, Math.min(1, pos.z))
        break

      case 'chakra_ascent':
        const chakras = Object.values(CHAKRA_POSITIONS)
        const chakraIndex = Math.floor((t % chakras.length))
        const nextIndex = (chakraIndex + 1) % chakras.length
        const progress = (t % 1)
        const current = chakras[chakraIndex]
        const next = chakras[nextIndex]
        pos.x = current.x + (next.x - current.x) * progress
        pos.y = current.y + (next.y - current.y) * progress
        pos.z = current.z + (next.z - current.z) * progress
        break

      case 'breath_sync':
        // Simulated breath (4 second cycle)
        const breathPhase = (t * 0.25) % 1
        if (breathPhase < 0.4) {
          // Inhale - move forward
          pos.z = 0.3 + breathPhase * 0.5
        } else if (breathPhase < 0.6) {
          // Hold
          pos.z = 0.5
        } else {
          // Exhale - move back
          pos.z = 0.5 - (breathPhase - 0.6) * 0.5
        }
        break
    }

    return pos
  }

  private emitState(): void {
    if (this.config.onStateChange) {
      this.config.onStateChange(this.getState())
    }
  }
}

// ============ Factory & Singleton ============

let spatialAudioInstance: SpatialAudioEngine | null = null

export function getSpatialAudioEngine(): SpatialAudioEngine {
  if (!spatialAudioInstance) {
    spatialAudioInstance = new SpatialAudioEngine()
  }
  return spatialAudioInstance
}

export function createSpatialAudioEngine(
  options?: SpatialAudioConfig
): SpatialAudioEngine {
  return new SpatialAudioEngine(options)
}

export const spatialAudioEngine = getSpatialAudioEngine()
