/**
 * KrishnaAvatar — 3D AI-driven Krishna character for VR.
 *
 * Divine blue figure with crown, flute, and flowing garments.
 * Built from Three.js primitives (no external models needed).
 * Responds to state changes with gesture animations.
 *
 * States: idle | speaking | listening | blessing | reciting | cosmic-form
 */

'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere } from '@react-three/drei'
import * as THREE from 'three'
import { useKiaanverseStore } from '@/stores/kiaanverseStore'

interface KrishnaAvatarProps {
  position?: [number, number, number]
}

export default function KrishnaAvatar({ position = [0, 0, 0] }: KrishnaAvatarProps) {
  const groupRef = useRef<THREE.Group>(null)
  const krishnaState = useKiaanverseStore((s) => s.krishnaState)

  const isActive = krishnaState === 'speaking' || krishnaState === 'blessing' || krishnaState === 'reciting'
  const isBlessing = krishnaState === 'blessing'
  const isCosmic = krishnaState === 'cosmic-form'

  /* Breathing & gesture animation */
  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime

    /* Gentle breathing sway */
    groupRef.current.position.y = position[1] + Math.sin(t * 0.8) * 0.02

    /* State-based posture */
    if (krishnaState === 'speaking') {
      groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.05
    } else if (krishnaState === 'listening') {
      groupRef.current.rotation.y = 0.1
    } else if (isCosmic) {
      groupRef.current.rotation.y = t * 0.2
      const scale = 1 + Math.sin(t * 0.5) * 0.15
      groupRef.current.scale.setScalar(scale)
    } else {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.02)
      groupRef.current.scale.setScalar(1)
    }
  })

  /* Divine aura color */
  const auraIntensity = useMemo(() => {
    if (isCosmic) return 1.5
    if (isBlessing) return 0.8
    if (isActive) return 0.5
    return 0.2
  }, [isCosmic, isBlessing, isActive])

  const bodyColor = isCosmic ? '#4444ff' : '#1e3a6e'
  const emissiveColor = isCosmic ? '#6666ff' : '#0a1a4a'

  return (
    <group ref={groupRef} position={position}>
      {/* ── Divine Aura (glowing sphere around body) ── */}
      <Sphere args={[1.2, 16, 16]} position={[0, 1, 0]}>
        <meshBasicMaterial
          color="#ffd700"
          transparent
          opacity={auraIntensity * 0.08}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* ── Crown (triple spires) ── */}
      <group position={[0, 2.25, 0]}>
        <mesh position={[0, 0.12, 0]}>
          <coneGeometry args={[0.06, 0.25, 4]} />
          <meshStandardMaterial color="#d4a44c" emissive="#ffd700" emissiveIntensity={0.4} metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[-0.1, 0.08, 0]}>
          <coneGeometry args={[0.04, 0.18, 4]} />
          <meshStandardMaterial color="#d4a44c" emissive="#ffd700" emissiveIntensity={0.3} metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0.1, 0.08, 0]}>
          <coneGeometry args={[0.04, 0.18, 4]} />
          <meshStandardMaterial color="#d4a44c" emissive="#ffd700" emissiveIntensity={0.3} metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Crown jewel */}
        <Sphere args={[0.03, 8, 8]} position={[0, 0.26, 0]}>
          <meshStandardMaterial color="#ff4500" emissive="#ff0000" emissiveIntensity={0.6} />
        </Sphere>
        {/* Peacock feather */}
        <mesh position={[0.12, 0.15, -0.03]} rotation={[0, 0, -0.3]}>
          <planeGeometry args={[0.06, 0.2]} />
          <meshStandardMaterial
            color="#006400"
            emissive="#00ff00"
            emissiveIntensity={0.15}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* ── Head ── */}
      <Sphere args={[0.18, 16, 16]} position={[0, 2.05, 0]}>
        <meshStandardMaterial color={bodyColor} emissive={emissiveColor} emissiveIntensity={0.15} />
      </Sphere>

      {/* ── Neck ── */}
      <mesh position={[0, 1.85, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.1, 8]} />
        <meshStandardMaterial color={bodyColor} emissive={emissiveColor} emissiveIntensity={0.1} />
      </mesh>

      {/* ── Upper body / torso ── */}
      <mesh position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.22, 0.18, 0.5, 8]} />
        <meshStandardMaterial color={bodyColor} emissive={emissiveColor} emissiveIntensity={0.1} />
      </mesh>

      {/* ── Kaustubha gem (chest jewel) ── */}
      <Sphere args={[0.03, 8, 8]} position={[0, 1.6, 0.19]}>
        <meshStandardMaterial color="#ff69b4" emissive="#ff1493" emissiveIntensity={0.8} />
      </Sphere>

      {/* ── Lower body / dhoti ── */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.18, 0.25, 0.8, 8]} />
        <meshStandardMaterial
          color="#d4a44c"
          emissive="#8b6914"
          emissiveIntensity={0.1}
          metalness={0.3}
          roughness={0.6}
        />
      </mesh>

      {/* ── Legs ── */}
      <mesh position={[-0.08, 0.3, 0]}>
        <cylinderGeometry args={[0.06, 0.05, 0.5, 6]} />
        <meshStandardMaterial color={bodyColor} emissive={emissiveColor} emissiveIntensity={0.05} />
      </mesh>
      <mesh position={[0.08, 0.3, 0]}>
        <cylinderGeometry args={[0.06, 0.05, 0.5, 6]} />
        <meshStandardMaterial color={bodyColor} emissive={emissiveColor} emissiveIntensity={0.05} />
      </mesh>

      {/* ── Feet ── */}
      <Sphere args={[0.06, 8, 4]} position={[-0.08, 0.04, 0.02]}>
        <meshStandardMaterial color={bodyColor} />
      </Sphere>
      <Sphere args={[0.06, 8, 4]} position={[0.08, 0.04, 0.02]}>
        <meshStandardMaterial color={bodyColor} />
      </Sphere>

      {/* ── Right arm ── */}
      <group>
        {isBlessing ? (
          /* Abhaya mudra — raised hand blessing */
          <group>
            <mesh position={[0.28, 1.75, 0]} rotation={[0, 0, -0.5]}>
              <cylinderGeometry args={[0.04, 0.04, 0.35, 6]} />
              <meshStandardMaterial color={bodyColor} emissive={emissiveColor} emissiveIntensity={0.1} />
            </mesh>
            <Sphere args={[0.06, 8, 8]} position={[0.4, 1.9, 0]}>
              <meshStandardMaterial color={bodyColor} emissive="#ffd700" emissiveIntensity={0.3} />
            </Sphere>
          </group>
        ) : (
          /* Relaxed arm */
          <mesh position={[0.25, 1.3, 0]} rotation={[0, 0, 0.15]}>
            <cylinderGeometry args={[0.04, 0.035, 0.5, 6]} />
            <meshStandardMaterial color={bodyColor} emissive={emissiveColor} emissiveIntensity={0.05} />
          </mesh>
        )}
      </group>

      {/* ── Left arm (holding flute) ── */}
      <mesh position={[-0.25, 1.45, 0.05]} rotation={[0.3, 0, -0.6]}>
        <cylinderGeometry args={[0.04, 0.035, 0.45, 6]} />
        <meshStandardMaterial color={bodyColor} emissive={emissiveColor} emissiveIntensity={0.05} />
      </mesh>

      {/* ── Flute ── */}
      <mesh position={[-0.35, 1.6, 0.12]} rotation={[0, 0, -0.8]}>
        <cylinderGeometry args={[0.012, 0.012, 0.4, 6]} />
        <meshStandardMaterial color="#d4a44c" emissive="#ffd700" emissiveIntensity={0.3} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* ── Divine point light emanating from Krishna ── */}
      <pointLight
        position={[0, 1.5, 0.5]}
        intensity={isActive ? 1.2 : 0.5}
        color="#ffd700"
        distance={5}
        decay={2}
      />
    </group>
  )
}
