/**
 * LotusMeditationScene — Serene lotus pond at the golden hour of dawn.
 *
 * Warm blue-indigo water lit by golden dawn light. Soft pink lotuses
 * glow with warm self-illumination. Gentle mist catches the light.
 * Rising sparkles drift upward like prayers.
 *
 * Atmosphere: Absolute peace. Golden warmth. Silence made visible.
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

/** Still water — deep blue with visible reflective sheen */
function StillWater() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.08 + Math.sin(clock.elapsedTime * 0.15) * 0.03
  })

  return (
    <Plane ref={ref} args={[120, 120, 1, 1]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
      <meshStandardMaterial
        color="#0c1e3a"
        emissive="#162848"
        emissiveIntensity={0.08}
        metalness={0.9}
        roughness={0.1}
        transparent
        opacity={0.95}
      />
    </Plane>
  )
}

/** Stone meditation platform — visible, warm */
function MeditationPlatform() {
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ringRef.current) return
    ringRef.current.rotation.z = clock.elapsedTime * 0.015
  })

  return (
    <group position={[0, 0, 0]}>
      {/* Stone platform — lighter gray */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[1.8, 2.2, 0.08, 24]} />
        <meshStandardMaterial color="#7a7a6a" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Sacred ring — warm gold */}
      <mesh ref={ringRef} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 1.5, 8]} />
        <meshStandardMaterial
          color="#d4a44c"
          emissive="#ffd700"
          emissiveIntensity={0.2}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Warm center light */}
      <pointLight position={[0, 0.3, 0]} intensity={0.8} color="#ffd700" distance={5} decay={2} />
    </group>
  )
}

/** Lotus flowers — warm, glowing, cone-petal shapes */
function GiantLotus({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const ref = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.25 + position[0] * 1.5) * 0.02
    ref.current.rotation.y = clock.elapsedTime * 0.012
  })

  return (
    <group ref={ref} position={position} scale={scale}>
      {/* Lily pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <circleGeometry args={[0.8, 16]} />
        <meshStandardMaterial color="#1a5a2a" emissive="#0a3a1a" emissiveIntensity={0.12} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Outer petals */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const r = 0.32
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * r, 0.08, Math.sin(angle) * r]}
            rotation={[0.45, angle, 0]}
          >
            <coneGeometry args={[0.14, 0.3, 4]} />
            <meshStandardMaterial
              color="#ff88a8"
              emissive="#ff6688"
              emissiveIntensity={0.35}
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}
      {/* Middle ring */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2 + 0.2
        const r = 0.18
        return (
          <mesh
            key={`mid-${i}`}
            position={[Math.cos(angle) * r, 0.14, Math.sin(angle) * r]}
            rotation={[0.35, angle, 0]}
          >
            <coneGeometry args={[0.1, 0.22, 4]} />
            <meshStandardMaterial
              color="#ffb0c8"
              emissive="#ff88a8"
              emissiveIntensity={0.4}
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}
      {/* Inner petals */}
      {Array.from({ length: 4 }).map((_, i) => {
        const angle = (i / 4) * Math.PI * 2 + 0.4
        const r = 0.08
        return (
          <mesh
            key={`in-${i}`}
            position={[Math.cos(angle) * r, 0.18, Math.sin(angle) * r]}
            rotation={[0.25, angle, 0]}
          >
            <coneGeometry args={[0.06, 0.15, 4]} />
            <meshStandardMaterial
              color="#ffd4e0"
              emissive="#ffb0c8"
              emissiveIntensity={0.5}
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}
      {/* Golden center */}
      <Sphere args={[0.05, 10, 10]} position={[0, 0.22, 0]}>
        <meshStandardMaterial color="#ffd700" emissive="#ffaa00" emissiveIntensity={0.7} />
      </Sphere>
      {/* Self-illumination */}
      <pointLight position={[0, 0.25, 0]} intensity={0.3} color="#ffaacc" distance={3} decay={2} />
    </group>
  )
}

/** Dawn mist — warm golden haze, visible */
function DawnMist() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.06 + Math.sin(clock.elapsedTime * 0.1) * 0.02
    ref.current.rotation.y = clock.elapsedTime * 0.004
  })

  return (
    <Sphere ref={ref} args={[35, 16, 16]} position={[0, 3, 0]}>
      <meshBasicMaterial color="#ffeedd" transparent opacity={0.06} side={THREE.BackSide} />
    </Sphere>
  )
}

/** Water surface sparkles */
function WaterMotes() {
  const ref = useRef<THREE.Points>(null)
  const count = 100

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (seeded(i + 100) - 0.5) * 25
      pos[i * 3 + 1] = -0.14 + seeded(i + 200) * 0.08
      pos[i * 3 + 2] = (seeded(i + 300) - 0.5) * 25
    }
    return pos
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.PointsMaterial
    mat.opacity = 0.25 + Math.sin(clock.elapsedTime * 0.3) * 0.08
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#aaccff"
        size={0.08}
        transparent
        opacity={0.25}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/** Rising light motes — prayers ascending */
function RisingLightMotes() {
  const ref = useRef<THREE.Points>(null)
  const count = 50

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (seeded(i + 500) - 0.5) * 12
      pos[i * 3 + 1] = seeded(i + 600) * 4
      pos[i * 3 + 2] = (seeded(i + 700) - 0.5) * 12
    }
    return pos
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += 0.003
      pos[i * 3] += Math.sin(clock.elapsedTime * 0.2 + i * 2) * 0.002
      if (pos[i * 3 + 1] > 5) pos[i * 3 + 1] = -0.1
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#ffeebb"
        size={0.04}
        transparent
        opacity={0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

export default function LotusMeditationScene() {
  return (
    <group>
      <StillWater />
      <MeditationPlatform />
      <DawnMist />
      <WaterMotes />
      <RisingLightMotes />

      {/* Lotuses */}
      <GiantLotus position={[-2.5, -0.1, -3]} scale={1.3} />
      <GiantLotus position={[3, -0.1, -4.5]} scale={1.1} />
      <GiantLotus position={[-5, -0.1, -7]} scale={0.9} />
      <GiantLotus position={[1.5, -0.1, -8]} scale={1.2} />
      <GiantLotus position={[-1.5, -0.1, -2]} scale={0.8} />
      <GiantLotus position={[5, -0.1, -2.5]} scale={1.0} />
      <GiantLotus position={[-3.5, -0.1, -10]} scale={0.7} />
      <GiantLotus position={[4.5, -0.1, -9]} scale={0.85} />

      {/* STRONG warm dawn lighting */}
      <pointLight position={[6, 10, -10]} intensity={2.5} color="#ffeedd" distance={50} decay={1.2} />
      <pointLight position={[-6, 8, -8]} intensity={1.5} color="#ffccaa" distance={35} decay={1.5} />
      <pointLight position={[0, 3, 5]} intensity={0.6} color="#ffd700" distance={15} decay={2} />
      <pointLight position={[0, 0.5, 0]} intensity={0.2} color="#aabbff" distance={8} decay={2} />

      {/* Base ambient — warm, not black */}
      <ambientLight intensity={0.1} color="#1a1a2a" />

      <fog attach="fog" args={['#0c1020', 12, 55]} />
    </group>
  )
}
