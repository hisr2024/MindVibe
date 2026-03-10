/**
 * CosmicParticles3D — 3D sacred particle system
 *
 * Golden sparkles orbiting around Krishna in spiral patterns.
 * Size/brightness pulses with audio playback.
 */

'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGitaVRStore } from '@/stores/gitaVRStore'

const PARTICLE_COUNT = 500

export default function CosmicParticles3D() {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.PointsMaterial>(null)
  const audioPlaying = useGitaVRStore((s) => s.audioPlaying)

  const { positions, initialData } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3)
    const data = new Float32Array(PARTICLE_COUNT * 3) // radius, angle, speed

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = 2 + Math.random() * 6
      const angle = Math.random() * Math.PI * 2
      const height = (Math.random() - 0.3) * 5

      pos[i * 3] = Math.cos(angle) * radius
      pos[i * 3 + 1] = height + 1.5
      pos[i * 3 + 2] = Math.sin(angle) * radius

      data[i * 3] = radius
      data[i * 3 + 1] = angle
      data[i * 3 + 2] = 0.1 + Math.random() * 0.3 // orbit speed
    }

    return { positions: pos, initialData: data }
  }, [])

  useFrame((state) => {
    if (!pointsRef.current) return

    const time = state.clock.elapsedTime
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const arr = posAttr.array as Float32Array

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = initialData[i * 3]
      const baseAngle = initialData[i * 3 + 1]
      const speed = initialData[i * 3 + 2]

      const angle = baseAngle + time * speed
      const spiralOffset = Math.sin(time * 0.5 + i * 0.1) * 0.5

      arr[i * 3] = Math.cos(angle) * (radius + spiralOffset)
      arr[i * 3 + 1] += Math.sin(time * 0.3 + i) * 0.002
      arr[i * 3 + 2] = Math.sin(angle) * (radius + spiralOffset)

      // Keep height in range
      if (arr[i * 3 + 1] > 8) arr[i * 3 + 1] = -1
      if (arr[i * 3 + 1] < -1) arr[i * 3 + 1] = 8
    }
    posAttr.needsUpdate = true

    // Pulse size with audio
    if (materialRef.current) {
      const targetSize = audioPlaying ? 0.08 + Math.sin(time * 4) * 0.03 : 0.05
      materialRef.current.size = THREE.MathUtils.lerp(materialRef.current.size, targetSize, 0.1)
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        color="#FFD700"
        size={0.05}
        transparent
        opacity={0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}
