'use client';

/**
 * deviceCapabilities.ts
 *
 * Runtime hardware detection and adaptive compute management.
 * Detects device capabilities (CPU, GPU, memory, battery, network)
 * and determines the optimal compute policy for TTS/STT providers,
 * balancing performance with power consumption and thermal state.
 *
 * All detection is SSR-safe — guards against missing window/navigator.
 */

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface DeviceCapabilities {
  /** Logical CPU core count (navigator.hardwareConcurrency). */
  cpuCores: number;
  /** Approximate device RAM in GB (navigator.deviceMemory). */
  memoryGb: number;
  /** Whether the WebGPU API is available. */
  supportsWebGPU: boolean;
  /** Whether the WebNN (ML) API is available. */
  supportsWebNN: boolean;
  /** GPU tier inferred from WebGL renderer string. */
  gpuTier: 'none' | 'integrated' | 'discrete';
  /** Whether ONNX Runtime Web is likely supported (WebAssembly present). */
  supportsONNX: boolean;
  /** Whether WebAssembly is supported. */
  supportsWASM: boolean;
  /** Battery level 0-1, or null if Battery API unavailable. */
  batteryLevel: number | null;
  /** Whether device is currently charging, or null if unknown. */
  isCharging: boolean | null;
  /** Device thermal state. Defaults to 'nominal' when unavailable. */
  thermalState: 'nominal' | 'fair' | 'serious' | 'critical';
  /** Effective network connection type. */
  networkType: 'offline' | '2g' | '3g' | '4g' | '5g' | 'wifi' | 'unknown';
}

export interface ComputePolicy {
  /** TTS provider to use (e.g. 'browser', 'piper', 'silero'). */
  ttsProvider: string;
  /** STT provider to use (e.g. 'browser', 'vosk', 'whisper_local'). */
  sttProvider: string;
  /** Whether to run inference locally on-device. */
  useLocalInference: boolean;
  /** Whether to enable streaming responses. */
  enableStreaming: boolean;
  /** Human-readable explanation for why this policy was chosen. */
  reason: string;
}

// ---------------------------------------------------------------------------
// Detection helpers (all SSR-safe)
// ---------------------------------------------------------------------------

/**
 * Classify the GPU tier from the WebGL debug renderer string.
 *
 * Uses the WEBGL_debug_renderer_info extension to inspect the
 * unmasked renderer. Discrete GPUs (NVIDIA, AMD Radeon RX/RTX)
 * return 'discrete'; Intel/Apple integrated GPUs return 'integrated';
 * everything else (or unavailable) returns 'none'.
 */
function detectGpuTier(): DeviceCapabilities['gpuTier'] {
  if (typeof document === 'undefined') return 'none';

  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');

    if (!gl || !(gl instanceof WebGLRenderingContext || gl instanceof WebGL2RenderingContext)) {
      return 'none';
    }

    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return 'none';

    const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)?.toString().toUpperCase() ?? '';

    // Discrete GPU detection
    if (renderer.includes('NVIDIA')) return 'discrete';
    if (renderer.includes('AMD') && /RADEON\s*(RX|RTX)/.test(renderer)) return 'discrete';

    // Integrated GPU detection
    if (renderer.includes('INTEL')) return 'integrated';
    if (renderer.includes('APPLE')) return 'integrated';

    return 'none';
  } catch {
    return 'none';
  }
}

/**
 * Read the battery status via the Battery Status API.
 * Returns { level, charging } or nulls when unavailable.
 */
async function detectBattery(): Promise<{
  level: number | null;
  charging: boolean | null;
}> {
  if (typeof navigator === 'undefined') {
    return { level: null, charging: null };
  }

  try {
    // The Battery Status API is non-standard but widely available on Chrome/Edge.
    // Battery Status API is non-standard — no TypeScript type exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const battery = await (navigator as any).getBattery?.();
    if (battery) {
      return {
        level: typeof battery.level === 'number' ? battery.level : null,
        charging: typeof battery.charging === 'boolean' ? battery.charging : null,
      };
    }
  } catch {
    // Battery API not available or permission denied — graceful degradation.
  }

  return { level: null, charging: null };
}

/**
 * Detect the effective network connection type.
 * Falls back to checking navigator.onLine for offline detection.
 */
function detectNetworkType(): DeviceCapabilities['networkType'] {
  if (typeof navigator === 'undefined') return 'unknown';

  if (!navigator.onLine) return 'offline';

  // Network Information API is non-standard — no TypeScript type exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const connection = (navigator as any).connection;
  if (!connection) return 'unknown';

  const effectiveType: string | undefined = connection.effectiveType;

  switch (effectiveType) {
    case 'slow-2g':
    case '2g':
      return '2g';
    case '3g':
      return '3g';
    case '4g':
      return '4g';
    default:
      break;
  }

  // Some browsers expose connection.type for wifi/5g detection
  const type: string | undefined = connection.type;
  if (type === 'wifi') return 'wifi';
  if (type === '5g' || effectiveType === '5g') return '5g';

  return 'unknown';
}

/**
 * Detect thermal state if available (currently no standard browser API;
 * placeholder for future Compute Pressure API or platform-specific hooks).
 */
function detectThermalState(): DeviceCapabilities['thermalState'] {
  // The Compute Pressure API (navigator.scheduling / PressureObserver)
  // is still experimental. Default to 'nominal' until widely supported.
  return 'nominal';
}

// ---------------------------------------------------------------------------
// Main detection function
// ---------------------------------------------------------------------------

/**
 * Detect all available device capabilities at runtime.
 *
 * Safe to call in SSR environments — returns sensible defaults when
 * browser APIs are unavailable.
 *
 * @returns A snapshot of the current device capabilities.
 *
 * @example
 * ```ts
 * const caps = await detectDeviceCapabilities();
 * console.log(`CPU cores: ${caps.cpuCores}, GPU: ${caps.gpuTier}`);
 * ```
 */
export async function detectDeviceCapabilities(): Promise<DeviceCapabilities> {
  const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';

  const supportsWASM = (() => {
    try {
      return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
    } catch {
      return false;
    }
  })();

  const battery = await detectBattery();

  return {
    cpuCores: isBrowser ? navigator.hardwareConcurrency ?? 1 : 1,
    // deviceMemory and gpu are non-standard Navigator properties
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    memoryGb: isBrowser ? (navigator as any).deviceMemory ?? 2 : 2,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supportsWebGPU: isBrowser ? !!(navigator as any).gpu : false,
    supportsWebNN: isBrowser ? 'ml' in navigator : false,
    gpuTier: isBrowser ? detectGpuTier() : 'none',
    supportsONNX: supportsWASM,
    supportsWASM,
    batteryLevel: battery.level,
    isCharging: battery.charging,
    thermalState: isBrowser ? detectThermalState() : 'nominal',
    networkType: isBrowser ? detectNetworkType() : 'unknown',
  };
}

// ---------------------------------------------------------------------------
// Compute policy
// ---------------------------------------------------------------------------

/**
 * Determine the optimal compute policy based on device capabilities.
 *
 * Decision priority (highest to lowest):
 *  1. Critical battery / thermal → minimal browser-only providers
 *  2. Low battery → browser-only providers
 *  3. Offline → local providers (piper + vosk)
 *  4. NPU / WebNN available → on-device inference (whisper_local + piper)
 *  5. Discrete GPU + WebGPU → GPU-accelerated local (whisper_local + silero)
 *  6. Default → browser built-in providers
 *
 * @param caps - Current device capabilities snapshot.
 * @returns The recommended compute policy.
 *
 * @example
 * ```ts
 * const caps = await detectDeviceCapabilities();
 * const policy = computeOptimalPolicy(caps);
 * console.log(`Using ${policy.ttsProvider} for TTS: ${policy.reason}`);
 * ```
 */
export function computeOptimalPolicy(caps: DeviceCapabilities): ComputePolicy {
  // --- Critical battery (< 10%, not charging) ---
  if (caps.batteryLevel !== null && caps.batteryLevel < 0.1 && caps.isCharging === false) {
    return {
      ttsProvider: 'browser',
      sttProvider: 'browser',
      useLocalInference: false,
      enableStreaming: false,
      reason: 'Battery critically low (<10%) and not charging — using minimal browser-only providers to conserve power.',
    };
  }

  // --- Low battery (< 20%, not charging) ---
  if (caps.batteryLevel !== null && caps.batteryLevel < 0.2 && caps.isCharging === false) {
    return {
      ttsProvider: 'browser',
      sttProvider: 'browser',
      useLocalInference: false,
      enableStreaming: false,
      reason: 'Battery low (<20%) and not charging — using browser-only providers to extend battery life.',
    };
  }

  // --- Thermal throttling ---
  if (caps.thermalState === 'serious' || caps.thermalState === 'critical') {
    return {
      ttsProvider: 'browser',
      sttProvider: 'browser',
      useLocalInference: false,
      enableStreaming: false,
      reason: `Device thermal state is "${caps.thermalState}" — reducing compute load with browser-only providers.`,
    };
  }

  // --- Offline ---
  if (caps.networkType === 'offline') {
    return {
      ttsProvider: 'piper',
      sttProvider: 'vosk',
      useLocalInference: true,
      enableStreaming: false,
      reason: 'Device is offline — using local providers (piper TTS, vosk STT) for continued functionality.',
    };
  }

  // --- NPU / WebNN available ---
  if (caps.supportsWebNN) {
    return {
      ttsProvider: 'piper',
      sttProvider: 'whisper_local',
      useLocalInference: true,
      enableStreaming: true,
      reason: 'WebNN (NPU) detected — using on-device inference for low-latency, privacy-preserving processing.',
    };
  }

  // --- Discrete GPU + WebGPU ---
  if (caps.gpuTier === 'discrete' && caps.supportsWebGPU) {
    return {
      ttsProvider: 'silero',
      sttProvider: 'whisper_local',
      useLocalInference: true,
      enableStreaming: true,
      reason: 'Discrete GPU with WebGPU support detected — using GPU-accelerated local inference.',
    };
  }

  // --- Default: browser built-in providers ---
  return {
    ttsProvider: 'browser',
    sttProvider: 'browser',
    useLocalInference: false,
    enableStreaming: true,
    reason: 'Using browser built-in providers as default — suitable for standard hardware.',
  };
}

// ---------------------------------------------------------------------------
// Policy comparison
// ---------------------------------------------------------------------------

/**
 * Check whether two compute policies differ in any meaningful field.
 *
 * Compares ttsProvider, sttProvider, useLocalInference, and enableStreaming.
 * The reason string is intentionally excluded because it is informational only.
 *
 * @param a - First policy.
 * @param b - Second policy.
 * @returns True if the policies differ in any operational field.
 */
export function policyChanged(a: ComputePolicy, b: ComputePolicy): boolean {
  return (
    a.ttsProvider !== b.ttsProvider ||
    a.sttProvider !== b.sttProvider ||
    a.useLocalInference !== b.useLocalInference ||
    a.enableStreaming !== b.enableStreaming
  );
}

// ---------------------------------------------------------------------------
// Adaptive compute manager
// ---------------------------------------------------------------------------

/** Callback invoked when the compute policy changes. */
export type PolicyChangeCallback = (policy: ComputePolicy) => void;

/**
 * Periodically re-detects device capabilities and notifies when
 * the optimal compute policy changes (e.g. battery drops, network
 * switches from wifi to offline, thermal throttling kicks in).
 *
 * @example
 * ```ts
 * const manager = new AdaptiveComputeManager();
 * manager.start((policy) => {
 *   console.log('Policy changed:', policy.reason);
 *   reconfigureProviders(policy);
 * });
 *
 * // Later, when component unmounts:
 * manager.stop();
 * ```
 */
export class AdaptiveComputeManager {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private currentPolicy: ComputePolicy | null = null;

  /**
   * Start periodic capability detection.
   *
   * Runs an initial detection immediately, then re-checks every 30 seconds.
   * The callback fires only when the policy actually changes (compared via
   * {@link policyChanged}).
   *
   * @param onPolicyChange - Callback invoked with the new policy when it differs
   *                          from the previous one.
   */
  async start(onPolicyChange: PolicyChangeCallback): Promise<void> {
    // Run initial detection immediately
    await this.detect(onPolicyChange);

    // Guard against SSR — setInterval requires a browser environment
    if (typeof window === 'undefined') return;

    this.intervalId = setInterval(async () => {
      await this.detect(onPolicyChange);
    }, 30_000);
  }

  /**
   * Stop periodic detection and clear the interval.
   * Safe to call multiple times.
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Get the most recently computed policy, or null if detection
   * has not yet run.
   */
  getCurrentPolicy(): ComputePolicy | null {
    return this.currentPolicy;
  }

  /**
   * Internal: detect capabilities, compute policy, and notify if changed.
   */
  private async detect(onPolicyChange: PolicyChangeCallback): Promise<void> {
    try {
      const caps = await detectDeviceCapabilities();
      const newPolicy = computeOptimalPolicy(caps);

      if (this.currentPolicy === null || policyChanged(this.currentPolicy, newPolicy)) {
        this.currentPolicy = newPolicy;
        onPolicyChange(newPolicy);
      }
    } catch (error) {
      // Detection should never crash the application.
      // Log at warning level — the previous policy remains in effect.
      if (typeof console !== 'undefined') {
        console.warn('[AdaptiveComputeManager] Detection failed, keeping current policy:', error);
      }
    }
  }
}
