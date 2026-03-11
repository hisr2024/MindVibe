/**
 * LotusMeditationScene — Serene meditation VR environment.
 *
 * A tranquil lotus pond at dawn. Still water, blooming lotuses,
 * soft mist, gentle golden light, and absolute peace.
 *
 * Designed for deep reflection and meditation moments.
 */

'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Plane, Sphere } from '@react-three/drei'
import * as THREE from 'three'

function StillWater() {
  return (
    <Plane args={[100, 100]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
      <meshStandardMaterial
        color="#0a1a2a"
        metalness={0.95}
        roughness={0.1}
        transparent
        opacity={0.9}
      />
    </Plane>
  )
}

function GiantLotus({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const ref = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.3 + position[0] * 2) * 0.03
  })

  return (
    <group ref={ref} position={position} scale={scale}>
      {/* Lotus pad (lily pad) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <circleGeometry args={[0.8, 16]} />
        <meshStandardMaterial
          color="#1a5a2a"
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Petals — layered rings opening upward */}
      {[0, 1, 2].map((ring) => (
        <group key={ring}>
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2 + ring * 0.2
            const r = 0.2 + ring * 0.15
            const tilt = 0.4 - ring * 0.1
            return (
              <mesh
                key={i}
                position={[Math.cos(angle) * r, 0.1 + ring * 0.08, Math.sin(angle) * r]}
                rotation={[tilt, angle, 0]}
              >
                <sphereGeometry args={[0.12 + ring * 0.02, 6, 4, 0, Math.PI]} />
                <meshStandardMaterial
                  color={ring === 0 ? '#ff69b4' : ring === 1 ? '#ffb6c1' : '#ffe4e1'}
                  emissive="#ff69b4"
                  emissiveIntensity={0.15}
                  transparent
                  opacity={0.8}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )
          })}
        </group>
      ))}
      {/* Center jewel */}
      <Sphere args={[0.06, 8, 8]} position={[0, 0.2, 0]}>
        <meshStandardMaterial color="#ffd700" emissive="#ffa500" emissiveIntensity={0.6} />
      </Sphere>
    </group>
  )
}

function DawnMist() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.04 + Math.sin(clock.elapsedTime * 0.15) * 0.015
  })

  return (
    <Sphere ref={ref} args={[40, 16, 16]} position={[0, 3, 0]}>
      <meshBasicMaterial
        color="#ffeedd"
        transparent
        opacity={0.04}
        side={THREE.BackSide}
      />
    </Sphere>
  )
}

function MeditationPlatform() {
  return (
    <group position={[0, 0, 0]}>
      {/* Stone lotus platform */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[1.5, 1.8, 0.1, 16]} />
        <meshStandardMaterial
          color="#888888"
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>
      {/* Om symbol light on the platform */}
      <pointLight position={[0, 0.3, 0]} intensity={0.5} color="#ffd700" distance={3} decay={2} />
    </group>
  )
}

export default function LotusMeditationScene() {
  return (
    <group>
      <StillWater />
      <MeditationPlatform />
      <DawnMist />

      {/* Lotus formations */}
      <GiantLotus position={[-2, -0.1, -3]} scale={1.2} />
      <GiantLotus position={[2.5, -0.1, -4]} />
      <GiantLotus position={[-4, -0.1, -6]} scale={0.8} />
      <GiantLotus position={[1, -0.1, -7]} scale={1.1} />
      <GiantLotus position={[-1.5, -0.1, -2]} scale={0.7} />
      <GiantLotus position={[4, -0.1, -2.5]} scale={0.9} />

      {/* Soft dawn lighting */}
      <pointLight position={[5, 10, -10]} intensity={1.2} color="#ffeedd" distance={40} decay={1.5} />
      <pointLight position={[-5, 8, -8]} intensity={0.6} color="#ffccaa" distance={25} decay={2} />
      <pointLight position={[0, 2, 5]} intensity={0.4} color="#ffd700" distance={10} decay={2} />

      <fog attach="fog" args={['#0a0a1a', 8, 40]} />
    </group>
  )
}
