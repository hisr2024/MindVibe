'use client';

/**
 * Active Listening Backchannel Engine
 *
 * Plays subtle audio cues (e.g., "mmhmm", "I hear you") during user speech
 * to simulate active listening. This is strictly best-effort: failures are
 * silently swallowed so backchannel issues never disrupt the core experience.
 */

type CueKey = 'mmhmm' | 'iHearYou' | 'goOn' | 'hmm';

interface CueMapping {
  key: CueKey;
  file: string;
}

const CUE_FILES: CueMapping[] = [
  { key: 'mmhmm', file: 'mmhmm.mp3' },
  { key: 'iHearYou', file: 'i-hear-you.mp3' },
  { key: 'goOn', file: 'go-on.mp3' },
  { key: 'hmm', file: 'hmm.mp3' },
];

/** Minimum seconds of speech before any backchannel plays. */
const INITIAL_SILENCE_SECONDS = 3;

/** Minimum gap between consecutive backchannel cues in milliseconds. */
const RATE_LIMIT_MS = 8_000;

/** Playback volume for backchannel cues (0–1). */
const PLAYBACK_VOLUME = 0.3;

/** Threshold (seconds) after which speech is considered "long". */
const LONG_SPEECH_THRESHOLD = 15;

export class BackchannelEngine {
  private audioContext: AudioContext | null = null;
  private buffers: Map<CueKey, AudioBuffer> = new Map();
  private lastPlayedAt = 0;
  private destroyed = false;

  /**
   * Lazily initialise the AudioContext on first use.
   * Returns null in SSR or if the Web Audio API is unavailable.
   */
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null;
    }

    if (this.destroyed) {
      return null;
    }

    if (!this.audioContext) {
      try {
        const AudioCtx =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) {
          return null;
        }
        this.audioContext = new AudioCtx();
      } catch {
        // Browser may block AudioContext creation; silently degrade.
        return null;
      }
    }

    return this.audioContext;
  }

  /**
   * Fetch and decode the four backchannel audio clips from /audio/backchannel/.
   * Any individual clip that fails to load is silently skipped.
   */
  async preloadCues(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    const ctx = this.getAudioContext();
    if (!ctx) {
      return;
    }

    const loadTasks = CUE_FILES.map(async ({ key, file }) => {
      try {
        const response = await fetch(`/audio/backchannel/${file}`);
        if (!response.ok) {
          return;
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        this.buffers.set(key, audioBuffer);
      } catch {
        // Silently skip cues that fail to load — backchannel is best-effort.
      }
    });

    await Promise.all(loadTasks);
  }

  /**
   * Play an appropriate backchannel cue based on the detected emotion and
   * how long the user has been speaking.
   *
   * Rules:
   *  - No cue in the first 3 seconds (let the user settle in).
   *  - Max one cue every 8 seconds.
   *  - sadness / grief → 'iHearYou'
   *  - speech > 15s     → 'goOn'
   *  - default          → 'mmhmm'
   *  - All cues play at 30 % volume.
   *
   * @param emotion           Detected emotion label (e.g. "sadness", "grief").
   * @param speechDurationSoFar  Seconds the user has been speaking so far.
   */
  playBackchannel(emotion: string, speechDurationSoFar: number): void {
    try {
      if (typeof window === 'undefined' || this.destroyed) {
        return;
      }

      // Don't interrupt the user in the first few seconds.
      if (speechDurationSoFar < INITIAL_SILENCE_SECONDS) {
        return;
      }

      // Rate-limit: at most one cue every RATE_LIMIT_MS.
      const now = Date.now();
      if (now - this.lastPlayedAt < RATE_LIMIT_MS) {
        return;
      }

      const ctx = this.getAudioContext();
      if (!ctx) {
        return;
      }

      // Select the appropriate cue.
      const cueKey = this.selectCue(emotion, speechDurationSoFar);
      const buffer = this.buffers.get(cueKey);

      if (!buffer) {
        // Desired cue wasn't loaded; try a fallback from whatever is available.
        const fallbackBuffer = this.getAnyAvailableBuffer();
        if (!fallbackBuffer) {
          return;
        }
        this.playCueBuffer(ctx, fallbackBuffer);
      } else {
        this.playCueBuffer(ctx, buffer);
      }

      this.lastPlayedAt = now;
    } catch {
      // Best-effort — never throw from backchannel playback.
    }
  }

  /**
   * Determine which cue key to use based on emotion and speech duration.
   */
  private selectCue(emotion: string, speechDurationSoFar: number): CueKey {
    const normalised = emotion.toLowerCase().trim();

    if (normalised === 'sadness' || normalised === 'grief') {
      return 'iHearYou';
    }

    if (speechDurationSoFar > LONG_SPEECH_THRESHOLD) {
      return 'goOn';
    }

    return 'mmhmm';
  }

  /**
   * Return the first available AudioBuffer from the loaded set, or null.
   */
  private getAnyAvailableBuffer(): AudioBuffer | null {
    const first = this.buffers.values().next();
    return first.done ? null : first.value;
  }

  /**
   * Play a decoded AudioBuffer through a GainNode at PLAYBACK_VOLUME.
   */
  private playCueBuffer(ctx: AudioContext, buffer: AudioBuffer): void {
    try {
      // Resume the context if it was suspended (autoplay policy).
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gainNode = ctx.createGain();
      gainNode.gain.value = PLAYBACK_VOLUME;

      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(0);
    } catch {
      // Playback failure is non-critical.
    }
  }

  /**
   * Returns true when at least one backchannel cue has been successfully loaded
   * and the engine has not been destroyed.
   */
  isReady(): boolean {
    return !this.destroyed && this.buffers.size > 0;
  }

  /**
   * Tear down the AudioContext and release all buffered audio data.
   * After calling destroy(), the engine becomes inert.
   */
  destroy(): void {
    this.destroyed = true;

    try {
      if (this.audioContext) {
        void this.audioContext.close();
      }
    } catch {
      // Closing an already-closed context throws in some browsers.
    }

    this.audioContext = null;
    this.buffers.clear();
  }
}
