import { randomUUID } from 'crypto'

import { JournalRecord, ProfileRecord, VaultSessionRecord } from './schemas'

const DEFAULT_VAULT_SESSION_DURATION_MS = 15 * 60 * 1000

export class VaultDataStore {
  private journals: JournalRecord[] = []
  private profiles: Map<string, ProfileRecord> = new Map()
  private vaultPins: Map<string, string> = new Map()
  private vaultSessions: Map<string, VaultSessionRecord> = new Map()
  private unlockFailures: Map<string, { count: number; lastAttempt: number }> = new Map()

  createJournal(entry: Omit<JournalRecord, 'createdAt' | 'id'> & { createdAt?: Date; id?: string }): JournalRecord {
    const record: JournalRecord = {
      id: entry.id ?? randomUUID(),
      createdAt: entry.createdAt ?? new Date(),
      ...entry
    }
    this.journals.push(record)
    return record
  }

  listJournalsByUser(userId: string): JournalRecord[] {
    return this.journals
      .filter((journal) => journal.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  setVaultPinHash(userId: string, hash: string) {
    this.vaultPins.set(userId, hash)
  }

  getVaultPinHash(userId: string): string | undefined {
    return this.vaultPins.get(userId)
  }

  createVaultSession(userId: string, durationMs = DEFAULT_VAULT_SESSION_DURATION_MS): VaultSessionRecord {
    const session: VaultSessionRecord = {
      id: randomUUID(),
      userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + durationMs)
    }
    this.vaultSessions.set(session.id, session)
    return session
  }

  getVaultSession(sessionId: string | undefined, userId: string): VaultSessionRecord | null {
    if (!sessionId) return null
    const session = this.vaultSessions.get(sessionId)
    if (!session) return null
    const now = Date.now()
    if (session.userId !== userId || session.expiresAt.getTime() <= now) {
      this.vaultSessions.delete(sessionId)
      return null
    }
    return session
  }

  recordUnlockFailure(userId: string): number {
    const existing = this.unlockFailures.get(userId)
    const now = Date.now()
    if (existing && now - existing.lastAttempt < 15 * 60 * 1000) {
      existing.count += 1
      existing.lastAttempt = now
      this.unlockFailures.set(userId, existing)
      return existing.count
    }
    this.unlockFailures.set(userId, { count: 1, lastAttempt: now })
    return 1
  }

  getUnlockFailures(userId: string): { count: number; lastAttempt: number } | null {
    const failure = this.unlockFailures.get(userId)
    if (!failure) return null
    if (Date.now() - failure.lastAttempt > 15 * 60 * 1000) {
      this.unlockFailures.delete(userId)
      return null
    }
    return failure
  }

  resetUnlockFailures(userId: string) {
    this.unlockFailures.delete(userId)
  }

  upsertProfile(profile: Omit<ProfileRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): ProfileRecord {
    const existing = this.profiles.get(profile.userId)
    const now = new Date()
    const record: ProfileRecord = {
      id: profile.id ?? existing?.id ?? randomUUID(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      ...profile
    }
    this.profiles.set(profile.userId, record)
    return record
  }

  getProfile(userId: string): ProfileRecord | null {
    return this.profiles.get(userId) ?? null
  }
}

export const inMemoryVaultStore = new VaultDataStore()
