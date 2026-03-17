'use client';

/**
 * Voice Emotion Detection via Prosody Analysis
 *
 * Uses Web Audio API to extract prosodic features (pitch, energy, rate, tremor)
 * from a microphone stream and infer the speaker's emotional state.
 * SSR-safe: all browser API access is guarded by typeof window checks.
 */

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface ProsodyFeatures {
  /** Fundamental frequency estimate in Hz (0 if unvoiced). */
  pitchHz: number;
  /** Variance of recent pitch readings – indicates intonation range. */
  pitchVariance: number;
  /** Estimated syllables-per-second derived from energy envelope peaks. */
  speakingRate: number;
  /** RMS energy expressed in decibels (dBFS). */
  energyDb: number;
  /** Ratio of silent frames to total frames in the recent window (0-1). */
  pauseRatio: number;
  /** Spectral centroid in Hz – brightness of the voice. */
  spectralCentroid: number;
  /** Tremor magnitude in the 4-8 Hz band (0-1 normalised). */
  voiceTremor: number;
}

export interface VoiceEmotion {
  /** Dominant detected emotion. */
  primary: string;
  /** Second-strongest emotion, if any. */
  secondary: string | null;
  /** Emotional intensity on a 0-1 scale. */
  intensity: number;
  /** Confidence of the classification on a 0-1 scale. */
  confidence: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FFT_SIZE = 2048;
const SMOOTHING = 0.8;
/** Minimum RMS amplitude to consider a frame voiced. */
const SILENCE_THRESHOLD_DB = -45;
/** History length for pitch variance and speaking-rate estimation. */
const HISTORY_LENGTH = 64;
/** Sample-rate fallback when AudioContext is unavailable. */
const DEFAULT_SAMPLE_RATE = 44100;

// ---------------------------------------------------------------------------
// Pure helper functions
// ---------------------------------------------------------------------------

/**
 * Estimate fundamental frequency using autocorrelation on time-domain data.
 *
 * Searches for the first significant peak in the autocorrelation function
 * within the plausible human voice range (80-600 Hz).
 *
 * @param buffer  Float32Array of time-domain samples (-1..1)
 * @param sampleRate  Audio context sample rate
 * @returns Estimated pitch in Hz, or 0 if no voiced signal detected
 */
export function estimatePitch(buffer: Float32Array, sampleRate: number): number {
  const size = buffer.length;
  // Lag boundaries corresponding to 80 Hz – 600 Hz
  const minLag = Math.floor(sampleRate / 600);
  const maxLag = Math.ceil(sampleRate / 80);

  if (maxLag >= size) return 0;

  // Normalised autocorrelation
  let bestCorrelation = 0;
  let bestLag = 0;

  // Pre-compute signal energy for normalisation
  let energy = 0;
  for (let i = 0; i < size; i++) {
    energy += buffer[i] * buffer[i];
  }
  if (energy < 1e-6) return 0; // silence

  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < size - lag; i++) {
      sum += buffer[i] * buffer[i + lag];
    }
    const correlation = sum / energy;

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  // Require a minimum correlation to treat as voiced
  if (bestCorrelation < 0.25 || bestLag === 0) return 0;

  return sampleRate / bestLag;
}

/**
 * Calculate RMS energy of a Float32Array and return it in dBFS.
 *
 * @param buffer  Time-domain samples
 * @returns Energy in decibels (negative, 0 dB = full scale)
 */
export function calculateRMSEnergy(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(sum / buffer.length);
  if (rms < 1e-10) return -100;
  return 20 * Math.log10(rms);
}

/**
 * Calculate spectral centroid from a magnitude frequency-domain buffer.
 *
 * The spectral centroid is the "centre of mass" of the spectrum, indicating
 * how bright or dull the voice sounds.
 *
 * @param frequencyData  Uint8Array from AnalyserNode.getByteFrequencyData
 * @param sampleRate     Audio context sample rate
 * @param fftSize        FFT size used by the analyser
 * @returns Spectral centroid in Hz
 */
export function calculateSpectralCentroid(
  frequencyData: Uint8Array,
  sampleRate: number,
  fftSize: number,
): number {
  const binCount = frequencyData.length;
  const hzPerBin = sampleRate / fftSize;

  let weightedSum = 0;
  let magnitudeSum = 0;

  for (let i = 0; i < binCount; i++) {
    const magnitude = frequencyData[i];
    const frequency = i * hzPerBin;
    weightedSum += magnitude * frequency;
    magnitudeSum += magnitude;
  }

  if (magnitudeSum < 1e-6) return 0;
  return weightedSum / magnitudeSum;
}

/**
 * Detect tremor (involuntary oscillation) in the 4-8 Hz range from an
 * energy envelope history.
 *
 * Uses a simple DFT over a small number of target bins rather than a full
 * FFT, keeping the computation lightweight.
 *
 * @param energyHistory  Array of recent RMS-energy values (one per analysis frame)
 * @param frameRate      Approximate number of analysis frames per second
 * @returns Normalised tremor magnitude (0-1)
 */
export function detectTremor(energyHistory: number[], frameRate: number): number {
  const n = energyHistory.length;
  if (n < 8 || frameRate < 1) return 0;

  // Target tremor frequencies: 4-8 Hz
  const loFreq = 4;
  const hiFreq = 8;

  let maxMagnitude = 0;
  let totalMagnitude = 0;
  const steps = 9; // check 4,4.5,5,...,8 Hz

  for (let s = 0; s < steps; s++) {
    const freq = loFreq + (s / (steps - 1)) * (hiFreq - loFreq);
    let real = 0;
    let imag = 0;

    for (let i = 0; i < n; i++) {
      const phase = (2 * Math.PI * freq * i) / frameRate;
      real += energyHistory[i] * Math.cos(phase);
      imag += energyHistory[i] * Math.sin(phase);
    }

    const mag = Math.sqrt(real * real + imag * imag) / n;
    if (mag > maxMagnitude) maxMagnitude = mag;
    totalMagnitude += mag;
  }

  // Normalise: ratio of peak tremor-band energy to average energy
  const avgMag = totalMagnitude / steps;
  if (avgMag < 1e-6) return 0;

  // Clamp to 0-1
  return Math.min(1, maxMagnitude / (avgMag * 4));
}

// ---------------------------------------------------------------------------
// ProsodyAnalyzer class
// ---------------------------------------------------------------------------

export class ProsodyAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;

  private frequencyData: Uint8Array<ArrayBuffer> = new Uint8Array(0);
  private timeDomainData: Float32Array<ArrayBuffer> = new Float32Array(0);

  /** Rolling history of pitch readings for variance calculation. */
  private pitchHistory: number[] = [];
  /** Rolling history of RMS-energy readings for tremor + rate detection. */
  private energyHistory: number[] = [];
  /** Timestamp of the last analysis call, used for frame-rate estimation. */
  private lastAnalysisTime = 0;
  /** Estimated analysis frames per second. */
  private frameRate = 30;

  /**
   * Connect the analyser to a live microphone MediaStream.
   *
   * Safe to call in the browser only — will throw if called during SSR.
   *
   * @param stream  MediaStream obtained from navigator.mediaDevices.getUserMedia
   */
  attachToStream(stream: MediaStream): void {
    if (typeof window === 'undefined') {
      throw new Error('ProsodyAnalyzer requires a browser environment');
    }

    // Clean up any prior session
    this.destroy();

    // webkitAudioContext is a non-standard vendor prefix — no TypeScript type exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!AudioCtx) {
      throw new Error('Web Audio API is not supported in this browser');
    }

    this.audioContext = new AudioCtx();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = FFT_SIZE;
    this.analyser.smoothingTimeConstant = SMOOTHING;

    this.sourceNode = this.audioContext.createMediaStreamSource(stream);
    this.sourceNode.connect(this.analyser);

    const binCount = this.analyser.frequencyBinCount;
    this.frequencyData = new Uint8Array(binCount);
    this.timeDomainData = new Float32Array(this.analyser.fftSize);

    this.pitchHistory = [];
    this.energyHistory = [];
    this.lastAnalysisTime = performance.now();
  }

  /**
   * Extract prosodic features from the current audio frame.
   *
   * Call this at a regular interval (e.g. requestAnimationFrame) to build
   * up enough history for variance, tremor, and rate estimates.
   */
  getFeatures(): ProsodyFeatures {
    if (!this.analyser || !this.audioContext) {
      return {
        pitchHz: 0,
        pitchVariance: 0,
        speakingRate: 0,
        energyDb: -100,
        pauseRatio: 1,
        spectralCentroid: 0,
        voiceTremor: 0,
      };
    }

    // Update frame-rate estimate
    const now = performance.now();
    const delta = now - this.lastAnalysisTime;
    if (delta > 0) {
      this.frameRate = 1000 / delta;
    }
    this.lastAnalysisTime = now;

    // Grab current data from analyser
    this.analyser.getFloatTimeDomainData(this.timeDomainData);
    this.analyser.getByteFrequencyData(this.frequencyData);

    const sampleRate = this.audioContext.sampleRate ?? DEFAULT_SAMPLE_RATE;

    // --- Core features ---
    const pitchHz = estimatePitch(this.timeDomainData, sampleRate);
    const energyDb = calculateRMSEnergy(this.timeDomainData);
    const spectralCentroid = calculateSpectralCentroid(
      this.frequencyData,
      sampleRate,
      FFT_SIZE,
    );

    // --- History tracking ---
    if (pitchHz > 0) {
      this.pitchHistory.push(pitchHz);
    }
    this.energyHistory.push(energyDb);

    // Trim histories to a fixed window
    if (this.pitchHistory.length > HISTORY_LENGTH) {
      this.pitchHistory.splice(0, this.pitchHistory.length - HISTORY_LENGTH);
    }
    if (this.energyHistory.length > HISTORY_LENGTH) {
      this.energyHistory.splice(0, this.energyHistory.length - HISTORY_LENGTH);
    }

    // --- Derived features ---
    const pitchVariance = this.computeVariance(this.pitchHistory);
    const pauseRatio = this.computePauseRatio();
    const speakingRate = this.estimateSpeakingRate();
    const voiceTremor = detectTremor(this.energyHistory, this.frameRate);

    return {
      pitchHz,
      pitchVariance,
      speakingRate,
      energyDb,
      pauseRatio,
      spectralCentroid,
      voiceTremor,
    };
  }

  /**
   * Map a set of prosodic features to an emotional classification.
   *
   * Uses a rule-based approach with weighted scoring across candidate
   * emotions. The two highest-scoring emotions become primary/secondary.
   */
  inferEmotion(features: ProsodyFeatures): VoiceEmotion {
    const {
      pitchHz,
      pitchVariance,
      speakingRate,
      energyDb,
      voiceTremor,
    } = features;

    // Normalise features into 0-1 ranges for scoring.
    // Ranges are approximate for typical human speech.
    const pitchNorm = clamp((pitchHz - 80) / (400 - 80));
    const varianceNorm = clamp(pitchVariance / 5000);
    const rateNorm = clamp(speakingRate / 8);
    const energyNorm = clamp((energyDb + 50) / 50); // -50dB→0, 0dB→1
    const tremorNorm = clamp(voiceTremor);

    // Score each candidate emotion
    const scores: Record<string, number> = {
      anger: 0,
      sadness: 0,
      anxiety: 0,
      distress: 0,
      calm: 0,
      joy: 0,
      neutral: 0,
    };

    // High pitch + high energy + fast rate → anger
    scores.anger =
      pitchNorm * 0.3 +
      energyNorm * 0.35 +
      rateNorm * 0.25 +
      (1 - varianceNorm) * 0.1;

    // Low pitch + low energy + slow rate → sadness
    scores.sadness =
      (1 - pitchNorm) * 0.3 +
      (1 - energyNorm) * 0.35 +
      (1 - rateNorm) * 0.25 +
      (1 - tremorNorm) * 0.1;

    // High pitch variance + moderate energy → anxiety
    scores.anxiety =
      varianceNorm * 0.4 +
      Math.abs(energyNorm - 0.5) < 0.25 ? 0.3 : 0.0 +
      rateNorm * 0.2 +
      tremorNorm * 0.1;

    // Tremor detected → distress / fear
    scores.distress =
      tremorNorm * 0.5 +
      (1 - energyNorm) * 0.15 +
      varianceNorm * 0.2 +
      pitchNorm * 0.15;

    // Stable pitch + moderate energy → calm
    scores.calm =
      (1 - varianceNorm) * 0.35 +
      (1 - Math.abs(energyNorm - 0.45)) * 0.3 +
      (1 - rateNorm) * 0.2 +
      (1 - tremorNorm) * 0.15;

    // High pitch + high energy + high variance → joy
    scores.joy =
      pitchNorm * 0.25 +
      energyNorm * 0.25 +
      varianceNorm * 0.3 +
      rateNorm * 0.2;

    // Baseline neutral score — acts as a floor
    scores.neutral = 0.35;

    // Find primary and secondary
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const [primaryEntry, secondaryEntry] = sorted;

    const primary = primaryEntry[0];
    const primaryScore = primaryEntry[0] ? primaryEntry[1] : 0;
    const secondaryScore = secondaryEntry ? secondaryEntry[1] : 0;

    // Only report secondary if it's close to primary
    const secondary =
      secondaryEntry && secondaryScore > primaryScore * 0.7
        ? secondaryEntry[0]
        : null;

    // Intensity: how far above neutral the primary emotion scores
    const intensity = clamp((primaryScore - scores.neutral) / 0.6);

    // Confidence: gap between primary and secondary
    const confidence = clamp(
      0.5 + (primaryScore - secondaryScore) * 1.5,
    );

    return { primary, secondary, intensity, confidence };
  }

  /**
   * Release all audio resources. Safe to call multiple times.
   */
  destroy(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {
        // Ignore errors during cleanup
      });
      this.audioContext = null;
    }
    this.pitchHistory = [];
    this.energyHistory = [];
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Compute variance of a number array. Returns 0 for empty/single-element.
   */
  private computeVariance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const sumSqDiff = values.reduce((acc, v) => acc + (v - mean) ** 2, 0);
    return sumSqDiff / values.length;
  }

  /**
   * Ratio of silent frames (below threshold) in energy history.
   */
  private computePauseRatio(): number {
    if (this.energyHistory.length === 0) return 1;
    const silentFrames = this.energyHistory.filter(
      (e) => e < SILENCE_THRESHOLD_DB,
    ).length;
    return silentFrames / this.energyHistory.length;
  }

  /**
   * Estimate speaking rate by counting energy-envelope peaks that cross
   * above the silence threshold (proxy for syllable onsets).
   */
  private estimateSpeakingRate(): number {
    const history = this.energyHistory;
    if (history.length < 4) return 0;

    let onsets = 0;
    let wasSilent = history[0] < SILENCE_THRESHOLD_DB;

    for (let i = 1; i < history.length; i++) {
      const isSilent = history[i] < SILENCE_THRESHOLD_DB;
      if (wasSilent && !isSilent) {
        onsets++;
      }
      wasSilent = isSilent;
    }

    // Convert onset count to syllables-per-second
    const windowDurationSec = history.length / Math.max(this.frameRate, 1);
    if (windowDurationSec < 0.1) return 0;
    return onsets / windowDurationSec;
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Clamp a value to the 0-1 range. */
function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}
