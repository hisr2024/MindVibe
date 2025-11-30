export interface AuthenticatedUser {
  id: string
}

export interface AuthenticatedRequest<TBody = unknown> {
  user?: AuthenticatedUser
  body?: TBody
  query?: Record<string, string | string[]>
  vaultSessionId?: string
  cookies?: Record<string, string>
}

export interface ApiResponse<T = unknown> {
  status: number
  body: T
}

export function jsonResponse<T>(status: number, body: T): ApiResponse<T> {
  return { status, body }
}

export type JournalRequestBody = {
  content: string
  mood_tag?: string
}

export type SetPinRequestBody = {
  pin: string
}

export type UnlockRequestBody = {
  pin: string
}

export type ProfileRequestBody = {
  display_name: string
  age_range?: string | null
  focus_areas?: string[]
  tone_preferences?: Record<string, unknown>
  support_goals?: string[]
}
