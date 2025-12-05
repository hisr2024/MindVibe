'use client'

import { useState, useEffect } from 'react'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { ActivityStatsDisplay } from '@/components/profile/ActivityStats'
import { ActivityTimeline } from '@/components/profile/ActivityTimeline'
import { KarmicTreePreview } from '@/components/profile/KarmicTreePreview'
import { DataExport } from '@/components/profile/DataExport'
import { Card, CardContent, Badge, Button, FadeIn, Modal } from '@/components/ui'
import { SettingsSection, SettingsItem, SettingsDivider, ToggleSwitch } from '@/components/settings'
import { useSubscription } from '@/hooks/useSubscription'
import { useProfile } from '@/hooks/useProfile'
import { useActivityLog } from '@/hooks/useActivityLog'
import Link from 'next/link'

interface ProfileData {
  name: string
  email: string
  bio?: string
  avatarUrl?: string
  createdAt: string
  privacy?: {
    showProfile: boolean
    dataSharing: boolean
  }
}

const PROFILE_STORAGE_KEY = 'mindvibe_profile'

export default function ProfilePage() {
  const { subscription } = useSubscription()
  const { profile: profileHook, stats, loading: profileLoading } = useProfile()
  const { activities, loading: activitiesLoading } = useActivityLog()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [privacySettings, setPrivacySettings] = useState({
    showProfile: true,
    dataSharing: false,
  })

  useEffect(() => {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      setProfile(parsed)
      if (parsed.privacy) {
        setPrivacySettings(parsed.privacy)
      }
    } else {
      // Default profile
      const defaultProfile: ProfileData = {
        name: 'MindVibe User',
        email: 'user@mindvibe.app',
        bio: '',
        createdAt: new Date().toISOString(),
        privacy: {
          showProfile: true,
          dataSharing: false,
        },
      }
      setProfile(defaultProfile)
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(defaultProfile))
    }
    setLoading(false)
  }, [])

  const handleSaveProfile = async (data: { name: string; email: string; bio?: string }) => {
    if (!profile) return

    const updated = {
      ...profile,
      ...data,
    }
    setProfile(updated)
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated))
    setIsEditing(false)
  }

  const handleAvatarUpload = async (file: File): Promise<string> => {
    // Convert to base64 for local storage (in production, this would upload to a server)
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

  const handlePrivacyChange = (key: 'showProfile' | 'dataSharing', value: boolean) => {
    const updated = { ...privacySettings, [key]: value }
    setPrivacySettings(updated)
    if (profile) {
      const updatedProfile = { ...profile, privacy: updated }
      setProfile(updatedProfile)
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile))
    }
  }

  if (loading || !profile) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-32 rounded-3xl bg-orange-500/10" />
          <div className="h-64 rounded-3xl bg-orange-500/10" />
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      {/* Profile Header */}
      <FadeIn>
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
      </FadeIn>

      {isEditing ? (
        <FadeIn>
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
        </FadeIn>
      ) : (
        <>
          {/* Activity Dashboard */}
          {stats && (
            <FadeIn delay={0.1}>
              <Card className="mb-8">
                <CardContent>
                  <h2 className="text-lg font-semibold text-orange-50 mb-4">Activity Dashboard</h2>
                  <ActivityStatsDisplay stats={stats} />
                </CardContent>
              </Card>
            </FadeIn>
          )}

          {/* Activity Timeline */}
          <FadeIn delay={0.15}>
            <Card className="mb-8">
              <CardContent>
                <h2 className="text-lg font-semibold text-orange-50 mb-4">Recent Activity</h2>
                <ActivityTimeline activities={activities} maxItems={10} />
              </CardContent>
            </Card>
          </FadeIn>

          {/* Karmic Tree Preview */}
          <FadeIn delay={0.2}>
            <KarmicTreePreview healthScore={75} className="mb-8" />
          </FadeIn>

          {/* Avatar Upload Section */}
          <FadeIn delay={0.25}>
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
          </FadeIn>

          {/* Bio Section */}
          <FadeIn delay={0.3}>
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
          </FadeIn>

          {/* Privacy Controls */}
          <FadeIn delay={0.35}>
            <SettingsSection title="Profile Privacy" description="Control who can see your profile" className="mb-8">
              <SettingsItem
                label="Show Profile"
                description="Make your profile visible to future social features"
              >
                <ToggleSwitch
                  enabled={privacySettings.showProfile}
                  onToggle={(v) => handlePrivacyChange('showProfile', v)}
                />
              </SettingsItem>
              <SettingsDivider />
              <SettingsItem
                label="Data Sharing"
                description="Allow anonymous usage data to help improve MindVibe"
              >
                <ToggleSwitch
                  enabled={privacySettings.dataSharing}
                  onToggle={(v) => handlePrivacyChange('dataSharing', v)}
                />
              </SettingsItem>
            </SettingsSection>
          </FadeIn>

          {/* Subscription Info */}
          <FadeIn delay={0.4}>
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
                  <Link href="/subscription">
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
          </FadeIn>

          {/* Data Export & Account Actions */}
          <FadeIn delay={0.45}>
            <Card>
              <CardContent>
                <h2 className="text-lg font-semibold text-orange-50 mb-4">Account</h2>
                <DataExport />
              </CardContent>
            </Card>
          </FadeIn>
        </>
      )}
    </main>
  )
}
