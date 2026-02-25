'use client'

/**
 * WisdomSkeleton - Branded skeleton loader for wisdom response areas.
 *
 * Matches the visual structure of WisdomResponseCard with shimmer
 * animations, so users perceive content forming rather than an empty void.
 * Each tool variant reflects its section layout (number of sections,
 * header pattern, action rows).
 */

import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'

type ToolVariant = 'ardha' | 'viyoga' | 'compass' | 'emotional-reset' | 'karma-reset' | 'generic'

interface WisdomSkeletonProps {
  variant?: ToolVariant
  className?: string
}

const SECTION_COUNTS: Record<ToolVariant, number> = {
  ardha: 7,
  viyoga: 5,
  compass: 4,
  'emotional-reset': 3,
  'karma-reset': 4,
  generic: 4,
}

function SectionSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div className="space-y-2">
      <Skeleton height={14} width={wide ? '45%' : '30%'} rounded="md" />
      <SkeletonText lines={wide ? 4 : 2} />
    </div>
  )
}

export function WisdomSkeleton({ variant = 'generic', className = '' }: WisdomSkeletonProps) {
  const sectionCount = SECTION_COUNTS[variant]

  return (
    <div
      className={`rounded-2xl border border-[#d4a44c]/15 bg-[#0d0d10]/85 p-5 space-y-5 ${className}`}
      role="status"
      aria-label="Loading wisdom response"
    >
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton width={36} height={36} rounded="xl" />
        <div className="flex-1 space-y-1.5">
          <Skeleton height={18} width="40%" rounded="md" />
          <Skeleton height={12} width="25%" rounded="md" />
        </div>
      </div>

      {/* Divider shimmer */}
      <Skeleton height={1} width="100%" rounded="none" />

      {/* Sections */}
      <div className="space-y-4">
        {Array.from({ length: sectionCount }).map((_, i) => (
          <SectionSkeleton key={i} wide={i === 0 || i === sectionCount - 1} />
        ))}
      </div>

      {/* Action row skeleton */}
      <div className="flex gap-2 pt-2">
        <Skeleton height={36} width={90} rounded="xl" />
        <Skeleton height={36} width={90} rounded="xl" />
        <Skeleton height={36} width={70} rounded="xl" />
      </div>

      <span className="sr-only">Loading...</span>
    </div>
  )
}

export default WisdomSkeleton
