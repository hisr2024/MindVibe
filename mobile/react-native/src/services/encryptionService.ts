/**
 * Encryption Service
 *
 * Client-side encryption for sensitive user data:
 * - Journal entries
 * - Chat messages (when privacy mode enabled)
 * - Personal reflections
 *
 * Uses AES-256-GCM via react-native-keychain for key storage.
 * The encryption key is derived per-user and stored in the OS secure enclave.
 *
 * NOTE: For a production implementation, use a native crypto library
 * (react-native-quick-crypto or expo-crypto). This module provides
 * the interface and falls back to base64 encoding in development.
 */

import * as Keychain from 'react-native-keychain';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ENCRYPTION_KEY_SERVICE = 'com.mindvibe.encryption';

// ---------------------------------------------------------------------------
// Key Management
// ---------------------------------------------------------------------------

/**
 * Store the user's encryption key in the OS secure enclave.
 * Called once during account setup or key rotation.
 */
export async function storeEncryptionKey(key: string): Promise<void> {
  await Keychain.setGenericPassword('encryption_key', key, {
    service: ENCRYPTION_KEY_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

/**
 * Retrieve the encryption key from secure storage.
 */
export async function getEncryptionKey(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({
    service: ENCRYPTION_KEY_SERVICE,
  });
  return credentials ? credentials.password : null;
}

/**
 * Remove the encryption key (on logout or account deletion).
 */
export async function clearEncryptionKey(): Promise<void> {
  await Keychain.resetGenericPassword({ service: ENCRYPTION_KEY_SERVICE });
}

// ---------------------------------------------------------------------------
// Encryption / Decryption
// ---------------------------------------------------------------------------

/**
 * Encrypt a plaintext string.
 *
 * In production, this should use AES-256-GCM via a native crypto library.
 * The current implementation uses base64 encoding as a placeholder
 * to establish the interface and data flow.
 *
 * @param plaintext - The text to encrypt
 * @returns The encrypted ciphertext (base64-encoded)
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  if (!key) {
    throw new Error('Encryption key not found. Please re-authenticate.');
  }

  // Production: Use react-native-quick-crypto AES-256-GCM
  // For now, simple XOR + base64 as a development placeholder
  const keyBytes = stringToBytes(key);
  const textBytes = stringToBytes(plaintext);
  const encrypted = new Uint8Array(textBytes.length);

  for (let i = 0; i < textBytes.length; i++) {
    encrypted[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  return bytesToBase64(encrypted);
}

/**
 * Decrypt a ciphertext string.
 *
 * @param ciphertext - The encrypted text (base64-encoded)
 * @returns The decrypted plaintext
 */
export async function decrypt(ciphertext: string): Promise<string> {
  const key = await getEncryptionKey();
  if (!key) {
    throw new Error('Encryption key not found. Please re-authenticate.');
  }

  const keyBytes = stringToBytes(key);
  const encryptedBytes = base64ToBytes(ciphertext);
  const decrypted = new Uint8Array(encryptedBytes.length);

  for (let i = 0; i < encryptedBytes.length; i++) {
    decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  return bytesToString(decrypted);
}

// ---------------------------------------------------------------------------
// Byte Utilities
// ---------------------------------------------------------------------------

function stringToBytes(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

function bytesToString(bytes: Uint8Array): string {
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
