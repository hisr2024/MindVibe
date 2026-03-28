/**
 * LotusSpeechIcon — Overlapping lotus petals (Chat tab)
 */

interface IconProps {
  width?: number
  height?: number
  className?: string
}

export function LotusSpeechIcon({ width = 24, height = 24, className = '' }: IconProps) {
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
      {/* Center petal */}
      <path d="M12 4c-1.5 3-2 6-2 9s.5 5 2 7c1.5-2 2-4 2-7s-.5-6-2-9z" />
      {/* Left petal */}
      <path d="M7 7c0 4 1.5 7 3.5 9-1-1-3-1.5-5-1.5-2.5 0-3.5 1-3.5 1 0-3 1.5-6 5-8.5z" />
      {/* Right petal */}
      <path d="M17 7c-3.5 2.5-5 5.5-5 8.5 0 0-1-1-3.5-1 2 0 4-.5 5-1.5C15.5 14 17 11 17 7z" />
      {/* Outer left petal */}
      <path d="M4.5 10c-.5 3 0 5.5 1.5 7.5" />
      {/* Outer right petal */}
      <path d="M19.5 10c.5 3 0 5.5-1.5 7.5" />
      {/* Speech tail */}
      <path d="M8 20c-2 1.5-4 2-4 2 1.5-1 2-2.5 2-4" />
    </svg>
  )
}

export default LotusSpeechIcon
