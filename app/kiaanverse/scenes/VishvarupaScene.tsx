/**
 * VishvarupaScene — The cosmic universal form (Chapter 11).
 *
 * Krishna reveals the infinite: galaxies spiraling, thousand suns blazing,
 * cosmic rings of creation spinning through space, and divine energy
 * streaming in all directions.
 *
 * Atmosphere: Overwhelming, infinite, terrifying beauty.
 * "If the radiance of a thousand suns were to burst at once into the sky,
 *  that would be like the splendor of the Mighty One."
 */

'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere } from '@react-three/drei'
import * as THREE from 'three'

function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

function CosmicCore() {
  const ref = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (ref.current) {
      ref.current.rotation.y = t * 0.15
      ref.current.rotation.z = t * 0.08
      const scale = 1 + Math.sin(t * 0.6) * 0.15
      ref.current.scale.setScalar(scale)
    }
    if (glowRef.current) {
      const gScale = 2.5 + Math.sin(t * 0.3) * 0.5
      glowRef.current.scale.setScalar(gScale)
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.08 + Math.sin(t * 0.5) * 0.03
    }
  })

  return (
    <group position={[0, 3, -10]}>
      <Sphere ref={ref} args={[2.5, 32, 32]}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
      </Sphere>
      {/* Soft glow around core */}
      <Sphere ref={glowRef} args={[3, 16, 16]}>
        <meshBasicMaterial color="#ffd700" transparent opacity={0.08} side={THREE.BackSide} />
      </Sphere>
    </group>
  )
}

function CosmicRings() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime
    groupRef.current.rotation.y = t * 0.12
    groupRef.current.children.forEach((child, i) => {
      child.rotation.x = Math.sin(t * 0.1 + i * 0.5) * 0.2
      child.rotation.z = t * (0.03 + i * 0.01) * (i % 2 === 0 ? 1 : -1)
    })
  })

  const rings = useMemo(() => [
    { r: 4, tube: 0.06, color: '#ffd700', opacity: 0.35 },
    { r: 6, tube: 0.05, color: '#ff6600', opacity: 0.28 },
    { r: 8, tube: 0.04, color: '#4488ff', opacity: 0.22 },
    { r: 10.5, tube: 0.035, color: '#9966ff', opacity: 0.18 },
    { r: 13, tube: 0.03, color: '#ff3366', opacity: 0.14 },
    { r: 16, tube: 0.025, color: '#ffd700', opacity: 0.1 },
  ], [])

  return (
    <group ref={groupRef} position={[0, 3, -10]}>
      {rings.map((ring, i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.25, i * 0.4, 0]}>
          <torusGeometry args={[ring.r, ring.tube, 8, 80]} />
          <meshBasicMaterial color={ring.color} transparent opacity={ring.opacity} />
        </mesh>
      ))}
    </group>
  )
}

function ThousandSuns() {
  const ref = useRef<THREE.Points>(null)
  const count = 800

  const positions = useMemo(() =>
    Float32Array.from({ length: count * 3 }, (_, i) => (seeded(i + 1000) - 0.5) * 120), [])

  const colors = useMemo(() =>
    Float32Array.from({ length: count * 3 }, (_, i) => {
      const ch = i % 3
      if (ch === 0) return 0.85 + seeded(i + 2000) * 0.15
      if (ch === 1) return 0.4 + seeded(i + 3000) * 0.5
      return seeded(i + 4000) * 0.4
    }), [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * 0.015
    ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.04) * 0.06
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.35} transparent opacity={0.85} vertexColors sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  )
}

function CosmicEnergy() {
  const ref = useRef<THREE.Points>(null)
  const count = 500

  const positions = useMemo(() =>
    Float32Array.from({ length: count * 3 }, (_, i) => {
      const idx = Math.floor(i / 3)
      const angle = (idx / count) * Math.PI * 24
      const radius = 2 + (idx / count) * 18
      const axis = i % 3
      if (axis === 0) return Math.cos(angle) * radius
      if (axis === 1) return (seeded(i + 5000) - 0.5) * 10 + 3
      return Math.sin(angle) * radius - 10
    }), [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * 0.06
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ff8800" size={0.08} transparent opacity={0.55} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  )
}

function SacredGeometryOverlay() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.rotation.z = clock.elapsedTime * 0.02
    groupRef.current.rotation.y = clock.elapsedTime * 0.01
  })

  return (
    <group ref={groupRef} position={[0, 3, -10]}>
      {/* Sri Yantra triangles at cosmic scale */}
      {[3.5, 5, 6.5].map((r, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, i * (Math.PI / 3)]}>
          <ringGeometry args={[r * 0.9, r, 3]} />
          <meshBasicMaterial color="#ffd700" transparent opacity={0.06 + i * 0.02} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {[3, 4.5, 6].map((r, i) => (
        <mesh key={`d-${i}`} rotation={[Math.PI / 2, 0, Math.PI + i * (Math.PI / 3)]}>
          <ringGeometry args={[r * 0.9, r, 3]} />
          <meshBasicMaterial color="#ff8844" transparent opacity={0.04 + i * 0.015} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

export default function VishvarupaScene() {
  return (
    <group>
      <CosmicCore />
      <CosmicRings />
      <SacredGeometryOverlay />
      <ThousandSuns />
      <CosmicEnergy />

      {/* Intense cosmic lighting */}
      <pointLight position={[0, 3, -10]} intensity={6} color="#ffffff" distance={60} decay={1} />
      <pointLight position={[-12, 12, -18]} intensity={2.5} color="#ff4500" distance={45} decay={1.5} />
      <pointLight position={[12, 12, -18]} intensity={2.5} color="#4488ff" distance={45} decay={1.5} />
      <pointLight position={[0, -8, -10]} intensity={2} color="#ffd700" distance={35} decay={2} />
      <pointLight position={[0, 20, -10]} intensity={1.5} color="#9966ff" distance={40} decay={1.5} />

      <fog attach="fog" args={['#000006', 15, 90]} />
    </group>
  )
}
