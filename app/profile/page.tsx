'use client'

import { useState, useEffect } from 'react'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'
import { AvatarUpload } from '@/components/profile/AvatarUpload'
import { Card, CardContent, Badge, Button } from '@/components/ui'
import { useSubscription } from '@/hooks/useSubscription'
import Link from 'next/link'

interface ProfileData {
  name: string
  email: string
  bio?: string
  avatarUrl?: string
  createdAt: string
}

const PROFILE_STORAGE_KEY = 'mindvibe_profile'

export default function ProfilePage() {
  const { subscription } = useSubscription()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (stored) {
      setProfile(JSON.parse(stored))
    } else {
      // Default profile
      const defaultProfile: ProfileData = {
        name: 'MindVibe User',
        email: 'user@mindvibe.app',
        bio: '',
        createdAt: new Date().toISOString(),
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
