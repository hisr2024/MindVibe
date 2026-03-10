/**
 * SacredEffects — Scene-level divine effects
 *
 * Floating lotus petals, distant camp fires,
 * and sacred energy rings that enhance the battlefield atmosphere.
 */

'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PETAL_COUNT = 100

function generatePetalPositions() {
  const pos = new Float32Array(PETAL_COUNT * 3)
  for (let i = 0; i < PETAL_COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 40
    pos[i * 3 + 1] = 2 + Math.random() * 8
    pos[i * 3 + 2] = (Math.random() - 0.5) * 40
  }
  return pos
}

function LotusPetals() {
  const pointsRef = useRef<THREE.Points>(null)

  const [positions] = useState(generatePetalPositions)

  useFrame((state) => {
    if (!pointsRef.current) return
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const arr = posAttr.array as Float32Array
    const time = state.clock.elapsedTime

    for (let i = 0; i < PETAL_COUNT; i++) {
      arr[i * 3] += Math.sin(time * 0.3 + i) * 0.005
      arr[i * 3 + 1] -= 0.003
      arr[i * 3 + 2] += Math.cos(time * 0.2 + i * 0.5) * 0.003

      if (arr[i * 3 + 1] < 0) {
        arr[i * 3 + 1] = 8 + Math.random() * 4
        arr[i * 3] = (Math.random() - 0.5) * 40
        arr[i * 3 + 2] = (Math.random() - 0.5) * 40
      }
    }
    posAttr.needsUpdate = true
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
        color="#FFB6C1"
        size={0.15}
        transparent
        opacity={0.4}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

function CampFires() {
  return (
    <group>
      {/* Distant camp fire lights on both sides */}
      {[-80, -70, -90, 80, 70, 90].map((x, i) => {
        const z = (i % 3 - 1) * 25
        return (
          <pointLight
            key={i}
            position={[x, 1, z]}
            color="#FF6600"
            intensity={0.3}
            distance={15}
            decay={2}
          />
        )
      })}
    </group>
  )
}

export default function SacredEffects() {
  return (
    <group>
      <LotusPetals />
      <CampFires />
    </group>
  )
}
