export const journalModelDefinition = `
model Journal {
  id                String   @id @default(uuid())
  user_id           String
  content_encrypted String
  iv                String
  auth_tag          String
  mood_tag          String?
  created_at        DateTime @default(now())

  @@index([user_id, created_at])
}`

export const profileModelDefinition = `
model Profile {
  id              String   @id @default(uuid())
  user_id         String   @unique
  display_name    String
  age_range       String?
  focus_areas     String[]
  tone_preferences Json
  support_goals   String[]
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  user User @relation(fields: [user_id], references: [id])
}`

export const vaultSessionModelDefinition = `
model User {
  id             String   @id @default(uuid())
  email          String   @unique
  password_hash  String
  vault_pin_hash String?

  profiles Profile[]
  journals Journal[]
  vault_sessions VaultSession[]
}

model VaultSession {
  id         String   @id @default(uuid())
  user_id    String
  created_at DateTime @default(now())
  expires_at DateTime

  user User @relation(fields: [user_id], references: [id])

  @@index([user_id, expires_at])
}`

export interface JournalRecord {
  id: string
  userId: string
  contentEncrypted: string
  iv: string
  authTag: string
  moodTag: string | null
  createdAt: Date
}

export interface ProfileRecord {
  id: string
  userId: string
  displayName: string
  ageRange?: string | null
  focusAreas?: string[]
  tonePreferences?: Record<string, unknown>
  supportGoals?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface VaultSessionRecord {
  id: string
  userId: string
  createdAt: Date
  expiresAt: Date
}
