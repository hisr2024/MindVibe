import crypto from 'crypto'

const ENCRYPTION_KEY_LENGTH = 32
const IV_LENGTH = 12
const JOURNAL_KDF_INFO = 'mindvibe-journal'

function getBaseKey(): Buffer {
  const key = process.env.JOURNAL_ENCRYPTION_KEY
  if (!key) {
    throw new Error('Missing JOURNAL_ENCRYPTION_KEY environment variable')
  }
  return Buffer.from(key, 'utf-8')
}

function deriveUserKey(userId: string): Buffer {
  const baseKey = getBaseKey()
  return crypto.hkdfSync('sha256', baseKey, Buffer.from(userId, 'utf-8'), JOURNAL_KDF_INFO, ENCRYPTION_KEY_LENGTH)
}

export function encryptJournalContent(plainText: string, userId: string): {
  ciphertext: string
  iv: string
  authTag: string
} {
  const key = deriveUserKey(userId)
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  }
}

export function decryptJournalContent(
  record: { ciphertext: string; iv: string; authTag: string },
  userId: string
): string {
  const key = deriveUserKey(userId)
  const iv = Buffer.from(record.iv, 'base64')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(Buffer.from(record.authTag, 'base64'))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(record.ciphertext, 'base64')),
    decipher.final()
  ])
  return decrypted.toString('utf8')
}
