'use client'

import { useState } from 'react'
import { shareContent, type SharePlatform } from '@/utils/socialShare'

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

  const handleShare = async (platform: SharePlatform) => {
    if (showWarning) {
      // User needs to acknowledge the warning first
      return
    }

    setSharing(true)
    const success = await shareContent(platform, text, anonymize)

    if (success && platform === 'instagram') {
      alert('Text copied to clipboard! You can now paste it into Instagram.')
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
        className={`group relative flex items-center gap-1.5 rounded-lg border border-orange-500/25 bg-orange-500/10 px-2.5 py-1.5 text-xs font-medium text-orange-200 transition-all hover:border-orange-500/40 hover:bg-orange-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 ${className}`}
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
          className="text-orange-400"
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
            className="relative max-w-lg w-full rounded-3xl border border-orange-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 shadow-2xl shadow-orange-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 rounded-full p-2 text-orange-200 hover:bg-orange-500/20 transition-colors"
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
                    <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center text-2xl">
                      ⚠️
                    </div>
                    <h2 className="text-xl font-bold text-orange-50">
                      Privacy Notice
                    </h2>
                  </div>

                  <p className="text-sm text-orange-100/80 leading-relaxed">
                    You are about to share mental health information. Please ensure you're
                    comfortable sharing this content publicly.
                  </p>

                  <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="anonymize"
                        checked={anonymize}
                        onChange={(e) => setAnonymize(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-orange-500/30 bg-transparent text-orange-500 focus:ring-orange-400"
                      />
                      <label htmlFor="anonymize" className="text-sm text-orange-100/90">
                        Anonymize content (remove personal identifiers)
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 rounded-xl border border-orange-500/30 px-4 py-2.5 text-sm font-semibold text-orange-200 transition-colors hover:bg-orange-500/10"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={acknowledgeWarning}
                      className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-orange-500/30 transition-all hover:scale-[1.02]"
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
                  <h2 className="text-xl font-bold text-orange-50">Share via</h2>

                  <p className="text-xs text-orange-100/70">
                    {anonymize ? '✓ Anonymized content' : 'Sharing original content'}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {shareOptions.map((option) => (
                      <button
                        key={option.platform}
                        onClick={() => handleShare(option.platform)}
                        disabled={sharing}
                        className={`group relative rounded-2xl border border-orange-500/20 bg-gradient-to-br ${option.color} p-4 text-left transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
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
                    className="w-full text-xs text-orange-300/70 hover:text-orange-200 transition-colors"
                  >
                    ← Back to privacy settings
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
