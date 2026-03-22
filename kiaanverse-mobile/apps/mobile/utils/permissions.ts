/**
 * Centralized Permission Utilities — Kiaanverse
 *
 * Single entry point for requesting all device permissions.
 * Each function handles the check-then-request flow, never throws,
 * and returns a boolean indicating whether the permission was granted.
 *
 * Permission usage mapping:
 *   Microphone  → Sakha voice conversations (expo-av Audio.requestPermissionsAsync)
 *   Camera      → Profile photos, sacred images (expo-camera Camera.requestCameraPermissionsAsync)
 *   Notification → Push + local notifications (expo-notifications requestPermissionsAsync)
 *   Biometric   → Face ID / fingerprint login (expo-local-authentication)
 *
 * These functions are consumed by:
 *   - useVoiceRecorder hook (microphone)
 *   - ReadyStep onboarding (notifications)
 *   - notificationService.ts (notifications)
 *   - authStore.ts (biometric)
 *   - Future camera features
 */

import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as Camera from 'expo-camera';
import * as Notifications from 'expo-notifications';
import * as LocalAuthentication from 'expo-local-authentication';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Biometric authentication type available on the device.
 * Maps to LocalAuthentication.AuthenticationType values.
 */
export type BiometricType = 'fingerprint' | 'facial-recognition' | 'iris';

// ---------------------------------------------------------------------------
// Microphone Permission
// ---------------------------------------------------------------------------

/**
 * Request microphone permission for voice recording.
 * Used by Sakha AI voice conversations via useVoiceRecorder.
 *
 * Flow:
 * 1. Check current status via Audio.getPermissionsAsync()
 * 2. If already granted, return true
 * 3. If undetermined, request via Audio.requestPermissionsAsync()
 * 4. Return whether granted
 *
 * @returns true if permission is granted, false otherwise. Never throws.
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const { status: existing } = await Audio.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Camera Permission
// ---------------------------------------------------------------------------

/**
 * Request camera permission for photo capture.
 * Used for profile photos and sacred image features.
 *
 * Flow:
 * 1. Check current status via Camera.getCameraPermissionsAsync()
 * 2. If already granted, return true
 * 3. If undetermined, request via Camera.requestCameraPermissionsAsync()
 * 4. Return whether granted
 *
 * @returns true if permission is granted, false otherwise. Never throws.
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const { status: existing } = await Camera.getCameraPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Notification Permission
// ---------------------------------------------------------------------------

/**
 * Request notification permission for push and local notifications.
 * Used during onboarding (ReadyStep) and by notificationService.
 *
 * Flow:
 * 1. Check current status via Notifications.getPermissionsAsync()
 * 2. If already granted, return true
 * 3. If undetermined, request via Notifications.requestPermissionsAsync()
 *    - On iOS, requests alert + badge + sound
 *    - On Android 13+, triggers POST_NOTIFICATIONS runtime permission
 * 4. Return whether granted
 *
 * @returns true if permission is granted, false otherwise. Never throws.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return status === 'granted';
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Biometric Availability Check
// ---------------------------------------------------------------------------

/**
 * Check if biometric authentication is available on this device.
 * Does NOT request permission — biometric prompt is shown only when
 * authenticateAsync() is called (handled by authStore).
 *
 * Flow:
 * 1. Check hardware availability via hasHardwareAsync()
 * 2. Check enrollment via isEnrolledAsync()
 * 3. If both pass, detect the specific biometric type
 * 4. Return the type, or null if unavailable
 *
 * Biometric types:
 *   'fingerprint'          → Touch ID (iOS) or fingerprint sensor (Android)
 *   'facial-recognition'   → Face ID (iOS) or face unlock (Android)
 *   'iris'                 → Iris scanner (Samsung, etc.)
 *
 * @returns The available BiometricType, or null if unavailable. Never throws.
 */
export async function checkBiometricAvailability(): Promise<BiometricType | null> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return null;

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) return null;

    // Detect the specific biometric type
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (supportedTypes.length === 0) return null;

    // Map expo-local-authentication types to our BiometricType
    // Prefer Face ID over fingerprint on devices that support both
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'facial-recognition';
    }
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'fingerprint';
    }
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'iris';
    }

    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Permission Status Checks (no prompt — read-only)
// ---------------------------------------------------------------------------

/**
 * Check if notification permission is currently granted without prompting.
 * Useful for UI conditional rendering (e.g., showing "Enable notifications" button).
 *
 * @returns true if granted, false otherwise. Never throws.
 */
export async function isNotificationPermissionGranted(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Check if microphone permission is currently granted without prompting.
 *
 * @returns true if granted, false otherwise. Never throws.
 */
export async function isMicrophonePermissionGranted(): Promise<boolean> {
  try {
    const { status } = await Audio.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Get a human-readable label for the biometric type.
 * Used in UI text like "Sign in with Face ID" or "Sign in with Fingerprint".
 *
 * @param type - The BiometricType to get a label for
 * @returns Display label for the biometric type
 */
export function getBiometricLabel(type: BiometricType): string {
  switch (type) {
    case 'facial-recognition':
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Unlock';
    case 'fingerprint':
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    case 'iris':
      return 'Iris Scanner';
  }
}
