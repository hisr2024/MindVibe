export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#d4a44c]/30 border-t-[#d4a44c]" />
        <p className="text-sm text-slate-400 animate-pulse">Preparing personal reflections...</p>
      </div>
    </div>
  )
}
