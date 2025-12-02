'use client'

import { type CSSProperties } from 'react'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  animate?: boolean
}

const roundedStyles = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
}

export function Skeleton({
  className = '',
  width,
  height,
  rounded = 'md',
  animate = true,
}: SkeletonProps) {
  const style: CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={`bg-orange-500/10 ${roundedStyles[rounded]} ${animate ? 'animate-pulse' : ''} ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={16}
          width={i === lines - 1 ? '60%' : '100%'}
          rounded="md"
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-3xl border border-orange-500/15 bg-[#0d0d10]/85 p-6 space-y-4 ${className}`}>
      <div className="flex items-center gap-4">
        <Skeleton width={48} height={48} rounded="xl" />
        <div className="flex-1 space-y-2">
          <Skeleton height={20} width="50%" />
          <Skeleton height={16} width="30%" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className="flex gap-2">
        <Skeleton height={40} width={100} rounded="xl" />
        <Skeleton height={40} width={100} rounded="xl" />
      </div>
    </div>
  )
}

export default Skeleton
