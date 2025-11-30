import bcrypt from 'bcryptjs'

import { requireVaultUnlocked } from './middleware'
import { inMemoryVaultStore, VaultDataStore } from './store'
import { ApiResponse, AuthenticatedRequest, SetPinRequestBody, UnlockRequestBody, jsonResponse } from './types'

const MIN_PIN_LENGTH = 4
const MAX_PIN_LENGTH = 8
const MAX_FAILURES = 5
const LOCKOUT_MS = 15 * 60 * 1000
const BCRYPT_ROUNDS = 12

function isPinComplexEnough(pin: string): boolean {
  const digitRegex = /^\d{4,8}$/
  if (!digitRegex.test(pin)) return false
  const allSame = /^([0-9])\1+$/.test(pin)
  return !allSame && pin.length >= MIN_PIN_LENGTH && pin.length <= MAX_PIN_LENGTH
}

export async function setVaultPinHandler(
  req: AuthenticatedRequest<SetPinRequestBody>,
  store: VaultDataStore = inMemoryVaultStore
): Promise<ApiResponse> {
  if (!req.user?.id) {
    return jsonResponse(401, { error: 'unauthorized' })
  }

  const pin = req.body?.pin ?? ''
  if (!isPinComplexEnough(pin)) {
    return jsonResponse(400, { error: 'invalid_pin_format' })
  }

  const hash = await bcrypt.hash(pin, BCRYPT_ROUNDS)
  store.setVaultPinHash(req.user.id, hash)
  store.resetUnlockFailures(req.user.id)

  return jsonResponse(200, { success: true })
}

export async function unlockVaultHandler(
  req: AuthenticatedRequest<UnlockRequestBody>,
  store: VaultDataStore = inMemoryVaultStore
): Promise<ApiResponse> {
  if (!req.user?.id) {
    return jsonResponse(401, { error: 'unauthorized' })
  }

  const failure = store.getUnlockFailures(req.user.id)
  if (failure && failure.count >= MAX_FAILURES && Date.now() - failure.lastAttempt < LOCKOUT_MS) {
    return jsonResponse(429, { error: 'vault_locked' })
  }

  const pin = req.body?.pin ?? ''
  const storedHash = store.getVaultPinHash(req.user.id)
  if (!storedHash) {
    return jsonResponse(400, { error: 'pin_not_set' })
  }

  const pinMatches = await bcrypt.compare(pin, storedHash)
  if (!pinMatches) {
    const attempts = store.recordUnlockFailure(req.user.id)
    if (attempts >= MAX_FAILURES) {
      return jsonResponse(429, { error: 'vault_locked' })
    }
    return jsonResponse(401, { error: 'invalid_credentials' })
  }

  store.resetUnlockFailures(req.user.id)
  const session = store.createVaultSession(req.user.id)

  return jsonResponse(200, {
    success: true,
    vault_session_id: session.id,
    expires_at: session.expiresAt.toISOString()
  })
}

export function applyVaultLock(req: AuthenticatedRequest, store: VaultDataStore = inMemoryVaultStore): ApiResponse | null {
  return requireVaultUnlocked(req, store)
}
