export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Page header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-44 animate-pulse rounded-lg bg-slate-800" />
          <div className="h-4 w-64 animate-pulse rounded bg-slate-800/60" />
        </div>

        {/* Account info card skeleton */}
        <div className="animate-pulse rounded-xl border border-slate-800/50 bg-slate-900/50 p-6">
          <div className="mb-5 h-5 w-40 rounded bg-slate-800" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-20 rounded bg-slate-800/40" />
                <div className="h-10 w-full rounded-lg bg-slate-800/30" />
              </div>
            ))}
          </div>
        </div>

        {/* Subscription card skeleton */}
        <div className="animate-pulse rounded-xl border border-slate-800/50 bg-slate-900/50 p-6">
          <div className="mb-4 h-5 w-32 rounded bg-slate-800" />
          <div className="mb-4 flex items-center justify-between">
            <div className="h-6 w-24 rounded-full bg-orange-500/20" />
            <div className="h-4 w-28 rounded bg-slate-800/40" />
          </div>
          <div className="h-10 w-full rounded-lg bg-slate-800/30" />
        </div>

        {/* Danger zone skeleton */}
        <div className="animate-pulse rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <div className="mb-3 h-5 w-28 rounded bg-red-500/20" />
          <div className="mb-4 h-3 w-64 rounded bg-red-500/10" />
          <div className="h-9 w-32 rounded-lg bg-red-500/20" />
        </div>
      </div>
    </div>
  )
}
