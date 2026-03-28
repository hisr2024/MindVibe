/**
 * SacredDivider — Golden gradient horizontal divider
 *
 * A sacred golden rule (transparent → gold → transparent)
 */

interface SacredDividerProps {
  className?: string
}

export function SacredDivider({ className = '' }: SacredDividerProps) {
  return <div className={`sacred-divider ${className}`} role="separator" aria-hidden="true" />
}

export default SacredDivider
