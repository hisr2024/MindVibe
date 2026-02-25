'use client'

import { useState } from 'react'
import { shareContent, type SharePlatform } from '@/utils/socialShare'
import { Toast } from '@/components/Toast'

interface ShareButtonProps {
  text: string
  className?: string
}

interface ShareOption {
  platform: SharePlatform
  name: string
  icon: string
  color: string
  description: string
}

const shareOptions: ShareOption[] = [
  {
    platform: 'whatsapp',
    name: 'WhatsApp',
    icon: '💬',
    color: 'from-green-500 to-green-600',
    description: 'Share via WhatsApp',
  },
  {
    platform: 'telegram',
    name: 'Telegram',
    icon: '✈️',
    color: 'from-blue-500 to-blue-600',
    description: 'Share via Telegram',
  },
  {
    platform: 'facebook',
    name: 'Facebook',
    icon: '👥',
    color: 'from-blue-600 to-blue-700',
    description: 'Share on Facebook',
  },
  {
    platform: 'instagram',
    name: 'Instagram',
    icon: '📸',
    color: 'from-pink-500 to-purple-600',
    description: 'Copy for Instagram',
  },
]

export function ShareButton({ text, className = '' }: ShareButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [showWarning, setShowWarning] = useState(true)
  const [anonymize, setAnonymize] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const handleShare = async (platform: SharePlatform) => {
    if (showWarning) {
      // User needs to acknowledge the warning first
      return
    }

    setSharing(true)
    const result = await shareContent(platform, text, anonymize)

    if (result.success && platform === 'instagram') {
      setShowToast(true)
    } else if (!result.success && result.error) {
      // Log error for debugging, could also show toast notification
      console.error(`Share failed: ${result.error}`)
    }

    setSharing(false)
    setShowModal(false)
    setShowWarning(true) // Reset warning for next time
  }

  const acknowledgeWarning = () => {
    setShowWarning(false)
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`group relative flex items-center gap-1.5 rounded-lg border border-[#d4a44c]/25 bg-[#d4a44c]/10 px-2.5 py-1.5 text-xs font-medium text-[#e8b54a] transition-all hover:border-[#d4a44c]/40 hover:bg-[#d4a44c]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a44c]/50 ${className}`}
        aria-label="Share this response"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[#d4a44c]"
        >
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
        <span>Share</span>
      </button>

      {/* Share Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative max-w-lg w-full rounded-3xl border border-[#d4a44c]/20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 shadow-2xl shadow-[#d4a44c]/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 rounded-full p-2 text-[#e8b54a] hover:bg-[#d4a44c]/20 transition-colors"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {showWarning ? (
              <>
                {/* Privacy Warning */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-[#d4a44c]/20 flex items-center justify-center text-2xl">
                      ⚠️
                    </div>
                    <h2 className="text-xl font-bold text-[#f5f0e8]">
                      Privacy Notice
                    </h2>
                  </div>

                  <p className="text-sm text-[#f5f0e8]/80 leading-relaxed">
                    You are about to share spiritual wellness information. Please ensure you&apos;re
                    comfortable sharing this content publicly.
                  </p>

                  <div className="rounded-2xl border border-[#d4a44c]/20 bg-[#d4a44c]/10 p-4">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="anonymize"
                        checked={anonymize}
                        onChange={(e) => setAnonymize(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-[#d4a44c]/30 bg-transparent text-[#d4a44c] focus:ring-[#d4a44c]"
                      />
                      <label htmlFor="anonymize" className="text-sm text-[#f5f0e8]/90">
                        Anonymize content (remove personal identifiers)
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 rounded-xl border border-[#d4a44c]/30 px-4 py-2.5 text-sm font-semibold text-[#e8b54a] transition-colors hover:bg-[#d4a44c]/10"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={acknowledgeWarning}
                      className="flex-1 rounded-xl bg-gradient-to-r from-[#d4a44c] via-[#d4a44c] to-[#d4a44c] px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-[#d4a44c]/30 transition-all hover:scale-[1.02]"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Share Options */}
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-[#f5f0e8]">Share via</h2>

                  <p className="text-xs text-[#f5f0e8]/70">
                    {anonymize ? '✓ Anonymized content' : 'Sharing original content'}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {shareOptions.map((option) => (
                      <button
                        key={option.platform}
                        onClick={() => handleShare(option.platform)}
                        disabled={sharing}
                        className={`group relative rounded-2xl border border-[#d4a44c]/20 bg-gradient-to-br ${option.color} p-4 text-left transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{option.icon}</div>
                          <div>
                            <div className="text-sm font-semibold text-white">
                              {option.name}
                            </div>
                            <div className="text-xs text-white/80">
                              {option.description}
                            </div>
                          </div>
                        </div>

                        {option.platform === 'instagram' && (
                          <div className="mt-2 text-[10px] text-white/70">
                            Copies text for manual paste
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowWarning(true)}
                    className="w-full text-xs text-[#e8b54a]/70 hover:text-[#e8b54a] transition-colors"
                  >
                    ← Back to privacy settings
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast notification for Instagram */}
      {showToast && (
        <Toast
          message="Text copied to clipboard! You can now paste it into Instagram."
          type="success"
          duration={4000}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  )
}
