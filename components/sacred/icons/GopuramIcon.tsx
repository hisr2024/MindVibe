/**
 * GopuramIcon — Temple tower silhouette for Home tab
 */

interface IconProps {
  width?: number
  height?: number
  className?: string
}

export function GopuramIcon({ width = 24, height = 24, className = '' }: IconProps) {
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
      {/* Base platform */}
      <path d="M3 22h18" />
      <path d="M5 22v-6h14v6" />
      {/* Middle tier */}
      <path d="M7 16v-4h10v4" />
      {/* Upper tier */}
      <path d="M8.5 12V9h7v3" />
      {/* Top tier */}
      <path d="M10 9V7h4v2" />
      {/* Kalash (pinnacle) */}
      <path d="M12 7V3" />
      <circle cx="12" cy="2.5" r="1" fill="currentColor" stroke="none" />
      {/* Doorway */}
      <path d="M10 22v-3a2 2 0 0 1 4 0v3" />
    </svg>
  )
}

export default GopuramIcon
