'use client'

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { KarmaScore, DimensionKey } from '@/types/karmalytix.types'
import { DIMENSIONS } from '@/types/karmalytix.types'

interface Props {
  score: KarmaScore
}

const RADAR_DATA_KEYS: { dim: string; sa: string; key: DimensionKey }[] = [
  { dim: 'Emotional Balance', sa: '\u092D\u093E\u0935\u0928\u093E', key: 'emotional_balance' },
  { dim: 'Spiritual Growth', sa: '\u0935\u093F\u0915\u093E\u0938', key: 'spiritual_growth' },
  { dim: 'Consistency', sa: '\u0928\u093F\u092F\u092E', key: 'consistency' },
  { dim: 'Self-Awareness', sa: '\u091C\u094D\u091E\u093E\u0928', key: 'self_awareness' },
  { dim: 'Wisdom', sa: '\u092C\u094B\u0927', key: 'wisdom_integration' },
]

/* eslint-disable @typescript-eslint/no-explicit-any */
const CustomTick = ({ x, y, payload }: any) => {
  const item = RADAR_DATA_KEYS.find((d) => d.dim === payload.value)
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={-6}
        textAnchor="middle"
        style={{ fontFamily: 'Noto Sans Devanagari', fontSize: 11, fill: '#D4A017' }}
      >
        {item?.sa}
      </text>
      <text
        x={0}
        y={10}
        textAnchor="middle"
        style={{ fontFamily: 'Outfit', fontSize: 10, fill: '#B8AE98' }}
      >
        {payload.value}
      </text>
    </g>
  )
}

export const KarmaScoreRadar: React.FC<Props> = ({ score }) => {
  const data = RADAR_DATA_KEYS.map((item) => ({
    dim: item.dim,
    v: score[item.key] as number,
    fill: 100,
  }))

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: 60,
            fontWeight: 300,
            color: '#F0C040',
          }}
        >
          {score.overall_score}
        </div>
        <div
          style={{
            fontFamily: 'Outfit',
            fontSize: 10,
            color: '#6B6355',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          Overall Karma Score
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(212,160,23,0.15)" />
          <PolarAngleAxis dataKey="dim" tick={<CustomTick />} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: 'rgba(107,99,85,0.5)', fontSize: 10 }}
            tickCount={4}
          />
          <Radar
            name="Karma"
            dataKey="v"
            stroke="#D4A017"
            fill="rgba(212,160,23,0.12)"
            strokeWidth={2}
            dot={{ fill: '#D4A017', r: 4, strokeWidth: 2 }}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(17,20,53,0.98)',
              border: '1px solid rgba(212,160,23,0.3)',
              borderRadius: 12,
              fontFamily: 'Outfit',
              color: '#EDE8DC',
            }}
            formatter={(v: number) => [`${v}/100`, 'Score']}
          />
        </RadarChart>
      </ResponsiveContainer>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(Object.entries(DIMENSIONS) as [DimensionKey, (typeof DIMENSIONS)[DimensionKey]][]).map(
          ([key, dim]) => {
            const val = (score[key] as number) ?? 0
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 140,
                    fontSize: 12,
                    fontFamily: 'Outfit',
                    color: '#B8AE98',
                    flexShrink: 0,
                  }}
                >
                  {dim.en}
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 4,
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${val}%`,
                      background: dim.color,
                      borderRadius: 2,
                      transition: 'width 1s ease-out',
                    }}
                  />
                </div>
                <div
                  style={{
                    width: 28,
                    fontSize: 11,
                    fontFamily: 'Outfit',
                    textAlign: 'right',
                    color: dim.color,
                  }}
                >
                  {val}
                </div>
              </div>
            )
          }
        )}
      </div>
    </div>
  )
}
