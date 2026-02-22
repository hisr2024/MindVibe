/**
 * Biometric Authentication Hook
 *
 * Provides secure biometric authentication using WebAuthn API.
 * Supports fingerprint, Face ID, and device PIN as fallback.
 *
 * Security Features:
 * - Uses platform authenticator (secure enclave on iOS/Android)
 * - Credentials stored securely in device keychain
 * - Challenge-response authentication prevents replay attacks
 * - No biometric data ever leaves the device
 *
 * @example
 * const { isAvailable, authenticate, register } = useBiometricAuth()
 *
 * if (isAvailable) {
 *   const result = await authenticate()
 *   if (result.success) {
 *     // User authenticated
 *   }
 * }
 */

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api'

// WebAuthn types for TypeScript
interface PublicKeyCredentialCreationOptionsJSON {
  challenge: string
  rp: {
    name: string
    id?: string
  }
  user: {
    id: string
    name: string
    displayName: string
  }
  pubKeyCredParams: Array<{
    type: 'public-key'
    alg: number
  }>
  timeout?: number
  attestation?: AttestationConveyancePreference
  authenticatorSelection?: {
    authenticatorAttachment?: AuthenticatorAttachment
    residentKey?: ResidentKeyRequirement
    requireResidentKey?: boolean
    userVerification?: UserVerificationRequirement
  }
  excludeCredentials?: Array<{
    type: 'public-key'
    id: string
    transports?: AuthenticatorTransport[]
  }>
}

interface PublicKeyCredentialRequestOptionsJSON {
  challenge: string
  timeout?: number
  rpId?: string
  allowCredentials?: Array<{
    type: 'public-key'
    id: string
    transports?: AuthenticatorTransport[]
  }>
  userVerification?: UserVerificationRequirement
}

interface BiometricAuthResult {
  success: boolean
  error?: string
  credentialId?: string
}

interface BiometricRegisterResult {
  success: boolean
  error?: string
  credentialId?: string
}

interface UseBiometricAuthReturn {
  /** Whether biometric auth is available on this device */
  isAvailable: boolean
  /** Whether biometric auth is supported (WebAuthn available) */
  isSupported: boolean
  /** Whether user has registered a credential */
  isRegistered: boolean
  /** Whether an operation is in progress */
  isLoading: boolean
  /** Last error message */
  error: string | null
  /** Check if biometric is available */
  checkAvailability: () => Promise<boolean>
  /** Register a new biometric credential */
  register: (userId: string, userName: string) => Promise<BiometricRegisterResult>
  /** Authenticate using biometric */
  authenticate: () => Promise<BiometricAuthResult>
  /** Remove registered credential */
  unregister: () => Promise<boolean>
  /** Clear any errors */
  clearError: () => void
}

// Storage keys for credential data
const CREDENTIAL_ID_KEY = 'mindvibe_biometric_credential_id'
const BIOMETRIC_ENABLED_KEY = 'mindvibe_biometric_enabled'

// Helper to convert base64url to ArrayBuffer
function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const paddedBase64 = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=')
  const binary = atob(paddedBase64)
  const buffer = new ArrayBuffer(binary.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i)
  }
  return buffer
}

// Helper to convert ArrayBuffer to base64url
function bufferToBase64url(buffer: ArrayBuffer): string {
  const view = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < view.length; i++) {
    binary += String.fromCharCode(view[i])
  }
  const base64 = btoa(binary)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function useBiometricAuth(): UseBiometricAuthReturn {
  const [isAvailable, setIsAvailable] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if WebAuthn is available
  useEffect(() => {
    const checkSupport = async () => {
      // Check basic WebAuthn support
      if (typeof window === 'undefined' || !window.PublicKeyCredential) {
        setIsSupported(false)
        setIsAvailable(false)
        return
      }

      setIsSupported(true)

      // Check if platform authenticator is available (fingerprint, Face ID, etc.)
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        setIsAvailable(available)
      } catch {
        setIsAvailable(false)
      }

      // Check if user has a registered credential
      const credentialId = localStorage.getItem(CREDENTIAL_ID_KEY)
      const enabled = localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true'
      setIsRegistered(!!credentialId && enabled)
    }

    checkSupport()
  }, [])

  // Check availability (can be called explicitly)
  const checkAvailability = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      return false
    }

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      setIsAvailable(available)
      return available
    } catch {
      setIsAvailable(false)
      return false
    }
  }, [])

  // Register a new biometric credential
  const register = useCallback(async (
    userId: string,
    userName: string
  ): Promise<BiometricRegisterResult> => {
    if (!isSupported || !isAvailable) {
      return { success: false, error: 'Biometric authentication is not available on this device' }
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get challenge from server
      const challengeResponse = await apiFetch('/api/auth/webauthn/register/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, user_name: userName }),
      })

      if (!challengeResponse.ok) {
        throw new Error('Failed to get registration challenge from server')
      }

      const options: PublicKeyCredentialCreationOptionsJSON = await challengeResponse.json()

      // Convert options for WebAuthn API
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: base64urlToBuffer(options.challenge),
        rp: {
          name: options.rp.name,
          id: options.rp.id || window.location.hostname,
        },
        user: {
          id: base64urlToBuffer(options.user.id),
          name: options.user.name,
          displayName: options.user.displayName,
        },
        pubKeyCredParams: options.pubKeyCredParams,
        timeout: options.timeout || 60000,
        attestation: options.attestation || 'none',
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Use device authenticator only
          residentKey: 'preferred',
          userVerification: 'required', // Require biometric verification
        },
      }

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential

      if (!credential) {
        throw new Error('Failed to create credential')
      }

      const response = credential.response as AuthenticatorAttestationResponse

      // Send credential to server for verification
      const verifyResponse = await apiFetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential_id: bufferToBase64url(credential.rawId),
          attestation_object: bufferToBase64url(response.attestationObject),
          client_data_json: bufferToBase64url(response.clientDataJSON),
          user_id: userId,
        }),
      })

      if (!verifyResponse.ok) {
        throw new Error('Failed to verify credential with server')
      }

      // Store credential ID locally
      const credentialId = bufferToBase64url(credential.rawId)
      localStorage.setItem(CREDENTIAL_ID_KEY, credentialId)
      localStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true')
      setIsRegistered(true)

      return { success: true, credentialId }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'

      // Handle user cancellation gracefully
      if (errorMessage.includes('NotAllowedError') || errorMessage.includes('cancelled')) {
        setError('Biometric registration was cancelled')
        return { success: false, error: 'Registration cancelled by user' }
      }

      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, isAvailable])

  // Authenticate using biometric
  const authenticate = useCallback(async (): Promise<BiometricAuthResult> => {
    if (!isSupported) {
      return { success: false, error: 'Biometric authentication is not supported' }
    }

    if (!isRegistered) {
      return { success: false, error: 'No biometric credential registered' }
    }

    setIsLoading(true)
    setError(null)

    try {
      const storedCredentialId = localStorage.getItem(CREDENTIAL_ID_KEY)
      if (!storedCredentialId) {
        throw new Error('No stored credential found')
      }

      // Get authentication challenge from server
      const challengeResponse = await apiFetch('/api/auth/webauthn/authenticate/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential_id: storedCredentialId }),
      })

      if (!challengeResponse.ok) {
        throw new Error('Failed to get authentication challenge')
      }

      const options: PublicKeyCredentialRequestOptionsJSON = await challengeResponse.json()

      // Convert options for WebAuthn API
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: base64urlToBuffer(options.challenge),
        timeout: options.timeout || 60000,
        rpId: options.rpId || window.location.hostname,
        userVerification: 'required',
        allowCredentials: options.allowCredentials?.map((cred) => ({
          type: 'public-key' as const,
          id: base64urlToBuffer(cred.id),
          transports: cred.transports,
        })) || [{
          type: 'public-key' as const,
          id: base64urlToBuffer(storedCredentialId),
        }],
      }

      // Get assertion
      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential

      if (!credential) {
        throw new Error('Authentication failed')
      }

      const response = credential.response as AuthenticatorAssertionResponse

      // Verify with server
      const verifyResponse = await apiFetch('/api/auth/webauthn/authenticate/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential_id: bufferToBase64url(credential.rawId),
          authenticator_data: bufferToBase64url(response.authenticatorData),
          client_data_json: bufferToBase64url(response.clientDataJSON),
          signature: bufferToBase64url(response.signature),
          user_handle: response.userHandle ? bufferToBase64url(response.userHandle) : null,
        }),
      })

      if (!verifyResponse.ok) {
        throw new Error('Server verification failed')
      }

      const _verifyData = await verifyResponse.json()

      return {
        success: true,
        credentialId: bufferToBase64url(credential.rawId),
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed'

      // Handle user cancellation
      if (errorMessage.includes('NotAllowedError') || errorMessage.includes('cancelled')) {
        setError('Biometric authentication was cancelled')
        return { success: false, error: 'Authentication cancelled by user' }
      }

      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, isRegistered])

  // Remove registered credential
  const unregister = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const credentialId = localStorage.getItem(CREDENTIAL_ID_KEY)

      if (credentialId) {
        // Notify server to remove credential
        await apiFetch('/api/auth/webauthn/unregister', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential_id: credentialId }),
        }).catch(() => {
          // Ignore server errors - still remove locally
        })
      }

      // Remove local data
      localStorage.removeItem(CREDENTIAL_ID_KEY)
      localStorage.removeItem(BIOMETRIC_ENABLED_KEY)
      setIsRegistered(false)

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unregister'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isAvailable,
    isSupported,
    isRegistered,
    isLoading,
    error,
    checkAvailability,
    register,
    authenticate,
    unregister,
    clearError,
  }
}

export default useBiometricAuth
