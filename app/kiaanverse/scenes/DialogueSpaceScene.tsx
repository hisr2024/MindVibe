/**
 * DialogueSpaceScene — Ancient banyan grove for intimate divine dialogue.
 *
 * A sacred clearing beneath a vast banyan tree. Golden light filters
 * through leaves, fireflies drift like wandering thoughts,
 * and a stone mandala marks the seat of wisdom.
 *
 * Atmosphere: Intimate, protected, timeless. A guru's forest ashram.
 */

'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Plane, Sphere } from '@react-three/drei'
import * as THREE from 'three'

function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

function ForestGround() {
  return (
    <Plane args={[80, 80, 1, 1]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <meshStandardMaterial color="#0f2810" roughness={0.95} metalness={0.02} />
    </Plane>
  )
}

function BanyanTree() {
  return (
    <group position={[0, 0, -6]}>
      {/* Main trunk */}
      <mesh position={[0, 3.5, 0]}>
        <cylinderGeometry args={[0.7, 1.1, 7, 8]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.98} />
      </mesh>
      {/* Aerial roots */}
      {[
        { x: -1.0, z: -0.3 }, { x: 0.8, z: 0.2 }, { x: -0.6, z: 0.5 },
        { x: 1.1, z: -0.4 }, { x: -0.3, z: -0.7 }, { x: 0.5, z: 0.6 },
      ].map((r, i) => (
        <mesh key={i} position={[r.x, 2.5, r.z]}>
          <cylinderGeometry args={[0.03, 0.06, 5, 4]} />
          <meshStandardMaterial color="#1a0f06" transparent opacity={0.4} />
        </mesh>
      ))}
      {/* Canopy — layered transparent spheres for depth */}
      <Sphere args={[7, 16, 16]} position={[0, 8, 0]}>
        <meshStandardMaterial color="#0a2a0a" transparent opacity={0.3} side={THREE.DoubleSide} />
      </Sphere>
      <Sphere args={[5, 12, 12]} position={[0, 7.5, 0]}>
        <meshStandardMaterial color="#0f3a0f" transparent opacity={0.2} side={THREE.DoubleSide} />
      </Sphere>
      {/* Light filtering through leaves */}
      <pointLight position={[0, 9, 0]} intensity={1.8} color="#ffd700" distance={18} decay={2} />
      <pointLight position={[-2, 7, 1]} intensity={0.3} color="#ffcc44" distance={8} decay={2} />
      <pointLight position={[2, 7, -1]} intensity={0.3} color="#ffcc44" distance={8} decay={2} />
    </group>
  )
}

function SacredMandala() {
  const innerRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!innerRef.current) return
    innerRef.current.rotation.z = clock.elapsedTime * 0.02
  })

  return (
    <group position={[0, 0, 0]}>
      {/* Stone platform */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[2.8, 3.2, 0.15, 32]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.9} metalness={0.08} />
      </mesh>
      {/* Sacred geometry ring — slowly rotating */}
      <mesh ref={innerRef} position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 2.2, 8]} />
        <meshStandardMaterial color="#c4944c" emissive="#ffd700" emissiveIntensity={0.08} transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* Inner octagram */}
      <mesh position={[0, 0.19, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 8]}>
        <ringGeometry args={[0.3, 1.2, 8]} />
        <meshStandardMaterial color="#d4a44c" emissive="#ffd700" emissiveIntensity={0.06} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      {/* Center light */}
      <pointLight position={[0, 0.3, 0]} intensity={0.4} color="#ffd700" distance={4} decay={2} />
    </group>
  )
}

function Fireflies() {
  const ref = useRef<THREE.Points>(null)
  const count = 100

  const positions = useMemo(() =>
    Float32Array.from({ length: count * 3 }, (_, i) => {
      const axis = i % 3
      if (axis === 0) return (seeded(i + 200) - 0.5) * 16
      if (axis === 1) return 0.3 + seeded(i + 400) * 7
      return (seeded(i + 600) - 0.5) * 16 - 4
    }), [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      const t = clock.elapsedTime * 0.4 + i * 0.6
      pos[i * 3] += Math.sin(t) * 0.004
      pos[i * 3 + 1] += Math.cos(t * 0.6) * 0.003
      pos[i * 3 + 2] += Math.sin(t * 0.4) * 0.003
    }
    ref.current.geometry.attributes.position.needsUpdate = true

    const mat = ref.current.material as THREE.PointsMaterial
    mat.opacity = 0.5 + Math.sin(clock.elapsedTime * 0.8) * 0.15
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffee66" size={0.05} transparent opacity={0.55} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  )
}

function FallingLeaves() {
  const ref = useRef<THREE.Points>(null)
  const count = 40

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (seeded(i + 800) - 0.5) * 10
      pos[i * 3 + 1] = 3 + seeded(i + 900) * 6
      pos[i * 3 + 2] = (seeded(i + 1000) - 0.5) * 10 - 5
    }
    return pos
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= 0.003
      pos[i * 3] += Math.sin(clock.elapsedTime * 0.5 + i * 2) * 0.004
      if (pos[i * 3 + 1] < -0.1) pos[i * 3 + 1] = 7 + seeded(i + 900) * 3
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#88aa44" size={0.06} transparent opacity={0.3} sizeAttenuation />
    </points>
  )
}

export default function DialogueSpaceScene() {
  return (
    <group>
      <ForestGround />
      <BanyanTree />
      <SacredMandala />
      <Fireflies />
      <FallingLeaves />

      {/* Warm golden ambient */}
      <pointLight position={[4, 5, 3]} intensity={0.5} color="#ffcc66" distance={18} decay={2} />
      <pointLight position={[-4, 5, 3]} intensity={0.5} color="#ffcc66" distance={18} decay={2} />
      <pointLight position={[0, 1, 5]} intensity={0.15} color="#ffeedd" distance={8} decay={2} />

      <fog attach="fog" args={['#061208', 6, 35]} />
    </group>
  )
}
