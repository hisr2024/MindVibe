'use client'

export type KarmaPlantStage = 'seed' | 'seedling' | 'sapling' | 'branching' | 'canopy'

export interface KarmaPlantProps {
  /** Current growth stage */
  stage: KarmaPlantStage
  /** Size of the SVG */
  size?: number
  /** Optional className */
  className?: string
  /** Whether to animate */
  animate?: boolean
}

/**
 * KarmaPlant SVG component with different growth states.
 *
 * Features:
 * - Five growth stages (seed, seedling, sapling, branching, canopy)
 * - Responsive sizing
 * - Optional pulse animation
 * - Accessibility attributes
 */
export function KarmaPlant({
  stage,
  size = 120,
  className = '',
  animate = true,
}: KarmaPlantProps) {
  const animateClass = animate && stage === 'canopy' ? 'animate-pulse' : ''

  const getStageSvg = () => {
    switch (stage) {
      case 'seed':
        return (
          <g>
            {/* Ground */}
            <ellipse cx="60" cy="100" rx="40" ry="10" fill="#8B7355" opacity="0.6" />
            {/* Seed */}
            <ellipse cx="60" cy="95" rx="10" ry="8" fill="#D4A574">
              <title>Seed</title>
            </ellipse>
          </g>
        )
      case 'seedling':
        return (
          <g>
            {/* Ground */}
            <ellipse cx="60" cy="100" rx="40" ry="10" fill="#8B7355" opacity="0.6" />
            {/* Stem */}
            <path d="M60 100 L60 75" stroke="#8B7355" strokeWidth="3" fill="none" />
            {/* First leaves */}
            <ellipse cx="55" cy="78" rx="6" ry="4" fill="#4ADE80" transform="rotate(-30, 55, 78)">
              <title>First leaves emerging</title>
            </ellipse>
            <ellipse cx="65" cy="78" rx="6" ry="4" fill="#4ADE80" transform="rotate(30, 65, 78)">
              <title>First leaves emerging</title>
            </ellipse>
            {/* Glow */}
            <circle cx="60" cy="80" r="15" fill="url(#seedlingGlow)" opacity="0.4" />
          </g>
        )
      case 'sapling':
        return (
          <g>
            {/* Ground */}
            <ellipse cx="60" cy="100" rx="40" ry="10" fill="#8B7355" opacity="0.6" />
            {/* Trunk */}
            <path d="M60 100 L60 55" stroke="#8B7355" strokeWidth="4" fill="none" />
            {/* Branches */}
            <path d="M60 70 L45 60" stroke="#8B7355" strokeWidth="2" fill="none" />
            <path d="M60 70 L75 60" stroke="#8B7355" strokeWidth="2" fill="none" />
            {/* Leaves */}
            <ellipse cx="45" cy="58" rx="10" ry="7" fill="#22C55E" transform="rotate(-20, 45, 58)" />
            <ellipse cx="75" cy="58" rx="10" ry="7" fill="#22C55E" transform="rotate(20, 75, 58)" />
            <ellipse cx="60" cy="50" rx="12" ry="8" fill="#4ADE80" />
            {/* Glow */}
            <circle cx="60" cy="60" r="25" fill="url(#saplingGlow)" opacity="0.3" />
          </g>
        )
      case 'branching':
        return (
          <g>
            {/* Ground */}
            <ellipse cx="60" cy="100" rx="40" ry="10" fill="#8B7355" opacity="0.6" />
            {/* Trunk */}
            <path d="M60 100 L60 45" stroke="#8B7355" strokeWidth="5" fill="none" />
            {/* Main branches */}
            <path d="M60 65 L40 55" stroke="#8B7355" strokeWidth="3" fill="none" />
            <path d="M60 65 L80 55" stroke="#8B7355" strokeWidth="3" fill="none" />
            <path d="M60 55 L50 40" stroke="#8B7355" strokeWidth="2" fill="none" />
            <path d="M60 55 L70 40" stroke="#8B7355" strokeWidth="2" fill="none" />
            {/* Leaf clusters */}
            <ellipse cx="40" cy="52" rx="12" ry="9" fill="#22C55E" transform="rotate(-15, 40, 52)" />
            <ellipse cx="80" cy="52" rx="12" ry="9" fill="#22C55E" transform="rotate(15, 80, 52)" />
            <ellipse cx="50" cy="38" rx="10" ry="8" fill="#4ADE80" transform="rotate(-10, 50, 38)" />
            <ellipse cx="70" cy="38" rx="10" ry="8" fill="#4ADE80" transform="rotate(10, 70, 38)" />
            <ellipse cx="60" cy="35" rx="14" ry="10" fill="#34D399" />
            {/* Glow */}
            <circle cx="60" cy="50" r="35" fill="url(#branchingGlow)" opacity="0.25" />
          </g>
        )
      case 'canopy':
      default:
        return (
          <g className={animateClass}>
            {/* Ground */}
            <ellipse cx="60" cy="100" rx="45" ry="12" fill="#8B7355" opacity="0.6" />
            {/* Trunk */}
            <path d="M60 100 L60 40" stroke="#8B7355" strokeWidth="6" fill="none" />
            {/* Major branches */}
            <path d="M60 60 L35 45" stroke="#8B7355" strokeWidth="4" fill="none" />
            <path d="M60 60 L85 45" stroke="#8B7355" strokeWidth="4" fill="none" />
            <path d="M60 50 L45 30" stroke="#8B7355" strokeWidth="3" fill="none" />
            <path d="M60 50 L75 30" stroke="#8B7355" strokeWidth="3" fill="none" />
            {/* Full canopy */}
            <ellipse cx="35" cy="42" rx="15" ry="12" fill="#16A34A" transform="rotate(-20, 35, 42)" />
            <ellipse cx="85" cy="42" rx="15" ry="12" fill="#16A34A" transform="rotate(20, 85, 42)" />
            <ellipse cx="45" cy="28" rx="14" ry="11" fill="#22C55E" transform="rotate(-10, 45, 28)" />
            <ellipse cx="75" cy="28" rx="14" ry="11" fill="#22C55E" transform="rotate(10, 75, 28)" />
            <ellipse cx="60" cy="25" rx="18" ry="14" fill="#4ADE80" />
            <ellipse cx="60" cy="18" rx="12" ry="10" fill="#34D399" />
            {/* Fruit/flowers */}
            <circle cx="42" cy="35" r="3" fill="#F97316" />
            <circle cx="78" cy="35" r="3" fill="#F97316" />
            <circle cx="60" cy="22" r="3" fill="#FBBF24" />
            {/* Glow */}
            <circle cx="60" cy="40" r="45" fill="url(#canopyGlow)" opacity="0.2" />
          </g>
        )
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label={`Karma plant at ${stage} stage`}
    >
      <title>Karma Plant - {stage} stage</title>
      <defs>
        <radialGradient id="seedlingGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#4ADE80" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="saplingGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22C55E" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="branchingGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F97316" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="canopyGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
        </radialGradient>
      </defs>
      {getStageSvg()}
    </svg>
  )
}

export default KarmaPlant
