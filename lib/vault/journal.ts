import { decryptJournalContent, encryptJournalContent } from './crypto'
import { requireVaultUnlocked } from './middleware'
import { inMemoryVaultStore, VaultDataStore } from './store'
import { JournalRequestBody, ApiResponse, AuthenticatedRequest, jsonResponse } from './types'

export async function postJournalHandler(
  req: AuthenticatedRequest<JournalRequestBody>,
  store: VaultDataStore = inMemoryVaultStore
): Promise<ApiResponse> {
  if (!req.user?.id) {
    return jsonResponse(401, { error: 'unauthorized' })
  }

  const lockCheck = requireVaultUnlocked(req, store)
  if (lockCheck) return lockCheck

  const { content, mood_tag } = req.body ?? {}
  if (!content || content.trim().length === 0) {
    return jsonResponse(400, { error: 'content_required' })
  }

  const encrypted = encryptJournalContent(content, req.user.id)

  const record = store.createJournal({
    userId: req.user.id,
    contentEncrypted: encrypted.ciphertext,
    iv: encrypted.iv,
    authTag: encrypted.authTag,
    moodTag: mood_tag ?? null
  })

  return jsonResponse(201, {
    id: record.id,
    created_at: record.createdAt.toISOString(),
    mood_tag: record.moodTag
  })
}

export async function getJournalHandler(
  req: AuthenticatedRequest,
  store: VaultDataStore = inMemoryVaultStore
): Promise<ApiResponse> {
  if (!req.user?.id) {
    return jsonResponse(401, { error: 'unauthorized' })
  }

  const lockCheck = requireVaultUnlocked(req, store)
  if (lockCheck) return lockCheck

  try {
    const journals = store.listJournalsByUser(req.user.id)
    const decrypted = journals.map((entry) => ({
      id: entry.id,
      content: decryptJournalContent(
        { ciphertext: entry.contentEncrypted, iv: entry.iv, authTag: entry.authTag },
        req.user!.id
      ),
      mood_tag: entry.moodTag,
      created_at: entry.createdAt.toISOString()
    }))

    return jsonResponse(200, decrypted)
  } catch (error) {
    return jsonResponse(500, { error: 'vault_processing_error' })
  }
}
