/**
 * Circle Card Component
 *
 * Displays community wisdom circle with info, member count, and join button.
 *
 * Quantum Enhancement #5: Community Wisdom Circles
 */

'use client'

import { motion } from 'framer-motion'
import { Users, MessageCircle, Lock, Shield, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface Circle {
  id: number
  name: string
  description: string
  category: string
  privacy: 'open' | 'moderated' | 'invite_only'
  member_count: number
  post_count: number
  is_member: boolean
  moderator_count: number
}

interface CircleCardProps {
  circle: Circle
  onJoin?: (circleId: number) => void
  onLeave?: (circleId: number) => void
  onView?: (circleId: number) => void
  className?: string
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  anxiety: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-400/30' },
  depression: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-400/30' },
  stress: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-400/30' },
  relationships: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-400/30' },
  work_life: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-400/30' },
  self_growth: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-400/30' },
  grief: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-400/30' },
  general: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-400/30' }
}

const PRIVACY_ICONS = {
  open: null,
  moderated: Shield,
  invite_only: Lock
}

export function CircleCard({ circle, onJoin, onLeave, onView, className = '' }: CircleCardProps) {
  const [isJoining, setIsJoining] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  const categoryStyle = CATEGORY_COLORS[circle.category] || CATEGORY_COLORS.general
  const PrivacyIcon = PRIVACY_ICONS[circle.privacy]

  const handleJoin = async () => {
    if (isJoining || !onJoin) return
    setIsJoining(true)
    try {
      await onJoin(circle.id)
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeave = async () => {
    if (isLeaving || !onLeave) return
    setIsLeaving(true)
    try {
      await onLeave(circle.id)
    } finally {
      setIsLeaving(false)
    }
  }

  const handleView = () => {
    if (onView) {
      onView(circle.id)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border border-orange-500/15 bg-black/50 p-6 hover:border-orange-400/30 transition cursor-pointer ${className}`}
      onClick={handleView}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-orange-50">{circle.name}</h3>
            {PrivacyIcon && <PrivacyIcon className="h-4 w-4 text-orange-100/60" />}
          </div>

          {/* Category Badge */}
          <div
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text} border ${categoryStyle.border}`}
          >
            {circle.category.replace('_', ' ')}
          </div>
        </div>

        {/* Member Badge */}
        {circle.is_member && (
          <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium border border-green-400/30">
            Member
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-orange-100/80 mb-4 line-clamp-2">{circle.description}</p>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm text-orange-100/60">
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          <span>{circle.member_count} members</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MessageCircle className="h-4 w-4" />
          <span>{circle.post_count} posts</span>
        </div>
      </div>

      {/* Privacy Info */}
      {circle.privacy === 'moderated' && (
        <div className="mb-4 p-3 rounded-2xl border border-blue-400/20 bg-blue-950/20">
          <p className="text-xs text-blue-100/80 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5" />
            <span>This circle is moderated. Join requests are reviewed before approval.</span>
          </p>
        </div>
      )}

      {circle.privacy === 'invite_only' && (
        <div className="mb-4 p-3 rounded-2xl border border-purple-400/20 bg-purple-950/20">
          <p className="text-xs text-purple-100/80 flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" />
            <span>This is a private circle. You need an invitation to join.</span>
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        {circle.is_member ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleView()
              }}
              className="flex-1 px-4 py-2 rounded-xl bg-orange-500/20 text-orange-400 text-sm font-medium hover:bg-orange-500/30 transition flex items-center justify-center gap-2"
            >
              <span>View Circle</span>
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleLeave()
              }}
              disabled={isLeaving}
              className="px-4 py-2 rounded-xl border border-orange-500/20 text-orange-100/80 text-sm hover:border-orange-400/40 hover:text-orange-50 transition disabled:opacity-50"
            >
              {isLeaving ? 'Leaving...' : 'Leave'}
            </button>
          </>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleJoin()
            }}
            disabled={isJoining || circle.privacy === 'invite_only'}
            className="flex-1 px-4 py-2 rounded-xl bg-orange-500/20 text-orange-400 text-sm font-medium hover:bg-orange-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining
              ? 'Joining...'
              : circle.privacy === 'moderated'
              ? 'Request to Join'
              : circle.privacy === 'invite_only'
              ? 'Invite Only'
              : 'Join Circle'}
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-orange-500/10">
        <p className="text-xs text-orange-100/40 flex items-center justify-between">
          <span>Anonymous participation • Compassionate moderation</span>
          <span>{circle.moderator_count} moderators</span>
        </p>
      </div>
    </motion.div>
  )
}
