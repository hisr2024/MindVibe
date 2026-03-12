'use client'

/**
 * Nityam Sadhana Page — /sadhana
 * Immersive daily sacred practice experience.
 */

import dynamic from 'next/dynamic'

const SadhanaExperience = dynamic(
  () => import('./SadhanaExperience').then((mod) => mod.SadhanaExperience),
  { ssr: false }
)

export default function SadhanaPage() {
  return <SadhanaExperience />
}
