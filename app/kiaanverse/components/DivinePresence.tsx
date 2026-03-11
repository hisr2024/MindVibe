/**
 * DivinePresence — Radiant divine light representing Krishna's presence.
 *
 * A blazing, warm golden orb that breathes with divine life —
 * surrounded by soft volumetric glow layers, warm particle wisps,
 * and a luminous lotus pedestal. No wireframes, no thin lines.
 *
 * State-driven intensity (idle → speaking → blessing → cosmic).
 */

'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useKiaanverseStore } from '@/stores/kiaanverseStore'

function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

/* ── Central Divine Light — blazing warm core ── */

function DivineLightCore() {
  const coreRef = useRef<THREE.Mesh>(null)
  const glow1Ref = useRef<THREE.Mesh>(null)
  const glow2Ref = useRef<THREE.Mesh>(null)
  const glow3Ref = useRef<THREE.Mesh>(null)
  const krishnaState = useKiaanverseStore((s) => s.krishnaState)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const isCosmic = krishnaState === 'cosmic-form'
    const isSpeaking = krishnaState === 'speaking' || krishnaState === 'reciting'

    const breathSpeed = isCosmic ? 0.8 : isSpeaking ? 1.2 : 0.5
    const breathAmp = isCosmic ? 0.2 : isSpeaking ? 0.1 : 0.05
    const baseScale = isCosmic ? 1.8 : isSpeaking ? 1.2 : 1.0
    const s = baseScale + Math.sin(t * breathSpeed) * breathAmp

    if (coreRef.current) coreRef.current.scale.setScalar(s)
    if (glow1Ref.current) {
      glow1Ref.current.scale.setScalar(s * 2.8 + Math.sin(t * 0.4) * 0.3)
      const m = glow1Ref.current.material as THREE.MeshBasicMaterial
      m.opacity = isCosmic ? 0.45 : isSpeaking ? 0.35 : 0.25
    }
    if (glow2Ref.current) {
      glow2Ref.current.scale.setScalar(s * 5.0 + Math.sin(t * 0.25) * 0.5)
      const m = glow2Ref.current.material as THREE.MeshBasicMaterial
      m.opacity = isCosmic ? 0.2 : isSpeaking ? 0.14 : 0.1
    }
    if (glow3Ref.current) {
      glow3Ref.current.scale.setScalar(s * 8.0 + Math.sin(t * 0.15) * 0.8)
      const m = glow3Ref.current.material as THREE.MeshBasicMaterial
      m.opacity = isCosmic ? 0.1 : 0.06
    }
  })

  return (
    <group position={[0, 1.8, 0]}>
      {/* Blazing inner core — bright warm white */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshBasicMaterial color="#fffaf0" transparent opacity={0.98} />
      </mesh>

      {/* First glow layer — rich gold */}
      <mesh ref={glow1Ref}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#ffd700"
          transparent
          opacity={0.3}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Second glow layer — warm amber */}
      <mesh ref={glow2Ref}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          color="#ffaa33"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Third glow layer — softest outer haze */}
      <mesh ref={glow3Ref}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#ff8844"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/* ── Radiant Halo Rings — thick glowing bands, NOT wireframe tori ── */

function RadiantHalos() {
  const groupRef = useRef<THREE.Group>(null)
  const krishnaState = useKiaanverseStore((s) => s.krishnaState)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime
    const speed = krishnaState === 'cosmic-form' ? 0.25 : 0.06
    groupRef.current.rotation.y = t * speed

    groupRef.current.children.forEach((child, i) => {
      child.rotation.x = Math.PI / 2 + Math.sin(t * 0.15 + i * 1.2) * 0.08
      child.rotation.z = t * (0.02 + i * 0.01) * (i % 2 === 0 ? 1 : -1)
    })
  })

  const isCosmic = krishnaState === 'cosmic-form'
  const isActive = krishnaState === 'speaking' || krishnaState === 'blessing' || krishnaState === 'reciting'
  const opacity = isCosmic ? 0.6 : isActive ? 0.4 : 0.25

  return (
    <group ref={groupRef} position={[0, 1.8, 0]}>
      {/* Thick glowing rings using torus with substantial tube radius */}
      {[
        { radius: 1.0, tube: 0.06, color: '#ffd700' },
        { radius: 1.5, tube: 0.05, color: '#ffcc44' },
        { radius: 2.1, tube: 0.04, color: '#ffaa33' },
      ].map((ring, i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.4, i * 0.6, 0]}>
          <torusGeometry args={[ring.radius, ring.tube, 24, 80]} />
          <meshBasicMaterial
            color={ring.color}
            transparent
            opacity={opacity - i * 0.06}
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
  const count = 250

  const { positions, seeds } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const s = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const theta = seeded(i) * Math.PI * 2
      const phi = Math.acos(2 * seeded(i + 500) - 1)
      const r = 0.6 + seeded(i + 1000) * 2.5
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = 1.8 + r * Math.sin(phi) * Math.sin(theta) * 0.6
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
      c[i * 3 + 1] = 0.85 + warmth * 0.12
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
    const expansion = isCosmic ? 2.2 : isBlessing ? 1.5 : isSpeaking ? 1.2 : 1.0

    for (let i = 0; i < count; i++) {
      const seed = seeds[i]
      const theta = seed * Math.PI * 2 + t * 0.06 * (seed > 0.5 ? 1 : -1)
      const phi = Math.acos(2 * seeded(i + 500) - 1)
      const baseR = 0.6 + seed * 2.5
      const r = baseR * expansion + Math.sin(t * 0.5 + seed * 10) * 0.15

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = 1.8 + r * Math.sin(phi) * Math.sin(theta) * 0.6
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
        size={0.09}
        transparent
        opacity={0.9}
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
  const count = 60
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
    const riseSpeed = isActive ? 0.012 : 0.005

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += riseSpeed + Math.sin(clock.elapsedTime + i) * 0.002
      pos[i * 3] += Math.sin(clock.elapsedTime * 0.3 + i * 0.5) * 0.003
      if (pos[i * 3 + 1] > 6) {
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
        size={0.06}
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/* ── Lotus Base — luminous warm petals ── */

function LotusBase() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = clock.elapsedTime * 0.025
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Outer petals — bright pink with strong emissive */}
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.6, 0.06, Math.sin(angle) * 0.6]}
            rotation={[0.5, angle, 0]}
          >
            <coneGeometry args={[0.14, 0.35, 6]} />
            <meshStandardMaterial
              color="#ff99bb"
              emissive="#ff6699"
              emissiveIntensity={1.2}
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}
      {/* Inner petals */}
      {Array.from({ length: 7 }).map((_, i) => {
        const angle = (i / 7) * Math.PI * 2 + 0.25
        return (
          <mesh
            key={`inner-${i}`}
            position={[Math.cos(angle) * 0.32, 0.12, Math.sin(angle) * 0.32]}
            rotation={[0.35, angle, 0]}
          >
            <coneGeometry args={[0.09, 0.25, 6]} />
            <meshStandardMaterial
              color="#ffbbdd"
              emissive="#ff88bb"
              emissiveIntensity={1.5}
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}
      {/* Golden center */}
      <mesh position={[0, 0.16, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color="#ffd700" />
      </mesh>
      {/* Lotus glow */}
      <pointLight position={[0, 0.3, 0]} intensity={1.5} color="#ffcc88" distance={5} decay={2} />
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
      <RadiantHalos />
      <WarmParticles />
      <RisingMotes />

      {/* Primary divine light — warm, strong, illuminates the scene */}
      <pointLight
        position={[0, 1.8, 0.5]}
        intensity={isCosmic ? 8.0 : isActive ? 5.0 : 3.0}
        color="#ffd700"
        distance={isCosmic ? 30 : 18}
        decay={1.2}
      />

      {/* Fill from behind */}
      <pointLight
        position={[0, 1.8, -1]}
        intensity={isCosmic ? 3.0 : isActive ? 2.0 : 1.0}
        color="#ffcc66"
        distance={15}
        decay={1.5}
      />

      {/* Warm uplight from lotus */}
      <pointLight
        position={[0, 0.4, 0]}
        intensity={1.0}
        color="#ff9944"
        distance={6}
        decay={2}
      />
    </group>
  )
}
