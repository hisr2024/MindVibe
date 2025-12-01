export type KeyEnvelope = {
  keyId: string
  salt: string
  iterations: number
  fingerprint: string
  createdAt: string
}

export type CipherBlobV2 = {
  v: 'v2'
  s: string
  i: string
  c: string
  k: string
  t: number
  createdAt: string
}

export type LegacyCipherBlob = { s: string; i: string; c: string }

export type CipherBlob = CipherBlobV2 | LegacyCipherBlob

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const normalizeBytes = (bytes: Uint8Array): Uint8Array<ArrayBuffer> =>
  new Uint8Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))

const b64 = (a: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(a)))
const ub64 = (s: string): Uint8Array<ArrayBuffer> =>
  normalizeBytes(new Uint8Array(atob(s).split('').map(c => c.charCodeAt(0))))

const DEFAULT_ITERATIONS = 350_000
const MIN_PASS_LENGTH = 12

async function deriveBits(passphrase: string, salt: Uint8Array, iterations: number) {
  const baseKey = await crypto.subtle.importKey('raw', encoder.encode(passphrase), { name: 'PBKDF2' }, false, [
    'deriveBits',
    'deriveKey',
  ])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, baseKey, 256)
  return b64(bits)
}

async function deriveKey(passphrase: string, salt: Uint8Array, iterations: number) {
  const baseKey = await crypto.subtle.importKey('raw', encoder.encode(passphrase), { name: 'PBKDF2' }, false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export function loadEnvelopeFromStorage(): KeyEnvelope | null {
  try {
    const raw = localStorage.getItem('mv_journal_key_envelope')
    if (!raw) return null
    return JSON.parse(raw) as KeyEnvelope
  } catch {
    return null
  }
}

function persistEnvelope(envelope: KeyEnvelope) {
  try {
    localStorage.setItem('mv_journal_key_envelope', JSON.stringify(envelope))
  } catch {
    /* ignore */
  }
}

export async function materializeEnvelope(passphrase: string, existing?: KeyEnvelope | null): Promise<{ key: CryptoKey; envelope: KeyEnvelope }> {
  if (!passphrase || passphrase.length < MIN_PASS_LENGTH) {
    throw new Error('Passphrase too short for secure encryption')
  }

  const envelope: KeyEnvelope = existing || {
    keyId: crypto.randomUUID(),
    salt: b64(crypto.getRandomValues(new Uint8Array(16))),
    iterations: DEFAULT_ITERATIONS,
    fingerprint: '',
    createdAt: new Date().toISOString(),
  }

  const saltBytes = ub64(envelope.salt)
  const fingerprint = await deriveBits(passphrase, saltBytes, envelope.iterations)
  if (envelope.fingerprint && envelope.fingerprint !== fingerprint) {
    throw new Error('Passphrase does not match the stored encryption key')
  }
  if (!envelope.fingerprint) {
    envelope.fingerprint = fingerprint
    persistEnvelope(envelope)
  }
  const key = await deriveKey(passphrase, saltBytes, envelope.iterations)
  return { key, envelope }
}

export async function rotateEnvelope(passphrase: string): Promise<{ key: CryptoKey; envelope: KeyEnvelope }> {
  const envelope: KeyEnvelope = {
    keyId: crypto.randomUUID(),
    salt: b64(crypto.getRandomValues(new Uint8Array(16))),
    iterations: DEFAULT_ITERATIONS,
    fingerprint: '',
    createdAt: new Date().toISOString(),
  }
  return materializeEnvelope(passphrase, envelope)
}

export async function encryptJournalEntry(plain: string, passphrase: string, envelope?: KeyEnvelope) {
  const { key, envelope: activeEnvelope } = await materializeEnvelope(passphrase, envelope)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plain))
  const blob: CipherBlobV2 = {
    v: 'v2',
    s: activeEnvelope.salt,
    i: b64(iv),
    c: b64(cipher),
    k: activeEnvelope.keyId,
    t: activeEnvelope.iterations,
    createdAt: new Date().toISOString(),
  }
  persistEnvelope(activeEnvelope)
  return { blob, envelope: activeEnvelope }
}

export async function decryptJournalEntry(blob: CipherBlob, passphrase: string, envelope?: KeyEnvelope) {
  const iterations = 't' in blob ? blob.t : DEFAULT_ITERATIONS
  const iv = ub64(blob.i)
  const keySource =
    envelope ||
    loadEnvelopeFromStorage() ||
    ('s' in blob
      ? { keyId: 'legacy', salt: blob.s, iterations, fingerprint: '', createdAt: new Date().toISOString() }
      : null)
  const { key } = await materializeEnvelope(passphrase, keySource)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ub64(blob.c))
  return decoder.decode(plaintext)
}

export const distressKeywords = [
  'suicide',
  'kill myself',
  'end it',
  'hurt myself',
  'harm myself',
  'want to die',
  'harm others',
  'kill someone',
  'murder',
  'unbearable',
  "can't go on",
  'hopeless',
]

export function hasDistressSignal(text: string) {
  if (!text) return false
  const lower = text.toLowerCase()
  return distressKeywords.some(keyword => lower.includes(keyword))
}

export function redactPassphrase(): void {
  try {
    localStorage.removeItem('mv_journal_key_envelope_tmp')
  } catch {
    /* ignore */
  }
}
