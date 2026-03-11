/**
 * VishvarupaScene — The cosmic universal form (Chapter 11).
 *
 * A BLAZING cosmic spectacle — the radiance of a thousand suns.
 * Bright, overwhelming, awe-inspiring. Not dark void but blinding light
 * with cosmic rings of fire, galaxies of golden sparks, and energy
 * streaming in all directions against a deep indigo cosmos.
 *
 * "If the radiance of a thousand suns were to burst at once into the sky..."
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

/** Blazing white-gold core — the source of creation */
function CosmicCore() {
  const ref = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const outerRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (ref.current) {
      ref.current.rotation.y = t * 0.15
      const scale = 1 + Math.sin(t * 0.6) * 0.12
      ref.current.scale.setScalar(scale)
    }
    if (glowRef.current) {
      const gScale = 3.0 + Math.sin(t * 0.3) * 0.5
      glowRef.current.scale.setScalar(gScale)
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.25 + Math.sin(t * 0.5) * 0.08
    }
    if (outerRef.current) {
      outerRef.current.scale.setScalar(5.5 + Math.sin(t * 0.2) * 0.8)
      const mat = outerRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.08 + Math.sin(t * 0.35) * 0.03
    }
  })

  return (
    <group position={[0, 4, -12]}>
      {/* Bright white core */}
      <Sphere ref={ref} args={[2.5, 32, 32]}>
        <meshBasicMaterial color="#fffaf0" transparent opacity={0.95} />
      </Sphere>
      {/* Golden glow */}
      <Sphere ref={glowRef} args={[3, 24, 24]}>
        <meshBasicMaterial
          color="#ffd700"
          transparent
          opacity={0.2}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </Sphere>
      {/* Outer warm haze */}
      <Sphere ref={outerRef} args={[4, 16, 16]}>
        <meshBasicMaterial
          color="#ff8844"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </Sphere>
    </group>
  )
}

/** Bright cosmic rings of creation — visible, colorful, not ghostly wireframes */
function CosmicRings() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime
    groupRef.current.rotation.y = t * 0.1
    groupRef.current.children.forEach((child, i) => {
      child.rotation.x = Math.sin(t * 0.08 + i * 0.5) * 0.15
      child.rotation.z = t * (0.025 + i * 0.008) * (i % 2 === 0 ? 1 : -1)
    })
  })

  const rings = useMemo(() => [
    { r: 4.5, tube: 0.12, color: '#ffd700', opacity: 0.55 },
    { r: 6.5, tube: 0.1, color: '#ff8833', opacity: 0.45 },
    { r: 8.5, tube: 0.08, color: '#66aaff', opacity: 0.38 },
    { r: 11, tube: 0.07, color: '#aa77ff', opacity: 0.3 },
    { r: 14, tube: 0.06, color: '#ff5588', opacity: 0.25 },
  ], [])

  return (
    <group ref={groupRef} position={[0, 4, -12]}>
      {rings.map((ring, i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.3, i * 0.35, 0]}>
          <torusGeometry args={[ring.r, ring.tube, 16, 100]} />
          <meshBasicMaterial
            color={ring.color}
            transparent
            opacity={ring.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

/** Galaxy sparks — bright, visible stars scattered across the cosmos */
function ThousandSuns() {
  const ref = useRef<THREE.Points>(null)
  const count = 600

  const positions = useMemo(() =>
    Float32Array.from({ length: count * 3 }, (_, i) => (seeded(i + 1000) - 0.5) * 80), [])

  const colors = useMemo(() =>
    Float32Array.from({ length: count * 3 }, (_, i) => {
      const ch = i % 3
      if (ch === 0) return 0.9 + seeded(i + 2000) * 0.1
      if (ch === 1) return 0.6 + seeded(i + 3000) * 0.35
      return 0.2 + seeded(i + 4000) * 0.5
    }), [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * 0.012
    ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.03) * 0.04
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.5}
        transparent
        opacity={0.9}
        vertexColors
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/** Spiral cosmic energy streams */
function CosmicEnergy() {
  const ref = useRef<THREE.Points>(null)
  const count = 400

  const positions = useMemo(() =>
    Float32Array.from({ length: count * 3 }, (_, i) => {
      const idx = Math.floor(i / 3)
      const angle = (idx / count) * Math.PI * 20
      const radius = 2 + (idx / count) * 16
      const axis = i % 3
      if (axis === 0) return Math.cos(angle) * radius
      if (axis === 1) return (seeded(i + 5000) - 0.5) * 8 + 4
      return Math.sin(angle) * radius - 12
    }), [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * 0.05
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#ffaa44"
        size={0.15}
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
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

      {/* INTENSE cosmic lighting — "thousand suns" */}
      <pointLight position={[0, 4, -12]} intensity={8} color="#ffffff" distance={80} decay={1} />
      <pointLight position={[-10, 10, -18]} intensity={4} color="#ff6633" distance={50} decay={1.2} />
      <pointLight position={[10, 10, -18]} intensity={4} color="#4488ff" distance={50} decay={1.2} />
      <pointLight position={[0, -6, -12]} intensity={3} color="#ffd700" distance={40} decay={1.5} />
      <pointLight position={[0, 20, -12]} intensity={2.5} color="#aa66ff" distance={50} decay={1.2} />

      {/* Base ambient so nothing is pure black */}
      <ambientLight intensity={0.15} color="#332244" />

      <fog attach="fog" args={['#0a0818', 30, 120]} />
    </group>
  )
}
