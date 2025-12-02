'use client'

import { useState, useRef, useCallback } from 'react'
import { Button, Modal } from '@/components/ui'

interface AvatarUploadProps {
  currentAvatar?: string
  onUpload: (file: File) => Promise<string>
  onRemove?: () => Promise<void>
  className?: string
}

export function AvatarUpload({
  currentAvatar,
  onUpload,
  onRemove,
  className = '',
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCropModal, setShowCropModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
      setShowCropModal(true)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return

    setLoading(true)
    setError(null)

    try {
      const file = fileInputRef.current.files[0]
      await onUpload(file)
      setShowCropModal(false)
      setPreview(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async () => {
    if (!onRemove) return

    setLoading(true)
    setError(null)

    try {
      await onRemove()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove avatar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload avatar"
      />

      <div className="flex items-center gap-4">
        <div className="relative">
          {currentAvatar || preview ? (
            <img
              src={preview || currentAvatar}
              alt="Avatar"
              className="h-24 w-24 rounded-2xl object-cover border-2 border-orange-400/30"
            />
          ) : (
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-orange-500/30 via-amber-500/30 to-orange-500/30 border-2 border-dashed border-orange-400/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="secondary"
            size="sm"
            disabled={loading}
          >
            {currentAvatar ? 'Change Avatar' : 'Upload Avatar'}
          </Button>
          {currentAvatar && onRemove && (
            <Button
              onClick={handleRemove}
              variant="ghost"
              size="sm"
              disabled={loading}
            >
              Remove
            </Button>
          )}
          <p className="text-xs text-orange-100/50">JPG, PNG, GIF. Max 5MB.</p>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}

      <Modal
        open={showCropModal}
        onClose={() => {
          setShowCropModal(false)
          setPreview(null)
        }}
        title="Preview Avatar"
        size="sm"
      >
        <div className="text-center">
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="mx-auto h-48 w-48 rounded-2xl object-cover mb-4"
            />
          )}
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setShowCropModal(false)
                setPreview(null)
              }}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              loading={loading}
              className="flex-1"
            >
              Save Avatar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AvatarUpload
