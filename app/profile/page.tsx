'use client'

import { useState, useEffect, useCallback } from 'react'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { Card, CardContent, Badge, Button } from '@/components/ui'
import { useSubscription } from '@/hooks/useSubscription'
import { useAuth } from '@/hooks/useAuth'
import { apiFetch } from '@/lib/api'
import Link from 'next/link'

interface ProfileData {
  name: string
  email: string
  bio?: string
  avatarUrl?: string
  createdAt: string
  baseExperience?: string
}

interface BackendProfile {
  profile_id: number
  user_id: string
  full_name: string | null
  base_experience: string
  created_at: string
  updated_at: string | null
}

const PROFILE_STORAGE_KEY = 'mindvibe_profile'

export default function ProfilePage() {
  const { subscription } = useSubscription()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch profile from backend or localStorage
  const fetchProfile = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // If authenticated, try to fetch from backend
      if (isAuthenticated && user) {
        try {
          const response = await apiFetch('/api/profile', {
            method: 'GET',
          })

          if (response.ok) {
            const backendProfile: BackendProfile = await response.json()
            const profileData: ProfileData = {
              name: backendProfile.full_name || user.name || user.email.split('@')[0],
              email: user.email,
              bio: '', // Backend doesn't store bio yet
              baseExperience: backendProfile.base_experience,
              createdAt: backendProfile.created_at,
            }

            // Try to get avatar and bio from localStorage cache
            const cached = localStorage.getItem(PROFILE_STORAGE_KEY)
            if (cached) {
              try {
                const cachedData = JSON.parse(cached)
                profileData.avatarUrl = cachedData.avatarUrl
                profileData.bio = cachedData.bio || ''
              } catch {
                // Ignore parse errors
              }
            }

            setProfile(profileData)
            // Cache profile locally
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData))
            return
          } else if (response.status === 404) {
            // Profile doesn't exist in backend, create it
            const createResponse = await apiFetch('/api/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                full_name: user.name || user.email.split('@')[0],
                base_experience: 'new_user',
              }),
            })

            if (createResponse.ok) {
              const newProfile: BackendProfile = await createResponse.json()
              const profileData: ProfileData = {
                name: newProfile.full_name || user.email.split('@')[0],
                email: user.email,
                bio: '',
                createdAt: newProfile.created_at,
                baseExperience: newProfile.base_experience,
              }
              setProfile(profileData)
              localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData))
              return
            }
          }

          // Backend fetch failed, fall back to localStorage
          throw new Error('Backend profile fetch failed')
        } catch (backendError) {
          console.warn('Backend profile fetch failed, using localStorage:', backendError)
          // Fall through to localStorage fallback
        }
      }

      // Fall back to localStorage (for unauthenticated users or backend failures)
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // If we have a user, update the profile with user info
        if (user) {
          parsed.email = user.email
          parsed.name = parsed.name || user.name || user.email.split('@')[0]
        }
        setProfile(parsed)
      } else {
        // Default profile
        const defaultProfile: ProfileData = {
          name: user?.name || user?.email?.split('@')[0] || 'MindVibe User',
          email: user?.email || 'user@mindvibe.app',
          bio: '',
          createdAt: new Date().toISOString(),
        }
        setProfile(defaultProfile)
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(defaultProfile))
      }
    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Failed to load profile')

      // Set a minimal profile
      const fallbackProfile: ProfileData = {
        name: user?.name || user?.email?.split('@')[0] || 'MindVibe User',
        email: user?.email || 'user@mindvibe.app',
        bio: '',
        createdAt: new Date().toISOString(),
      }
      setProfile(fallbackProfile)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user])

  // Initial load
  useEffect(() => {
    if (!authLoading) {
      fetchProfile()
    }
  }, [authLoading, fetchProfile])

  // Sync with auth changes
  useEffect(() => {
    const handleAuthChange = () => {
      fetchProfile()
    }

    window.addEventListener('auth-changed', handleAuthChange)
    return () => window.removeEventListener('auth-changed', handleAuthChange)
  }, [fetchProfile])

  const handleSaveProfile = async (data: { name: string; email: string; bio?: string }) => {
    if (!profile) return

    setSaving(true)
    setError(null)

    try {
      // If authenticated, sync to backend
      if (isAuthenticated) {
        try {
          const response = await apiFetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              full_name: data.name,
              base_experience: profile.baseExperience || 'returning_user',
            }),
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.detail || 'Failed to save profile')
          }
        } catch (backendError) {
          console.warn('Backend profile save failed:', backendError)
          // Continue to save locally
        }
      }

      // Update local state and localStorage
      const updated: ProfileData = {
        ...profile,
        ...data,
      }
      setProfile(updated)
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated))
      setIsEditing(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save profile'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (file: File): Promise<string> => {
    // Convert to base64 for local storage (avatar storage would need backend support)
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const avatarUrl = reader.result as string
        if (profile) {
          const updated = { ...profile, avatarUrl }
          setProfile(updated)
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated))
        }
        resolve(avatarUrl)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleAvatarRemove = async () => {
    if (!profile) return
    const updated = { ...profile, avatarUrl: undefined }
    setProfile(updated)
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated))
  }

  if (authLoading || loading || !profile) {
    return (
      <main className="mx-auto max-w-4xl px-3 sm:px-4 py-6 sm:py-8 md:py-12 pb-28 sm:pb-8">
        <div className="animate-pulse space-y-6">
          <div className="h-32 rounded-3xl bg-orange-500/10" />
          <div className="h-64 rounded-3xl bg-orange-500/10" />
        </div>
      </main>
    )
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-4xl px-3 sm:px-4 py-6 sm:py-8 md:py-12 pb-28 sm:pb-8">
        <Card variant="elevated" className="mb-8">
          <CardContent>
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold text-orange-50 mb-2">Sign in to access your profile</h2>
              <p className="text-sm text-orange-100/70 mb-6">
                Create an account or sign in to save your profile and access all features.
              </p>
              <Link href="/account">
                <Button variant="primary">Go to Account</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-3 sm:px-4 py-6 sm:py-8 md:py-12 pb-28 sm:pb-8">
      {error && (
        <div className="mb-6 rounded-2xl border border-orange-400/40 bg-orange-500/10 p-4 text-sm text-orange-50">
          {error}
        </div>
      )}

      {/* Profile Header */}
      <Card variant="elevated" className="mb-8">
        <CardContent>
          <ProfileHeader
            name={profile.name}
            email={profile.email}
            avatarUrl={profile.avatarUrl}
            tier={subscription?.tierName ?? 'Free'}
            memberSince={new Date(profile.createdAt)}
            onEditProfile={() => setIsEditing(true)}
          />
        </CardContent>
      </Card>

      {isEditing ? (
        <ProfileEditForm
          initialData={{
            name: profile.name,
            email: profile.email,
            bio: profile.bio,
          }}
          onSave={handleSaveProfile}
          onCancel={() => setIsEditing(false)}
          className="mb-8"
        />
      ) : (
        <>
          {/* Avatar Upload Section */}
          <Card className="mb-8">
            <CardContent>
              <h2 className="text-lg font-semibold text-orange-50 mb-4">Profile Picture</h2>
              <AvatarUpload
                currentAvatar={profile.avatarUrl}
                onUpload={handleAvatarUpload}
                onRemove={handleAvatarRemove}
              />
            </CardContent>
          </Card>

          {/* Bio Section */}
          <Card className="mb-8">
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-orange-50">About</h2>
                <Button onClick={() => setIsEditing(true)} variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
              {profile.bio ? (
                <p className="text-sm text-orange-100/80">{profile.bio}</p>
              ) : (
                <p className="text-sm text-orange-100/50 italic">
                  Add a bio to tell others about yourself...
                </p>
              )}
            </CardContent>
          </Card>

          {/* Subscription Info */}
          <Card className="mb-8">
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-orange-50">Subscription</h2>
                <Badge variant={subscription?.tierId === 'free' ? 'default' : 'premium'}>
                  {subscription?.tierName ?? 'Free'}
                </Badge>
              </div>
              <p className="text-sm text-orange-100/70 mb-4">
                {subscription?.tierId === 'free'
                  ? 'You are on the free plan with 10 KIAAN questions per month.'
                  : `You are on the ${subscription?.tierName} plan.`}
              </p>
              <div className="flex gap-3">
                <Link href="/dashboard/subscription">
                  <Button variant="secondary" size="sm">
                    Manage Subscription
                  </Button>
                </Link>
                {subscription?.tierId === 'free' && (
                  <Link href="/pricing">
                    <Button variant="primary" size="sm">
                      Upgrade
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardContent>
              <h2 className="text-lg font-semibold text-orange-50 mb-4">Account</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-orange-50">Export Data</p>
                    <p className="text-xs text-orange-100/50">Download all your journal entries and data</p>
                  </div>
                  <Button variant="outline" size="sm">Export</Button>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-orange-500/10">
                  <div>
                    <p className="text-sm font-medium text-red-400">Delete Account</p>
                    <p className="text-xs text-orange-100/50">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="danger" size="sm">Delete</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  )
}
