/**
 * LotusIcon — 8-petal sacred lotus for general use
 */

interface IconProps {
  width?: number
  height?: number
  className?: string
}

export function LotusIcon({ width = 24, height = 24, className = '' }: IconProps) {
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
      {/* Center petal (up) */}
      <path d="M12 4c-1 3-1.5 5.5-1.5 8S11 17 12 19c1-2 1.5-4.5 1.5-7S13 7 12 4z" />
      {/* Left petal */}
      <path d="M7 6c-.5 3 0 6 1.5 8.5 1 1.5 2 2.5 3.5 3.5-2-1-4.5-1.5-6.5-1-1.5.5-2.5 1-3 2 .5-3 2-5.5 4.5-8 1.5-1.5 3-3 4.5-5z" />
      {/* Right petal */}
      <path d="M17 6c.5 3 0 6-1.5 8.5-1 1.5-2 2.5-3.5 3.5 2-1 4.5-1.5 6.5-1 1.5.5 2.5 1 3 2-.5-3-2-5.5-4.5-8-1.5-1.5-3-3-4.5-5z" />
      {/* Water base */}
      <path d="M4 20c2-.5 4.5-.5 8-.5s6 0 8 .5" />
    </svg>
  )
}

export default LotusIcon
