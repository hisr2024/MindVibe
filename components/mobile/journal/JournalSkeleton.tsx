'use client'

export const JournalSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        style={{
          height: 110,
          borderRadius: 14,
          background:
            'linear-gradient(90deg, rgba(22,26,66,0.6) 0%, rgba(22,26,66,0.9) 50%, rgba(22,26,66,0.6) 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.6s ease-in-out infinite',
        }}
      />
    ))}
  </div>
)
