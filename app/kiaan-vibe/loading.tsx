export default function KiaanVibeLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      {/* Vibe header skeleton */}
      <div className="border-b border-slate-800/50 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20" />
          <div className="space-y-1.5">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-800" />
            <div className="h-3 w-44 animate-pulse rounded bg-slate-800/50" />
          </div>
        </div>
      </div>

      {/* Vibe check area skeleton */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Mood selector skeleton */}
          <div className="space-y-4 text-center">
            <div className="mx-auto h-5 w-48 animate-pulse rounded bg-slate-800" />
            <div className="flex justify-center gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 w-14 animate-pulse rounded-full bg-slate-800/50" />
              ))}
            </div>
          </div>

          {/* Insight card skeleton */}
          <div className="animate-pulse rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6">
            <div className="mb-3 h-5 w-40 rounded bg-slate-800" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-slate-800/40" />
              <div className="h-3 w-5/6 rounded bg-slate-800/40" />
              <div className="h-3 w-3/4 rounded bg-slate-800/40" />
            </div>
          </div>

          {/* Verse skeleton */}
          <div className="animate-pulse rounded-2xl border border-orange-500/10 bg-orange-500/5 p-6">
            <div className="mb-3 h-4 w-24 rounded bg-orange-500/20" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-orange-500/10" />
              <div className="h-3 w-4/5 rounded bg-orange-500/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
