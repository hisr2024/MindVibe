'use client'

import React, { ReactNode } from 'react'

/**
 * Skeleton Loader Components
 * Provides loading placeholders that match content layout
 */

interface SkeletonBaseProps {
  className?: string
  animate?: boolean
}

/**
 * Base skeleton component
 */
export function Skeleton({ className = '', animate = true }: SkeletonBaseProps) {
  return (
    <div
      className={`
        bg-slate-800/50 rounded
        ${animate ? 'animate-pulse' : ''}
        ${className}
      `}
      aria-hidden="true"
    />
  )
}

/**
 * Text skeleton - matches text line height
 */
interface SkeletonTextProps extends SkeletonBaseProps {
  lines?: number
  width?: 'full' | 'three-quarters' | 'half' | 'quarter'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function SkeletonText({
  lines = 1,
  width = 'full',
  size = 'md',
  className = '',
  animate = true,
}: SkeletonTextProps) {
  const widthClass = {
    full: 'w-full',
    'three-quarters': 'w-3/4',
    half: 'w-1/2',
    quarter: 'w-1/4',
  }[width]

  const heightClass = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-5',
    xl: 'h-6',
  }[size]

  return (
    <div className={`space-y-2 ${className}`} role="status" aria-label="Loading">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`${heightClass} ${i === lines - 1 && lines > 1 ? 'w-2/3' : widthClass}`}
          animate={animate}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

/**
 * Avatar skeleton - circular placeholder
 */
interface SkeletonAvatarProps extends SkeletonBaseProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function SkeletonAvatar({ size = 'md', className = '', animate = true }: SkeletonAvatarProps) {
  const sizeClass = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }[size]

  return <Skeleton className={`${sizeClass} rounded-full ${className}`} animate={animate} />
}

/**
 * Button skeleton
 */
interface SkeletonButtonProps extends SkeletonBaseProps {
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export function SkeletonButton({ size = 'md', fullWidth = false, className = '', animate = true }: SkeletonButtonProps) {
  const sizeClass = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-32',
  }[size]

  return <Skeleton className={`${fullWidth ? 'w-full' : sizeClass} rounded-md ${className}`} animate={animate} />
}

/**
 * Card skeleton - common card layout placeholder
 */
interface SkeletonCardProps extends SkeletonBaseProps {
  hasImage?: boolean
  hasHeader?: boolean
  lines?: number
}

export function SkeletonCard({
  hasImage = false,
  hasHeader = true,
  lines = 3,
  className = '',
  animate = true,
}: SkeletonCardProps) {
  return (
    <div
      className={`rounded-lg border border-slate-800 bg-slate-900/50 p-4 ${className}`}
      role="status"
      aria-label="Loading card"
    >
      {hasImage && <Skeleton className="w-full h-40 rounded-md mb-4" animate={animate} />}
      {hasHeader && (
        <div className="flex items-center gap-3 mb-4">
          <SkeletonAvatar size="md" animate={animate} />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" animate={animate} />
            <Skeleton className="h-3 w-1/4" animate={animate} />
          </div>
        </div>
      )}
      <SkeletonText lines={lines} animate={animate} />
      <span className="sr-only">Loading...</span>
    </div>
  )
}

/**
 * List skeleton - repeated items
 */
interface SkeletonListProps extends SkeletonBaseProps {
  items?: number
  showAvatar?: boolean
}

export function SkeletonList({ items = 5, showAvatar = true, className = '', animate = true }: SkeletonListProps) {
  return (
    <div className={`space-y-4 ${className}`} role="status" aria-label="Loading list">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {showAvatar && <SkeletonAvatar size="md" animate={animate} />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" animate={animate} />
            <Skeleton className="h-3 w-1/2" animate={animate} />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

/**
 * Table skeleton
 */
interface SkeletonTableProps extends SkeletonBaseProps {
  rows?: number
  columns?: number
}

export function SkeletonTable({ rows = 5, columns = 4, className = '', animate = true }: SkeletonTableProps) {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-label="Loading table">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-slate-800">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" animate={animate} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" animate={animate} />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

/**
 * Form skeleton
 */
interface SkeletonFormProps extends SkeletonBaseProps {
  fields?: number
}

export function SkeletonForm({ fields = 4, className = '', animate = true }: SkeletonFormProps) {
  return (
    <div className={`space-y-6 ${className}`} role="status" aria-label="Loading form">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-1/4" animate={animate} />
          <Skeleton className="h-10 w-full rounded-md" animate={animate} />
        </div>
      ))}
      <SkeletonButton size="lg" fullWidth animate={animate} />
      <span className="sr-only">Loading...</span>
    </div>
  )
}

/**
 * Dashboard widget skeleton
 */
export function SkeletonDashboardWidget({ className = '', animate = true }: SkeletonBaseProps) {
  return (
    <div className={`rounded-lg border border-slate-800 bg-slate-900/50 p-6 ${className}`} role="status" aria-label="Loading widget">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-1/3" animate={animate} />
        <Skeleton className="h-8 w-8 rounded" animate={animate} />
      </div>
      <Skeleton className="h-10 w-1/2 mb-2" animate={animate} />
      <Skeleton className="h-4 w-3/4" animate={animate} />
      <span className="sr-only">Loading...</span>
    </div>
  )
}

/**
 * Chat message skeleton
 */
interface SkeletonChatMessageProps extends SkeletonBaseProps {
  isUser?: boolean
}

export function SkeletonChatMessage({ isUser = false, className = '', animate = true }: SkeletonChatMessageProps) {
  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${className}`}
      role="status"
      aria-label="Loading message"
    >
      <div className={`max-w-[80%] ${isUser ? 'order-2' : ''}`}>
        <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
          {!isUser && <SkeletonAvatar size="sm" animate={animate} />}
          <div className="space-y-1">
            <Skeleton className={`h-4 ${isUser ? 'w-32' : 'w-48'}`} animate={animate} />
            <Skeleton className={`h-4 ${isUser ? 'w-24' : 'w-36'}`} animate={animate} />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}
