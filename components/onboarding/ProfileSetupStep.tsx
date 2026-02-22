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
          <label htmlFor="setup-bio" className="block text-sm font-semibold text-orange-50">
            A bit about yourself (optional)
          </label>
          <textarea
            id="setup-bio"
            value={bio}
            onChange={(e) => onBioChange(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-orange-500/20 bg-slate-900/70 px-3 py-3 text-sm text-orange-50 outline-none transition placeholder:text-orange-100/50 focus:border-orange-400 focus:ring-2 focus:ring-orange-500/40"
            placeholder="I'm on a journey to..."
          />
        </div>
      )}
    </div>
  )
}

export default ProfileSetupStep
