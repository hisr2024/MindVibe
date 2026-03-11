/**
 * CosmicOceanScene — Entry portal VR environment.
 *
 * An infinite cosmic ocean (Kshira Sagara) where Vishnu rests.
 * Deep indigo waters, celestial fog, floating lotus petals,
 * and a cosmic dome of stars above.
 *
 * This is the gateway scene before entering Kurukshetra.
 */

'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Plane, Sphere } from '@react-three/drei'
import * as THREE from 'three'

function CosmicWater() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.08 + Math.sin(clock.elapsedTime * 0.3) * 0.03
  })

  return (
    <Plane
      ref={meshRef}
      args={[200, 200, 64, 64]}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
    >
      <meshStandardMaterial
        color="#0a0a3a"
        emissive="#1a1a6a"
        emissiveIntensity={0.08}
        metalness={0.9}
        roughness={0.3}
        transparent
        opacity={0.85}
      />
    </Plane>
  )
}

function FloatingLotus({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null)
  const baseY = position[1]

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = baseY + Math.sin(clock.elapsedTime * 0.5 + position[0]) * 0.1
    ref.current.rotation.y = clock.elapsedTime * 0.1
  })

  return (
    <group ref={ref} position={position}>
      {/* Lotus petals (simplified geometry) */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i / 8) * Math.PI * 2) * 0.3,
            0.05,
            Math.sin((i / 8) * Math.PI * 2) * 0.3,
          ]}
          rotation={[0.3, (i / 8) * Math.PI * 2, 0]}
        >
          <sphereGeometry args={[0.15, 8, 4, 0, Math.PI]} />
          <meshStandardMaterial
            color="#ffb6c1"
            emissive="#ff69b4"
            emissiveIntensity={0.3}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {/* Center */}
      <Sphere args={[0.08, 8, 8]} position={[0, 0.1, 0]}>
        <meshStandardMaterial color="#ffd700" emissive="#ffa500" emissiveIntensity={0.5} />
      </Sphere>
    </group>
  )
}

function CelestialFog() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.06 + Math.sin(clock.elapsedTime * 0.2) * 0.02
  })

  return (
    <Sphere ref={ref} args={[50, 16, 16]} position={[0, 5, 0]}>
      <meshBasicMaterial
        color="#1a0a3e"
        transparent
        opacity={0.06}
        side={THREE.BackSide}
      />
    </Sphere>
  )
}

export default function CosmicOceanScene() {
  return (
    <group>
      {/* Cosmic water plane */}
      <CosmicWater />

      {/* Floating lotus formations */}
      <FloatingLotus position={[-3, -0.3, -4]} />
      <FloatingLotus position={[2, -0.3, -6]} />
      <FloatingLotus position={[-5, -0.3, -8]} />
      <FloatingLotus position={[4, -0.3, -3]} />

      {/* Celestial fog dome */}
      <CelestialFog />

      {/* Sacred golden light from above */}
      <pointLight position={[0, 15, -5]} intensity={0.8} color="#ffd700" distance={40} decay={2} />
      <pointLight position={[-5, 8, -10]} intensity={0.3} color="#4169e1" distance={25} decay={2} />
      <pointLight position={[5, 8, -10]} intensity={0.3} color="#9370db" distance={25} decay={2} />

      {/* Fog effect */}
      <fog attach="fog" args={['#0a0a2e', 10, 60]} />
    </group>
  )
}
