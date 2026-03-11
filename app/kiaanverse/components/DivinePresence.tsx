/**
 * DivinePresence — Radiant divine light representing Krishna's presence.
 *
 * A warm, luminous golden orb of light that breathes and pulses —
 * surrounded by soft concentric halos, gentle particle wisps,
 * and a glowing lotus base. Feels like sitting near a sacred flame.
 *
 * State-driven intensity (idle → speaking → blessing → cosmic).
 * The divine is FELT as warmth and light, not depicted as wireframes.
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

/* ── Central Divine Light (warm golden orb) ── */

function DivineLightCore() {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const haloRef = useRef<THREE.Mesh>(null)
  const krishnaState = useKiaanverseStore((s) => s.krishnaState)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const isCosmic = krishnaState === 'cosmic-form'
    const isSpeaking = krishnaState === 'speaking' || krishnaState === 'reciting'
    const isBlessing = krishnaState === 'blessing'

    if (meshRef.current) {
      const breathSpeed = isCosmic ? 0.8 : isSpeaking ? 1.2 : 0.5
      const breathAmp = isCosmic ? 0.25 : isSpeaking ? 0.12 : 0.06
      const scale = (isCosmic ? 1.6 : isSpeaking ? 1.1 : 0.9) + Math.sin(t * breathSpeed) * breathAmp
      meshRef.current.scale.setScalar(scale)
    }

    if (glowRef.current) {
      const gScale = isCosmic ? 5.0 : isBlessing ? 4.0 : isSpeaking ? 3.2 : 2.5
      const pulse = Math.sin(t * 0.4) * 0.4
      glowRef.current.scale.setScalar(gScale + pulse)
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = isCosmic ? 0.18 : isBlessing ? 0.14 : isSpeaking ? 0.1 : 0.07
    }

    if (haloRef.current) {
      const hScale = isCosmic ? 7.0 : isBlessing ? 5.5 : 4.0
      haloRef.current.scale.setScalar(hScale + Math.sin(t * 0.25) * 0.5)
      const mat = haloRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = isCosmic ? 0.08 : 0.04
    }
  })

  return (
    <group position={[0, 1.6, 0]}>
      {/* Inner bright core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshBasicMaterial color="#fff5e0" transparent opacity={0.95} />
      </mesh>

      {/* Mid glow — warm gold */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#ffd700"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Outer halo — very soft, large */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          color="#ffaa44"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/* ── Concentric Golden Halos (subtle rotating rings) ── */

function GoldenHalos() {
  const groupRef = useRef<THREE.Group>(null)
  const krishnaState = useKiaanverseStore((s) => s.krishnaState)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime
    const speed = krishnaState === 'cosmic-form' ? 0.3 : 0.08
    groupRef.current.rotation.y = t * speed

    groupRef.current.children.forEach((child, i) => {
      child.rotation.x = Math.sin(t * 0.2 + i * 1.5) * 0.12
      child.rotation.z = t * (0.03 + i * 0.015) * (i % 2 === 0 ? 1 : -1)
    })
  })

  const isCosmic = krishnaState === 'cosmic-form'
  const isActive = krishnaState === 'speaking' || krishnaState === 'blessing' || krishnaState === 'reciting'
  const opacity = isCosmic ? 0.5 : isActive ? 0.3 : 0.18

  return (
    <group ref={groupRef} position={[0, 1.6, 0]}>
      {[
        { radius: 0.8, tube: 0.015, color: '#ffd700' },
        { radius: 1.2, tube: 0.012, color: '#ffcc44' },
        { radius: 1.7, tube: 0.01, color: '#ffaa33' },
      ].map((ring, i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.5, i * 0.7, 0]}>
          <torusGeometry args={[ring.radius, ring.tube, 16, 64]} />
          <meshBasicMaterial
            color={ring.color}
            transparent
            opacity={opacity - i * 0.04}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

/* ── Warm Particle Cloud ── */

function WarmParticles() {
  const ref = useRef<THREE.Points>(null)
  const krishnaState = useKiaanverseStore((s) => s.krishnaState)
  const count = 300

  const { positions, seeds } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const s = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const theta = seeded(i) * Math.PI * 2
      const phi = Math.acos(2 * seeded(i + 500) - 1)
      const r = 0.5 + seeded(i + 1000) * 2.0
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = 1.6 + r * Math.sin(phi) * Math.sin(theta) * 0.5
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
      c[i * 3 + 1] = 0.82 + warmth * 0.15
      c[i * 3 + 2] = 0.5 + warmth * 0.3
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

    const expansion = isCosmic ? 2.0 : isBlessing ? 1.4 : isSpeaking ? 1.15 : 1.0

    for (let i = 0; i < count; i++) {
      const seed = seeds[i]
      const theta = seed * Math.PI * 2 + t * 0.08 * (seed > 0.5 ? 1 : -1)
      const phi = Math.acos(2 * seeded(i + 500) - 1)
      const baseR = 0.5 + seed * 2.0
      const r = baseR * expansion + Math.sin(t * 0.6 + seed * 10) * 0.1

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = 1.6 + r * Math.sin(phi) * Math.sin(theta) * 0.5
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        transparent
        opacity={0.8}
        vertexColors
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/* ── Rising Light Motes ── */

function RisingMotes() {
  const ref = useRef<THREE.Points>(null)
  const count = 80
  const krishnaState = useKiaanverseStore((s) => s.krishnaState)

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (seeded(i + 7000) - 0.5) * 3
      pos[i * 3 + 1] = seeded(i + 8000) * 4
      pos[i * 3 + 2] = (seeded(i + 9000) - 0.5) * 3
    }
    return pos
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    const isActive = krishnaState === 'speaking' || krishnaState === 'blessing' || krishnaState === 'cosmic-form'
    const riseSpeed = isActive ? 0.01 : 0.004

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += riseSpeed + Math.sin(clock.elapsedTime + i) * 0.001
      pos[i * 3] += Math.sin(clock.elapsedTime * 0.3 + i * 0.5) * 0.002
      if (pos[i * 3 + 1] > 5) {
        pos[i * 3 + 1] = -0.3
        pos[i * 3] = (seeded(i + 7000 + Math.floor(clock.elapsedTime)) - 0.5) * 3
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
        size={0.04}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/* ── Lotus Base (warm glowing petals) ── */

function LotusBase() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = clock.elapsedTime * 0.02
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Outer petals */}
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2
        const r = 0.55
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * r, 0.05, Math.sin(angle) * r]}
            rotation={[0.5, angle, 0]}
          >
            <coneGeometry args={[0.12, 0.3, 4]} />
            <meshStandardMaterial
              color="#ffb0c8"
              emissive="#ff8aa0"
              emissiveIntensity={0.4}
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}
      {/* Inner petals */}
      {Array.from({ length: 7 }).map((_, i) => {
        const angle = (i / 7) * Math.PI * 2 + 0.25
        const r = 0.3
        return (
          <mesh
            key={`inner-${i}`}
            position={[Math.cos(angle) * r, 0.1, Math.sin(angle) * r]}
            rotation={[0.35, angle, 0]}
          >
            <coneGeometry args={[0.08, 0.22, 4]} />
            <meshStandardMaterial
              color="#ffd0dd"
              emissive="#ffb0c8"
              emissiveIntensity={0.5}
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}
      {/* Golden center */}
      <mesh position={[0, 0.14, 0]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffaa00" emissiveIntensity={0.8} />
      </mesh>
      {/* Lotus glow light */}
      <pointLight position={[0, 0.2, 0]} intensity={0.6} color="#ffcc88" distance={3} decay={2} />
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
      <DivineLightCore />
      <GoldenHalos />
      <WarmParticles />
      <RisingMotes />

      {/* Primary divine light — warm and strong */}
      <pointLight
        position={[0, 1.6, 0.5]}
        intensity={isCosmic ? 5.0 : isActive ? 3.0 : 1.5}
        color="#ffd700"
        distance={isCosmic ? 20 : 12}
        decay={1.5}
      />

      {/* Fill light from core */}
      <pointLight
        position={[0, 1.6, -0.5]}
        intensity={isCosmic ? 2.0 : isActive ? 1.2 : 0.6}
        color="#ffcc66"
        distance={10}
        decay={2}
      />

      {/* Warm uplight from lotus */}
      <pointLight
        position={[0, 0.3, 0]}
        intensity={0.5}
        color="#ff9944"
        distance={5}
        decay={2}
      />
    </group>
  )
}
