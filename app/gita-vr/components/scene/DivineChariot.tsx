/**
 * DivineChariot — Krishna and Arjuna's sacred chariot
 *
 * Procedural 3D chariot with golden PBR materials,
 * wheels, canopy, and placeholder horse forms.
 * Positioned at the center of the Kurukshetra battlefield.
 */

'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const GOLD = '#d4a44c'
const DARK_GOLD = '#8B6914'
const WOOD = '#5C3A1E'

function Wheel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Outer rim */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.6, 0.08, 8, 24]} />
        <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Hub */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.15, 12]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Spokes */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[0, Math.sin(angle) * 0.3, Math.cos(angle) * 0.3]}
            rotation={[angle, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.02, 0.02, 0.55, 4]} />
            <meshStandardMaterial color={DARK_GOLD} metalness={0.7} roughness={0.4} />
          </mesh>
        )
      })}
    </group>
  )
}

function Horse({ position, mirror }: { position: [number, number, number]; mirror?: boolean }) {
  const scale = mirror ? [-1, 1, 1] as [number, number, number] : [1, 1, 1] as [number, number, number]
  return (
    <group position={position} scale={scale}>
      {/* Body */}
      <mesh position={[0, 0.4, 0]}>
        <capsuleGeometry args={[0.25, 0.8, 4, 8]} />
        <meshStandardMaterial color="#F5F5DC" roughness={0.6} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 0.7, -0.5]} rotation={[0.6, 0, 0]}>
        <capsuleGeometry args={[0.12, 0.5, 4, 8]} />
        <meshStandardMaterial color="#F5F5DC" roughness={0.6} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.0, -0.75]}>
        <capsuleGeometry args={[0.1, 0.25, 4, 8]} />
        <meshStandardMaterial color="#F5F5DC" roughness={0.6} />
      </mesh>
      {/* Legs */}
      {[[-0.15, 0, -0.3], [0.15, 0, -0.3], [-0.15, 0, 0.3], [0.15, 0, 0.3]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.05, 0.04, 0.6, 6]} />
          <meshStandardMaterial color="#F5F5DC" roughness={0.6} />
        </mesh>
      ))}
      {/* Golden harness */}
      <mesh position={[0, 0.55, -0.1]}>
        <torusGeometry args={[0.3, 0.02, 4, 12]} />
        <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

export default function DivineChariot() {
  const groupRef = useRef<THREE.Group>(null)

  // Subtle breathing hover
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.03
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Chariot platform */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[2.5, 0.15, 1.8]} />
        <meshStandardMaterial color={WOOD} roughness={0.7} />
      </mesh>

      {/* Chariot side walls */}
      <mesh position={[0, 0.9, 0.85]}>
        <boxGeometry args={[2.5, 0.7, 0.08]} />
        <meshStandardMaterial color={DARK_GOLD} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.9, -0.85]}>
        <boxGeometry args={[2.5, 0.7, 0.08]} />
        <meshStandardMaterial color={DARK_GOLD} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[1.2, 0.9, 0]}>
        <boxGeometry args={[0.08, 0.7, 1.8]} />
        <meshStandardMaterial color={DARK_GOLD} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Golden ornamental trim */}
      <mesh position={[0, 1.25, 0.85]}>
        <boxGeometry args={[2.6, 0.06, 0.12]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} emissive={GOLD} emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[0, 1.25, -0.85]}>
        <boxGeometry args={[2.6, 0.06, 0.12]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} emissive={GOLD} emissiveIntensity={0.1} />
      </mesh>

      {/* Canopy / parasol */}
      <mesh position={[0.3, 2.5, 0]}>
        <sphereGeometry args={[1.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
        <meshStandardMaterial
          color={GOLD}
          metalness={0.7}
          roughness={0.3}
          side={THREE.DoubleSide}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Canopy pole */}
      <mesh position={[0.3, 1.5, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 2, 8]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Wheels */}
      <Wheel position={[-1, 0.1, 1.1]} />
      <Wheel position={[-1, 0.1, -1.1]} />
      <Wheel position={[1, 0.1, 1.1]} />
      <Wheel position={[1, 0.1, -1.1]} />

      {/* Chariot pole / yoke */}
      <mesh position={[-2.2, 0.5, 0]} rotation={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.04, 0.06, 2.5, 6]} />
        <meshStandardMaterial color={WOOD} roughness={0.7} />
      </mesh>

      {/* Horses */}
      <Horse position={[-3.5, 0, -0.6]} />
      <Horse position={[-3.5, 0, 0.6]} mirror />
      <Horse position={[-3.8, 0, -0.2]} />
      <Horse position={[-3.8, 0, 0.2]} mirror />

      {/* Divine flag (Hanuman flag on chariot) */}
      <mesh position={[1.15, 2.2, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 2.5, 6]} />
        <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[1.15, 3.2, 0.2]}>
        <planeGeometry args={[0.5, 0.4]} />
        <meshStandardMaterial
          color="#FF6600"
          side={THREE.DoubleSide}
          emissive="#FF6600"
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  )
}
