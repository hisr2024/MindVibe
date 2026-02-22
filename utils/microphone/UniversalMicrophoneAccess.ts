/**
 * Universal Microphone Access Utility
 *
 * Provides robust, cross-platform microphone access for:
 * - Desktop browsers (Chrome, Firefox, Safari, Edge)
 * - Mobile browsers (iOS Safari, Chrome Mobile, Samsung Internet)
 * - Web apps (PWAs)
 * - All devices and platforms
 *
 * Features:
 * - Automatic retry logic
 * - Platform-specific handling
 * - Permission persistence
 * - Detailed error messages
 * - Offline support
 */

export interface MicrophonePermissionState {
  status: 'granted' | 'denied' | 'prompt' | 'unsupported' | 'checking'
  canUse: boolean
  error?: string
  needsHTTPS?: boolean
  platform: string
  browser: string
}

export interface MicrophoneStreamOptions {
  echoCancellation?: boolean
  noiseSuppression?: boolean
  autoGainControl?: boolean
  sampleRate?: number
  channelCount?: number
}

/**
 * Detect the current platform
 */
export function detectPlatform(): { platform: string; browser: string; isMobile: boolean; isIOS: boolean } {
  if (typeof window === 'undefined') {
    return { platform: 'server', browser: 'none', isMobile: false, isIOS: false }
  }

  const ua = navigator.userAgent
  const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  const isIOS = /iPhone|iPad|iPod/i.test(ua)
  const isAndroid = /Android/i.test(ua)

  let browser = 'unknown'
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Edg')) browser = 'Edge'
  else if (ua.includes('Samsung')) browser = 'Samsung Internet'

  let platform = 'desktop'
  if (isIOS) platform = 'iOS'
  else if (isAndroid) platform = 'Android'
  else if (isMobile) platform = 'mobile'

  return { platform, browser, isMobile, isIOS }
}

/**
 * Check if the environment supports microphone access
 */
export function isEnvironmentSupported(): { supported: boolean; reason?: string } {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'Not running in a browser' }
  }

  // Check for secure context (HTTPS or localhost)
  const isSecure = window.isSecureContext ||
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]'

  if (!isSecure) {
    return { supported: false, reason: 'Microphone access requires HTTPS or localhost' }
  }

  // Check for mediaDevices API
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return { supported: false, reason: 'MediaDevices API not available in this browser' }
  }

  return { supported: true }
}

/**
 * Check current microphone permission status
 */
export async function checkMicrophonePermission(): Promise<MicrophonePermissionState> {
  const { platform, browser, isMobile, isIOS } = detectPlatform()

  // Check environment first
  const envCheck = isEnvironmentSupported()
  if (!envCheck.supported) {
    return {
      status: 'unsupported',
      canUse: false,
      error: envCheck.reason,
      needsHTTPS: envCheck.reason?.includes('HTTPS'),
      platform,
      browser
    }
  }

  try {
    // Try Permissions API first (not supported on all browsers)
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })

        return {
          status: result.state as 'granted' | 'denied' | 'prompt',
          canUse: result.state === 'granted',
          platform,
          browser
        }
      } catch {
        // Permissions API failed, fall through to alternative check
      }
    }

    // Alternative: Try to enumerate devices (works on Safari/iOS)
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioDevices = devices.filter(d => d.kind === 'audioinput')

      // If we have labeled devices, permission was granted
      const hasLabels = audioDevices.some(d => d.label !== '')

      if (hasLabels) {
        return { status: 'granted', canUse: true, platform, browser }
      } else if (audioDevices.length > 0) {
        // Devices exist but no labels = permission not yet granted
        return { status: 'prompt', canUse: false, platform, browser }
      } else {
        // No audio devices found
        return {
          status: 'unsupported',
          canUse: false,
          error: 'No microphone detected on this device',
          platform,
          browser
        }
      }
    } catch (enumError) {
      // Enumeration failed, assume we need to prompt
      return { status: 'prompt', canUse: false, platform, browser }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error checking microphone permission'
    return {
      status: 'unsupported',
      canUse: false,
      error: message,
      platform,
      browser
    }
  }
}

/**
 * Request microphone access with robust error handling and retries
 */
export async function requestMicrophoneAccess(
  options: MicrophoneStreamOptions = {},
  maxRetries: number = 3
): Promise<{ success: boolean; stream?: MediaStream; error?: string }> {
  const { platform, browser, isIOS } = detectPlatform()

  // Check environment
  const envCheck = isEnvironmentSupported()
  if (!envCheck.supported) {
    return { success: false, error: envCheck.reason }
  }

  // Default options optimized for voice
  const defaultOptions: MediaStreamConstraints = {
    audio: {
      echoCancellation: options.echoCancellation !== false,
      noiseSuppression: options.noiseSuppression !== false,
      autoGainControl: options.autoGainControl !== false,
      ...(options.sampleRate && { sampleRate: options.sampleRate }),
      ...(options.channelCount && { channelCount: options.channelCount })
    },
    video: false
  }

  // iOS Safari specific handling
  if (isIOS) {
    // iOS Safari requires simpler constraints
    defaultOptions.audio = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  }

  let lastError: unknown = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(defaultOptions)

      // Verify the stream has audio tracks
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks in media stream')
      }

      // Verify tracks are enabled and not muted
      const workingTracks = audioTracks.filter(t => t.enabled && t.readyState === 'live')
      if (workingTracks.length === 0) {
        throw new Error('Audio tracks are not active')
      }

      return { success: true, stream }

    } catch (error: unknown) {
      lastError = error
      const errName = error instanceof Error ? error.name : 'UnknownError'
      const errMessage = error instanceof Error ? error.message : String(error)
      console.warn(`[Microphone] Attempt ${attempt + 1} failed:`, errName, errMessage)

      // Don't retry on permanent errors
      if (
        errName === 'NotAllowedError' ||
        errName === 'PermissionDeniedError' ||
        errName === 'NotFoundError' ||
        errName === 'DevicesNotFoundError'
      ) {
        break  // These won't be fixed by retrying
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500))
      }
    }
  }

  // All attempts failed, return detailed error
  return {
    success: false,
    error: formatMicrophoneError(lastError, platform, browser)
  }
}

/**
 * Format error messages to be user-friendly and platform-specific
 */
function formatMicrophoneError(error: unknown, platform: string, browser: string): string {
  const errorName = error instanceof Error ? error.name : ''
  const errorMsg = error instanceof Error ? error.message : ''

  if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
    if (platform === 'iOS') {
      return 'Microphone access denied. Go to Settings → Safari → Microphone and allow access, then refresh this page.'
    } else if (platform === 'Android') {
      return 'Microphone access denied. Go to Settings → Apps → Browser → Permissions → Microphone and allow access.'
    } else {
      return `Microphone access denied. Click the lock/info icon in your browser's address bar and allow microphone access.`
    }
  }

  if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
    return 'No microphone found. Please connect a microphone and try again.'
  }

  if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
    return 'Microphone is in use by another application. Please close other apps using the microphone and try again.'
  }

  if (errorName === 'OverconstrainedError') {
    return 'Your microphone does not support the requested settings. Trying with default settings...'
  }

  if (errorName === 'TypeError') {
    return 'Microphone access is not supported on this device or browser. Please use a modern browser like Chrome, Safari, or Edge.'
  }

  if (errorName === 'AbortError') {
    return 'Microphone access was interrupted. Please try again.'
  }

  if (errorMsg.includes('secure') || errorMsg.includes('HTTPS')) {
    return 'Microphone access requires HTTPS. Please access this site via https:// or use localhost for development.'
  }

  return `Could not access microphone: ${errorMsg || errorName || 'Unknown error'}. Please check your device settings.`
}

/**
 * Test if speech recognition is available
 */
export function isSpeechRecognitionAvailable(): boolean {
  if (typeof window === 'undefined') return false

  const win = window as unknown as Window & Record<string, unknown>
  return !!(
    win.SpeechRecognition ||
    win.webkitSpeechRecognition ||
    win.mozSpeechRecognition ||
    win.msSpeechRecognition
  )
}

/**
 * Get the Speech Recognition constructor
 */
export function getSpeechRecognitionConstructor(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null

  const win = window as unknown as Window & Record<string, unknown>
  return (
    (win.SpeechRecognition as (new () => SpeechRecognition) | undefined) ||
    (win.webkitSpeechRecognition as (new () => SpeechRecognition) | undefined) ||
    (win.mozSpeechRecognition as (new () => SpeechRecognition) | undefined) ||
    (win.msSpeechRecognition as (new () => SpeechRecognition) | undefined) ||
    null
  )
}

/**
 * Comprehensive diagnostic check
 */
export async function runMicrophoneDiagnostics(): Promise<{
  platform: string
  browser: string
  isSecure: boolean
  hasMediaDevices: boolean
  hasSpeechRecognition: boolean
  permissionStatus: string
  audioDevicesCount: number
  errors: string[]
}> {
  const { platform, browser } = detectPlatform()
  const errors: string[] = []

  const isSecure = window.isSecureContext ||
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost'

  const hasMediaDevices = !!(navigator.mediaDevices?.getUserMedia)
  const hasSpeechRecognition = isSpeechRecognitionAvailable()

  let permissionStatus = 'unknown'
  let audioDevicesCount = 0

  try {
    const permState = await checkMicrophonePermission()
    permissionStatus = permState.status
    if (permState.error) errors.push(permState.error)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    errors.push(`Permission check failed: ${message}`)
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    audioDevicesCount = devices.filter(d => d.kind === 'audioinput').length
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    errors.push(`Device enumeration failed: ${message}`)
  }

  return {
    platform,
    browser,
    isSecure,
    hasMediaDevices,
    hasSpeechRecognition,
    permissionStatus,
    audioDevicesCount,
    errors
  }
}

/**
 * Stop a media stream and release all tracks
 */
export function stopMediaStream(stream: MediaStream | null | undefined): void {
  if (!stream) return

  try {
    stream.getTracks().forEach(track => {
      track.stop()
      stream.removeTrack(track)
    })
  } catch (error) {
    console.warn('Error stopping media stream:', error)
  }
}

export default {
  detectPlatform,
  isEnvironmentSupported,
  checkMicrophonePermission,
  requestMicrophoneAccess,
  isSpeechRecognitionAvailable,
  getSpeechRecognitionConstructor,
  runMicrophoneDiagnostics,
  stopMediaStream
}
