/**
 * ShankhaIcon - Sacred Conch Shell (Shankha) SVG Icon
 *
 * The Shankha (conch shell) is a sacred symbol in Hindu tradition,
 * representing the primordial sound of creation (Om). Krishna's conch
 * "Panchajanya" announces divine presence and awakening.
 *
 * Used as the microphone/voice activation symbol for KIAAN Voice,
 * replacing the standard microphone icon to reflect the spiritual
 * nature of voice interaction with KIAAN.
 *
 * The Shankha also serves as KIAAN's always-awake indicator -
 * when KIAAN is listening, the Shankha glows and resonates.
 */

'use client'

interface ShankhaIconProps {
  /** Width and height in pixels */
  size?: number
  /** SVG stroke color */
  color?: string
  /** SVG stroke width */
  strokeWidth?: number
  /** Additional CSS class names */
  className?: string
  /** Whether the icon should have a filled style (active/listening state) */
  filled?: boolean
}

export function ShankhaIcon({
  size = 24,
  color = 'currentColor',
  strokeWidth = 1.8,
  className = '',
  filled = false,
}: ShankhaIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Conch shell body - spiral form */}
      <path
        d="M12 2C8.5 2 5 5 5 9c0 2.5 1 4.5 2.5 6 1 1 1.5 2.5 1.5 4v1h6v-1c0-1.5.5-3 1.5-4C18 13.5 19 11.5 19 9c0-4-3.5-7-7-7z"
        fillOpacity={filled ? 0.15 : 0}
      />
      {/* Inner spiral - the sacred geometry of the conch */}
      <path
        d="M12 5c-2 0-4 1.8-4 4.5 0 1.5.7 2.8 1.8 3.7"
        fill="none"
      />
      <path
        d="M12 5c1.5 0 3 1.2 3 3 0 1.2-.8 2.2-1.8 2.7"
        fill="none"
      />
      {/* Sound wave emanation lines */}
      <path
        d="M9 19h6"
        fill="none"
      />
      <path
        d="M10 22h4"
        fill="none"
      />
      {/* Sacred resonance dot at center */}
      <circle
        cx="12"
        cy="9"
        r="1"
        fill={color}
        stroke="none"
      />
    </svg>
  )
}

export default ShankhaIcon
