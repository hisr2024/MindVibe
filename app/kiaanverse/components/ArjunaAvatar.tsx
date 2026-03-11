/**
 * ArjunaAvatar — 3D warrior character for VR.
 *
 * Bronze-toned warrior with angular crown, armor, and Gandiva bow.
 * Built from Three.js primitives. Secondary to Krishna.
 *
 * States: idle | distressed | listening | enlightened | awestruck
 */

'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere } from '@react-three/drei'
import * as THREE from 'three'
import { useKiaanverseStore } from '@/stores/kiaanverseStore'

interface ArjunaAvatarProps {
  position?: [number, number, number]
}

export default function ArjunaAvatar({ position = [0, 0, 0] }: ArjunaAvatarProps) {
  const groupRef = useRef<THREE.Group>(null)
  const arjunaState = useKiaanverseStore((s) => s.arjunaState)

  const isDistressed = arjunaState === 'distressed'
  const isEnlightened = arjunaState === 'enlightened'

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime

    /* Breathing */
    groupRef.current.position.y = position[1] + Math.sin(t * 0.7) * 0.015

    /* Distressed slump */
    if (isDistressed) {
      groupRef.current.rotation.z = Math.sin(t * 0.3) * 0.03 + 0.05
    } else if (arjunaState === 'listening') {
      groupRef.current.rotation.y = -0.15
    } else {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.02)
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.02)
    }
  })

  const bodyColor = '#3d2814'
  const emissiveColor = isEnlightened ? '#ffd700' : '#1a0f06'
  const emissiveIntensity = useMemo(() => (isEnlightened ? 0.2 : 0.05), [isEnlightened])

  return (
    <group ref={groupRef} position={position}>
      {/* ── Warrior crown (angular) ── */}
      <group position={[0, 2.2, 0]}>
        <mesh position={[0, 0.08, 0]}>
          <coneGeometry args={[0.05, 0.18, 5]} />
          <meshStandardMaterial color="#8b7355" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[-0.08, 0.05, 0]}>
          <coneGeometry args={[0.03, 0.12, 4]} />
          <meshStandardMaterial color="#8b7355" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.08, 0.05, 0]}>
          <coneGeometry args={[0.03, 0.12, 4]} />
          <meshStandardMaterial color="#8b7355" metalness={0.7} roughness={0.3} />
        </mesh>
        <Sphere args={[0.02, 8, 8]} position={[0, 0.18, 0]}>
          <meshStandardMaterial color="#4169e1" emissive="#0000ff" emissiveIntensity={0.4} />
        </Sphere>
      </group>

      {/* ── Head ── */}
      <Sphere args={[0.17, 16, 16]} position={[0, 2.02, 0]}>
        <meshStandardMaterial color={bodyColor} emissive={emissiveColor} emissiveIntensity={emissiveIntensity} />
      </Sphere>

      {/* ── Neck ── */}
      <mesh position={[0, 1.83, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.1, 8]} />
        <meshStandardMaterial color={bodyColor} emissive={emissiveColor} emissiveIntensity={emissiveIntensity} />
      </mesh>

      {/* ── Armored shoulders ── */}
      <Sphere args={[0.08, 8, 8]} position={[-0.22, 1.72, 0]}>
        <meshStandardMaterial color="#5a4a3a" metalness={0.5} roughness={0.5} />
      </Sphere>
      <Sphere args={[0.08, 8, 8]} position={[0.22, 1.72, 0]}>
        <meshStandardMaterial color="#5a4a3a" metalness={0.5} roughness={0.5} />
      </Sphere>

      {/* ── Torso (broader warrior build) ── */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.24, 0.2, 0.5, 8]} />
        <meshStandardMaterial color={bodyColor} emissive={emissiveColor} emissiveIntensity={emissiveIntensity} />
      </mesh>

      {/* ── Chest armor plate ── */}
      <mesh position={[0, 1.55, 0.18]}>
        <boxGeometry args={[0.2, 0.15, 0.02]} />
        <meshStandardMaterial color="#8b7355" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* ── Lower body / warrior dhoti ── */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.7, 8]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.8} />
      </mesh>

      {/* ── Legs ── */}
      <mesh position={[-0.08, 0.35, 0]}>
        <cylinderGeometry args={[0.06, 0.055, 0.45, 6]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0.08, 0.35, 0]}>
        <cylinderGeometry args={[0.06, 0.055, 0.45, 6]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>

      {/* ── Feet ── */}
      <Sphere args={[0.055, 8, 4]} position={[-0.08, 0.05, 0.02]}>
        <meshStandardMaterial color={bodyColor} />
      </Sphere>
      <Sphere args={[0.055, 8, 4]} position={[0.08, 0.05, 0.02]}>
        <meshStandardMaterial color={bodyColor} />
      </Sphere>

      {/* ── Arms ── */}
      <mesh position={[-0.26, 1.35, 0]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.04, 0.035, 0.45, 6]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0.26, 1.35, 0]} rotation={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.04, 0.035, 0.45, 6]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>

      {/* ── Gandiva Bow (tall curve beside him) ── */}
      <group position={[0.35, 1.2, -0.05]}>
        <mesh rotation={[0, 0, 0]}>
          <torusGeometry args={[0.6, 0.015, 6, 16, Math.PI]} />
          <meshStandardMaterial
            color="#8b7355"
            metalness={0.5}
            roughness={0.4}
            transparent
            opacity={isDistressed ? 0.3 : 0.7}
          />
        </mesh>
        {/* Bowstring */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.003, 0.003, 1.2, 4]} />
          <meshStandardMaterial
            color="#d4a44c"
            transparent
            opacity={isDistressed ? 0.15 : 0.4}
          />
        </mesh>
      </group>

      {/* ── Quiver on back ── */}
      <mesh position={[0.15, 1.65, -0.15]} rotation={[0.2, 0, -0.1]}>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 6]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.8} />
      </mesh>

      {/* ── Enlightened aura ── */}
      {isEnlightened && (
        <Sphere args={[1, 16, 16]} position={[0, 1, 0]}>
          <meshBasicMaterial
            color="#ffd700"
            transparent
            opacity={0.06}
            side={THREE.BackSide}
          />
        </Sphere>
      )}
    </group>
  )
}
