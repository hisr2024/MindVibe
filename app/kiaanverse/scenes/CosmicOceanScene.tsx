/**
 * CosmicOceanScene — The infinite Kshira Sagara, gateway to divinity.
 *
 * Deep indigo cosmic ocean stretching to infinity. Floating lotus formations,
 * bioluminescent water ripples, celestial nebula fog, and star reflections.
 *
 * Atmosphere: Primordial, vast, awe-inspiring. The womb of creation.
 */

'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Plane, Sphere } from '@react-three/drei'
import * as THREE from 'three'

function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

function CosmicWater() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.1 + Math.sin(clock.elapsedTime * 0.25) * 0.04
  })

  return (
    <Plane ref={meshRef} args={[300, 300, 1, 1]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <meshStandardMaterial color="#050520" emissive="#0a0a4a" emissiveIntensity={0.1} metalness={0.92} roughness={0.15} transparent opacity={0.9} />
    </Plane>
  )
}

function BioluminescentRipples() {
  const ref = useRef<THREE.Points>(null)
  const count = 200

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (seeded(i + 100) - 0.5) * 60
      pos[i * 3 + 1] = -0.45
      pos[i * 3 + 2] = (seeded(i + 200) - 0.5) * 60 - 10
    }
    return pos
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] = -0.45 + Math.sin(clock.elapsedTime * 0.3 + seeded(i) * 20) * 0.02
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#4488ff" size={0.12} transparent opacity={0.2} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  )
}

function FloatingLotus({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const ref = useRef<THREE.Group>(null)
  const baseY = position[1]

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = baseY + Math.sin(clock.elapsedTime * 0.4 + position[0]) * 0.08
    ref.current.rotation.y = clock.elapsedTime * 0.06
  })

  return (
    <group ref={ref} position={position} scale={scale}>
      {/* Lily pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <circleGeometry args={[0.5, 12]} />
        <meshStandardMaterial color="#0a3a1a" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Outer petals */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh
          key={i}
          position={[Math.cos((i / 10) * Math.PI * 2) * 0.25, 0.06, Math.sin((i / 10) * Math.PI * 2) * 0.25]}
          rotation={[0.35, (i / 10) * Math.PI * 2, 0]}
        >
          <sphereGeometry args={[0.13, 6, 4, 0, Math.PI]} />
          <meshStandardMaterial color="#ffb6c1" emissive="#ff69b4" emissiveIntensity={0.25} transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Inner petals */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh
          key={`in-${i}`}
          position={[Math.cos((i / 6) * Math.PI * 2) * 0.12, 0.12, Math.sin((i / 6) * Math.PI * 2) * 0.12]}
          rotation={[0.25, (i / 6) * Math.PI * 2, 0]}
        >
          <sphereGeometry args={[0.08, 6, 4, 0, Math.PI]} />
          <meshStandardMaterial color="#ffe4e1" emissive="#ffb6c1" emissiveIntensity={0.2} transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Center jewel */}
      <Sphere args={[0.04, 8, 8]} position={[0, 0.14, 0]}>
        <meshStandardMaterial color="#ffd700" emissive="#ffa500" emissiveIntensity={0.6} />
      </Sphere>
      {/* Self-illumination */}
      <pointLight position={[0, 0.2, 0]} intensity={0.2} color="#ff69b4" distance={2} decay={2} />
    </group>
  )
}

function NebulaFog() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.05 + Math.sin(clock.elapsedTime * 0.15) * 0.02
    ref.current.rotation.y = clock.elapsedTime * 0.01
  })

  return (
    <Sphere ref={ref} args={[60, 16, 16]} position={[0, 8, -10]}>
      <meshBasicMaterial color="#1a0a3e" transparent opacity={0.05} side={THREE.BackSide} />
    </Sphere>
  )
}

function CelestialMotes() {
  const ref = useRef<THREE.Points>(null)
  const count = 150

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = seeded(i + 4000) * Math.PI * 2
      const r = 3 + seeded(i + 5000) * 25
      pos[i * 3] = Math.cos(theta) * r
      pos[i * 3 + 1] = 1 + seeded(i + 6000) * 12
      pos[i * 3 + 2] = Math.sin(theta) * r - 15
    }
    return pos
  }, [])

  const colors = useMemo(() => {
    const c = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const type = seeded(i + 7000)
      if (type < 0.4) { c[i * 3] = 1; c[i * 3 + 1] = 0.85; c[i * 3 + 2] = 0.4 }
      else if (type < 0.7) { c[i * 3] = 0.4; c[i * 3 + 1] = 0.5; c[i * 3 + 2] = 1.0 }
      else { c[i * 3] = 0.7; c[i * 3 + 1] = 0.4; c[i * 3 + 2] = 0.9 }
    }
    return c
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * 0.005
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += Math.sin(clock.elapsedTime * 0.2 + i) * 0.003
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.08} transparent opacity={0.6} vertexColors sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  )
}

export default function CosmicOceanScene() {
  return (
    <group>
      <CosmicWater />
      <BioluminescentRipples />

      {/* Lotus formations */}
      <FloatingLotus position={[-3, -0.3, -4]} scale={1.1} />
      <FloatingLotus position={[2.5, -0.3, -6]} />
      <FloatingLotus position={[-5.5, -0.3, -9]} scale={0.8} />
      <FloatingLotus position={[4.5, -0.3, -3]} scale={0.9} />
      <FloatingLotus position={[-1, -0.3, -12]} scale={0.6} />
      <FloatingLotus position={[6, -0.3, -8]} scale={0.7} />

      <NebulaFog />
      <CelestialMotes />

      {/* Sacred golden light from above */}
      <pointLight position={[0, 18, -8]} intensity={1.0} color="#ffd700" distance={50} decay={1.5} />
      <pointLight position={[-8, 10, -15]} intensity={0.4} color="#4169e1" distance={30} decay={2} />
      <pointLight position={[8, 10, -15]} intensity={0.4} color="#7b68ee" distance={30} decay={2} />
      <pointLight position={[0, 0, 5]} intensity={0.15} color="#9370db" distance={10} decay={2} />

      <fog attach="fog" args={['#060618', 8, 65]} />
    </group>
  )
}
