/**
 * DialogueSpaceScene — Sacred banyan grove for intimate divine dialogue.
 *
 * A warm, golden-lit clearing beneath a great banyan tree. Warm light
 * filters through leaves, bright fireflies drift lazily, soft green
 * leaves fall. The sacred mandala glows with golden warmth.
 *
 * Atmosphere: Intimate, protected, warm. Like sitting by a sacred fire.
 */

'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

function ForestGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial
        color="#2a5028"
        emissive="#1a3818"
        emissiveIntensity={0.15}
        roughness={0.88}
        metalness={0.05}
      />
    </mesh>
  )
}

function BanyanTree() {
  return (
    <group position={[0, 0, -6]}>
      <mesh position={[0, 3.5, 0]}>
        <cylinderGeometry args={[0.7, 1.2, 7, 10]} />
        <meshStandardMaterial
          color="#5a3a1a"
          emissive="#3a2210"
          emissiveIntensity={0.1}
          roughness={0.92}
        />
      </mesh>
      {[
        { x: -1.0, z: -0.3 }, { x: 0.8, z: 0.2 }, { x: -0.6, z: 0.5 },
        { x: 1.1, z: -0.4 }, { x: -0.3, z: -0.7 }, { x: 0.5, z: 0.6 },
      ].map((r, i) => (
        <mesh key={i} position={[r.x, 2.5, r.z]}>
          <cylinderGeometry args={[0.04, 0.07, 5, 5]} />
          <meshStandardMaterial color="#4a3018" transparent opacity={0.65} />
        </mesh>
      ))}
      {/* Canopy — warm green, luminous */}
      <mesh position={[0, 8, 0]}>
        <sphereGeometry args={[7, 20, 20]} />
        <meshStandardMaterial
          color="#2a6a2a"
          emissive="#1a4a1a"
          emissiveIntensity={0.25}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 7.5, 0]}>
        <sphereGeometry args={[5, 16, 16]} />
        <meshStandardMaterial
          color="#3a7a3a"
          emissive="#2a5a2a"
          emissiveIntensity={0.2}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Strong golden light through leaves */}
      <pointLight position={[0, 10, 0]} intensity={5.0} color="#ffd700" distance={28} decay={1.2} />
      <pointLight position={[-3, 7, 2]} intensity={1.5} color="#ffcc44" distance={14} decay={1.5} />
      <pointLight position={[3, 7, -2]} intensity={1.5} color="#ffcc44" distance={14} decay={1.5} />
    </group>
  )
}

function SacredMandala() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[2.8, 3.2, 0.15, 32]} />
        <meshStandardMaterial color="#7a7a6a" roughness={0.8} metalness={0.1} />
      </mesh>
      {/* Golden center glow */}
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshBasicMaterial color="#ffd700" />
      </mesh>
      <pointLight position={[0, 0.4, 0]} intensity={2.0} color="#ffd700" distance={6} decay={2} />
    </group>
  )
}

function Fireflies() {
  const ref = useRef<THREE.Points>(null)
  const count = 80

  const positions = useMemo(() =>
    Float32Array.from({ length: count * 3 }, (_, i) => {
      const axis = i % 3
      if (axis === 0) return (seeded(i + 200) - 0.5) * 14
      if (axis === 1) return 0.5 + seeded(i + 400) * 7
      return (seeded(i + 600) - 0.5) * 14 - 4
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
    mat.opacity = 0.75 + Math.sin(clock.elapsedTime * 0.8) * 0.15
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#ffee66"
        size={0.1}
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
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
      pos[i * 3 + 1] -= 0.004
      pos[i * 3] += Math.sin(clock.elapsedTime * 0.5 + i * 2) * 0.004
      if (pos[i * 3 + 1] < -0.1) pos[i * 3 + 1] = 8 + seeded(i + 900) * 3
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#bbdd66"
        size={0.1}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
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

      {/* Warm golden light filling the grove */}
      <pointLight position={[5, 6, 4]} intensity={2.0} color="#ffcc66" distance={25} decay={1.2} />
      <pointLight position={[-5, 6, 4]} intensity={2.0} color="#ffcc66" distance={25} decay={1.2} />
      <pointLight position={[0, 2, 6]} intensity={0.8} color="#ffeedd" distance={14} decay={1.5} />

      <ambientLight intensity={0.3} color="#3a4a2a" />

      <fog attach="fog" args={['#1a2a15', 15, 55]} />
    </group>
  )
}
