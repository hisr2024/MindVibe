/**
 * KurukshetraScene — The sacred battlefield at the twilight of ages.
 *
 * Vast open plain under a molten sunset sky. Distant mountain silhouettes,
 * the sacred chariot at center, golden dust rising like prayers,
 * and faint army formations dissolving into heat haze.
 *
 * Atmosphere: Epic, cinematic, reverent. The stillness before wisdom.
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

function BattlefieldGround() {
  return (
    <Plane args={[300, 300, 1, 1]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <meshStandardMaterial color="#2a1a0c" roughness={0.98} metalness={0.02} />
    </Plane>
  )
}

function DistantMountains() {
  const mountains = useMemo(() => [
    { x: -40, h: 14, s: 10 }, { x: -28, h: 20, s: 13 }, { x: -15, h: 11, s: 8 },
    { x: -5, h: 24, s: 15 }, { x: 8, h: 16, s: 10 }, { x: 20, h: 22, s: 14 },
    { x: 32, h: 13, s: 9 }, { x: 44, h: 17, s: 11 },
  ], [])

  return (
    <group position={[0, 0, -80]}>
      {mountains.map((m, i) => (
        <mesh key={i} position={[m.x, m.h * 0.35, 0]}>
          <coneGeometry args={[m.s, m.h, 5]} />
          <meshStandardMaterial color="#0f0805" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function ArmySilhouettes({ side }: { side: 'left' | 'right' }) {
  const xBase = side === 'left' ? -30 : 30
  const xDir = side === 'left' ? -1 : 1
  const sideSeed = side === 'left' ? 0 : 1000

  return (
    <group position={[xBase, 0, -20]}>
      {Array.from({ length: 25 }).map((_, i) => {
        const x = i * 1.0 * xDir
        const height = 2.5 + seeded(sideSeed + i) * 2
        const zOff = seeded(sideSeed + i + 100) * 8 - 4
        return (
          <group key={i} position={[x, 0, zOff]}>
            <mesh position={[0, height / 2, 0]}>
              <cylinderGeometry args={[0.015, 0.015, height, 3]} />
              <meshStandardMaterial color="#1a1208" transparent opacity={0.15} />
            </mesh>
            <mesh position={[0, height + 0.12, 0]}>
              <coneGeometry args={[0.04, 0.25, 3]} />
              <meshStandardMaterial color="#2a1a08" transparent opacity={0.15} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function SacredChariot() {
  return (
    <group position={[0, 0, -2.5]}>
      {/* Platform */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[3.2, 0.12, 2.2]} />
        <meshStandardMaterial color="#3a2510" roughness={0.85} />
      </mesh>
      {/* Wheels */}
      {[-1.3, 1.3].map((x, i) => (
        <mesh key={i} position={[x, 0.35, 1.05]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.38, 0.04, 8, 20]} />
          <meshStandardMaterial color="#8b7355" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Canopy posts */}
      {[[-1.05, 0.25, -0.85], [1.05, 0.25, -0.85], [-1.05, 0.25, 0.85], [1.05, 0.25, 0.85]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.025, 0.025, 2.6, 6]} />
          <meshStandardMaterial color="#c4944c" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Canopy */}
      <mesh position={[0, 2.8, 0]}>
        <boxGeometry args={[2.5, 0.05, 2.1]} />
        <meshStandardMaterial color="#6b0000" emissive="#3a0000" emissiveIntensity={0.15} transparent opacity={0.75} />
      </mesh>
      {/* Sacred Dhvaja (flag) atop */}
      <mesh position={[0, 3.6, -0.9]}>
        <cylinderGeometry args={[0.012, 0.012, 1.5, 4]} />
        <meshStandardMaterial color="#c4944c" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.12, 3.9, -0.9]} rotation={[0, 0, 0.1]}>
        <planeGeometry args={[0.3, 0.2]} />
        <meshStandardMaterial color="#ff4500" emissive="#ff2200" emissiveIntensity={0.1} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function SunsetOrb() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.65 + Math.sin(clock.elapsedTime * 0.2) * 0.08
  })

  return (
    <Sphere ref={ref} args={[5, 32, 32]} position={[0, 14, -60]}>
      <meshBasicMaterial color="#ff8833" transparent opacity={0.65} />
    </Sphere>
  )
}

function SunRays() {
  const ref = useRef<THREE.Points>(null)
  const count = 80

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = seeded(i + 300) * Math.PI * 0.6 - Math.PI * 0.3
      const dist = 10 + seeded(i + 400) * 40
      pos[i * 3] = Math.sin(angle) * dist
      pos[i * 3 + 1] = 8 + seeded(i + 500) * 12
      pos[i * 3 + 2] = -30 - seeded(i + 600) * 30
    }
    return pos
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.PointsMaterial
    mat.opacity = 0.15 + Math.sin(clock.elapsedTime * 0.4) * 0.05
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffaa44" size={0.3} transparent opacity={0.15} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  )
}

function GoldenDust() {
  const ref = useRef<THREE.Points>(null)
  const count = 350

  const positions = useMemo(() =>
    Float32Array.from({ length: count * 3 }, (_, i) => {
      const axis = i % 3
      if (axis === 0) return (seeded(i + 500) - 0.5) * 50
      if (axis === 1) return seeded(i + 700) * 5
      return (seeded(i + 900) - 0.5) * 30 - 5
    }), [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += Math.sin(clock.elapsedTime * 0.2 + i * 0.8) * 0.002
      if (pos[i * 3 + 1] > 6) pos[i * 3 + 1] = 0
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffd700" size={0.035} transparent opacity={0.35} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
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

      {/* Warm battlefield lighting */}
      <pointLight position={[0, 14, -60]} intensity={2.5} color="#ff8833" distance={100} decay={1.2} />
      <pointLight position={[-12, 4, -8]} intensity={0.4} color="#ff7700" distance={25} decay={2} />
      <pointLight position={[12, 4, -8]} intensity={0.4} color="#ff5500" distance={25} decay={2} />
      <pointLight position={[0, 1, 3]} intensity={0.15} color="#ffc040" distance={8} decay={2} />

      <fog attach="fog" args={['#1a0c04', 12, 80]} />
    </group>
  )
}
