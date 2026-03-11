/**
 * LotusMeditationScene — Serene lotus pond at the golden hour of dawn.
 *
 * Mirror-still water reflecting eternity, giant lotuses in full bloom,
 * a stone meditation platform, and warm mist dissolving into light.
 *
 * Atmosphere: Absolute peace. Silence made visible. The breath of God.
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

function StillWater() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.03 + Math.sin(clock.elapsedTime * 0.15) * 0.01
  })

  return (
    <Plane ref={ref} args={[150, 150, 1, 1]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
      <meshStandardMaterial color="#081828" emissive="#0a1a3a" emissiveIntensity={0.03} metalness={0.96} roughness={0.06} transparent opacity={0.92} />
    </Plane>
  )
}

function MeditationPlatform() {
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ringRef.current) return
    ringRef.current.rotation.z = clock.elapsedTime * 0.015
  })

  return (
    <group position={[0, 0, 0]}>
      {/* Stone lotus platform */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[1.8, 2.2, 0.08, 24]} />
        <meshStandardMaterial color="#666666" roughness={0.92} metalness={0.05} />
      </mesh>
      {/* Sacred ring */}
      <mesh ref={ringRef} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 1.5, 8]} />
        <meshStandardMaterial color="#c4944c" emissive="#ffd700" emissiveIntensity={0.06} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      {/* Soft center light */}
      <pointLight position={[0, 0.3, 0]} intensity={0.4} color="#ffd700" distance={4} decay={2} />
    </group>
  )
}

function GiantLotus({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const ref = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.25 + position[0] * 1.5) * 0.025
    ref.current.rotation.y = clock.elapsedTime * 0.015
  })

  return (
    <group ref={ref} position={position} scale={scale}>
      {/* Lily pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <circleGeometry args={[1.0, 16]} />
        <meshStandardMaterial color="#0f3a1a" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      {/* Petals — three layered rings */}
      {[0, 1, 2].map((ring) => (
        <group key={ring}>
          {Array.from({ length: 10 }).map((_, i) => {
            const angle = (i / 10) * Math.PI * 2 + ring * 0.18
            const r = 0.25 + ring * 0.18
            const tilt = 0.45 - ring * 0.12
            return (
              <mesh
                key={i}
                position={[Math.cos(angle) * r, 0.08 + ring * 0.1, Math.sin(angle) * r]}
                rotation={[tilt, angle, 0]}
              >
                <sphereGeometry args={[0.14 + ring * 0.025, 6, 4, 0, Math.PI]} />
                <meshStandardMaterial
                  color={ring === 0 ? '#ff69b4' : ring === 1 ? '#ffb6c1' : '#ffe4e1'}
                  emissive="#ff69b4"
                  emissiveIntensity={0.12}
                  transparent
                  opacity={0.75}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )
          })}
        </group>
      ))}
      {/* Center jewel */}
      <Sphere args={[0.07, 10, 10]} position={[0, 0.25, 0]}>
        <meshStandardMaterial color="#ffd700" emissive="#ffa500" emissiveIntensity={0.5} />
      </Sphere>
      {/* Self-illumination */}
      <pointLight position={[0, 0.3, 0]} intensity={0.15} color="#ffb6c1" distance={3} decay={2} />
    </group>
  )
}

function DawnMist() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.035 + Math.sin(clock.elapsedTime * 0.12) * 0.012
    ref.current.rotation.y = clock.elapsedTime * 0.005
  })

  return (
    <Sphere ref={ref} args={[45, 16, 16]} position={[0, 4, 0]}>
      <meshBasicMaterial color="#ffeedd" transparent opacity={0.035} side={THREE.BackSide} />
    </Sphere>
  )
}

function WaterMotes() {
  const ref = useRef<THREE.Points>(null)
  const count = 80

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (seeded(i + 100) - 0.5) * 30
      pos[i * 3 + 1] = -0.15 + seeded(i + 200) * 0.1
      pos[i * 3 + 2] = (seeded(i + 300) - 0.5) * 30
    }
    return pos
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.PointsMaterial
    mat.opacity = 0.15 + Math.sin(clock.elapsedTime * 0.3) * 0.06
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#88bbff" size={0.08} transparent opacity={0.15} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  )
}

function RisingLightMotes() {
  const ref = useRef<THREE.Points>(null)
  const count = 60

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (seeded(i + 500) - 0.5) * 15
      pos[i * 3 + 1] = seeded(i + 600) * 4
      pos[i * 3 + 2] = (seeded(i + 700) - 0.5) * 15
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
      <pointsMaterial color="#ffeebb" size={0.025} transparent opacity={0.35} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
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

      {/* Lotus formations */}
      <GiantLotus position={[-2.5, -0.1, -3]} scale={1.3} />
      <GiantLotus position={[3, -0.1, -4.5]} scale={1.1} />
      <GiantLotus position={[-5, -0.1, -7]} scale={0.9} />
      <GiantLotus position={[1.5, -0.1, -8]} scale={1.2} />
      <GiantLotus position={[-1.5, -0.1, -2]} scale={0.8} />
      <GiantLotus position={[5, -0.1, -2.5]} scale={1.0} />
      <GiantLotus position={[-3.5, -0.1, -10]} scale={0.7} />
      <GiantLotus position={[4.5, -0.1, -9]} scale={0.85} />

      {/* Soft dawn lighting */}
      <pointLight position={[6, 12, -12]} intensity={1.4} color="#ffeedd" distance={45} decay={1.5} />
      <pointLight position={[-6, 9, -10]} intensity={0.7} color="#ffccaa" distance={28} decay={2} />
      <pointLight position={[0, 3, 6]} intensity={0.3} color="#ffd700" distance={12} decay={2} />
      <pointLight position={[0, 0.5, 0]} intensity={0.1} color="#88bbff" distance={6} decay={2} />

      <fog attach="fog" args={['#080c18', 6, 42]} />
    </group>
  )
}
