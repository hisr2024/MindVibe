/**
 * Post Feed Component
 *
 * Displays community posts with reactions, replies, and compassion badges.
 *
 * Quantum Enhancement #5: Community Wisdom Circles
 */

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  MessageCircle,
  Flag,
  Sparkles,
  MoreHorizontal,
  Pin
} from 'lucide-react'

interface AnonymousIdentity {
  display_name: string
  avatar_color: string
}

interface Post {
  id: number
  circle_id: number
  author: AnonymousIdentity
  content: string
  created_at: string
  reaction_counts: Record<string, number>
  reply_count: number
  user_reaction: string | null
  compassion_badges: string[]
  is_pinned: boolean
}

interface PostFeedProps {
  posts: Post[]
  onReact?: (postId: number, reactionType: string) => void
  onRemoveReaction?: (postId: number) => void
  onReply?: (postId: number) => void
  onReport?: (postId: number) => void
  onAwardBadge?: (postId: number, badgeType: string) => void
  className?: string
}

const REACTION_ICONS = {
  heart: '❤️',
  hug: '🤗',
  strength: '💪',
  wisdom: '🧠'
}

const BADGE_ICONS = {
  heart: '💝',
  wisdom: '📚',
  strength: '⭐',
  peace: '☮️'
}

const BADGE_DESCRIPTIONS = {
  heart: 'Empathetic response',
  wisdom: 'Thoughtful guidance',
  strength: 'Encouraging words',
  peace: 'Calming presence'
}

export function PostFeed({
  posts,
  onReact,
  onRemoveReaction,
  onReply,
  onReport,
  onAwardBadge,
  className = ''
}: PostFeedProps) {
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set())
  const [showReactionPicker, setShowReactionPicker] = useState<number | null>(null)
  const [showBadgePicker, setShowBadgePicker] = useState<number | null>(null)

  const toggleExpanded = (postId: number) => {
    const newExpanded = new Set(expandedPosts)
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId)
    } else {
      newExpanded.add(postId)
    }
    setExpandedPosts(newExpanded)
  }

  const handleReact = (postId: number, reactionType: string) => {
    if (onReact) {
      onReact(postId, reactionType)
    }
    setShowReactionPicker(null)
  }

  const handleAwardBadge = (postId: number, badgeType: string) => {
    if (onAwardBadge) {
      onAwardBadge(postId, badgeType)
    }
    setShowBadgePicker(null)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (posts.length === 0) {
    return (
      <div className={`rounded-3xl border border-[#d4a44c]/15 bg-black/50 p-12 text-center ${className}`}>
        <div className="max-w-md mx-auto">
          <div className="mb-4 flex justify-center">
            <div className="h-16 w-16 rounded-full bg-[#d4a44c]/10 flex items-center justify-center">
              <MessageCircle className="h-8 w-8 text-[#d4a44c]" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-[#f5f0e8] mb-2">No posts yet</h3>
          <p className="text-sm text-[#f5f0e8]/60">
            Be the first to share and start a supportive conversation in this circle.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {posts.map((post, index) => {
        const isExpanded = expandedPosts.has(post.id)
        const totalReactions = Object.values(post.reaction_counts).reduce((a, b) => a + b, 0)

        return (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`rounded-3xl border bg-black/50 p-6 ${
              post.is_pinned
                ? 'border-[#d4a44c]/30 bg-orange-950/10'
                : 'border-[#d4a44c]/15'
            }`}
          >
            {/* Pinned Badge */}
            {post.is_pinned && (
              <div className="mb-3 flex items-center gap-2 text-[#d4a44c] text-xs font-medium">
                <Pin className="h-3.5 w-3.5" />
                <span>Pinned Post</span>
              </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: post.author.avatar_color }}
                >
                  {post.author.display_name.split(' ').map(w => w[0]).join('')}
                </div>

                {/* Author Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#f5f0e8]">{post.author.display_name}</span>
                    {post.compassion_badges.length > 0 && (
                      <div className="flex items-center gap-1">
                        {post.compassion_badges.map((badge, i) => (
                          <span
                            key={i}
                            title={BADGE_DESCRIPTIONS[badge as keyof typeof BADGE_DESCRIPTIONS]}
                            className="text-xs"
                          >
                            {BADGE_ICONS[badge as keyof typeof BADGE_ICONS]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-[#f5f0e8]/60">{formatTimestamp(post.created_at)}</span>
                </div>
              </div>

              {/* More Menu */}
              <button
                onClick={() => onReport?.(post.id)}
                className="text-[#f5f0e8]/60 hover:text-[#f5f0e8] transition"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-4">
              <p
                className={`text-sm text-[#f5f0e8]/90 leading-relaxed ${
                  !isExpanded && post.content.length > 300 ? 'line-clamp-4' : ''
                }`}
              >
                {post.content}
              </p>
              {post.content.length > 300 && (
                <button
                  onClick={() => toggleExpanded(post.id)}
                  className="mt-2 text-xs text-[#d4a44c] hover:text-[#e8b54a]"
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>

            {/* Reactions Bar */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#d4a44c]/10">
              <div className="flex items-center gap-4 text-xs text-[#f5f0e8]/60">
                {totalReactions > 0 && (
                  <span>{totalReactions} {totalReactions === 1 ? 'reaction' : 'reactions'}</span>
                )}
                {post.reply_count > 0 && (
                  <span>{post.reply_count} {post.reply_count === 1 ? 'reply' : 'replies'}</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* React Button */}
              <div className="relative">
                <button
                  onClick={() =>
                    post.user_reaction
                      ? onRemoveReaction?.(post.id)
                      : setShowReactionPicker(showReactionPicker === post.id ? null : post.id)
                  }
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                    post.user_reaction
                      ? 'bg-[#d4a44c]/20 text-[#d4a44c] border border-[#d4a44c]/30'
                      : 'border border-[#d4a44c]/20 text-[#f5f0e8]/80 hover:border-[#d4a44c]/40 hover:text-[#f5f0e8]'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${post.user_reaction ? 'fill-current' : ''}`} />
                  <span>React</span>
                </button>

                {/* Reaction Picker */}
                <AnimatePresence>
                  {showReactionPicker === post.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full mb-2 left-0 rounded-2xl border border-[#d4a44c]/20 bg-black/95 p-2 flex gap-1 shadow-xl backdrop-blur-sm"
                    >
                      {Object.entries(REACTION_ICONS).map(([type, icon]) => (
                        <button
                          key={type}
                          onClick={() => handleReact(post.id, type)}
                          className="h-10 w-10 rounded-xl hover:bg-[#d4a44c]/10 transition text-xl flex items-center justify-center"
                          title={type}
                        >
                          {icon}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Reply Button */}
              <button
                onClick={() => onReply?.(post.id)}
                className="px-4 py-2 rounded-xl border border-[#d4a44c]/20 text-[#f5f0e8]/80 text-sm font-medium hover:border-[#d4a44c]/40 hover:text-[#f5f0e8] transition flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Reply</span>
              </button>

              {/* Award Badge Button */}
              <div className="relative ml-auto">
                <button
                  onClick={() =>
                    setShowBadgePicker(showBadgePicker === post.id ? null : post.id)
                  }
                  className="px-4 py-2 rounded-xl border border-[#d4a44c]/20 text-[#f5f0e8]/80 text-sm font-medium hover:border-[#d4a44c]/40 hover:text-[#f5f0e8] transition flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Award</span>
                </button>

                {/* Badge Picker */}
                <AnimatePresence>
                  {showBadgePicker === post.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full mb-2 right-0 rounded-2xl border border-[#d4a44c]/20 bg-black/95 p-3 shadow-xl backdrop-blur-sm w-56"
                    >
                      <p className="text-xs text-[#f5f0e8]/80 mb-2 font-medium">Award Compassion Badge</p>
                      <div className="space-y-1">
                        {Object.entries(BADGE_ICONS).map(([type, icon]) => (
                          <button
                            key={type}
                            onClick={() => handleAwardBadge(post.id, type)}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#d4a44c]/10 transition flex items-center gap-2"
                          >
                            <span className="text-lg">{icon}</span>
                            <div className="flex-1">
                              <div className="text-xs font-medium text-[#f5f0e8] capitalize">{type}</div>
                              <div className="text-xs text-[#f5f0e8]/60">
                                {BADGE_DESCRIPTIONS[type as keyof typeof BADGE_DESCRIPTIONS]}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Report Button */}
              <button
                onClick={() => onReport?.(post.id)}
                className="px-3 py-2 rounded-xl border border-[#d4a44c]/20 text-[#f5f0e8]/60 text-sm hover:border-red-400/40 hover:text-red-400 transition"
                title="Report post"
              >
                <Flag className="h-4 w-4" />
              </button>
            </div>

            {/* Reaction Summary */}
            {totalReactions > 0 && (
              <div className="mt-3 pt-3 border-t border-[#d4a44c]/10 flex items-center gap-3">
                {Object.entries(post.reaction_counts).map(([type, count]) => (
                  count > 0 && (
                    <div
                      key={type}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#d4a44c]/5"
                    >
                      <span className="text-sm">{REACTION_ICONS[type as keyof typeof REACTION_ICONS]}</span>
                      <span className="text-xs text-[#f5f0e8]/80 font-medium">{count}</span>
                    </div>
                  )
                ))}
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
