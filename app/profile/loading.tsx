export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Profile header skeleton */}
        <div className="flex flex-col items-center gap-4">
          <div className="h-24 w-24 animate-pulse rounded-full bg-slate-800" />
          <div className="space-y-2 text-center">
            <div className="h-6 w-40 animate-pulse rounded-lg bg-slate-800" />
            <div className="h-4 w-56 animate-pulse rounded bg-slate-800/50" />
          </div>
        </div>

        {/* Stats row skeleton */}
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-800/50 bg-slate-900/50 p-4 text-center">
              <div className="mx-auto mb-2 h-6 w-12 rounded bg-slate-800" />
              <div className="mx-auto h-3 w-20 rounded bg-slate-800/40" />
            </div>
          ))}
        </div>

        {/* Profile sections skeleton */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-slate-800/50 bg-slate-900/50 p-5">
            <div className="mb-4 h-5 w-36 rounded bg-slate-800" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded bg-slate-800/30" />
              <div className="h-4 w-3/4 rounded bg-slate-800/30" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
