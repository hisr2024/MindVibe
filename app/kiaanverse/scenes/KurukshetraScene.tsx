/**
 * KurukshetraScene — The sacred battlefield at the twilight of ages.
 *
 * Vast open plain under a WARM molten sunset. The sunset orb is large
 * and bright, casting golden-orange light across the dusty battlefield.
 * Distant mountain silhouettes, sacred chariot, golden dust rising.
 *
 * Atmosphere: Epic, cinematic, warm. The golden hour before wisdom.
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

/** Warm brown battlefield ground */
function BattlefieldGround() {
  return (
    <Plane args={[200, 200, 1, 1]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <meshStandardMaterial color="#3a2210" roughness={0.95} metalness={0.02} />
    </Plane>
  )
}

/** Visible mountain silhouettes */
function DistantMountains() {
  const mountains = useMemo(() => [
    { x: -40, h: 14, s: 10 }, { x: -28, h: 20, s: 13 }, { x: -15, h: 11, s: 8 },
    { x: -5, h: 24, s: 15 }, { x: 8, h: 16, s: 10 }, { x: 20, h: 22, s: 14 },
    { x: 32, h: 13, s: 9 }, { x: 44, h: 17, s: 11 },
  ], [])

  return (
    <group position={[0, 0, -70]}>
      {mountains.map((m, i) => (
        <mesh key={i} position={[m.x, m.h * 0.35, 0]}>
          <coneGeometry args={[m.s, m.h, 5]} />
          <meshStandardMaterial color="#1a0e08" transparent opacity={0.65} />
        </mesh>
      ))}
    </group>
  )
}

/** Faint army silhouettes */
function ArmySilhouettes({ side }: { side: 'left' | 'right' }) {
  const xBase = side === 'left' ? -28 : 28
  const xDir = side === 'left' ? -1 : 1
  const sideSeed = side === 'left' ? 0 : 1000

  return (
    <group position={[xBase, 0, -18]}>
      {Array.from({ length: 20 }).map((_, i) => {
        const x = i * 1.1 * xDir
        const height = 2.5 + seeded(sideSeed + i) * 2
        const zOff = seeded(sideSeed + i + 100) * 6 - 3
        return (
          <group key={i} position={[x, 0, zOff]}>
            <mesh position={[0, height / 2, 0]}>
              <cylinderGeometry args={[0.02, 0.02, height, 3]} />
              <meshStandardMaterial color="#2a1808" transparent opacity={0.25} />
            </mesh>
            <mesh position={[0, height + 0.12, 0]}>
              <coneGeometry args={[0.05, 0.25, 3]} />
              <meshStandardMaterial color="#3a2210" transparent opacity={0.25} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

/** Sacred chariot */
function SacredChariot() {
  return (
    <group position={[0, 0, -2.5]}>
      {/* Platform */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[3.2, 0.12, 2.2]} />
        <meshStandardMaterial color="#4a3018" roughness={0.8} />
      </mesh>
      {/* Wheels */}
      {[-1.3, 1.3].map((x, i) => (
        <mesh key={i} position={[x, 0.35, 1.05]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.38, 0.04, 8, 20]} />
          <meshStandardMaterial color="#aa8855" metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
      {/* Canopy posts */}
      {[[-1.05, 0.25, -0.85], [1.05, 0.25, -0.85], [-1.05, 0.25, 0.85], [1.05, 0.25, 0.85]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.025, 0.025, 2.6, 6]} />
          <meshStandardMaterial color="#d4a44c" metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
      {/* Canopy */}
      <mesh position={[0, 2.8, 0]}>
        <boxGeometry args={[2.5, 0.05, 2.1]} />
        <meshStandardMaterial color="#8b1a1a" emissive="#5a0a0a" emissiveIntensity={0.25} transparent opacity={0.8} />
      </mesh>
      {/* Flag pole */}
      <mesh position={[0, 3.6, -0.9]}>
        <cylinderGeometry args={[0.012, 0.012, 1.5, 4]} />
        <meshStandardMaterial color="#d4a44c" metalness={0.7} roughness={0.25} />
      </mesh>
      {/* Flag */}
      <mesh position={[0.12, 3.9, -0.9]} rotation={[0, 0, 0.1]}>
        <planeGeometry args={[0.3, 0.2]} />
        <meshStandardMaterial color="#ff5500" emissive="#ff3300" emissiveIntensity={0.2} transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/** BRIGHT sunset orb — the hero of this scene */
function SunsetOrb() {
  const ref = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.85 + Math.sin(clock.elapsedTime * 0.2) * 0.06
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1.8 + Math.sin(clock.elapsedTime * 0.15) * 0.2)
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.15 + Math.sin(clock.elapsedTime * 0.25) * 0.04
    }
  })

  return (
    <group position={[0, 12, -55]}>
      {/* Bright sun */}
      <Sphere ref={ref} args={[5, 32, 32]}>
        <meshBasicMaterial color="#ff9944" transparent opacity={0.85} />
      </Sphere>
      {/* Sun glow halo */}
      <Sphere ref={glowRef} args={[6, 16, 16]}>
        <meshBasicMaterial
          color="#ff7722"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </Sphere>
    </group>
  )
}

/** Sun rays — visible golden streaks */
function SunRays() {
  const ref = useRef<THREE.Points>(null)
  const count = 100

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = seeded(i + 300) * Math.PI * 0.6 - Math.PI * 0.3
      const dist = 8 + seeded(i + 400) * 35
      pos[i * 3] = Math.sin(angle) * dist
      pos[i * 3 + 1] = 6 + seeded(i + 500) * 12
      pos[i * 3 + 2] = -25 - seeded(i + 600) * 30
    }
    return pos
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.PointsMaterial
    mat.opacity = 0.3 + Math.sin(clock.elapsedTime * 0.3) * 0.08
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#ffaa44"
        size={0.4}
        transparent
        opacity={0.3}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/** Golden dust particles rising — visible and warm */
function GoldenDust() {
  const ref = useRef<THREE.Points>(null)
  const count = 300

  const positions = useMemo(() =>
    Float32Array.from({ length: count * 3 }, (_, i) => {
      const axis = i % 3
      if (axis === 0) return (seeded(i + 500) - 0.5) * 40
      if (axis === 1) return seeded(i + 700) * 4
      return (seeded(i + 900) - 0.5) * 25 - 5
    }), [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += Math.sin(clock.elapsedTime * 0.2 + i * 0.8) * 0.002
      if (pos[i * 3 + 1] > 5) pos[i * 3 + 1] = 0
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#ffd700"
        size={0.05}
        transparent
        opacity={0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
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
      <SunRays />
      <GoldenDust />

      {/* STRONG warm battlefield lighting from sunset */}
      <pointLight position={[0, 12, -55]} intensity={4} color="#ff8833" distance={100} decay={1} />
      <pointLight position={[-10, 4, -6]} intensity={0.8} color="#ff7722" distance={28} decay={1.5} />
      <pointLight position={[10, 4, -6]} intensity={0.8} color="#ff5522" distance={28} decay={1.5} />
      <pointLight position={[0, 1.5, 4]} intensity={0.4} color="#ffc040" distance={10} decay={2} />

      {/* Base ambient — warm brown, not black */}
      <ambientLight intensity={0.12} color="#2a1a0a" />

      <fog attach="fog" args={['#1a1008', 18, 90]} />
    </group>
  )
}
