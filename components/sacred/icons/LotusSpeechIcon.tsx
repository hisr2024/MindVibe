/**
 * LotusSpeechIcon — Sacred speech bubble with lotus accent (Chat tab)
 *
 * A clearly recognizable chat/conversation icon that reads well at 22px.
 * Combines a rounded speech bubble silhouette with a small 3-petal lotus
 * inside to maintain the sacred Kiaanverse aesthetic.
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
      {/* Speech bubble outline */}
      <path d="M21 12c0 4.418-4.03 8-9 8-1.4 0-2.73-.25-3.91-.7L3 21l1.3-3.9C3.48 15.65 3 14.37 3 13c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      {/* Center lotus petal (upward) */}
      <path d="M12 9c-.6 1.2-.8 2.5-.6 3.8.4-1.2 1-2.3 1.8-3.2-.4-.3-.8-.5-1.2-.6z" strokeWidth="1.2" />
      <path d="M12 9c.6 1.2.8 2.5.6 3.8-.4-1.2-1-2.3-1.8-3.2.4-.3.8-.5 1.2-.6z" strokeWidth="1.2" />
      {/* Left petal */}
      <path d="M9.5 11.5c.8.5 1.5 1.2 2 2-.3-.9-.3-1.9 0-2.8-.8.1-1.5.4-2 .8z" strokeWidth="1.2" />
      {/* Right petal */}
      <path d="M14.5 11.5c-.8.5-1.5 1.2-2 2 .3-.9.3-1.9 0-2.8.8.1 1.5.4 2 .8z" strokeWidth="1.2" />
      {/* Small dot center */}
      <circle cx="12" cy="12.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default LotusSpeechIcon
