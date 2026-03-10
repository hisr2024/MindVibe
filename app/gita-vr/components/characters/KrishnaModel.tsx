/**
 * KrishnaModel — Lord Krishna 3D Character
 *
 * Procedural 3D model of Krishna built from Three.js primitives:
 * divine blue skin, golden crown (mukut), peacock feather, flute,
 * yellow pitambara, and sacred ornaments. Positioned on the chariot.
 *
 * Supports state-driven animation:
 * - idle: gentle breathing sway
 * - speaking: subtle body movement + mouth morph
 * - listening: head tilt
 * - blessing: right hand raised
 */

'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGitaVRStore } from '@/stores/gitaVRStore'

const KRISHNA_SKIN = '#4a7ab5'
const GOLD = '#d4a44c'
const BRIGHT_GOLD = '#FFD700'
const YELLOW = '#FFD93D'
const PEACOCK_GREEN = '#00695C'

export default function KrishnaModel() {
  const groupRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Group>(null)
  const rightArmRef = useRef<THREE.Group>(null)
  const leftArmRef = useRef<THREE.Group>(null)
  const mouthRef = useRef<THREE.Mesh>(null)

  const krishnaState = useGitaVRStore((s) => s.krishnaState)
  const audioPlaying = useGitaVRStore((s) => s.audioPlaying)

  // Crown jewel emissive material
  const crownMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: BRIGHT_GOLD,
    metalness: 0.9,
    roughness: 0.15,
    emissive: GOLD,
    emissiveIntensity: 0.3,
  }), [])

  const skinMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: KRISHNA_SKIN,
    roughness: 0.5,
    metalness: 0.05,
  }), [])

  useFrame((state) => {
    const time = state.clock.elapsedTime

    if (!groupRef.current) return

    // Idle breathing sway
    groupRef.current.position.y = Math.sin(time * 0.8) * 0.02

    // Head animation based on state
    if (headRef.current) {
      if (krishnaState === 'listening') {
        headRef.current.rotation.z = THREE.MathUtils.lerp(
          headRef.current.rotation.z, 0.1, 0.05
        )
      } else if (krishnaState === 'speaking') {
        headRef.current.rotation.z = Math.sin(time * 2) * 0.03
        headRef.current.rotation.x = Math.sin(time * 1.5) * 0.02
      } else {
        headRef.current.rotation.z = THREE.MathUtils.lerp(
          headRef.current.rotation.z, 0, 0.05
        )
      }
    }

    // Right arm — blessing gesture when speaking/blessing
    if (rightArmRef.current) {
      const targetRotation = (krishnaState === 'blessing' || krishnaState === 'speaking')
        ? -0.8 : 0.3
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(
        rightArmRef.current.rotation.z, targetRotation, 0.03
      )
    }

    // Mouth animation during speech
    if (mouthRef.current && audioPlaying) {
      const mouthOpen = Math.abs(Math.sin(time * 8)) * 0.04
      mouthRef.current.scale.y = 0.5 + mouthOpen * 5
    } else if (mouthRef.current) {
      mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, 0.5, 0.1)
    }
  })

  return (
    <group ref={groupRef} position={[0.3, 0.6, 0]}>
      {/* === BODY === */}
      {/* Torso */}
      <mesh position={[0, 1.2, 0]} material={skinMaterial}>
        <capsuleGeometry args={[0.22, 0.5, 8, 16]} />
      </mesh>

      {/* Pitambara (yellow dhoti/cloth) */}
      <mesh position={[0, 0.55, 0]}>
        <capsuleGeometry args={[0.2, 0.7, 8, 16]} />
        <meshStandardMaterial color={YELLOW} roughness={0.6} />
      </mesh>

      {/* Sacred thread (yajnopavita) */}
      <mesh position={[0, 1.2, 0.12]} rotation={[0.3, 0, 0.5]}>
        <torusGeometry args={[0.28, 0.01, 4, 16]} />
        <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.3} />
      </mesh>

      {/* === HEAD === */}
      <group ref={headRef} position={[0, 1.85, 0]}>
        {/* Face */}
        <mesh material={skinMaterial}>
          <sphereGeometry args={[0.18, 16, 16]} />
        </mesh>

        {/* Eyes — dark, compassionate */}
        <mesh position={[-0.065, 0.03, 0.15]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[0.065, 0.03, 0.15]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>

        {/* Eye whites */}
        <mesh position={[-0.065, 0.03, 0.14]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#FFFFF0" />
        </mesh>
        <mesh position={[0.065, 0.03, 0.14]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#FFFFF0" />
        </mesh>

        {/* Gentle smile */}
        <mesh ref={mouthRef} position={[0, -0.06, 0.16]}>
          <sphereGeometry args={[0.04, 8, 4, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial color="#8B4040" />
        </mesh>

        {/* Tilak (sacred mark) */}
        <mesh position={[0, 0.08, 0.175]}>
          <planeGeometry args={[0.025, 0.06]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.5} side={THREE.DoubleSide} />
        </mesh>

        {/* Hair */}
        <mesh position={[0, 0.05, -0.05]}>
          <sphereGeometry args={[0.19, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.5]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>

        {/* === CROWN (MUKUT) === */}
        <group position={[0, 0.22, 0]}>
          {/* Base crown ring */}
          <mesh material={crownMaterial}>
            <cylinderGeometry args={[0.15, 0.19, 0.08, 16]} />
          </mesh>
          {/* Crown peak */}
          <mesh position={[0, 0.15, 0]} material={crownMaterial}>
            <coneGeometry args={[0.12, 0.25, 8]} />
          </mesh>
          {/* Crown jewels */}
          <mesh position={[0, 0.04, 0.16]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[-0.1, 0.04, 0.12]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#0066FF" emissive="#0066FF" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0.1, 0.04, 0.12]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#00FF66" emissive="#00FF66" emissiveIntensity={0.3} />
          </mesh>

          {/* Peacock feather */}
          <group position={[0.05, 0.25, -0.05]} rotation={[0.3, 0, 0.2]}>
            {/* Feather shaft */}
            <mesh>
              <cylinderGeometry args={[0.005, 0.003, 0.5, 4]} />
              <meshStandardMaterial color={PEACOCK_GREEN} />
            </mesh>
            {/* Feather eye */}
            <mesh position={[0, 0.22, 0]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial
                color={PEACOCK_GREEN}
                emissive="#00897B"
                emissiveIntensity={0.4}
                metalness={0.3}
              />
            </mesh>
            {/* Feather eye center */}
            <mesh position={[0, 0.22, 0.02]}>
              <sphereGeometry args={[0.015, 8, 8]} />
              <meshStandardMaterial color="#1565C0" emissive="#1565C0" emissiveIntensity={0.3} />
            </mesh>
          </group>
        </group>

        {/* Earrings */}
        <mesh position={[-0.18, -0.02, 0]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color={BRIGHT_GOLD} metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh position={[0.18, -0.02, 0]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color={BRIGHT_GOLD} metalness={0.9} roughness={0.15} />
        </mesh>
      </group>

      {/* === ARMS === */}
      {/* Right arm (blessing gesture) */}
      <group ref={rightArmRef} position={[0.28, 1.35, 0]} rotation={[0, 0, 0.3]}>
        <mesh position={[0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={skinMaterial}>
          <capsuleGeometry args={[0.06, 0.25, 4, 8]} />
        </mesh>
        {/* Hand */}
        <mesh position={[0.35, 0.05, 0]} material={skinMaterial}>
          <sphereGeometry args={[0.06, 8, 8]} />
        </mesh>
        {/* Bracelet */}
        <mesh position={[0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.07, 0.015, 4, 12]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Left arm (holding flute) */}
      <group ref={leftArmRef} position={[-0.28, 1.35, 0]} rotation={[0.3, 0, -0.5]}>
        <mesh position={[-0.15, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={skinMaterial}>
          <capsuleGeometry args={[0.06, 0.25, 4, 8]} />
        </mesh>
        {/* Hand */}
        <mesh position={[-0.35, 0.05, 0]} material={skinMaterial}>
          <sphereGeometry args={[0.06, 8, 8]} />
        </mesh>
        {/* Bracelet */}
        <mesh position={[-0.22, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <torusGeometry args={[0.07, 0.015, 4, 12]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Flute (Murali) */}
        <mesh position={[-0.3, 0.1, 0.1]} rotation={[0.5, 0.3, 0]}>
          <cylinderGeometry args={[0.015, 0.02, 0.4, 8]} />
          <meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* === LEGS === */}
      <mesh position={[-0.1, 0.1, 0]} material={skinMaterial}>
        <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
      </mesh>
      <mesh position={[0.1, 0.1, 0]} material={skinMaterial}>
        <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
      </mesh>

      {/* Feet */}
      <mesh position={[-0.1, -0.2, 0.05]} material={skinMaterial}>
        <boxGeometry args={[0.08, 0.04, 0.12]} />
      </mesh>
      <mesh position={[0.1, -0.2, 0.05]} material={skinMaterial}>
        <boxGeometry args={[0.08, 0.04, 0.12]} />
      </mesh>

      {/* Neck ornament (Kaustubha jewel) */}
      <mesh position={[0, 1.55, 0.15]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial
          color="#FF1493"
          emissive="#FF1493"
          emissiveIntensity={0.5}
          metalness={0.3}
        />
      </mesh>

      {/* Necklace */}
      <mesh position={[0, 1.55, 0]}>
        <torusGeometry args={[0.16, 0.012, 4, 16]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Vaijayanti garland */}
      <mesh position={[0, 1.15, 0.18]} rotation={[0.2, 0, 0]}>
        <torusGeometry args={[0.2, 0.02, 4, 16]} />
        <meshStandardMaterial color="#FF6B6B" roughness={0.7} />
      </mesh>
    </group>
  )
}
