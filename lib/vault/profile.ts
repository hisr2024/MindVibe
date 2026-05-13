import { inMemoryVaultStore, VaultDataStore } from './store'
import { ApiResponse, AuthenticatedRequest, ProfileRequestBody, jsonResponse } from './types'

export async function getProfileHandler(
  req: AuthenticatedRequest,
  store: VaultDataStore = inMemoryVaultStore
): Promise<ApiResponse> {
  if (!req.user?.id) {
    return jsonResponse(401, { error: 'unauthorized' })
  }

  const profile = store.getProfile(req.user.id)
  if (!profile) {
    return jsonResponse(200, null)
  }

  return jsonResponse(200, {
    id: profile.id,
    user_id: profile.userId,
    display_name: profile.displayName,
    age_range: profile.ageRange ?? null,
    focus_areas: profile.focusAreas ?? [],
    tone_preferences: profile.tonePreferences ?? {},
    support_goals: profile.supportGoals ?? [],
    created_at: profile.createdAt.toISOString(),
    updated_at: profile.updatedAt.toISOString()
  })
}

export async function postProfileHandler(
  req: AuthenticatedRequest<ProfileRequestBody>,
  store: VaultDataStore = inMemoryVaultStore
): Promise<ApiResponse> {
  if (!req.user?.id) {
    return jsonResponse(401, { error: 'unauthorized' })
  }

  const { display_name, age_range, focus_areas, tone_preferences, support_goals } = req.body ?? {}
  if (!display_name || display_name.trim().length === 0) {
    return jsonResponse(400, { error: 'display_name_required' })
  }

  const profile = store.upsertProfile({
    userId: req.user.id,
    displayName: display_name,
    ageRange: age_range ?? null,
    focusAreas: focus_areas ?? [],
    tonePreferences: tone_preferences ?? {},
    supportGoals: support_goals ?? []
  })

  return jsonResponse(200, {
    id: profile.id,
    user_id: profile.userId,
    display_name: profile.displayName,
    age_range: profile.ageRange ?? null,
    focus_areas: profile.focusAreas ?? [],
    tone_preferences: profile.tonePreferences ?? {},
    support_goals: profile.supportGoals ?? [],
    created_at: profile.createdAt.toISOString(),
    updated_at: profile.updatedAt.toISOString()
  })
}
