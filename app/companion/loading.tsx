export default function CompanionLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      {/* Companion header skeleton */}
      <div className="border-b border-slate-800/50 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-gradient-to-br from-slate-800 to-slate-700" />
          <div className="space-y-1.5">
            <div className="h-4 w-36 animate-pulse rounded bg-slate-800" />
            <div className="h-3 w-52 animate-pulse rounded bg-slate-800/50" />
          </div>
        </div>
      </div>

      {/* Companion conversation skeleton */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Welcome message */}
          <div className="flex gap-3">
            <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-orange-500/20" />
            <div className="max-w-[80%] space-y-2 rounded-2xl rounded-tl-sm bg-slate-800/40 p-4">
              <div className="h-3 w-60 animate-pulse rounded bg-slate-700/60" />
              <div className="h-3 w-72 animate-pulse rounded bg-slate-700/60" />
              <div className="h-3 w-44 animate-pulse rounded bg-slate-700/60" />
            </div>
          </div>

          {/* Suggestion chips skeleton */}
          <div className="flex flex-wrap gap-2 pl-11">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 w-32 animate-pulse rounded-full bg-slate-800/50" />
            ))}
          </div>
        </div>
      </div>

      {/* Input area skeleton */}
      <div className="border-t border-slate-800/50 px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="h-12 animate-pulse rounded-xl bg-slate-800/40" />
        </div>
      </div>
    </div>
  )
}
