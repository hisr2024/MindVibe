export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500/30 border-t-orange-500" />
        <p className="text-sm text-slate-400 animate-pulse">Opening the wisdom rooms...</p>
      </div>
    </div>
  )
}
