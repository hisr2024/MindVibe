'use client'

import { Input } from '@/components/ui'

interface ProfileSetupStepProps {
  name: string
  onNameChange: (name: string) => void
  bio?: string
  onBioChange?: (bio: string) => void
}

export function ProfileSetupStep({
  name,
  onNameChange,
  bio = '',
  onBioChange,
}: ProfileSetupStepProps) {
  return (
    <div className="max-w-md mx-auto space-y-4">
      <Input
        label="How should we call you?"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Your name"
      />
      
      {onBioChange && (
        <div className="space-y-1.5">
          <label htmlFor="setup-bio" className="block text-sm font-semibold text-[#f5f0e8]">
            A bit about yourself (optional)
          </label>
          <textarea
            id="setup-bio"
            value={bio}
            onChange={(e) => onBioChange(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-[#d4a44c]/20 bg-slate-900/70 px-3 py-3 text-sm text-[#f5f0e8] outline-none transition placeholder:text-[#f5f0e8]/50 focus:border-[#d4a44c] focus:ring-2 focus:ring-[#d4a44c]/40"
            placeholder="I'm on a journey to..."
          />
        </div>
      )}
    </div>
  )
}

export default ProfileSetupStep
