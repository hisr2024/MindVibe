'use client'

import { useState } from 'react'
import { Button, Input, Card, CardContent } from '@/components/ui'

interface ProfileData {
  name: string
  email: string
  bio?: string
}

interface ProfileEditFormProps {
  initialData: ProfileData
  onSave: (data: ProfileData) => Promise<void>
  onCancel?: () => void
  className?: string
}

export function ProfileEditForm({
  initialData,
  onSave,
  onCancel,
  className = '',
}: ProfileEditFormProps) {
  const [formData, setFormData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await onSave(formData)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof ProfileData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  return (
    <Card className={className}>
      <CardContent>
        <h2 className="text-lg font-semibold text-[#f5f0e8] mb-4">Edit Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={handleChange('name')}
            required
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            required
            hint="Your email is used for account recovery and notifications"
          />

          <div className="space-y-1.5">
            <label htmlFor="profile-bio" className="block text-sm font-semibold text-[#f5f0e8]">
              Bio (optional)
            </label>
            <textarea
              id="profile-bio"
              value={formData.bio ?? ''}
              onChange={handleChange('bio')}
              rows={3}
              className="w-full rounded-xl border border-[#d4a44c]/20 bg-slate-900/70 px-3 py-3 text-sm text-[#f5f0e8] outline-none transition placeholder:text-[#f5f0e8]/50 focus:border-[#d4a44c] focus:ring-2 focus:ring-[#d4a44c]/40"
              placeholder="Tell us a little about yourself..."
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-50">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-50">
              Profile updated successfully!
            </div>
          )}

          <div className="flex gap-3">
            {onCancel && (
              <Button type="button" onClick={onCancel} variant="outline" className="flex-1">
                Cancel
              </Button>
            )}
            <Button type="submit" loading={loading} className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default ProfileEditForm
