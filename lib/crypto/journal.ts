/**
 * Client-side E2E encryption for journal entries.
 *
 * Uses Web Crypto API (SubtleCrypto) AES-GCM 256. The key material is
 * generated on first use and stored in localStorage under a stable name.
 * The server never sees plaintext content; only the envelope
 * "v1:<iv_b64>:<ciphertext_b64>" is transmitted.
 *
 * NOTE: This is a pragmatic client-side encryption layer. A production
 * rollout should derive keys from a user passphrase or vault-managed
 * secret rather than a locally generated key. Left as a TODO; the shape
 * of the API is stable so the upgrade is transparent to callers.
 */

'use client'

const STORAGE_KEY = 'mindvibe.journal.key.v1'
const ENVELOPE_PREFIX = 'v1:'

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

async function getOrCreateKey(): Promise<CryptoKey> {
  if (typeof window === 'undefined') {
    throw new Error('journal crypto is client-only')
  }
  const existing = localStorage.getItem(STORAGE_KEY)
  if (existing) {
    const raw = fromBase64(existing)
    return crypto.subtle.importKey(
      'raw',
      raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer,
      'AES-GCM',
      false,
      ['encrypt', 'decrypt']
    )
  }
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key))
  localStorage.setItem(STORAGE_KEY, toBase64(raw))
  return key
}

/**
 * Encrypt plaintext journal content to an opaque envelope string safe to
 * transmit to the server.
 */
export async function encryptContent(plainText: string): Promise<string> {
  if (!plainText) return ''
  const key = await getOrCreateKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(plainText)
    )
  )
  return `${ENVELOPE_PREFIX}${toBase64(iv)}:${toBase64(ct)}`
}

/**
 * Decrypt an envelope string back to plaintext. Returns the input unchanged
 * if it is not a recognized envelope (e.g. legacy plaintext entries).
 */
export async function decryptContent(envelope: string): Promise<string> {
  if (!envelope) return ''
  if (!envelope.startsWith(ENVELOPE_PREFIX)) return envelope
  const parts = envelope.slice(ENVELOPE_PREFIX.length).split(':')
  if (parts.length !== 2) return envelope
  try {
    const key = await getOrCreateKey()
    const iv = fromBase64(parts[0])
    const ct = fromBase64(parts[1])
    const ivBuf = iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer
    const ctBuf = ct.buffer.slice(ct.byteOffset, ct.byteOffset + ct.byteLength) as ArrayBuffer
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBuf }, key, ctBuf)
    return new TextDecoder().decode(pt)
  } catch {
    return '[unable to decrypt on this device]'
  }
}
