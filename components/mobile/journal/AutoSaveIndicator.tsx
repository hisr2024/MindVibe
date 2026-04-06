'use client'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const CONFIG: Record<SaveState, { color: string; text: string; dot: string }> = {
  idle: { color: '#6B6355', text: '', dot: '#6B6355' },
  saving: { color: '#D4A017', text: 'Saving…', dot: '#D4A017' },
  saved: { color: '#6EE7B7', text: 'Saved', dot: '#6EE7B7' },
  error: { color: '#FCA5A5', text: 'Saved offline', dot: '#EF4444' },
}

export const AutoSaveIndicator: React.FC<{ state: SaveState }> = ({ state }) => {
  if (state === 'idle') return null
  const c = CONFIG[state]
  return (
    <div
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 10,
        color: c.color,
        fontFamily: 'Outfit, sans-serif',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: c.dot,
          display: 'inline-block',
          animation: state === 'saving' ? 'pulse 1s ease-in-out infinite' : 'none',
        }}
      />
      {c.text}
    </div>
  )
}
