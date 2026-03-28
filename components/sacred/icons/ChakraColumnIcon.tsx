/**
 * ChakraColumnIcon — Ascending chakra column (Journey tab)
 */

interface IconProps {
  width?: number
  height?: number
  className?: string
}

export function ChakraColumnIcon({ width = 24, height = 24, className = '' }: IconProps) {
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
      {/* Vertical spine */}
      <line x1="12" y1="22" x2="12" y2="3" strokeWidth="1" opacity="0.4" />
      {/* Muladhara (root) */}
      <circle cx="12" cy="20" r="2" />
      {/* Svadhisthana (sacral) */}
      <circle cx="12" cy="16.5" r="1.8" />
      {/* Manipura (solar plexus) */}
      <circle cx="12" cy="13" r="1.6" />
      {/* Anahata (heart) */}
      <circle cx="12" cy="9.5" r="1.5" />
      {/* Vishuddha (throat) */}
      <circle cx="12" cy="6.5" r="1.3" />
      {/* Ajna (third eye) */}
      <circle cx="12" cy="4" r="1" />
      {/* Sahasrara (crown) — rays */}
      <path d="M12 2l-.5-1M12 2l.5-1M12 2l-1-.5M12 2l1-.5" strokeWidth="1" />
    </svg>
  )
}

export default ChakraColumnIcon
