/**
 * ManuscriptIcon — Open Sanskrit manuscript (Shlokas tab)
 */

interface IconProps {
  width?: number
  height?: number
  className?: string
}

export function ManuscriptIcon({ width = 24, height = 24, className = '' }: IconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Left scroll curl */}
      <path d="M3 5c0-1.5 1-2.5 2.5-2.5S8 3.5 8 5v14c0 1.5-1 2.5-2.5 2.5S3 20.5 3 19V5z" />
      {/* Right scroll curl */}
      <path d="M21 5c0-1.5-1-2.5-2.5-2.5S16 3.5 16 5v14c0 1.5 1 2.5 2.5 2.5S21 20.5 21 19V5z" />
      {/* Manuscript body */}
      <rect x="6" y="4" width="12" height="16" rx="1" />
      {/* Text lines (Sanskrit style) */}
      <line x1="8.5" y1="8" x2="15.5" y2="8" />
      <line x1="8.5" y1="11" x2="15.5" y2="11" />
      <line x1="8.5" y1="14" x2="13" y2="14" />
      {/* Top ornament line (Devanagari shirorekha) */}
      <line x1="8.5" y1="7" x2="15.5" y2="7" strokeWidth="0.75" />
      <line x1="8.5" y1="10" x2="15.5" y2="10" strokeWidth="0.75" />
    </svg>
  )
}

export default ManuscriptIcon
