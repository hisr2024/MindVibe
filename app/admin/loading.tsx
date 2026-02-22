export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Admin header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-800" />
          <div className="h-4 w-64 animate-pulse rounded bg-slate-800/60" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-800/50 bg-slate-900/50 p-5">
              <div className="mb-3 h-3 w-24 rounded bg-slate-800/50" />
              <div className="mb-1 h-7 w-20 rounded bg-slate-800" />
              <div className="h-3 w-16 rounded bg-slate-800/40" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="rounded-xl border border-slate-800/50 bg-slate-900/50">
          <div className="border-b border-slate-800/50 px-5 py-4">
            <div className="h-5 w-32 animate-pulse rounded bg-slate-800" />
          </div>
          <div className="divide-y divide-slate-800/30">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-9 w-9 animate-pulse rounded-full bg-slate-800/60" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-40 animate-pulse rounded bg-slate-800" />
                  <div className="h-3 w-56 animate-pulse rounded bg-slate-800/40" />
                </div>
                <div className="h-6 w-16 animate-pulse rounded-full bg-slate-800/50" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
