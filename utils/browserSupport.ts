/**
 * Browser support and compatibility checking utilities
 * Helps provide guidance to users when features are not available
 */

/**
 * Check if the current context is HTTPS or localhost
 * Many browser features (like microphone) require secure context
 */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check if running on localhost (development)
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname === '[::1]'
  
  // Check if HTTPS
  const isHttps = window.location.protocol === 'https:'
  
  return isHttps || isLocalhost
}

/**
 * Check if Speech Recognition API is supported
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
}

/**
 * Check if Speech Synthesis (text-to-speech) is supported
 */
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'speechSynthesis' in window
}

/**
 * Check if Clipboard API is supported
 */
export function isClipboardSupported(): boolean {
  if (typeof window === 'undefined') return false
  return !!(
    navigator.clipboard ||
    (document.queryCommandSupported && document.queryCommandSupported('copy'))
  )
}

/**
 * Check if the Web Share API is supported
 */
export function isWebShareSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'share' in navigator
}

/**
 * Get microphone permission status
 * Returns: 'granted', 'denied', 'prompt', or 'unsupported'
 */
export async function getMicrophonePermissionStatus(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> {
  if (typeof navigator === 'undefined' || !navigator.permissions) {
    return 'unsupported'
  }

  try {
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
    return result.state as 'granted' | 'denied' | 'prompt'
  } catch (error) {
    // Permissions API might not be supported or microphone query might fail
    return 'unsupported'
  }
}

/**
 * Request microphone permission by attempting to access media stream
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return false
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    // Stop the stream immediately as we only needed permission
    stream.getTracks().forEach(track => track.stop())
    return true
  } catch (error) {
    console.error('Microphone permission denied or not available:', error)
    return false
  }
}

/**
 * Get user-friendly message for voice feature requirements
 */
export function getVoiceFeatureRequirements(): {
  isSupported: boolean
  isSecure: boolean
  messages: string[]
} {
  const isSupported = isSpeechRecognitionSupported()
  const isSecure = isSecureContext()
  const messages: string[] = []

  if (!isSupported) {
    messages.push('Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.')
  }

  if (!isSecure) {
    messages.push('Voice features require HTTPS. Please access this site over a secure connection.')
  }

  return {
    isSupported,
    isSecure,
    messages,
  }
}

/**
 * Detect browser name for specific guidance
 */
export function getBrowserName(): string {
  if (typeof navigator === 'undefined') return 'unknown'
  
  const userAgent = navigator.userAgent.toLowerCase()
  
  if (userAgent.includes('chrome') && !userAgent.includes('edge')) {
    return 'Chrome'
  } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    return 'Safari'
  } else if (userAgent.includes('firefox')) {
    return 'Firefox'
  } else if (userAgent.includes('edge')) {
    return 'Edge'
  } else if (userAgent.includes('opera') || userAgent.includes('opr')) {
    return 'Opera'
  }
  
  return 'Unknown'
}

/**
 * Check if all required features for voice input are available
 */
export function canUseVoiceInput(): {
  available: boolean
  reason?: string
} {
  const requirements = getVoiceFeatureRequirements()
  
  if (!requirements.isSupported) {
    return {
      available: false,
      reason: `Voice input is not supported in ${getBrowserName()}. Please use Chrome, Edge, or Safari.`
    }
  }
  
  if (!requirements.isSecure) {
    return {
      available: false,
      reason: 'Voice features require HTTPS or localhost. Please access this site securely.'
    }
  }
  
  return { available: true }
}
