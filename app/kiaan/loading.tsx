export default function KiaanLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      {/* Chat header skeleton */}
      <div className="border-b border-slate-800/50 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-slate-800" />
          <div className="space-y-1.5">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-800" />
            <div className="h-3 w-48 animate-pulse rounded bg-slate-800/50" />
          </div>
        </div>
      </div>

      {/* Chat messages skeleton */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* AI message */}
          <div className="flex gap-3">
            <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-slate-800" />
            <div className="max-w-[75%] space-y-2 rounded-2xl rounded-tl-sm bg-slate-800/40 p-4">
              <div className="h-3 w-64 animate-pulse rounded bg-slate-700/60" />
              <div className="h-3 w-48 animate-pulse rounded bg-slate-700/60" />
              <div className="h-3 w-56 animate-pulse rounded bg-slate-700/60" />
            </div>
          </div>

          {/* User message */}
          <div className="flex justify-end">
            <div className="max-w-[75%] space-y-2 rounded-2xl rounded-tr-sm bg-orange-500/10 p-4">
              <div className="h-3 w-40 animate-pulse rounded bg-orange-500/20" />
            </div>
          </div>

          {/* AI message */}
          <div className="flex gap-3">
            <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-slate-800" />
            <div className="max-w-[75%] space-y-2 rounded-2xl rounded-tl-sm bg-slate-800/40 p-4">
              <div className="h-3 w-72 animate-pulse rounded bg-slate-700/60" />
              <div className="h-3 w-52 animate-pulse rounded bg-slate-700/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Chat input skeleton */}
      <div className="border-t border-slate-800/50 px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="h-12 animate-pulse rounded-xl bg-slate-800/40" />
        </div>
      </div>
    </div>
  )
}
