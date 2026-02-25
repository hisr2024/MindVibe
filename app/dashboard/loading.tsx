/**
 * Dashboard Loading Skeleton
 *
 * Next.js App Router loading boundary — renders instantly while the
 * DashboardClient lazy-loads. Mirrors the dashboard layout structure
 * so users perceive content forming rather than seeing a blank screen.
 */

import { Skeleton } from '@/components/ui/Skeleton'

function QuickActionSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[18px] border border-white/[0.06] bg-white/[0.02] p-4 md:p-5">
      <Skeleton width={48} height={48} rounded="full" className="mb-3 md:!w-14 md:!h-14" />
      <Skeleton width={60} height={14} rounded="md" />
      <Skeleton width={50} height={10} rounded="md" className="mt-1" />
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-7xl space-y-4 sm:space-y-6 px-3 sm:px-4 pb-28 sm:pb-16 lg:px-6">
      {/* Pathway Map skeleton */}
      <div className="mb-4">
        <Skeleton height={64} rounded="2xl" />
      </div>

      {/* Divine Presence CTA skeleton */}
      <div className="mb-6 rounded-[18px] sm:rounded-[20px] border border-[#d4a44c]/10 bg-amber-900/10 p-4 sm:p-5 md:p-6">
        <div className="flex items-center gap-4">
          <Skeleton width={56} height={56} rounded="full" />
          <div className="flex-1 space-y-2">
            <Skeleton height={20} width="40%" rounded="md" />
            <Skeleton height={14} width="70%" rounded="md" />
          </div>
          <Skeleton width={24} height={24} rounded="md" />
        </div>
      </div>

      {/* Quick Actions Grid skeleton */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-8 sm:grid-cols-2 md:grid-cols-4 md:gap-4">
        <QuickActionSkeleton />
        <QuickActionSkeleton />
        <QuickActionSkeleton />
        <QuickActionSkeleton />
      </div>

      {/* Companion CTA skeleton */}
      <div className="mb-6 rounded-2xl border border-[#d4a44c]/10 bg-black/30 p-5">
        <div className="flex items-center gap-3">
          <Skeleton width={40} height={40} rounded="full" />
          <div className="flex-1 space-y-2">
            <Skeleton height={16} width="55%" rounded="md" />
            <Skeleton height={12} width="80%" rounded="md" />
          </div>
        </div>
      </div>

      {/* Tools Section skeleton */}
      <div>
        <div className="mb-5 flex items-center gap-3">
          <Skeleton width={32} height={32} rounded="lg" />
          <Skeleton height={22} width={180} rounded="md" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[#d4a44c]/10 bg-black/20 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton width={36} height={36} rounded="xl" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton height={14} width="50%" rounded="md" />
                  <Skeleton height={10} width="70%" rounded="md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
