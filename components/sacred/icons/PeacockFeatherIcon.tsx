/**
 * PeacockFeatherIcon — Simplified peacock feather for share actions
 */

interface IconProps {
  width?: number
  height?: number
  className?: string
}

export function PeacockFeatherIcon({ width = 24, height = 24, className = '' }: IconProps) {
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
      {/* Feather stem */}
      <path d="M12 22c0-6 0-12 0-18" strokeWidth="1" />
      {/* Eye pattern (center) */}
      <ellipse cx="12" cy="9" rx="3" ry="5" />
      <ellipse cx="12" cy="9" rx="1.5" ry="3" />
      <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
      {/* Left barbs */}
      <path d="M9 9c-3-1-5 0-6 2" />
      <path d="M9 7c-2-2-5-2-7 0" />
      <path d="M10 12c-3 0-5 1-6 3" />
      {/* Right barbs */}
      <path d="M15 9c3-1 5 0 6 2" />
      <path d="M15 7c2-2 5-2 7 0" />
      <path d="M14 12c3 0 5 1 6 3" />
    </svg>
  )
}

export default PeacockFeatherIcon
