/**
 * KurukshetraScene — The sacred battlefield VR environment.
 *
 * The primary dialogue space between Krishna and Arjuna.
 * Vast open battlefield at golden sunset, distant armies,
 * war chariots, dust and divine light. Sacred and cinematic.
 *
 * This is where the Bhagavad Gita was spoken.
 */

'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Plane, Sphere } from '@react-three/drei'
import * as THREE from 'three'

function BattlefieldGround() {
  return (
    <Plane args={[200, 200]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <meshStandardMaterial
        color="#3a2a15"
        roughness={0.95}
        metalness={0.05}
      />
    </Plane>
  )
}

function DistantMountains() {
  return (
    <group position={[0, 0, -60]}>
      {/* Mountain range — simple cones */}
      {[
        { x: -30, h: 12, s: 8 },
        { x: -18, h: 16, s: 10 },
        { x: -8, h: 10, s: 7 },
        { x: 5, h: 18, s: 11 },
        { x: 15, h: 13, s: 9 },
        { x: 28, h: 15, s: 10 },
        { x: 38, h: 11, s: 8 },
      ].map((m, i) => (
        <mesh key={i} position={[m.x, m.h * 0.4, 0]}>
          <coneGeometry args={[m.s, m.h, 6]} />
          <meshStandardMaterial
            color="#1a0f08"
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  )
}

function ArmySilhouettes({ side }: { side: 'left' | 'right' }) {
  const xBase = side === 'left' ? -25 : 25
  const xDir = side === 'left' ? -1 : 1

  return (
    <group position={[xBase, 0, -15]}>
      {/* Spear/lance array representing distant armies */}
      {Array.from({ length: 20 }).map((_, i) => {
        const x = i * 1.2 * xDir
        const height = 3 + Math.random() * 1.5
        return (
          <group key={i} position={[x, 0, Math.random() * 5 - 2.5]}>
            {/* Spear shaft */}
            <mesh position={[0, height / 2, 0]}>
              <cylinderGeometry args={[0.02, 0.02, height, 4]} />
              <meshStandardMaterial color="#1a1a1a" transparent opacity={0.25} />
            </mesh>
            {/* Spear tip */}
            <mesh position={[0, height + 0.15, 0]}>
              <coneGeometry args={[0.06, 0.3, 4]} />
              <meshStandardMaterial color="#2a2a2a" transparent opacity={0.25} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function SacredChariot() {
  return (
    <group position={[0, 0, -2]}>
      {/* Simplified chariot platform */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[3, 0.15, 2]} />
        <meshStandardMaterial color="#4a3520" roughness={0.8} />
      </mesh>
      {/* Chariot wheels */}
      {[-1.2, 1.2].map((x) => (
        <mesh key={x} position={[x, 0.4, 1]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.4, 0.05, 8, 16]} />
          <meshStandardMaterial color="#8b7355" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {/* Canopy posts */}
      {[
        [-1, 0.3, -0.8],
        [1, 0.3, -0.8],
        [-1, 0.3, 0.8],
        [1, 0.3, 0.8],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.03, 0.03, 2.5, 6]} />
          <meshStandardMaterial color="#d4a44c" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Canopy top */}
      <mesh position={[0, 2.8, 0]}>
        <boxGeometry args={[2.4, 0.06, 2]} />
        <meshStandardMaterial
          color="#8b0000"
          emissive="#4a0000"
          emissiveIntensity={0.2}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  )
}

function SunsetOrb() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.7 + Math.sin(clock.elapsedTime * 0.3) * 0.1
  })

  return (
    <Sphere ref={ref} args={[4, 32, 32]} position={[0, 12, -50]}>
      <meshBasicMaterial
        color="#ffc040"
        transparent
        opacity={0.7}
      />
    </Sphere>
  )
}

function GoldenDust() {
  const ref = useRef<THREE.Points>(null)
  const count = 200

  const positions = useRef(
    Float32Array.from({ length: count * 3 }, (_, i) => {
      const axis = i % 3
      if (axis === 0) return (Math.random() - 0.5) * 40
      if (axis === 1) return Math.random() * 4
      return (Math.random() - 0.5) * 20 - 5
    })
  )

  useFrame(({ clock }) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += Math.sin(clock.elapsedTime * 0.3 + i) * 0.002
      if (pos[i * 3 + 1] > 5) pos[i * 3 + 1] = 0
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
        color="#ffd700"
        size={0.04}
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  )
}

export default function KurukshetraScene() {
  return (
    <group>
      <BattlefieldGround />
      <DistantMountains />
      <ArmySilhouettes side="left" />
      <ArmySilhouettes side="right" />
      <SacredChariot />
      <SunsetOrb />
      <GoldenDust />

      {/* Warm battlefield lighting */}
      <pointLight position={[0, 12, -50]} intensity={2} color="#ffc040" distance={80} decay={1.5} />
      <pointLight position={[-10, 3, -5]} intensity={0.3} color="#ff8800" distance={20} decay={2} />
      <pointLight position={[10, 3, -5]} intensity={0.3} color="#ff6600" distance={20} decay={2} />

      {/* Fog — dusty battlefield atmosphere */}
      <fog attach="fog" args={['#2a1508', 15, 70]} />
    </group>
  )
}
