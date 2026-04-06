/**
 * Client-side E2E encryption for journal entries.
 *
 * Produces an `EncryptedPayload` object shape-compatible with the backend
 * `backend/schemas/journal.py::EncryptedPayload`:
 *   { ciphertext, iv, salt, auth_tag?, algorithm, key_version? }
 *
 * Zero-knowledge: the backend stores this object opaquely and never
 * decrypts it. Ciphertext is produced with AES-GCM 256; the 16-byte auth
 * tag is appended to the ciphertext (Web Crypto default) and `auth_tag`
 * is left empty.
 *
 * The symmetric key is generated on first use and persisted in
 * localStorage. A production rollout should derive it from a vault-managed
 * secret or a user passphrase — left as a TODO; the API surface here is
 * stable so callers are unaffected by that change.
 */

'use client'

export interface EncryptedPayload {
  ciphertext: string
  iv: string
  salt: string
  auth_tag?: string
  algorithm: string
  key_version?: string
}

const STORAGE_KEY = 'mindvibe.journal.key.v1'

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer
}

async function getOrCreateKey(): Promise<CryptoKey> {
  if (typeof window === 'undefined') {
    throw new Error('journal crypto is client-only')
  }
  const existing = localStorage.getItem(STORAGE_KEY)
  if (existing) {
    const raw = fromBase64(existing)
    return crypto.subtle.importKey(
      'raw',
      toArrayBuffer(raw),
      'AES-GCM',
      false,
      ['encrypt', 'decrypt']
    )
  }
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ])
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key))
  localStorage.setItem(STORAGE_KEY, toBase64(raw))
  return key
}

/** Encrypt a plaintext string into a backend-compatible EncryptedPayload. */
export async function encryptPayload(plainText: string): Promise<EncryptedPayload> {
  const key = await getOrCreateKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(iv) },
      key,
      new TextEncoder().encode(plainText ?? '')
    )
  )
  return {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv),
    salt: '',
    auth_tag: '',
    algorithm: 'AES-GCM',
    key_version: 'v1',
  }
}

/** Decrypt an EncryptedPayload object back to plaintext. Returns '' on failure. */
export async function decryptPayload(
  payload: EncryptedPayload | null | undefined
): Promise<string> {
  if (!payload || !payload.ciphertext || !payload.iv) return ''
  try {
    const key = await getOrCreateKey()
    const iv = fromBase64(payload.iv)
    const ct = fromBase64(payload.ciphertext)
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(iv) },
      key,
      toArrayBuffer(ct)
    )
    return new TextDecoder().decode(pt)
  } catch {
    return '[unable to decrypt on this device]'
  }
}
