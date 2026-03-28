/**
 * MeditatorIcon — Sitting meditation figure silhouette (Profile tab)
 */

interface IconProps {
  width?: number
  height?: number
  className?: string
}

export function MeditatorIcon({ width = 24, height = 24, className = '' }: IconProps) {
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
      {/* Head */}
      <circle cx="12" cy="5" r="2.5" />
      {/* Body / torso */}
      <path d="M12 7.5v5" />
      {/* Crossed legs (lotus position) */}
      <path d="M7 18c1-2 3-3 5-3s4 1 5 3" />
      <path d="M6 20c1.5-1.5 3.5-2.5 6-2.5s4.5 1 6 2.5" />
      {/* Arms in meditation mudra */}
      <path d="M12 10c-2 1-4 2.5-5 4" />
      <path d="M12 10c2 1 4 2.5 5 4" />
      {/* Hands on knees */}
      <circle cx="7" cy="14.5" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="17" cy="14.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default MeditatorIcon
