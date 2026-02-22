'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { apiFetch } from '@/lib/api'
import { useLanguage } from '@/hooks/useLanguage'
import { ArrowLeft, Loader2 } from 'lucide-react'

// Dynamic imports for framer-motion components to reduce bundle size
const CircleList = dynamic(() => import('@/components/community/CircleList').then(mod => mod.CircleList), { ssr: false })
const PostFeed = dynamic(() => import('@/components/community/PostFeed').then(mod => mod.PostFeed), { ssr: false })
const PostComposer = dynamic(() => import('@/components/community/PostComposer').then(mod => mod.PostComposer), { ssr: false })
const CrisisAlert = dynamic(() => import('@/components/community/CrisisAlert').then(mod => mod.CrisisAlert), { ssr: false })

interface Circle {
  id: number
  name: string
  description: string
  category: string
  privacy: 'open' | 'moderated' | 'invite_only'
  member_count: number
  post_count: number
  is_member: boolean
}

interface Post {
  id: number
  circle_id: number
  author: { display_name: string; avatar_color: string }
  content: string
  created_at: string
  reaction_counts: Record<string, number>
  reply_count: number
  user_reaction: string | null
  compassion_badges: string[]
  is_pinned: boolean
}

/**
 * Community Wisdom Circles Page
 * Anonymous peer support spaces for spiritual wellness community
 */
export default function CommunityPage() {
  const { t } = useLanguage()
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [showCrisisAlert, setShowCrisisAlert] = useState(false)
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)

  const handleViewCircle = useCallback(async (circleId: number) => {
    try {
      // Fetch circle details
      const circleRes = await apiFetch(`/api/community/circles/${circleId}`)
      if (circleRes.ok) {
        const circle = await circleRes.json()
        setSelectedCircle(circle)
      }

      // Fetch posts for the circle
      setIsLoadingPosts(true)
      const postsRes = await apiFetch(`/api/community/circles/${circleId}/posts`)
      if (postsRes.ok) {
        const postsData = await postsRes.json()
        setPosts(postsData)
      }
    } catch (err) {
      console.error('Failed to load circle:', err)
    } finally {
      setIsLoadingPosts(false)
    }
  }, [])

  const handleBackToCircles = () => {
    setSelectedCircle(null)
    setPosts([])
  }

  const handleJoinCircle = async (circleId: number) => {
    try {
      await apiFetch(`/api/community/circles/${circleId}/join`, { method: 'POST' })
    } catch (err) {
      console.error('Failed to join circle:', err)
    }
  }

  const handlePost = async (content: string) => {
    if (!selectedCircle) return

    try {
      const res = await apiFetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circle_id: selectedCircle.id, content })
      })

      if (!res.ok) return

      const data = await res.json()

      if (data.crisis_detected) {
        setShowCrisisAlert(true)
        return
      }

      if (data.post) {
        setPosts(prev => [data.post, ...prev])
      }
    } catch (err) {
      console.error('Failed to post:', err)
    }
  }

  const handleReact = async (postId: number, reactionType: string) => {
    // Optimistic update
    const previousPosts = posts
    setPosts(prev => prev.map(post =>
      post.id === postId
        ? {
            ...post,
            reaction_counts: {
              ...post.reaction_counts,
              [reactionType]: (post.reaction_counts[reactionType] || 0) + 1
            },
            user_reaction: reactionType
          }
        : post
    ))

    try {
      const res = await apiFetch(`/api/community/posts/${postId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction: reactionType })
      })

      if (!res.ok) {
        // Rollback optimistic update on failure
        setPosts(previousPosts)
      }
    } catch (_err) {
      // Rollback optimistic update on network error
      setPosts(previousPosts)
    }
  }

  return (
    <div className="min-h-screen space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-3xl font-bold text-orange-50 md:text-4xl">
          {t('community.title', 'Community Wisdom Circles')}
        </h1>
        <p className="text-orange-100/70 max-w-2xl mx-auto">
          {t('community.subtitle', 'Connect anonymously with others on similar journeys. Share experiences, give support, and grow together in a safe, judgment-free space.')}
        </p>
      </motion.div>

      {/* Crisis Alert Modal */}
      {showCrisisAlert && (
        <CrisisAlert onClose={() => setShowCrisisAlert(false)} />
      )}

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl border border-orange-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-900/90 p-4 md:p-6 shadow-2xl shadow-orange-500/10 backdrop-blur-xl"
      >
        {selectedCircle === null ? (
          /* Circle List View */
          <CircleList
            onJoinCircle={handleJoinCircle}
            onViewCircle={handleViewCircle}
            className="min-h-[400px]"
          />
        ) : (
          /* Circle Detail View */
          <div className="space-y-6">
            {/* Back Button & Circle Info */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToCircles}
                className="flex items-center gap-2 text-sm text-orange-300 hover:text-orange-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('community.backToCircles', 'Back to Circles')}
              </button>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-orange-50">{selectedCircle.name}</h2>
                <p className="text-sm text-orange-100/60">{selectedCircle.description}</p>
              </div>
            </div>

            {/* Post Composer */}
            <PostComposer
              circleId={selectedCircle.id}
              circleName={selectedCircle.name}
              onPost={handlePost}
            />

            {/* Post Feed */}
            {isLoadingPosts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-orange-100/60">No posts yet. Be the first to share!</p>
              </div>
            ) : (
              <PostFeed
                posts={posts}
                onReact={handleReact}
              />
            )}
          </div>
        )}
      </motion.div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-orange-500/10 bg-white/5 p-4 backdrop-blur"
        >
          <div className="text-2xl mb-2">🔒</div>
          <h3 className="font-semibold text-orange-50 mb-1">
            {t('community.features.anonymous.title', 'Anonymous & Safe')}
          </h3>
          <p className="text-xs text-orange-100/60">
            {t('community.features.anonymous.description', 'Your identity is protected with cryptographic anonymization. Share freely without fear.')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-orange-500/10 bg-white/5 p-4 backdrop-blur"
        >
          <div className="text-2xl mb-2">🛡️</div>
          <h3 className="font-semibold text-orange-50 mb-1">
            {t('community.features.moderated.title', 'AI Moderated')}
          </h3>
          <p className="text-xs text-orange-100/60">
            {t('community.features.moderated.description', 'Every post is nurtured for compassion and respect. A sacred space where seekers support one another.')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-orange-500/10 bg-white/5 p-4 backdrop-blur"
        >
          <div className="text-2xl mb-2">💝</div>
          <h3 className="font-semibold text-orange-50 mb-1">
            {t('community.features.compassion.title', 'Compassion First')}
          </h3>
          <p className="text-xs text-orange-100/60">
            {t('community.features.compassion.description', 'Earn badges for supportive messages. Build a community rooted in empathy and understanding.')}
          </p>
        </motion.div>
      </div>
    </div>
  )
}
