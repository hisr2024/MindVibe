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
import * as THREE from 'three'

function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

function BattlefieldGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial
        color="#5a3a1a"
        emissive="#3a2210"
        emissiveIntensity={0.15}
        roughness={0.9}
        metalness={0.05}
      />
    </mesh>
  )
}

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
          <coneGeometry args={[m.s, m.h, 6]} />
          <meshStandardMaterial
            color="#2a1808"
            emissive="#1a0e05"
            emissiveIntensity={0.1}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
    </group>
  )
}

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
              <cylinderGeometry args={[0.03, 0.03, height, 4]} />
              <meshStandardMaterial color="#3a2210" transparent opacity={0.35} />
            </mesh>
            <mesh position={[0, height + 0.12, 0]}>
              <coneGeometry args={[0.06, 0.3, 4]} />
              <meshStandardMaterial color="#4a3018" transparent opacity={0.35} />
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
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[3.2, 0.12, 2.2]} />
        <meshStandardMaterial color="#6a4828" emissive="#3a2818" emissiveIntensity={0.15} roughness={0.75} />
      </mesh>
      {[-1.3, 1.3].map((x, i) => (
        <mesh key={i} position={[x, 0.35, 1.05]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.38, 0.05, 12, 24]} />
          <meshStandardMaterial color="#cc9944" emissive="#aa7722" emissiveIntensity={0.2} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {[[-1.05, 0.25, -0.85], [1.05, 0.25, -0.85], [-1.05, 0.25, 0.85], [1.05, 0.25, 0.85]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.03, 0.03, 2.6, 8]} />
          <meshStandardMaterial color="#d4a44c" emissive="#aa8833" emissiveIntensity={0.2} metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, 2.8, 0]}>
        <boxGeometry args={[2.5, 0.05, 2.1]} />
        <meshStandardMaterial color="#aa2222" emissive="#881111" emissiveIntensity={0.4} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 3.6, -0.9]}>
        <cylinderGeometry args={[0.015, 0.015, 1.5, 6]} />
        <meshStandardMaterial color="#d4a44c" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0.12, 3.9, -0.9]} rotation={[0, 0, 0.1]}>
        <planeGeometry args={[0.3, 0.2]} />
        <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={0.5} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function SunsetOrb() {
  const ref = useRef<THREE.Mesh>(null)
  const glow1Ref = useRef<THREE.Mesh>(null)
  const glow2Ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.92 + Math.sin(t * 0.2) * 0.05
    }
    if (glow1Ref.current) {
      glow1Ref.current.scale.setScalar(1.6 + Math.sin(t * 0.15) * 0.15)
      const mat = glow1Ref.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.3 + Math.sin(t * 0.25) * 0.06
    }
    if (glow2Ref.current) {
      glow2Ref.current.scale.setScalar(2.5 + Math.sin(t * 0.1) * 0.3)
      const mat = glow2Ref.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.12 + Math.sin(t * 0.18) * 0.03
    }
  })

  return (
    <group position={[0, 12, -55]}>
      {/* Bright blazing sun */}
      <mesh ref={ref}>
        <sphereGeometry args={[5, 32, 32]} />
        <meshBasicMaterial color="#ffaa44" transparent opacity={0.92} />
      </mesh>
      {/* Inner glow */}
      <mesh ref={glow1Ref}>
        <sphereGeometry args={[7, 24, 24]} />
        <meshBasicMaterial
          color="#ff8822"
          transparent
          opacity={0.25}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Outer warm haze */}
      <mesh ref={glow2Ref}>
        <sphereGeometry args={[10, 16, 16]} />
        <meshBasicMaterial
          color="#ff6611"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

function GoldenDust() {
  const ref = useRef<THREE.Points>(null)
  const count = 350

  const positions = useMemo(() =>
    Float32Array.from({ length: count * 3 }, (_, i) => {
      const axis = i % 3
      if (axis === 0) return (seeded(i + 500) - 0.5) * 45
      if (axis === 1) return seeded(i + 700) * 5
      return (seeded(i + 900) - 0.5) * 30 - 5
    }), [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += 0.003 + Math.sin(clock.elapsedTime * 0.2 + i * 0.8) * 0.002
      if (pos[i * 3 + 1] > 6) pos[i * 3 + 1] = 0
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
        size={0.07}
        transparent
        opacity={0.65}
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
      <GoldenDust />

      {/* Strong warm battlefield lighting from sunset */}
      <pointLight position={[0, 14, -55]} intensity={6.0} color="#ff9944" distance={120} decay={0.8} />
      <pointLight position={[-12, 6, -6]} intensity={1.5} color="#ff7722" distance={35} decay={1.2} />
      <pointLight position={[12, 6, -6]} intensity={1.5} color="#ff5522" distance={35} decay={1.2} />
      <pointLight position={[0, 2, 6]} intensity={0.8} color="#ffc040" distance={14} decay={1.5} />

      <ambientLight intensity={0.25} color="#4a2a10" />

      <fog attach="fog" args={['#2a1810', 25, 100]} />
    </group>
  )
}
