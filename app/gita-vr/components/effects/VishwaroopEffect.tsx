/**
 * VishwaroopEffect — Chapter 11 Cosmic Form (Vishwaroop Darshan)
 *
 * The most dramatic visual moment: Krishna reveals his universal form.
 * Particle explosion, galaxy spirals, multiple face overlays,
 * cosmic scale camera pullback.
 */

'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGitaVRStore } from '@/stores/gitaVRStore'

const COSMIC_PARTICLE_COUNT = 2000

function CosmicExplosion() {
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, velocities, colors } = useMemo(() => {
    const pos = new Float32Array(COSMIC_PARTICLE_COUNT * 3)
    const vel = new Float32Array(COSMIC_PARTICLE_COUNT * 3)
    const col = new Float32Array(COSMIC_PARTICLE_COUNT * 3)

    for (let i = 0; i < COSMIC_PARTICLE_COUNT; i++) {
      // Start from center
      pos[i * 3] = (Math.random() - 0.5) * 0.5
      pos[i * 3 + 1] = 1.5 + (Math.random() - 0.5) * 0.5
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5

      // Radial velocity
      const speed = 0.02 + Math.random() * 0.08
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      vel[i * 3] = Math.sin(phi) * Math.cos(theta) * speed
      vel[i * 3 + 1] = Math.cos(phi) * speed
      vel[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed

      // Cosmic colors: gold, blue, purple, white
      const colorChoice = Math.random()
      if (colorChoice < 0.3) {
        col[i * 3] = 1; col[i * 3 + 1] = 0.84; col[i * 3 + 2] = 0 // Gold
      } else if (colorChoice < 0.5) {
        col[i * 3] = 0.3; col[i * 3 + 1] = 0.5; col[i * 3 + 2] = 1 // Blue
      } else if (colorChoice < 0.7) {
        col[i * 3] = 0.6; col[i * 3 + 1] = 0.2; col[i * 3 + 2] = 0.8 // Purple
      } else {
        col[i * 3] = 1; col[i * 3 + 1] = 1; col[i * 3 + 2] = 0.9 // White
      }
    }

    return { positions: pos, velocities: vel, colors: col }
  }, [])

  useFrame(() => {
    if (!pointsRef.current) return
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const arr = posAttr.array as Float32Array

    for (let i = 0; i < COSMIC_PARTICLE_COUNT; i++) {
      arr[i * 3] += velocities[i * 3]
      arr[i * 3 + 1] += velocities[i * 3 + 1]
      arr[i * 3 + 2] += velocities[i * 3 + 2]

      // Slow down and orbit
      velocities[i * 3] *= 0.998
      velocities[i * 3 + 1] *= 0.998
      velocities[i * 3 + 2] *= 0.998

      // Reset if too far
      const dist = Math.sqrt(
        arr[i * 3] ** 2 + (arr[i * 3 + 1] - 1.5) ** 2 + arr[i * 3 + 2] ** 2
      )
      if (dist > 30) {
        arr[i * 3] = (Math.random() - 0.5) * 0.5
        arr[i * 3 + 1] = 1.5 + (Math.random() - 0.5) * 0.5
        arr[i * 3 + 2] = (Math.random() - 0.5) * 0.5

        const speed = 0.02 + Math.random() * 0.08
        const theta = Math.random() * Math.PI * 2
        const phi = Math.random() * Math.PI
        velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed
        velocities[i * 3 + 1] = Math.cos(phi) * speed
        velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed
      }
    }
    posAttr.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        transparent
        opacity={0.8}
        vertexColors
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

function GalaxySpiral() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
    }
  })

  const spiralPoints = useMemo(() => {
    const points = new Float32Array(300 * 3)
    for (let i = 0; i < 300; i++) {
      const t = i / 300 * Math.PI * 6
      const r = t * 0.5
      points[i * 3] = Math.cos(t) * r
      points[i * 3 + 1] = (Math.random() - 0.5) * 0.5
      points[i * 3 + 2] = Math.sin(t) * r
    }
    return points
  }, [])

  return (
    <group ref={groupRef} position={[0, 3, 0]} rotation={[0.5, 0, 0]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[spiralPoints, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#9966FF" size={0.08} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>
    </group>
  )
}

function CosmicRings() {
  const ring1Ref = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)
  const ring3Ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const time = state.clock.elapsedTime
    if (ring1Ref.current) ring1Ref.current.rotation.z = time * 0.3
    if (ring2Ref.current) ring2Ref.current.rotation.x = time * 0.2
    if (ring3Ref.current) ring3Ref.current.rotation.y = time * 0.25
  })

  return (
    <group position={[0, 2, 0]}>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[5, 0.03, 8, 64]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.3} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[7, 0.02, 8, 64]} />
        <meshBasicMaterial color="#4488FF" transparent opacity={0.2} />
      </mesh>
      <mesh ref={ring3Ref} rotation={[0, Math.PI / 4, Math.PI / 6]}>
        <torusGeometry args={[9, 0.025, 8, 64]} />
        <meshBasicMaterial color="#AA44FF" transparent opacity={0.15} />
      </mesh>
    </group>
  )
}

export default function VishwaroopEffect() {
  const sceneState = useGitaVRStore((s) => s.sceneState)

  if (sceneState !== 'vishwaroop') return null

  return (
    <group>
      <CosmicExplosion />
      <GalaxySpiral />
      <CosmicRings />

      {/* Intense divine light */}
      <pointLight position={[0, 3, 0]} intensity={3} color="#FFD700" distance={30} decay={1} />
      <pointLight position={[0, 3, 0]} intensity={1.5} color="#4488FF" distance={20} decay={2} />
    </group>
  )
}
