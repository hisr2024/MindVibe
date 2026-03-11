/**
 * VishvarupaScene — The cosmic universal form (Chapter 11).
 *
 * A BLAZING cosmic spectacle — the radiance of a thousand suns.
 * Bright, overwhelming, awe-inspiring. Blinding light with cosmic
 * rings of fire, galaxies of golden sparks, and energy streaming
 * in all directions against a deep indigo cosmos.
 *
 * "If the radiance of a thousand suns were to burst at once into the sky..."
 */

'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

function CosmicCore() {
  const coreRef = useRef<THREE.Mesh>(null)
  const glow1Ref = useRef<THREE.Mesh>(null)
  const glow2Ref = useRef<THREE.Mesh>(null)
  const glow3Ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.15
      coreRef.current.scale.setScalar(1 + Math.sin(t * 0.6) * 0.15)
    }
    if (glow1Ref.current) {
      glow1Ref.current.scale.setScalar(2.5 + Math.sin(t * 0.3) * 0.4)
      const m = glow1Ref.current.material as THREE.MeshBasicMaterial
      m.opacity = 0.4 + Math.sin(t * 0.5) * 0.1
    }
    if (glow2Ref.current) {
      glow2Ref.current.scale.setScalar(4.5 + Math.sin(t * 0.2) * 0.6)
      const m = glow2Ref.current.material as THREE.MeshBasicMaterial
      m.opacity = 0.18 + Math.sin(t * 0.35) * 0.05
    }
    if (glow3Ref.current) {
      glow3Ref.current.scale.setScalar(7.0 + Math.sin(t * 0.15) * 1.0)
      const m = glow3Ref.current.material as THREE.MeshBasicMaterial
      m.opacity = 0.08 + Math.sin(t * 0.25) * 0.03
    }
  })

  return (
    <group position={[0, 4, -12]}>
      {/* Blazing white core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshBasicMaterial color="#fffaf0" transparent opacity={0.98} />
      </mesh>
      {/* Golden glow */}
      <mesh ref={glow1Ref}>
        <sphereGeometry args={[3, 24, 24]} />
        <meshBasicMaterial
          color="#ffd700"
          transparent
          opacity={0.35}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Warm amber glow */}
      <mesh ref={glow2Ref}>
        <sphereGeometry args={[4, 16, 16]} />
        <meshBasicMaterial
          color="#ff8844"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Outer cosmic haze */}
      <mesh ref={glow3Ref}>
        <sphereGeometry args={[5, 12, 12]} />
        <meshBasicMaterial
          color="#ff6622"
          transparent
          opacity={0.07}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

function CosmicRings() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime
    groupRef.current.rotation.y = t * 0.08
    groupRef.current.children.forEach((child, i) => {
      child.rotation.x = Math.sin(t * 0.06 + i * 0.4) * 0.12
      child.rotation.z = t * (0.02 + i * 0.006) * (i % 2 === 0 ? 1 : -1)
    })
  })

  const rings = useMemo(() => [
    { r: 5, tube: 0.15, color: '#ffd700', opacity: 0.6 },
    { r: 7, tube: 0.12, color: '#ff8833', opacity: 0.5 },
    { r: 9, tube: 0.1, color: '#66aaff', opacity: 0.42 },
    { r: 11.5, tube: 0.08, color: '#aa77ff', opacity: 0.35 },
    { r: 14.5, tube: 0.07, color: '#ff5588', opacity: 0.28 },
  ], [])

  return (
    <group ref={groupRef} position={[0, 4, -12]}>
      {rings.map((ring, i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.3, i * 0.35, 0]}>
          <torusGeometry args={[ring.r, ring.tube, 24, 100]} />
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

function ThousandSuns() {
  const ref = useRef<THREE.Points>(null)
  const count = 800

  const positions = useMemo(() =>
    Float32Array.from({ length: count * 3 }, (_, i) => (seeded(i + 1000) - 0.5) * 90), [])

  const colors = useMemo(() =>
    Float32Array.from({ length: count * 3 }, (_, i) => {
      const ch = i % 3
      if (ch === 0) return 0.9 + seeded(i + 2000) * 0.1
      if (ch === 1) return 0.65 + seeded(i + 3000) * 0.3
      return 0.25 + seeded(i + 4000) * 0.5
    }), [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * 0.015
    ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.03) * 0.05
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.6}
        transparent
        opacity={0.95}
        vertexColors
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

function CosmicEnergy() {
  const ref = useRef<THREE.Points>(null)
  const count = 500

  const positions = useMemo(() =>
    Float32Array.from({ length: count * 3 }, (_, i) => {
      const idx = Math.floor(i / 3)
      const angle = (idx / count) * Math.PI * 20
      const radius = 2 + (idx / count) * 18
      const axis = i % 3
      if (axis === 0) return Math.cos(angle) * radius
      if (axis === 1) return (seeded(i + 5000) - 0.5) * 10 + 4
      return Math.sin(angle) * radius - 12
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
      <pointsMaterial
        color="#ffaa44"
        size={0.18}
        transparent
        opacity={0.8}
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
      <pointLight position={[0, 4, -12]} intensity={10.0} color="#ffffff" distance={100} decay={0.8} />
      <pointLight position={[-12, 12, -20]} intensity={5.0} color="#ff6633" distance={60} decay={1.0} />
      <pointLight position={[12, 12, -20]} intensity={5.0} color="#4488ff" distance={60} decay={1.0} />
      <pointLight position={[0, -6, -12]} intensity={4.0} color="#ffd700" distance={50} decay={1.2} />
      <pointLight position={[0, 22, -12]} intensity={3.5} color="#aa66ff" distance={60} decay={1.0} />

      <ambientLight intensity={0.3} color="#443355" />

      <fog attach="fog" args={['#151025', 35, 130]} />
    </group>
  )
}
