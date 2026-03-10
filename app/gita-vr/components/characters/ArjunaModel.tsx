/**
 * ArjunaModel — Arjuna 3D Character
 *
 * Procedural 3D model of Arjuna: warrior prince with armor,
 * Gandiva bow, and emotional pose states (distressed → listening → enlightened).
 * Positioned beside Krishna on the chariot.
 */

'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGitaVRStore } from '@/stores/gitaVRStore'

const ARMOR_SILVER = '#C0C0C0'
const ARMOR_DARK = '#4a4a5a'
const SKIN = '#C68642'
const BROWN = '#4a2a0a'
const GOLD = '#d4a44c'

export default function ArjunaModel() {
  const groupRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Group>(null)

  const arjunaState = useGitaVRStore((s) => s.arjunaState)

  const skinMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: SKIN,
    roughness: 0.5,
    metalness: 0.05,
  }), [])

  const armorMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: ARMOR_SILVER,
    metalness: 0.7,
    roughness: 0.3,
  }), [])

  useFrame((state) => {
    const time = state.clock.elapsedTime
    if (!groupRef.current || !headRef.current || !bodyRef.current) return

    // Breathing
    groupRef.current.position.y = Math.sin(time * 0.6) * 0.01

    // Emotional state animation
    switch (arjunaState) {
      case 'distressed':
        // Head bowed, body slumped
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0.3, 0.03)
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, 0.1, 0.03)
        break
      case 'listening':
        // Head up, attentive
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -0.05, 0.03)
        headRef.current.rotation.z = Math.sin(time * 0.5) * 0.02
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, 0, 0.03)
        break
      case 'enlightened':
        // Head up, slight tilt back, wonder
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -0.1, 0.03)
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, -0.05, 0.03)
        break
      default:
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, 0.03)
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, 0, 0.03)
    }
  })

  return (
    <group ref={groupRef} position={[-0.6, 0.6, 0.3]} rotation={[0, 0.3, 0]}>
      {/* === BODY === */}
      <group ref={bodyRef}>
        {/* Torso */}
        <mesh position={[0, 1.15, 0]} material={skinMaterial}>
          <capsuleGeometry args={[0.24, 0.5, 8, 16]} />
        </mesh>

        {/* Chest armor plate */}
        <mesh position={[0, 1.2, 0.15]} material={armorMaterial}>
          <boxGeometry args={[0.35, 0.4, 0.06]} />
        </mesh>

        {/* Shoulder armor */}
        <mesh position={[-0.28, 1.38, 0]} material={armorMaterial}>
          <sphereGeometry args={[0.09, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position={[0.28, 1.38, 0]} material={armorMaterial}>
          <sphereGeometry args={[0.09, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>

        {/* Lower body / dhoti */}
        <mesh position={[0, 0.55, 0]}>
          <capsuleGeometry args={[0.2, 0.7, 8, 16]} />
          <meshStandardMaterial color="#F5F5DC" roughness={0.6} />
        </mesh>

        {/* Arms */}
        {/* Right arm */}
        <group position={[0.32, 1.3, 0]} rotation={[0.2, 0, 0.4]}>
          <mesh position={[0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={skinMaterial}>
            <capsuleGeometry args={[0.065, 0.25, 4, 8]} />
          </mesh>
          <mesh position={[0.35, 0, 0]} material={skinMaterial}>
            <sphereGeometry args={[0.06, 8, 8]} />
          </mesh>
          {/* Arm guard */}
          <mesh position={[0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={armorMaterial}>
            <cylinderGeometry args={[0.075, 0.07, 0.12, 8]} />
          </mesh>
        </group>

        {/* Left arm */}
        <group position={[-0.32, 1.3, 0]} rotation={[0.3, 0, -0.6]}>
          <mesh position={[-0.15, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={skinMaterial}>
            <capsuleGeometry args={[0.065, 0.25, 4, 8]} />
          </mesh>
          <mesh position={[-0.35, 0, 0]} material={skinMaterial}>
            <sphereGeometry args={[0.06, 8, 8]} />
          </mesh>
          {/* Arm guard */}
          <mesh position={[-0.1, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={armorMaterial}>
            <cylinderGeometry args={[0.075, 0.07, 0.12, 8]} />
          </mesh>
        </group>

        {/* Legs */}
        <mesh position={[-0.1, 0.1, 0]} material={skinMaterial}>
          <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
        </mesh>
        <mesh position={[0.1, 0.1, 0]} material={skinMaterial}>
          <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
        </mesh>
      </group>

      {/* === HEAD === */}
      <group ref={headRef} position={[0, 1.82, 0]}>
        {/* Face */}
        <mesh material={skinMaterial}>
          <sphereGeometry args={[0.17, 16, 16]} />
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.06, 0.03, 0.14]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#FFFFF0" />
        </mesh>
        <mesh position={[0.06, 0.03, 0.14]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#FFFFF0" />
        </mesh>
        <mesh position={[-0.06, 0.03, 0.155]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color="#2a1a0a" />
        </mesh>
        <mesh position={[0.06, 0.03, 0.155]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color="#2a1a0a" />
        </mesh>

        {/* Hair */}
        <mesh position={[0, 0.04, -0.03]}>
          <sphereGeometry args={[0.18, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.5]} />
          <meshStandardMaterial color={BROWN} />
        </mesh>

        {/* Warrior headband */}
        <mesh position={[0, 0.08, 0]}>
          <torusGeometry args={[0.175, 0.02, 4, 16]} />
          <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Small forehead jewel */}
        <mesh position={[0, 0.1, 0.17]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={0.3} />
        </mesh>

        {/* Earrings */}
        <mesh position={[-0.17, -0.02, 0]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0.17, -0.02, 0]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* === GANDIVA BOW === */}
      <group position={[-0.5, 0.8, -0.1]} rotation={[0.1, 0.3, 0.5]}>
        {/* Bow curve — approximated with tube */}
        <mesh>
          <torusGeometry args={[0.5, 0.02, 4, 16, Math.PI]} />
          <meshStandardMaterial color={BROWN} roughness={0.5} />
        </mesh>
        {/* Bow string */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.005, 0.005, 1.0, 4]} />
          <meshStandardMaterial color="#DDD" />
        </mesh>
        {/* Gold tips */}
        <mesh position={[0.5, 0, 0]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[-0.5, 0, 0]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Quiver on back */}
      <mesh position={[0.1, 1.1, -0.25]} rotation={[0.2, 0, 0.1]}>
        <cylinderGeometry args={[0.06, 0.05, 0.5, 8]} />
        <meshStandardMaterial color={BROWN} roughness={0.6} />
      </mesh>
    </group>
  )
}
