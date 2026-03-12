/**
 * LotusMeditationScene — Serene lotus pond at the golden hour of dawn.
 *
 * Warm indigo water lit by golden dawn light. Bright pink lotuses
 * glow with warm self-illumination. Golden mist catches the light.
 * Rising sparkles drift upward like prayers.
 *
 * Atmosphere: Absolute peace. Golden warmth. Silence made visible.
 */

'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

function StillWater() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.15 + Math.sin(clock.elapsedTime * 0.15) * 0.05
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
      <planeGeometry args={[120, 120]} />
      <meshStandardMaterial
        color="#1a2e5a"
        emissive="#2a3e7a"
        emissiveIntensity={0.15}
        metalness={0.85}
        roughness={0.15}
        transparent
        opacity={0.95}
      />
    </mesh>
  )
}

function MeditationPlatform() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[1.8, 2.2, 0.08, 32]} />
        <meshStandardMaterial color="#8a8a7a" roughness={0.8} metalness={0.1} />
      </mesh>
      <pointLight position={[0, 0.3, 0]} intensity={1.5} color="#ffd700" distance={6} decay={2} />
    </group>
  )
}

function GiantLotus({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const ref = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.25 + position[0] * 1.5) * 0.03
    ref.current.rotation.y = clock.elapsedTime * 0.015
  })

  return (
    <group ref={ref} position={position} scale={scale}>
      {/* Lily pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <circleGeometry args={[0.8, 24]} />
        <meshStandardMaterial
          color="#2a7a3a"
          emissive="#1a5a2a"
          emissiveIntensity={0.3}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Outer petals */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.32, 0.08, Math.sin(angle) * 0.32]}
            rotation={[0.45, angle, 0]}
          >
            <coneGeometry args={[0.14, 0.3, 6]} />
            <meshStandardMaterial
              color="#ff88a8"
              emissive="#ff5588"
              emissiveIntensity={1.0}
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}
      {/* Middle petals */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2 + 0.2
        return (
          <mesh
            key={`mid-${i}`}
            position={[Math.cos(angle) * 0.18, 0.14, Math.sin(angle) * 0.18]}
            rotation={[0.35, angle, 0]}
          >
            <coneGeometry args={[0.1, 0.22, 6]} />
            <meshStandardMaterial
              color="#ffb0cc"
              emissive="#ff88aa"
              emissiveIntensity={1.2}
              transparent
              opacity={0.92}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}
      {/* Inner petals */}
      {Array.from({ length: 4 }).map((_, i) => {
        const angle = (i / 4) * Math.PI * 2 + 0.4
        return (
          <mesh
            key={`in-${i}`}
            position={[Math.cos(angle) * 0.08, 0.18, Math.sin(angle) * 0.08]}
            rotation={[0.25, angle, 0]}
          >
            <coneGeometry args={[0.06, 0.15, 6]} />
            <meshStandardMaterial
              color="#ffd4e0"
              emissive="#ffaacc"
              emissiveIntensity={1.5}
              transparent
              opacity={0.95}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}
      {/* Golden center */}
      <mesh position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshBasicMaterial color="#ffd700" />
      </mesh>
      {/* Self-illumination */}
      <pointLight position={[0, 0.25, 0]} intensity={0.8} color="#ffaacc" distance={4} decay={2} />
    </group>
  )
}

function DawnMist() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.1 + Math.sin(clock.elapsedTime * 0.1) * 0.03
    ref.current.rotation.y = clock.elapsedTime * 0.005
  })

  return (
    <mesh position={[0, 3, 0]}>
      <sphereGeometry args={[35, 16, 16]} />
      <meshBasicMaterial color="#ffeedd" transparent opacity={0.1} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  )
}

function WaterMotes() {
  const ref = useRef<THREE.Points>(null)
  const count = 120

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (seeded(i + 100) - 0.5) * 25
      pos[i * 3 + 1] = -0.12 + seeded(i + 200) * 0.1
      pos[i * 3 + 2] = (seeded(i + 300) - 0.5) * 25
    }
    return pos
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.PointsMaterial
    mat.opacity = 0.4 + Math.sin(clock.elapsedTime * 0.3) * 0.1
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#aaddff"
        size={0.1}
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

function RisingLightMotes() {
  const ref = useRef<THREE.Points>(null)
  const count = 60

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (seeded(i + 500) - 0.5) * 14
      pos[i * 3 + 1] = seeded(i + 600) * 5
      pos[i * 3 + 2] = (seeded(i + 700) - 0.5) * 14
    }
    return pos
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += 0.004
      pos[i * 3] += Math.sin(clock.elapsedTime * 0.2 + i * 2) * 0.003
      if (pos[i * 3 + 1] > 6) pos[i * 3 + 1] = -0.2
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
        size={0.06}
        transparent
        opacity={0.65}
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

      <GiantLotus position={[-2.5, -0.1, -3]} scale={1.3} />
      <GiantLotus position={[3, -0.1, -4.5]} scale={1.1} />
      <GiantLotus position={[-5, -0.1, -7]} scale={0.9} />
      <GiantLotus position={[1.5, -0.1, -8]} scale={1.2} />
      <GiantLotus position={[-1.5, -0.1, -2]} scale={0.8} />
      <GiantLotus position={[5, -0.1, -2.5]} scale={1.0} />
      <GiantLotus position={[-3.5, -0.1, -10]} scale={0.7} />
      <GiantLotus position={[4.5, -0.1, -9]} scale={0.85} />

      {/* Strong warm dawn lighting */}
      <pointLight position={[6, 12, -10]} intensity={4.0} color="#ffeedd" distance={60} decay={1.0} />
      <pointLight position={[-6, 10, -8]} intensity={2.5} color="#ffccaa" distance={40} decay={1.2} />
      <pointLight position={[0, 4, 5]} intensity={1.2} color="#ffd700" distance={18} decay={1.5} />
      <pointLight position={[0, 1, 0]} intensity={0.5} color="#aabbff" distance={10} decay={2} />

      <ambientLight intensity={0.3} color="#2a2a4a" />

      <fog attach="fog" args={['#1a1a35', 20, 65]} />
    </group>
  )
}
