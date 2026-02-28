'use client'

import Image from 'next/image'
import { Badge, Button } from '@/components/ui'

interface ProfileHeaderProps {
  name: string
  email: string
  avatarUrl?: string
  tier?: string
  memberSince?: Date
  onEditProfile?: () => void
  className?: string
}

export function ProfileHeader({
  name,
  email,
  avatarUrl,
  tier = 'Free',
  memberSince,
  onEditProfile,
  className = '',
}: ProfileHeaderProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={`flex items-start gap-6 ${className}`}>
      <div className="relative">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            width={80}
            height={80}
            className="h-20 w-20 rounded-2xl object-cover border-2 border-[#d4a44c]/30"
            unoptimized
          />
        ) : (
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#d4a44c] via-[#d4a44c] to-[#e8b54a] flex items-center justify-center text-2xl font-bold text-slate-900 border-2 border-[#d4a44c]/30">
            {initials}
          </div>
        )}
        {onEditProfile && (
          <button
            onClick={onEditProfile}
            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-lg bg-slate-900 border border-[#d4a44c]/30 flex items-center justify-center text-[#f5f0e8] hover:bg-[#d4a44c]/20 transition"
            aria-label="Edit profile picture"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-[#f5f0e8] truncate">{name}</h1>
          <Badge variant="premium">{tier}</Badge>
        </div>
        <p className="text-sm text-[#f5f0e8]/70 truncate mb-2">{email}</p>
        {memberSince && (
          <p className="text-xs text-[#f5f0e8]/50">
            Member since {memberSince.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>

      {onEditProfile && (
        <Button onClick={onEditProfile} variant="secondary" size="sm">
          Edit Profile
        </Button>
      )}
    </div>
  )
}

export default ProfileHeader
