import { inMemoryVaultStore, VaultDataStore } from './store'
import { ApiResponse, AuthenticatedRequest, jsonResponse } from './types'

export function requireVaultUnlocked(
  req: AuthenticatedRequest,
  store: VaultDataStore = inMemoryVaultStore
): ApiResponse | null {
  const userId = req.user?.id
  if (!userId) {
    return jsonResponse(401, { error: 'unauthorized' })
  }

  const vaultSessionId = req.vaultSessionId ?? req.cookies?.vault_session_id
  const session = store.getVaultSession(vaultSessionId, userId)
  if (!session) {
    return jsonResponse(401, { error: 'vault_locked' })
  }

  return null
}
