/**
 * VishvarupaScene — Cosmic Vision VR environment (Chapter 11).
 *
 * Krishna reveals His universal form (Vishvarupa Darshan).
 * Infinite cosmic space with swirling galaxies, divine light,
 * thousand suns, and overwhelming cosmic energy.
 *
 * The most visually intense scene in Kiaanverse.
 */

'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere } from '@react-three/drei'
import * as THREE from 'three'

function CosmicCore() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * 0.1
    ref.current.rotation.z = clock.elapsedTime * 0.05
    const scale = 1 + Math.sin(clock.elapsedTime * 0.5) * 0.1
    ref.current.scale.setScalar(scale)
  })

  return (
    <Sphere ref={ref} args={[3, 32, 32]} position={[0, 3, -8]}>
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.8}
      />
    </Sphere>
  )
}

function CosmicRings() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = clock.elapsedTime * 0.15
    groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.1) * 0.1
  })

  return (
    <group ref={groupRef} position={[0, 3, -8]}>
      {[5, 7, 9, 12].map((radius, i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.2, i * 0.3, 0]}>
          <torusGeometry args={[radius, 0.08, 8, 64]} />
          <meshBasicMaterial
            color={['#ffd700', '#ff4500', '#4169e1', '#9370db'][i]}
            transparent
            opacity={0.3 - i * 0.05}
          />
        </mesh>
      ))}
    </group>
  )
}

function ThousandSuns() {
  const ref = useRef<THREE.Points>(null)
  const count = 500

  const positions = useRef(
    Float32Array.from({ length: count * 3 }, () => (Math.random() - 0.5) * 100)
  )

  const colors = useRef(
    Float32Array.from({ length: count * 3 }, (_, i) => {
      const channel = i % 3
      if (channel === 0) return 0.8 + Math.random() * 0.2
      if (channel === 1) return 0.5 + Math.random() * 0.4
      return Math.random() * 0.5
    })
  )

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * 0.02
    ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.05) * 0.05
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions.current, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors.current, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.3}
        transparent
        opacity={0.8}
        vertexColors
        sizeAttenuation
      />
    </points>
  )
}

function CosmicEnergy() {
  const ref = useRef<THREE.Points>(null)
  const count = 300

  const positions = useRef(
    Float32Array.from({ length: count * 3 }, (_, i) => {
      const idx = Math.floor(i / 3)
      const angle = (idx / count) * Math.PI * 20
      const radius = 2 + (idx / count) * 15
      const axis = i % 3
      if (axis === 0) return Math.cos(angle) * radius
      if (axis === 1) return (Math.random() - 0.5) * 8
      return Math.sin(angle) * radius - 8
    })
  )

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * 0.08
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions.current, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#ffa500"
        size={0.1}
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  )
}

export default function VishvarupaScene() {
  return (
    <group>
      <CosmicCore />
      <CosmicRings />
      <ThousandSuns />
      <CosmicEnergy />

      {/* Intense cosmic lighting */}
      <pointLight position={[0, 3, -8]} intensity={5} color="#ffffff" distance={50} decay={1} />
      <pointLight position={[-10, 10, -15]} intensity={2} color="#ff4500" distance={40} decay={1.5} />
      <pointLight position={[10, 10, -15]} intensity={2} color="#4169e1" distance={40} decay={1.5} />
      <pointLight position={[0, -5, -8]} intensity={1.5} color="#ffd700" distance={30} decay={2} />

      <fog attach="fog" args={['#000008', 20, 80]} />
    </group>
  )
}
