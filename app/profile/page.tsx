'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { Card, CardContent, Badge, Button } from '@/components/ui'
import { useSubscription } from '@/hooks/useSubscription'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { useAuth } from '@/hooks/useAuth'
import { apiFetch } from '@/lib/api'
import { getKiaanTools } from '@/lib/api/kiaan-ecosystem'
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
  const { tier, isPaid, kiaanQuota, isKiaanUnlimited, journeyLimit, isDeveloper } = useFeatureAccess()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<ProfileStats>({
    journeysCompleted: 0,
    journalEntries: 0,
    insightsReceived: 0,
    dayStreak: 0,
  })

  const kiaanTools = useMemo(() => getKiaanTools(), [])

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
      // Stats are non-critical
    }
  }, [isAuthenticated])

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      if (isAuthenticated && user) {
        try {
          const response = await apiFetch('/api/profile', { method: 'GET' })

          if (response.ok) {
            const backendProfile: BackendProfile = await response.json()
            const profileData: ProfileData = {
              name: backendProfile.full_name || user.name || user.email.split('@')[0],
              email: user.email,
              bio: '',
              baseExperience: backendProfile.base_experience,
              createdAt: backendProfile.created_at,
            }

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
          name: user?.name || user?.email?.split('@')[0] || 'Sakha User',
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
        name: user?.name || user?.email?.split('@')[0] || 'Sakha User',
        email: user?.email || 'user@mindvibe.life',
        bio: '',
        createdAt: new Date().toISOString(),
      }
      setProfile(fallbackProfile)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    if (!authLoading) {
      fetchProfile()
      fetchStats()
    }
  }, [authLoading, fetchProfile, fetchStats])

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

      const updated: ProfileData = { ...profile, ...data }
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

  // Loading state
  if (authLoading || loading || !profile) {
    return (
      <main className="mx-auto max-w-4xl px-3 sm:px-4 py-6 sm:py-8 md:py-12 pb-28 sm:pb-8">
        <div className="animate-pulse space-y-6">
          <div className="h-32 rounded-3xl bg-[#d4a44c]/10" />
          <div className="h-24 rounded-3xl bg-[#d4a44c]/10" />
          <div className="h-64 rounded-3xl bg-[#d4a44c]/10" />
        </div>
      </main>
    )
  }

  // Unauthenticated view
  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-4xl px-3 sm:px-4 py-6 sm:py-8 md:py-12 pb-28 sm:pb-8">
        <Card variant="elevated" className="mb-8">
          <CardContent>
            <div className="text-center py-8">
              <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-[#d4a44c] via-[#d4a44c] to-[#e8b54a] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[#f5f0e8] mb-2">Sign in to view your profile</h2>
              <p className="text-sm text-[#f5f0e8]/70 mb-6">
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

  // Authenticated view
  const tierDisplayName = subscription?.tierName ?? 'Free'

  const STAT_ITEMS = [
    { label: 'Day Streak', value: stats.dayStreak, color: 'text-[#d4a44c]', icon: '🔥' },
    { label: 'Journeys', value: stats.journeysCompleted, color: 'text-cyan-400', icon: '🧭' },
    { label: 'Reflections', value: stats.journalEntries, color: 'text-purple-400', icon: '📝' },
    { label: 'Insights', value: stats.insightsReceived, color: 'text-teal-400', icon: '✨' },
  ]

  return (
    <main className="mx-auto max-w-4xl px-3 sm:px-4 py-6 sm:py-8 md:py-12 pb-28 sm:pb-8">
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#f5f0e8] mb-1">My Profile</h1>
        <p className="text-sm text-[#f5f0e8]/60">Your personal space on Sakha</p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-[#d4a44c]/40 bg-[#d4a44c]/10 p-4 text-sm text-[#f5f0e8]">
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
            tier={isDeveloper ? 'Developer' : tierDisplayName}
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
              <p className="text-xs text-[#f5f0e8]/50 mt-1">{stat.label}</p>
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
          {/* Avatar Upload */}
          <Card className="mb-6">
            <CardContent>
              <h2 className="text-lg font-semibold text-[#f5f0e8] mb-4">Profile Picture</h2>
              <AvatarUpload
                currentAvatar={profile.avatarUrl}
                onUpload={handleAvatarUpload}
                onRemove={handleAvatarRemove}
              />
            </CardContent>
          </Card>

          {/* Bio */}
          <Card className="mb-6">
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#f5f0e8]">About</h2>
                <Button onClick={() => setIsEditing(true)} variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
              {profile.bio ? (
                <p className="text-sm text-[#f5f0e8]/80">{profile.bio}</p>
              ) : (
                <p className="text-sm text-[#f5f0e8]/50 italic">
                  Add a bio to tell others about yourself...
                </p>
              )}
            </CardContent>
          </Card>

          {/* Subscription & KIAAN Quota */}
          <Card className="mb-6">
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#f5f0e8]">Subscription</h2>
                <Badge variant={tier === 'free' ? 'default' : 'premium'}>
                  {isDeveloper ? 'Developer' : tierDisplayName}
                </Badge>
              </div>

              {/* Tier details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <div className="rounded-xl border border-[#d4a44c]/10 bg-white/[0.02] p-3">
                  <p className="text-xs text-[#f5f0e8]/50 mb-1">KIAAN Questions</p>
                  <p className="text-sm font-semibold text-[#f5f0e8]">
                    {isKiaanUnlimited ? 'Unlimited' : `${kiaanQuota}/month`}
                  </p>
                </div>
                <div className="rounded-xl border border-[#d4a44c]/10 bg-white/[0.02] p-3">
                  <p className="text-xs text-[#f5f0e8]/50 mb-1">Active Journeys</p>
                  <p className="text-sm font-semibold text-[#f5f0e8]">
                    {journeyLimit === -1 ? 'Unlimited' : `${journeyLimit} max`}
                  </p>
                </div>
                <div className="rounded-xl border border-[#d4a44c]/10 bg-white/[0.02] p-3 col-span-2 sm:col-span-1">
                  <p className="text-xs text-[#f5f0e8]/50 mb-1">Plan Status</p>
                  <p className="text-sm font-semibold text-[#f5f0e8]">
                    {subscription?.status === 'active' ? 'Active' : subscription?.status ?? 'Active'}
                  </p>
                </div>
              </div>

              <p className="text-sm text-[#f5f0e8]/70 mb-4">
                {tier === 'free'
                  ? `You are on the free plan with ${kiaanQuota} KIAAN questions per month.`
                  : `You are on the ${tierDisplayName} plan with ${isKiaanUnlimited ? 'unlimited' : kiaanQuota} KIAAN questions.`}
              </p>

              {subscription?.cancelAtPeriodEnd && (
                <div className="mb-4 rounded-xl border border-[#d4a44c]/30 bg-[#d4a44c]/10 p-3 text-xs text-[#f5f0e8]">
                  Your plan will end on {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'the end of the billing period'}.
                </div>
              )}

              <div className="flex gap-3">
                <Link href="/dashboard/subscription">
                  <Button variant="secondary" size="sm">
                    Manage Subscription
                  </Button>
                </Link>
                {!isPaid && (
                  <Link href="/pricing">
                    <Button variant="primary" size="sm">
                      Upgrade
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* KIAAN Ecosystem Tools */}
          <Card className="mb-6">
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d4a44c]/10 text-sm font-black text-[#d4a44c]">K</span>
                <div>
                  <h2 className="text-lg font-semibold text-[#f5f0e8]">KIAAN AI Ecosystem</h2>
                  <p className="text-xs text-[#f5f0e8]/50">{kiaanTools.length} wisdom-powered tools</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {kiaanTools.map(tool => (
                  <Link
                    key={tool.id}
                    href={tool.route}
                    className="group rounded-xl border border-[#d4a44c]/10 bg-white/[0.02] p-3 text-center hover:border-[#d4a44c]/30 hover:bg-[#d4a44c]/5 transition"
                  >
                    <span className="text-lg block mb-1">{tool.icon}</span>
                    <span className="text-xs font-medium text-[#f5f0e8]/70 group-hover:text-[#f5f0e8] transition line-clamp-1">{tool.name}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardContent>
              <h2 className="text-lg font-semibold text-[#f5f0e8] mb-4">Quick Links</h2>
              <div className="space-y-3">
                <Link href="/account" className="flex items-center justify-between py-2 group">
                  <div>
                    <p className="text-sm font-medium text-[#f5f0e8] group-hover:text-[#e8b54a] transition">Account Settings</p>
                    <p className="text-xs text-[#f5f0e8]/50">Security, sessions, and data management</p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#f5f0e8]/30 group-hover:text-[#e8b54a] transition">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
                <div className="border-t border-[#d4a44c]/10" />
                <Link href="/kiaan/chat" className="flex items-center justify-between py-2 group">
                  <div>
                    <p className="text-sm font-medium text-[#f5f0e8] group-hover:text-[#e8b54a] transition">KIAAN Chat</p>
                    <p className="text-xs text-[#f5f0e8]/50">Your AI wisdom companion</p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#f5f0e8]/30 group-hover:text-[#e8b54a] transition">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
                <div className="border-t border-[#d4a44c]/10" />
                <Link href="/settings" className="flex items-center justify-between py-2 group">
                  <div>
                    <p className="text-sm font-medium text-[#f5f0e8] group-hover:text-[#e8b54a] transition">App Settings</p>
                    <p className="text-xs text-[#f5f0e8]/50">Notifications, privacy, and accessibility</p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#f5f0e8]/30 group-hover:text-[#e8b54a] transition">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Suppress unused variable warning */}
      {saving && null}
    </main>
  )
}
