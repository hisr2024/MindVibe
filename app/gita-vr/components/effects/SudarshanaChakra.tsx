/**
 * SudarshanaChakra — Krishna's divine spinning disc
 *
 * Spinning torus with golden fire-like emissive material,
 * orbiting above Krishna's right hand. Visible during blessing state.
 */

'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGitaVRStore } from '@/stores/gitaVRStore'

export default function SudarshanaChakra() {
  const groupRef = useRef<THREE.Group>(null)
  const krishnaState = useGitaVRStore((s) => s.krishnaState)

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.z += 0.05
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.2

    // Fade in/out based on state
    const visible = krishnaState === 'blessing' || krishnaState === 'speaking'
    const targetScale = visible ? 1 : 0
    groupRef.current.scale.setScalar(
      THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.05)
    )
  })

  return (
    <group ref={groupRef} position={[0.9, 2.5, 0.3]} scale={0}>
      {/* Main disc */}
      <mesh>
        <torusGeometry args={[0.2, 0.03, 8, 32]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FF8C00"
          emissiveIntensity={1.5}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      {/* Inner ring */}
      <mesh>
        <torusGeometry args={[0.12, 0.015, 6, 24]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#FFD700"
          emissiveIntensity={1}
        />
      </mesh>
      {/* Spokes */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.16, Math.sin(angle) * 0.16, 0]}>
            <boxGeometry args={[0.08, 0.008, 0.008]} />
            <meshStandardMaterial color="#FFD700" emissive="#FF6600" emissiveIntensity={0.8} />
          </mesh>
        )
      })}
      {/* Glow */}
      <pointLight color="#FFD700" intensity={0.5} distance={3} decay={2} />
    </group>
  )
}
