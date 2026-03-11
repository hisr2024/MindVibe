/**
 * DivinePresence — Sacred geometry mandala representing Krishna's divine energy.
 *
 * Replaces physical character avatars with pure luminous presence:
 * - Rotating Sri Yantra–inspired triangular rings
 * - Breathing particle field that responds to interaction state
 * - Golden light rays and lotus base
 * - State-driven intensity (idle → speaking → blessing → cosmic)
 *
 * The divine is felt, not depicted.
 */

'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useKiaanverseStore } from '@/stores/kiaanverseStore'

/** Deterministic pseudo-random from seed (0–1 range) */
function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

/* ── Sacred Geometry Rings (Sri Yantra–inspired) ── */

function SacredRings() {
  const groupRef = useRef<THREE.Group>(null)
  const krishnaState = useKiaanverseStore((s) => s.krishnaState)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime
    const isCosmic = krishnaState === 'cosmic-form'
    const speed = isCosmic ? 0.4 : 0.12

    groupRef.current.rotation.y = t * speed
    groupRef.current.children.forEach((child, i) => {
      child.rotation.z = t * (0.05 + i * 0.02) * (i % 2 === 0 ? 1 : -1)
      child.rotation.x = Math.sin(t * 0.3 + i) * 0.15
    })
  })

  const isActive = krishnaState === 'speaking' || krishnaState === 'blessing' || krishnaState === 'reciting'
  const isCosmic = krishnaState === 'cosmic-form'
  const baseOpacity = isCosmic ? 0.6 : isActive ? 0.35 : 0.2

  const rings = useMemo(() => [
    { radius: 0.6, tube: 0.008, color: '#ffd700', segments: 3 },
    { radius: 0.9, tube: 0.006, color: '#ffaa33', segments: 3 },
    { radius: 1.2, tube: 0.005, color: '#ff8844', segments: 6 },
    { radius: 1.6, tube: 0.004, color: '#ffd700', segments: 6 },
    { radius: 2.0, tube: 0.003, color: '#ffcc55', segments: 8 },
  ], [])

  return (
    <group ref={groupRef} position={[0, 1.6, 0]}>
      {rings.map((ring, i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.4, i * 0.6, 0]}>
          <torusGeometry args={[ring.radius, ring.tube, 8, ring.segments]} />
          <meshBasicMaterial
            color={ring.color}
            transparent
            opacity={baseOpacity + (isCosmic ? 0.2 : 0)}
          />
        </mesh>
      ))}

      {/* Inner triangle pointing up (Shiva principle) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.3, 3]} />
        <meshBasicMaterial color="#ffd700" transparent opacity={baseOpacity * 1.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Inner triangle pointing down (Shakti principle) */}
      <mesh rotation={[Math.PI / 2, 0, Math.PI]}>
        <ringGeometry args={[0.22, 0.24, 3]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={baseOpacity * 1.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/* ── Central Light Core ── */

function LightCore() {
  const meshRef = useRef<THREE.Mesh>(null)
  const krishnaState = useKiaanverseStore((s) => s.krishnaState)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.elapsedTime
    const isCosmic = krishnaState === 'cosmic-form'
    const isSpeaking = krishnaState === 'speaking' || krishnaState === 'reciting'

    const breathScale = isCosmic
      ? 1.4 + Math.sin(t * 0.8) * 0.3
      : isSpeaking
        ? 1.0 + Math.sin(t * 1.2) * 0.12
        : 0.8 + Math.sin(t * 0.5) * 0.06

    meshRef.current.scale.setScalar(breathScale)

    const mat = meshRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = isCosmic ? 0.9 : isSpeaking ? 0.6 : 0.35
  })

  return (
    <mesh ref={meshRef} position={[0, 1.6, 0]}>
      <sphereGeometry args={[0.25, 32, 32]} />
      <meshBasicMaterial color="#fff8e7" transparent opacity={0.4} />
    </mesh>
  )
}

/* ── Radiance Glow (outer soft sphere) ── */

function RadianceGlow() {
  const meshRef = useRef<THREE.Mesh>(null)
  const krishnaState = useKiaanverseStore((s) => s.krishnaState)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.elapsedTime
    const isCosmic = krishnaState === 'cosmic-form'
    const isBlessing = krishnaState === 'blessing'

    const scale = isCosmic ? 3.5 : isBlessing ? 2.8 : 2.0
    const pulse = Math.sin(t * 0.4) * 0.2
    meshRef.current.scale.setScalar(scale + pulse)

    const mat = meshRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = isCosmic ? 0.12 : isBlessing ? 0.08 : 0.04
  })

  return (
    <mesh ref={meshRef} position={[0, 1.6, 0]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color="#ffd700" transparent opacity={0.05} side={THREE.BackSide} />
    </mesh>
  )
}

/* ── Breathing Particle Field ── */

function PresenceParticles() {
  const ref = useRef<THREE.Points>(null)
  const krishnaState = useKiaanverseStore((s) => s.krishnaState)
  const count = 400

  const { positions, seeds } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const s = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const theta = seeded(i) * Math.PI * 2
      const phi = Math.acos(2 * seeded(i + 500) - 1)
      const r = 0.4 + seeded(i + 1000) * 1.8
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = 1.6 + r * Math.sin(phi) * Math.sin(theta) * 0.6
      pos[i * 3 + 2] = r * Math.cos(phi)
      s[i] = seeded(i + 2000)
    }
    return { positions: pos, seeds: s }
  }, [])

  const colors = useMemo(() => {
    const c = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const warmth = seeded(i + 3000)
      c[i * 3] = 1.0
      c[i * 3 + 1] = 0.75 + warmth * 0.2
      c[i * 3 + 2] = 0.3 + warmth * 0.3
    }
    return c
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    const isCosmic = krishnaState === 'cosmic-form'
    const isSpeaking = krishnaState === 'speaking' || krishnaState === 'reciting'
    const isBlessing = krishnaState === 'blessing'

    const expansionMult = isCosmic ? 2.2 : isBlessing ? 1.5 : isSpeaking ? 1.15 : 1.0
    const speed = isSpeaking ? 1.5 : 0.6

    for (let i = 0; i < count; i++) {
      const seed = seeds[i]
      const theta = seed * Math.PI * 2 + t * 0.1 * (seed > 0.5 ? 1 : -1)
      const phi = Math.acos(2 * seeded(i + 500) - 1)
      const baseR = 0.4 + seed * 1.8
      const r = baseR * expansionMult + Math.sin(t * speed + seed * 10) * 0.15

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = 1.6 + r * Math.sin(phi) * Math.sin(theta) * 0.6
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  const particleSize = krishnaState === 'cosmic-form' ? 0.045 : 0.03

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={particleSize}
        transparent
        opacity={0.7}
        vertexColors
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/* ── Rising Light Motes (upward drifting sparks) ── */

function RisingMotes() {
  const ref = useRef<THREE.Points>(null)
  const count = 120
  const krishnaState = useKiaanverseStore((s) => s.krishnaState)

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (seeded(i + 7000) - 0.5) * 4
      pos[i * 3 + 1] = seeded(i + 8000) * 5
      pos[i * 3 + 2] = (seeded(i + 9000) - 0.5) * 4
    }
    return pos
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    const isActive = krishnaState === 'speaking' || krishnaState === 'blessing' || krishnaState === 'cosmic-form'
    const riseSpeed = isActive ? 0.012 : 0.004

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += riseSpeed + Math.sin(clock.elapsedTime + i) * 0.002
      pos[i * 3] += Math.sin(clock.elapsedTime * 0.3 + i * 0.5) * 0.003

      if (pos[i * 3 + 1] > 5) {
        pos[i * 3 + 1] = -0.5
        pos[i * 3] = (seeded(i + 7000 + Math.floor(clock.elapsedTime)) - 0.5) * 4
      }
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
        size={0.02}
        transparent
        opacity={0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/* ── Lotus Base ── */

function LotusBase() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = clock.elapsedTime * 0.03
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Lotus petals arranged in a circle at the base */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2
        const r = 0.5
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * r, 0.06, Math.sin(angle) * r]}
            rotation={[0.6, angle, 0]}
          >
            <sphereGeometry args={[0.15, 6, 4, 0, Math.PI]} />
            <meshStandardMaterial
              color="#ffb6c1"
              emissive="#ff69b4"
              emissiveIntensity={0.15}
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}
      {/* Inner ring */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2 + 0.2
        const r = 0.28
        return (
          <mesh
            key={`inner-${i}`}
            position={[Math.cos(angle) * r, 0.12, Math.sin(angle) * r]}
            rotation={[0.4, angle, 0]}
          >
            <sphereGeometry args={[0.1, 6, 4, 0, Math.PI]} />
            <meshStandardMaterial
              color="#ffe4e1"
              emissive="#ffb6c1"
              emissiveIntensity={0.2}
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}
      {/* Golden center */}
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffa500" emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}

/* ── Main Component ── */

interface DivinePresenceProps {
  position?: [number, number, number]
}

export default function DivinePresence({ position = [0, 0, 0] }: DivinePresenceProps) {
  const krishnaState = useKiaanverseStore((s) => s.krishnaState)

  const isActive = krishnaState === 'speaking' || krishnaState === 'blessing' || krishnaState === 'reciting'
  const isCosmic = krishnaState === 'cosmic-form'

  return (
    <group position={position}>
      <LotusBase />
      <SacredRings />
      <LightCore />
      <RadianceGlow />
      <PresenceParticles />
      <RisingMotes />

      {/* Divine point light emanating from presence center */}
      <pointLight
        position={[0, 1.6, 0.5]}
        intensity={isCosmic ? 3.0 : isActive ? 1.8 : 0.8}
        color="#ffd700"
        distance={isCosmic ? 15 : 8}
        decay={2}
      />

      {/* Subtle warm fill from below */}
      <pointLight
        position={[0, 0.3, 0]}
        intensity={0.3}
        color="#ff9944"
        distance={4}
        decay={2}
      />
    </group>
  )
}
