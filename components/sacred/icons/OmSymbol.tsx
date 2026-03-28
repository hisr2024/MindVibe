/**
 * OmSymbol — Sacred OM (ॐ) SVG icon
 *
 * Path-based SVG suitable for stroke-dasharray animation.
 * Used in the SacredOMLoader and splash screen.
 */

interface OmSymbolProps {
  width?: number
  height?: number
  className?: string
  /** When true, applies stroke-dasharray animation class */
  animated?: boolean
}

export function OmSymbol({ width = 48, height = 48, className = '', animated = false }: OmSymbolProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M50 8c-4 0-7.5 2-9.5 5.5C38 17 37 21 37 26c0 6 2 11 5 15 3 3.5 6 5.5 10 6.5-2 3-5 5.5-9 7.5-5 2.5-10 3.5-15 3-4-.5-7-2-9-4.5-2-3-3-6-3-10 0-3 1-6 2.5-8.5 1.5-2 3.5-3.5 6-4.5l-2-5c-4 1.5-7 4-9 7.5C11 36 10 40 10 44c0 5 1.5 9.5 4.5 13 3 3.5 7 5.5 12 6 6 .5 12-1 17-4.5 4-3 7-6.5 9-10.5h.5c5 0 9.5-2 13-5.5 3.5-3.5 5-8 5-13 0-5.5-2-10-5.5-13.5C62 12.5 57 10.5 51.5 10L50 8zm2 7c3.5.5 6.5 2 9 4.5 2.5 3 3.5 6 3.5 10 0 4-1.5 7-4 9.5-2.5 2.5-5.5 3.5-9 3.5-1.5 0-3-.5-4-1 2-3.5 3-7.5 3-12 0-5-1-10-3.5-14.5h5zm-22 60c0 3 1 5.5 3 7.5 2 2.5 5 3.5 8 3.5 4 0 7-1.5 9.5-4l3 3.5 4-3.5-3.5-3.5c2-3 3-6.5 3-10.5H52c0 3-.5 5.5-2 7.5-1.5 2-3.5 3-6 3-1.5 0-3-.5-4-1.5-1-1.5-1.5-3-1.5-5 0-3 1-5.5 3-7.5 2-2.5 5-4 8.5-5l-1.5-5c-5 1.5-9 4-12 7.5-2.5 3-4 7-4 11z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        style={animated ? {
          strokeDasharray: 600,
          strokeDashoffset: 600,
          ['--om-path-length' as string]: '600',
        } : undefined}
      />
      {/* Chandrabindu (crescent + dot) */}
      <circle cx="58" cy="6" r="2.5" fill="currentColor" />
      <path
        d="M48 10c2-3 5-5 9-5s7 2 9 5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default OmSymbol
