'use client'

export type KarmaFootprintState =
  | 'strong_positive'
  | 'mild_positive'
  | 'neutral'
  | 'mild_heavy'
  | 'heavy'

export interface KarmaPlantProps {
  /** Current karma footprint state */
  state: KarmaFootprintState
  /** Size of the plant visualization */
  size?: 'sm' | 'md' | 'lg'
  /** Additional className */
  className?: string
}

const stateConfig: Record<
  KarmaFootprintState,
  {
    label: string
    color: string
    glowColor: string
    leafCount: number
    stemHeight: number
  }
> = {
  strong_positive: {
    label: 'Flourishing',
    color: '#10B981', // green
    glowColor: 'rgba(16, 185, 129, 0.3)',
    leafCount: 5,
    stemHeight: 80,
  },
  mild_positive: {
    label: 'Growing',
    color: '#34D399', // emerald
    glowColor: 'rgba(52, 211, 153, 0.25)',
    leafCount: 4,
    stemHeight: 65,
  },
  neutral: {
    label: 'Steady',
    color: '#F59E0B', // amber
    glowColor: 'rgba(245, 158, 11, 0.2)',
    leafCount: 3,
    stemHeight: 50,
  },
  mild_heavy: {
    label: 'Wilting',
    color: '#F97316', // orange
    glowColor: 'rgba(249, 115, 22, 0.2)',
    leafCount: 2,
    stemHeight: 40,
  },
  heavy: {
    label: 'Needs Care',
    color: '#EF4444', // red
    glowColor: 'rgba(239, 68, 68, 0.2)',
    leafCount: 1,
    stemHeight: 30,
  },
}

const sizeConfig = {
  sm: { width: 80, height: 100 },
  md: { width: 120, height: 150 },
  lg: { width: 180, height: 220 },
}

/**
 * KarmaPlant component - visual representation of karma footprint state.
 * 
 * Features:
 * - 5 distinct visual states
 * - Animated transitions between states
 * - SVG-based lightweight rendering
 * - Accessible with ARIA labels
 */
export function KarmaPlant({
  state,
  size = 'md',
  className = '',
}: KarmaPlantProps) {
  const config = stateConfig[state]
  const dimensions = sizeConfig[size]

  const renderLeaves = () => {
    const leaves = []
    const leafPositions = [
      { x: 0, y: -15, angle: 45 },
      { x: 0, y: -30, angle: -45 },
      { x: 0, y: -45, angle: 35 },
      { x: 0, y: -55, angle: -35 },
      { x: 0, y: -70, angle: 0 },
    ]

    for (let i = 0; i < config.leafCount; i++) {
      const pos = leafPositions[i]
      const scale = 1 - (i * 0.1)
      leaves.push(
        <ellipse
          key={i}
          cx={dimensions.width / 2 + pos.x}
          cy={dimensions.height - 20 + pos.y}
          rx={12 * scale}
          ry={18 * scale}
          fill={config.color}
          opacity={0.8 - (i * 0.1)}
          transform={`rotate(${pos.angle}, ${dimensions.width / 2 + pos.x}, ${dimensions.height - 20 + pos.y})`}
          style={{ transition: 'all 0.5s ease' }}
        />
      )
    }
    return leaves
  }

  return (
    <div
      className={`inline-flex flex-col items-center ${className}`}
      role="img"
      aria-label={`Karma plant showing ${config.label} state`}
    >
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="drop-shadow-lg"
      >
        {/* Glow effect */}
        <defs>
          <radialGradient id={`glow-${state}`} cx="50%" cy="30%" r="50%">
            <stop offset="0%" stopColor={config.glowColor} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle
          cx={dimensions.width / 2}
          cy={dimensions.height / 3}
          r={dimensions.width / 3}
          fill={`url(#glow-${state})`}
        />

        {/* Pot */}
        <path
          d={`M${dimensions.width / 2 - 20} ${dimensions.height - 10} 
              L${dimensions.width / 2 - 25} ${dimensions.height} 
              L${dimensions.width / 2 + 25} ${dimensions.height} 
              L${dimensions.width / 2 + 20} ${dimensions.height - 10} Z`}
          fill="#6B7280"
          opacity={0.8}
        />
        <rect
          x={dimensions.width / 2 - 22}
          y={dimensions.height - 15}
          width={44}
          height={6}
          rx={2}
          fill="#4B5563"
        />

        {/* Stem */}
        <line
          x1={dimensions.width / 2}
          y1={dimensions.height - 15}
          x2={dimensions.width / 2}
          y2={dimensions.height - 15 - config.stemHeight}
          stroke={config.color}
          strokeWidth={4}
          strokeLinecap="round"
          style={{ transition: 'all 0.5s ease' }}
        />

        {/* Leaves */}
        {renderLeaves()}
      </svg>

      <span
        className="mt-2 text-xs font-semibold uppercase tracking-wide"
        style={{ color: config.color }}
      >
        {config.label}
      </span>
    </div>
  )
}

export default KarmaPlant
