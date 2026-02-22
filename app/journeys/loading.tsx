export default function JourneysLoading() {
  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Page header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-800" />
          <div className="h-4 w-80 animate-pulse rounded bg-slate-800/60" />
        </div>

        {/* Filter bar skeleton */}
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-slate-800/50" />
          ))}
        </div>

        {/* Journey cards skeleton */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-slate-800/50 bg-slate-900/50 p-5">
              <div className="mb-4 h-32 rounded-xl bg-slate-800/40" />
              <div className="mb-2 h-5 w-3/4 rounded bg-slate-800" />
              <div className="mb-4 h-3 w-full rounded bg-slate-800/50" />
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 rounded bg-slate-800/40" />
                <div className="h-8 w-24 rounded-lg bg-slate-800/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
