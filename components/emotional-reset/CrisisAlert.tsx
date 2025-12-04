'use client'

interface CrisisAlertProps {
  crisisResponse: string
  onAcknowledge: () => void
  onCloseSession: () => void
  className?: string
}

/**
 * Crisis Alert Modal
 * Shows safety resources when crisis is detected during the emotional reset flow
 */
export function CrisisAlert({
  crisisResponse,
  onAcknowledge,
  onCloseSession,
  className = '',
}: CrisisAlertProps) {
  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm ${className}`}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="crisis-alert-title"
      aria-describedby="crisis-alert-description"
    >
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-red-500/30 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-[0_20px_60px_rgba(239,68,68,0.2)]">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
            <span className="text-2xl">🆘</span>
          </div>
          <div>
            <h3 
              id="crisis-alert-title"
              className="text-lg font-semibold text-red-400"
            >
              Your Safety Matters
            </h3>
            <p className="text-xs text-red-300/70">
              We care about your well-being
            </p>
          </div>
        </div>

        {/* Crisis Response Content */}
        <div 
          id="crisis-alert-description"
          className="rounded-xl border border-red-500/20 bg-red-950/30 p-4"
        >
          <p className="whitespace-pre-wrap leading-relaxed text-orange-100/90">
            {crisisResponse}
          </p>
        </div>

        {/* Emergency Resources */}
        <div className="space-y-2 rounded-xl border border-orange-500/20 bg-black/40 p-4">
          <p className="text-sm font-medium text-orange-100">
            If you need immediate support:
          </p>
          <ul className="space-y-1.5 text-sm text-orange-100/80">
            <li className="flex items-center gap-2">
              <span className="text-orange-400">📞</span>
              <span>National Crisis Helpline: <strong className="text-orange-50">988</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-orange-400">💬</span>
              <span>Crisis Text Line: Text <strong className="text-orange-50">HOME</strong> to 741741</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-orange-400">🌍</span>
              <span>International: <strong className="text-orange-50">befrienders.org</strong></span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onAcknowledge}
            className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 font-medium text-orange-50 transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            I Understand
          </button>
          <button
            onClick={onCloseSession}
            className="flex-1 rounded-xl border border-red-500/30 bg-red-500/20 px-4 py-2.5 font-medium text-red-400 transition hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Close Session
          </button>
        </div>
      </div>
    </div>
  )
}

export default CrisisAlert
