'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

/**
 * Base skeleton component with shimmer animation
 */
export interface SkeletonProps {
  /** Width (can be number for px or string like '100%') */
  width?: number | string
  /** Height (can be number for px or string like '100%') */
  height?: number | string
  /** Border radius */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  /** Additional className */
  className?: string
  /** Animate the shimmer */
  animate?: boolean
}

export function Skeleton({
  width,
  height,
  rounded = 'md',
  className = '',
  animate = true,
}: SkeletonProps) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  }

  return (
    <div
      className={`
        skeleton
        ${roundedClasses[rounded]}
        ${animate ? '' : 'animation-none'}
        ${className}
      `.trim()}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  )
}

/**
 * Text skeleton for simulating text lines
 */
export interface TextSkeletonProps {
  lines?: number
  lastLineWidth?: string
  lineHeight?: number
  gap?: number
  className?: string
}

export function TextSkeleton({
  lines = 3,
  lastLineWidth = '60%',
  lineHeight = 16,
  gap = 8,
  className = '',
}: TextSkeletonProps) {
  return (
    <div className={`flex flex-col ${className}`} style={{ gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? lastLineWidth : '100%'}
          height={lineHeight}
          rounded="sm"
        />
      ))}
    </div>
  )
}

/**
 * Avatar skeleton
 */
export interface AvatarSkeletonProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function AvatarSkeleton({ size = 'md', className = '' }: AvatarSkeletonProps) {
  const sizes = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  }

  return (
    <Skeleton
      width={sizes[size]}
      height={sizes[size]}
      rounded="full"
      className={className}
    />
  )
}

/**
 * Card skeleton for mobile
 */
export interface CardSkeletonProps {
  /** Show avatar/icon on left */
  showAvatar?: boolean
  /** Number of text lines */
  textLines?: number
  /** Show action button */
  showAction?: boolean
  /** Card height */
  height?: number | string
  className?: string
}

export function CardSkeleton({
  showAvatar = true,
  textLines = 2,
  showAction = false,
  height = 'auto',
  className = '',
}: CardSkeletonProps) {
  return (
    <div
      className={`
        p-4 rounded-2xl
        bg-white/[0.03]
        border border-white/[0.06]
        flex items-start gap-3
        ${className}
      `}
      style={{ height }}
    >
      {showAvatar && <AvatarSkeleton size="md" />}

      <div className="flex-1 space-y-2">
        <Skeleton width="40%" height={16} rounded="sm" />
        <TextSkeleton lines={textLines} lineHeight={14} gap={6} />
      </div>

      {showAction && (
        <Skeleton width={60} height={32} rounded="lg" />
      )}
    </div>
  )
}

/**
 * List skeleton
 */
export interface ListSkeletonProps {
  count?: number
  itemHeight?: number
  gap?: number
  showAvatar?: boolean
  className?: string
}

export function ListSkeleton({
  count = 5,
  itemHeight = 72,
  gap = 12,
  showAvatar = true,
  className = '',
}: ListSkeletonProps) {
  return (
    <div className={`flex flex-col ${className}`} style={{ gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
        >
          <CardSkeleton
            showAvatar={showAvatar}
            textLines={2}
            height={itemHeight}
          />
        </motion.div>
      ))}
    </div>
  )
}

/**
 * Chat message skeleton
 */
export interface MessageSkeletonProps {
  isUser?: boolean
  className?: string
}

export function MessageSkeleton({ isUser = false, className = '' }: MessageSkeletonProps) {
  return (
    <div
      className={`
        flex items-end gap-2
        ${isUser ? 'flex-row-reverse' : 'flex-row'}
        ${className}
      `}
    >
      {!isUser && <AvatarSkeleton size="sm" />}

      <div
        className={`
          max-w-[75%] p-3 rounded-2xl
          ${isUser ? 'bg-[#d4a44c]/10' : 'bg-white/[0.04]'}
        `}
      >
        <TextSkeleton
          lines={isUser ? 1 : 3}
          lastLineWidth={isUser ? '80%' : '50%'}
          lineHeight={14}
          gap={6}
        />
      </div>
    </div>
  )
}

/**
 * Chat skeleton
 */
export interface ChatSkeletonProps {
  messageCount?: number
  className?: string
}

export function ChatSkeleton({
  messageCount = 5,
  className = '',
}: ChatSkeletonProps) {
  const messages = Array.from({ length: messageCount }).map((_, i) => ({
    isUser: i % 3 === 1,
  }))

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {messages.map((msg, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <MessageSkeleton isUser={msg.isUser} />
        </motion.div>
      ))}
    </div>
  )
}

/**
 * Grid skeleton for cards
 */
export interface GridSkeletonProps {
  count?: number
  columns?: 2 | 3 | 4
  itemHeight?: number
  gap?: number
  className?: string
}

export function GridSkeleton({
  count = 6,
  columns = 2,
  itemHeight = 120,
  gap = 12,
  className = '',
}: GridSkeletonProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }

  return (
    <div
      className={`grid ${gridCols[columns]} ${className}`}
      style={{ gap }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-xl bg-white/[0.03] border border-white/[0.06]"
          style={{ height: itemHeight }}
        >
          <div className="p-3 h-full flex flex-col">
            <Skeleton width="100%" height="60%" rounded="lg" />
            <div className="mt-2 space-y-2">
              <Skeleton width="70%" height={14} rounded="sm" />
              <Skeleton width="40%" height={12} rounded="sm" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/**
 * Profile skeleton
 */
export function ProfileSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <AvatarSkeleton size="xl" />
      <div className="mt-4 space-y-2 text-center">
        <Skeleton width={120} height={20} rounded="md" className="mx-auto" />
        <Skeleton width={180} height={14} rounded="sm" className="mx-auto" />
      </div>
      <div className="mt-6 flex gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Skeleton width={40} height={24} rounded="md" />
            <Skeleton width={50} height={12} rounded="sm" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Feed/Timeline skeleton
 */
export function FeedSkeleton({
  count = 3,
  className = '',
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 flex items-center gap-3">
            <AvatarSkeleton size="md" />
            <div className="space-y-1.5">
              <Skeleton width={100} height={14} rounded="sm" />
              <Skeleton width={60} height={12} rounded="sm" />
            </div>
          </div>

          {/* Content */}
          <Skeleton width="100%" height={200} rounded="none" />

          {/* Actions */}
          <div className="p-4 flex gap-6">
            <Skeleton width={60} height={24} rounded="md" />
            <Skeleton width={60} height={24} rounded="md" />
            <Skeleton width={60} height={24} rounded="md" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/**
 * Skeleton container with loading state management
 */
export interface SkeletonContainerProps {
  isLoading: boolean
  skeleton: ReactNode
  children: ReactNode
  className?: string
}

export function SkeletonContainer({
  isLoading,
  skeleton,
  children,
  className = '',
}: SkeletonContainerProps) {
  return (
    <div className={className}>
      {isLoading ? skeleton : children}
    </div>
  )
}

export default Skeleton
