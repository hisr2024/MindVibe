/**
 * Post Composer Component
 *
 * Create new posts with real-time moderation feedback and PII warnings.
 *
 * Quantum Enhancement #5: Community Wisdom Circles
 */

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  AlertTriangle,
  CheckCircle,
  Shield,
  Sparkles,
  AlertCircle,
  XCircle
} from 'lucide-react'

interface ModerationFeedback {
  score: number // 0-1 scale
  flags: string[]
  suggestions: string[]
  compassionScore: number
}

interface PostComposerProps {
  circleId: number
  circleName: string
  onPost: (content: string) => Promise<void>
  onCancel?: () => void
  className?: string
}

export function PostComposer({
  circleId: _circleId,
  circleName,
  onPost,
  onCancel,
  className = ''
}: PostComposerProps) {
  const [content, setContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [moderationFeedback, setModerationFeedback] = useState<ModerationFeedback | null>(null)
  const [showGuidelines, setShowGuidelines] = useState(true)

  const charCount = content.length
  const charLimit = 2000
  const minLength = 10

  // Simple client-side moderation preview (real moderation happens server-side)
  useEffect(() => {
    if (content.length < minLength) {
      setModerationFeedback(null)
      return
    }

    // Simulate moderation analysis
    const feedback = analyzeContent(content)
    setModerationFeedback(feedback)
  }, [content])

  const analyzeContent = (text: string): ModerationFeedback => {
    const lowerText = text.toLowerCase()
    const flags: string[] = []
    const suggestions: string[] = []

    // Check for PII
    if (/@|\.com|http/.test(text)) {
      flags.push('pii')
      suggestions.push('Remove URLs and email addresses to protect your privacy')
    }

    // Check for phone numbers
    if (/\d{3}[-.]?\d{3}[-.]?\d{4}/.test(text)) {
      flags.push('pii')
      suggestions.push('Remove phone numbers for your safety')
    }

    // Check for potential crisis keywords
    const crisisKeywords = ['kill myself', 'end my life', 'suicide', 'want to die']
    if (crisisKeywords.some((kw) => lowerText.includes(kw))) {
      flags.push('crisis')
      suggestions.push('Crisis keywords detected. Please reach out for immediate support.')
    }

    // Check for toxicity
    const toxicWords = ['stupid', 'idiot', 'hate', 'ugly', 'pathetic']
    if (toxicWords.some((word) => lowerText.includes(word))) {
      flags.push('toxicity')
      suggestions.push('Use compassionate language to maintain a supportive environment')
    }

    // Calculate compassion score
    const compassionKeywords = [
      'understand',
      'support',
      'care',
      'help',
      'together',
      'hope',
      'strength',
      'proud',
      'grateful'
    ]
    const compassionCount = compassionKeywords.filter((kw) => lowerText.includes(kw)).length
    const compassionScore = Math.min(compassionCount / 3, 1.0)

    // Overall score (higher = better)
    const score = flags.length === 0 ? 0.9 : flags.includes('crisis') ? 0.0 : 0.5

    return {
      score,
      flags,
      suggestions,
      compassionScore
    }
  }

  const handlePost = async () => {
    if (isPosting || content.length < minLength || content.length > charLimit) return

    setIsPosting(true)
    try {
      await onPost(content)
      setContent('')
      setModerationFeedback(null)
    } finally {
      setIsPosting(false)
    }
  }

  const canPost = content.length >= minLength && content.length <= charLimit

  return (
    <div className={`rounded-3xl border border-[#d4a44c]/15 bg-black/50 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[#f5f0e8] mb-1">Share in {circleName}</h3>
        <p className="text-sm text-[#f5f0e8]/60">
          Your identity is anonymous. Be authentic and compassionate.
        </p>
      </div>

      {/* Guidelines (Collapsible) */}
      <AnimatePresence>
        {showGuidelines && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="rounded-2xl border border-blue-400/20 bg-blue-950/20 p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-semibold text-blue-100 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Circle Guidelines</span>
                </h4>
                <button
                  onClick={() => setShowGuidelines(false)}
                  className="text-blue-100/60 hover:text-blue-100 text-xs"
                >
                  Hide
                </button>
              </div>
              <ul className="space-y-1 text-xs text-blue-100/80">
                <li>• Be compassionate and non-judgmental</li>
                <li>• Share experiences, not medical advice</li>
                <li>• Respect everyone&apos;s privacy and anonymity</li>
                <li>• No personal information (email, phone, social media)</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showGuidelines && (
        <button
          onClick={() => setShowGuidelines(true)}
          className="mb-4 text-xs text-[#f5f0e8]/60 hover:text-[#f5f0e8]"
        >
          Show guidelines
        </button>
      )}

      {/* Text Area */}
      <div className="mb-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts, feelings, or experiences..."
          className="w-full h-40 px-4 py-3 rounded-2xl border border-[#d4a44c]/20 bg-[#d4a44c]/5 text-[#f5f0e8] text-sm placeholder:text-[#f5f0e8]/40 focus:outline-none focus:border-[#d4a44c]/40 resize-none"
          maxLength={charLimit}
        />

        {/* Character Count */}
        <div className="flex items-center justify-between mt-2 text-xs">
          <span
            className={
              charCount < minLength
                ? 'text-[#f5f0e8]/40'
                : charCount > charLimit * 0.9
                ? 'text-red-400'
                : 'text-[#f5f0e8]/60'
            }
          >
            {charCount} / {charLimit} characters
            {charCount < minLength && ` (${minLength - charCount} more needed)`}
          </span>
        </div>
      </div>

      {/* Moderation Feedback */}
      <AnimatePresence>
        {moderationFeedback && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-4 overflow-hidden"
          >
            {/* Compassionate Care Notice */}
            {moderationFeedback.flags.includes('crisis') && (
              <div className="mb-3 rounded-2xl border border-[#d4a44c]/30 bg-[#d4a44c]/5 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-[#d4a44c] flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-semibold text-[#d4a44c] mb-1">You Are Not Alone</h5>
                    <p className="text-xs text-[#f5f0e8]/80 mb-2">
                      Your feelings matter deeply. If you need support beyond the spiritual path, caring souls are ready to help:
                    </p>
                    <div className="space-y-1 text-xs text-[#f5f0e8]/90">
                      <p>📞 <strong>988</strong> - Support Line (US)</p>
                      <p>💬 <strong>Text HOME to 741741</strong> - Text Support</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PII Warning */}
            {moderationFeedback.flags.includes('pii') && !moderationFeedback.flags.includes('crisis') && (
              <div className="mb-3 rounded-2xl border border-yellow-400/30 bg-yellow-950/20 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-semibold text-yellow-100 mb-1">Privacy Warning</h5>
                    <p className="text-xs text-yellow-100/80">
                      {moderationFeedback.suggestions.find((s) => s.includes('privacy') || s.includes('Remove'))}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Toxicity Warning */}
            {moderationFeedback.flags.includes('toxicity') && (
              <div className="mb-3 rounded-2xl border border-[#d4a44c]/30 bg-orange-950/20 p-4">
                <div className="flex items-start gap-2">
                  <XCircle className="h-5 w-5 text-[#d4a44c] flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-semibold text-[#f5f0e8] mb-1">Language Check</h5>
                    <p className="text-xs text-[#f5f0e8]/80">
                      {moderationFeedback.suggestions.find((s) => s.includes('compassionate'))}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Compassion Score */}
            {moderationFeedback.flags.length === 0 && moderationFeedback.compassionScore > 0.5 && (
              <div className="rounded-2xl border border-green-400/30 bg-green-950/20 p-4">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-semibold text-green-100 mb-1">
                      Compassionate Message
                    </h5>
                    <p className="text-xs text-green-100/80">
                      Your message shows empathy and support. The community will appreciate this!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* All Clear */}
            {moderationFeedback.flags.length === 0 && moderationFeedback.compassionScore <= 0.5 && (
              <div className="rounded-2xl border border-blue-400/30 bg-blue-950/20 p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-blue-100/80">
                      Your message looks good and is ready to post!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handlePost}
          disabled={!canPost || isPosting || moderationFeedback?.flags.includes('crisis')}
          className="flex-1 px-4 py-3 rounded-xl bg-[#d4a44c]/20 text-[#d4a44c] font-medium hover:bg-[#d4a44c]/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPosting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#d4a44c]" />
              <span>Posting...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Post to Circle</span>
            </>
          )}
        </button>

        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isPosting}
            className="px-4 py-3 rounded-xl border border-[#d4a44c]/20 text-[#f5f0e8]/80 hover:border-[#d4a44c]/40 hover:text-[#f5f0e8] transition disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Community Guidelines */}
      <div className="mt-4 p-3 rounded-2xl border border-[#d4a44c]/10 bg-[#d4a44c]/5">
        <p className="text-xs text-[#f5f0e8]/60 leading-relaxed">
          <strong>Sacred Space:</strong> All posts are reviewed to maintain a compassionate and respectful community. Your identity
          remains anonymous. This is a space of spiritual fellowship and mutual support.
        </p>
      </div>
    </div>
  )
}
