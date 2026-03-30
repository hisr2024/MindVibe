'use client'

/**
 * DharmaMirrorCard — Sakha's witness statement.
 * A left-accent bordered card that reflects back what Sakha sees.
 * Uses word-by-word reveal for the dharmic mirror text.
 */

import React from 'react'
import { MobileWordReveal } from '@/components/mobile/MobileWordReveal'
import type { KarmaCategory } from '../types'
import { CATEGORY_COLORS } from '../types'

interface DharmaMirrorCardProps {
  text: string
  category: KarmaCategory
}

export function DharmaMirrorCard({ text, category }: DharmaMirrorCardProps) {
  const color = CATEGORY_COLORS[category]

  return (
    <div
      style={{
        borderLeft: `2px solid ${color}66`,
        paddingLeft: 16,
        paddingRight: 4,
        position: 'relative',
      }}
    >
      {/* Category dot */}
      <div
        style={{
          position: 'absolute',
          left: -5,
          top: 6,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 8px ${color}66`,
        }}
      />
      <MobileWordReveal
        text={text}
        speed={65}
        className="leading-[1.85]"
        as="p"
      />
    </div>
  )
}
