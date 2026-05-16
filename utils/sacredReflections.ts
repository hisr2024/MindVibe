/**
 * Sacred Reflections utility — store KIAAN's wisdom messages encrypted at rest in localStorage.
 *
 * SECURITY POSTURE
 * ----------------
 * This is **local-device** encryption, NOT end-to-end encryption. The
 * AES-GCM key is generated on the device and stored in localStorage on
 * the same device. The goal is "obscured on-disk storage" — a thief or
 * other process reading the browser's localStorage file sees ciphertext,
 * not plaintext. It is NOT a defence against:
 *   - XSS in this app (script can call getEncryptionKey() and decrypt)
 *   - Physical device access with running browser (open DevTools, read key)
 *   - Cross-device sync (reflections written on device A cannot be read on B)
 *
 * Marketing/UX must therefore describe this as "encrypted at rest on
 * your device" — never as "end-to-end encrypted". The TERMS.md privacy
 * section reflects this. True E2E would require a user-derived key
 * (passphrase) which we deliberately don't ask for (UX cost too high
 * for the value).
 *
 * The two constants below are localStorage KEY NAMES, not the
 * encryption key itself. Renaming for clarity.
 */

const SACRED_REFLECTIONS_STORAGE_KEY = 'kiaan_sacred_reflections'
const SACRED_REFLECTIONS_AES_KEY_STORAGE_KEY = 'kiaan_sacred_reflections_key'

// Encryption helpers (same as journal encryption in page.tsx)
function toBase64(buffer: ArrayBuffer | Uint8Array) {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer
  return btoa(String.fromCharCode(...bytes))
}

function fromBase64(value: string) {
  const binary = atob(value)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

async function getEncryptionKey() {
  const cached = typeof window !== 'undefined' ? window.localStorage.getItem(SACRED_REFLECTIONS_AES_KEY_STORAGE_KEY) : null
  const rawKey = cached ? fromBase64(cached) : crypto.getRandomValues(new Uint8Array(32))

  if (!cached && typeof window !== 'undefined') {
    window.localStorage.setItem(SACRED_REFLECTIONS_AES_KEY_STORAGE_KEY, toBase64(rawKey))
  }

  return crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

async function encryptText(plain: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await getEncryptionKey()
  const encoded = new TextEncoder().encode(plain)
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  return `${toBase64(iv)}:${toBase64(encrypted)}`
}

async function decryptText(payload: string) {
  const [ivPart, dataPart] = payload.split(':')
  if (!ivPart || !dataPart) return ''
  const iv = fromBase64(ivPart)
  const encrypted = fromBase64(dataPart)
  const key = await getEncryptionKey()
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted)
  return new TextDecoder().decode(decrypted)
}

export interface SacredReflection {
  id: string
  content: string
  timestamp: string
  source: 'kiaan' | 'user'
}

/**
 * Save a reflection to Sacred Reflections
 */
export async function saveSacredReflection(
  content: string,
  source: 'kiaan' | 'user' = 'kiaan'
): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false
    
    const reflections = await getSacredReflections()
    
    const newReflection: SacredReflection = {
      id: crypto.randomUUID(),
      content,
      timestamp: new Date().toISOString(),
      source,
    }
    
    reflections.unshift(newReflection) // Add to beginning
    
    // Keep only last 100 reflections
    const trimmed = reflections.slice(0, 100)
    
    const encrypted = await encryptText(JSON.stringify(trimmed))
    localStorage.setItem(SACRED_REFLECTIONS_STORAGE_KEY, encrypted)
    
    return true
  } catch (error) {
    console.error('Failed to save sacred reflection:', error)
    return false
  }
}

/**
 * Get all Sacred Reflections
 */
export async function getSacredReflections(): Promise<SacredReflection[]> {
  try {
    if (typeof window === 'undefined') return []
    
    const stored = localStorage.getItem(SACRED_REFLECTIONS_STORAGE_KEY)
    if (!stored) return []
    
    const decrypted = await decryptText(stored)
    const reflections = JSON.parse(decrypted) as SacredReflection[]
    
    return reflections
  } catch (error) {
    console.error('Failed to load sacred reflections:', error)
    return []
  }
}

/**
 * Delete a specific reflection
 */
export async function deleteSacredReflection(id: string): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false
    
    const reflections = await getSacredReflections()
    const filtered = reflections.filter(r => r.id !== id)
    
    const encrypted = await encryptText(JSON.stringify(filtered))
    localStorage.setItem(SACRED_REFLECTIONS_STORAGE_KEY, encrypted)
    
    return true
  } catch (error) {
    console.error('Failed to delete sacred reflection:', error)
    return false
  }
}

/**
 * Clear all Sacred Reflections
 */
export function clearSacredReflections(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SACRED_REFLECTIONS_STORAGE_KEY)
  }
}
