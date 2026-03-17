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
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Conch shell outer body — wide opening tapering to a spiral tip */}
      <path
        d="M6 8c0-3 2.5-5.5 6-5.5S18 5 18 8c0 4-2 7-4 9.5-.6.8-1 1.5-1 2.5v1h-2v-1c0-1-.4-1.7-1-2.5C8 15 6 12 6 8z"
        fill={filled ? color : 'none'}
        fillOpacity={filled ? 0.15 : 0}
      />
      {/* Inner spiral — three concentric curves forming the sacred spiral */}
      <path
        d="M12 5.5c-2.2 0-3.8 1.8-3.8 3.8 0 1.5.8 2.7 2 3.5"
        fill="none"
      />
      <path
        d="M12 5.5c1.8 0 3 1.4 3 3 0 1.2-.7 2.2-1.7 2.8"
        fill="none"
      />
      <path
        d="M12 7.5c-.8 0-1.5.7-1.5 1.5s.5 1.3 1 1.5"
        fill="none"
      />
      {/* Ridged lines on the conch body */}
      <path d="M9.5 15.5c.8.6 1.5.8 2.5.8s1.7-.2 2.5-.8" fill="none" />
      <path d="M10 17.5c.6.4 1.2.5 2 .5s1.4-.1 2-.5" fill="none" />
      {/* Pointed tip / spire at the top */}
      <circle
        cx="12"
        cy="9"
        r="0.8"
        fill={color}
        stroke="none"
      />
    </svg>
  )
}

export default ShankhaIcon
