export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Page header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-36 animate-pulse rounded-lg bg-slate-800" />
          <div className="h-4 w-72 animate-pulse rounded bg-slate-800/60" />
        </div>

        {/* Settings sections skeleton */}
        {['Notifications', 'Appearance', 'Language', 'Privacy'].map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-slate-800/50 bg-slate-900/50 p-6">
            <div className="mb-5 h-5 w-32 rounded bg-slate-800" />
            <div className="space-y-5">
              {Array.from({ length: 3 }).map((__, j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="h-4 w-36 rounded bg-slate-800/60" />
                    <div className="h-3 w-52 rounded bg-slate-800/30" />
                  </div>
                  <div className="h-6 w-11 rounded-full bg-slate-800/50" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
