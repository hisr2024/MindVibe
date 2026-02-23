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

interface ProfileStats {
  journeysCompleted: number
  journalEntries: number
  insightsReceived: number
  dayStreak: number
}

const PROFILE_STORAGE_KEY = 'mindvibe_profile'

export default function ProfilePage() {
  const { subscription } = useSubscription()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [_saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<ProfileStats>({
    journeysCompleted: 0,
    journalEntries: 0,
    insightsReceived: 0,
    dayStreak: 0,
  })

  // Fetch profile stats from analytics
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const response = await apiFetch('/api/analytics/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats({
          journeysCompleted: data.journeys_completed || 0,
          journalEntries: data.journal_entries || 0,
          insightsReceived: data.insights_count || 0,
          dayStreak: data.streak || 0,
        })
      }
    } catch {
      // Stats are non-critical, fail silently
    }
  }, [isAuthenticated])

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
              bio: '',
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
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData))
            return
          } else if (response.status === 404) {
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

          throw new Error('Backend profile fetch failed')
        } catch (backendError) {
          console.warn('Backend profile fetch failed, using localStorage:', backendError)
        }
      }

      // Fall back to localStorage
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (user) {
          parsed.email = user.email
          parsed.name = parsed.name || user.name || user.email.split('@')[0]
        }
        setProfile(parsed)
      } else {
        const defaultProfile: ProfileData = {
          name: user?.name || user?.email?.split('@')[0] || 'MindVibe User',
          email: user?.email || 'user@mindvibe.life',
          bio: '',
          createdAt: new Date().toISOString(),
        }
        setProfile(defaultProfile)
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(defaultProfile))
      }
    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Failed to load profile')

      const fallbackProfile: ProfileData = {
        name: user?.name || user?.email?.split('@')[0] || 'MindVibe User',
        email: user?.email || 'user@mindvibe.life',
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
      fetchStats()
    }
  }, [authLoading, fetchProfile, fetchStats])

  // Sync with auth changes
  useEffect(() => {
    const handleAuthChange = () => {
      fetchProfile()
      fetchStats()
    }

    window.addEventListener('auth-changed', handleAuthChange)
    return () => window.removeEventListener('auth-changed', handleAuthChange)
  }, [fetchProfile, fetchStats])

  const handleSaveProfile = async (data: { name: string; email: string; bio?: string }) => {
    if (!profile) return

    setSaving(true)
    setError(null)

    try {
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
        }
      }

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
              <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-300 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-orange-50 mb-2">Sign in to view your profile</h2>
              <p className="text-sm text-orange-100/70 mb-6">
                Create an account or sign in to manage your profile, track your progress, and access all features.
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

  const STAT_ITEMS = [
    { label: 'Day Streak', value: stats.dayStreak, color: 'text-orange-400', bg: 'bg-orange-500/10', icon: '🔥' },
    { label: 'Journeys', value: stats.journeysCompleted, color: 'text-cyan-400', bg: 'bg-cyan-500/10', icon: '🧭' },
    { label: 'Reflections', value: stats.journalEntries, color: 'text-purple-400', bg: 'bg-purple-500/10', icon: '📝' },
    { label: 'Insights', value: stats.insightsReceived, color: 'text-teal-400', bg: 'bg-teal-500/10', icon: '✨' },
  ]

  return (
    <main className="mx-auto max-w-4xl px-3 sm:px-4 py-6 sm:py-8 md:py-12 pb-28 sm:pb-8">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-orange-50 mb-1">My Profile</h1>
        <p className="text-sm text-orange-100/60">Your personal space on MindVibe</p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-orange-400/40 bg-orange-500/10 p-4 text-sm text-orange-50">
          {error}
        </div>
      )}

      {/* Profile Header */}
      <Card variant="elevated" className="mb-6">
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {STAT_ITEMS.map((stat) => (
          <Card key={stat.label} className="text-center">
            <CardContent className="py-4">
              <span className="text-xl mb-1 block">{stat.icon}</span>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-orange-100/50 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isEditing ? (
        <ProfileEditForm
          initialData={{
            name: profile.name,
            email: profile.email,
            bio: profile.bio,
          }}
          onSave={handleSaveProfile}
          onCancel={() => setIsEditing(false)}
          className="mb-6"
        />
      ) : (
        <>
          {/* Avatar Upload Section */}
          <Card className="mb-6">
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
          <Card className="mb-6">
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
          <Card className="mb-6">
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-orange-50">Subscription</h2>
                <Badge variant={subscription?.tierId === 'free' ? 'default' : 'premium'}>
                  {subscription?.tierName ?? 'Free'}
                </Badge>
              </div>
              <p className="text-sm text-orange-100/70 mb-4">
                {subscription?.tierId === 'free'
                  ? 'You are on the free plan with 20 KIAAN questions per month.'
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

          {/* Quick Links */}
          <Card>
            <CardContent>
              <h2 className="text-lg font-semibold text-orange-50 mb-4">Quick Links</h2>
              <div className="space-y-3">
                <Link href="/account" className="flex items-center justify-between py-2 group">
                  <div>
                    <p className="text-sm font-medium text-orange-50 group-hover:text-orange-300 transition">Account Settings</p>
                    <p className="text-xs text-orange-100/50">Security, sessions, and data management</p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-100/30 group-hover:text-orange-300 transition">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
                <div className="border-t border-orange-500/10" />
                <Link href="/settings" className="flex items-center justify-between py-2 group">
                  <div>
                    <p className="text-sm font-medium text-orange-50 group-hover:text-orange-300 transition">App Settings</p>
                    <p className="text-xs text-orange-100/50">Notifications, privacy, and accessibility</p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-100/30 group-hover:text-orange-300 transition">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  )
}
