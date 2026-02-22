export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Page header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-52 animate-pulse rounded-lg bg-slate-800" />
          <div className="h-4 w-80 animate-pulse rounded bg-slate-800/60" />
        </div>

        {/* Date range and filters skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-9 w-20 animate-pulse rounded-lg bg-slate-800/50" />
            ))}
          </div>
          <div className="h-9 w-36 animate-pulse rounded-lg bg-slate-800/50" />
        </div>

        {/* Metrics cards skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-800/50 bg-slate-900/50 p-5">
              <div className="mb-1 h-3 w-24 rounded bg-slate-800/50" />
              <div className="mb-2 h-7 w-16 rounded bg-slate-800" />
              <div className="h-3 w-20 rounded bg-slate-800/40" />
            </div>
          ))}
        </div>

        {/* Chart skeletons */}
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-800/50 bg-slate-900/50 p-5">
              <div className="mb-4 h-5 w-36 rounded bg-slate-800" />
              <div className="h-56 rounded-lg bg-slate-800/30" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
