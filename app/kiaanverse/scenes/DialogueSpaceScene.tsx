/**
 * DialogueSpaceScene — Intimate conversation VR environment.
 *
 * A serene sacred grove for deep dialogue with Krishna.
 * Ancient banyan tree, soft golden light filtering through leaves,
 * a stone platform for sitting, and floating fireflies.
 *
 * Optimized for focused Q&A (Sakha mode).
 */

'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Plane, Sphere } from '@react-three/drei'
import * as THREE from 'three'

function SacredGround() {
  return (
    <Plane args={[50, 50]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <meshStandardMaterial
        color="#1a3a1a"
        roughness={0.9}
        metalness={0.05}
      />
    </Plane>
  )
}

function BanyanTree() {
  return (
    <group position={[0, 0, -5]}>
      {/* Trunk */}
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.6, 0.9, 6, 8]} />
        <meshStandardMaterial color="#3a2a15" roughness={0.95} />
      </mesh>
      {/* Aerial roots */}
      {[-0.8, 0.6, -0.5, 0.9].map((x, i) => (
        <mesh key={i} position={[x, 2, i * 0.3 - 0.5]}>
          <cylinderGeometry args={[0.04, 0.08, 4, 4]} />
          <meshStandardMaterial color="#2a1a0a" transparent opacity={0.5} />
        </mesh>
      ))}
      {/* Canopy — large transparent sphere */}
      <Sphere args={[6, 16, 16]} position={[0, 7, 0]}>
        <meshStandardMaterial
          color="#0a2a0a"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </Sphere>
      {/* Filtered light through canopy */}
      <pointLight position={[0, 8, 0]} intensity={1.5} color="#ffd700" distance={15} decay={2} />
    </group>
  )
}

function StonePlatform() {
  return (
    <group position={[0, 0, 0]}>
      {/* Circular stone platform */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[2.5, 2.8, 0.2, 24]} />
        <meshStandardMaterial color="#555555" roughness={0.85} metalness={0.1} />
      </mesh>
      {/* Inner circle with sacred geometry */}
      <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 2, 8]} />
        <meshStandardMaterial
          color="#d4a44c"
          emissive="#ffd700"
          emissiveIntensity={0.1}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

function Fireflies() {
  const ref = useRef<THREE.Points>(null)
  const count = 60

  const positions = useRef(
    Float32Array.from({ length: count * 3 }, (_, i) => {
      const axis = i % 3
      if (axis === 0) return (Math.random() - 0.5) * 12
      if (axis === 1) return Math.random() * 6 + 0.5
      return (Math.random() - 0.5) * 12 - 3
    })
  )

  useFrame(({ clock }) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      const t = clock.elapsedTime * 0.5 + i * 0.7
      pos[i * 3] += Math.sin(t) * 0.003
      pos[i * 3 + 1] += Math.cos(t * 0.7) * 0.002
      pos[i * 3 + 2] += Math.sin(t * 0.5) * 0.002
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions.current, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffee88"
        size={0.06}
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
      <SacredGround />
      <BanyanTree />
      <StonePlatform />
      <Fireflies />

      {/* Warm golden ambient */}
      <pointLight position={[3, 4, 2]} intensity={0.4} color="#ffcc66" distance={15} decay={2} />
      <pointLight position={[-3, 4, 2]} intensity={0.4} color="#ffcc66" distance={15} decay={2} />

      <fog attach="fog" args={['#0a1a0a', 8, 35]} />
    </group>
  )
}
