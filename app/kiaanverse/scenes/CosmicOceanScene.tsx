/**
 * CosmicOceanScene — The infinite Kshira Sagara, milky ocean of creation.
 *
 * A luminous deep-blue ocean lit by golden celestial light from above.
 * Bright pink lotuses float with warm self-illumination. Blue sparkles
 * catch the light. Nebula mist glows in warm indigo-violet.
 *
 * Atmosphere: Primordial, vast, peaceful. Luminous, NOT dark void.
 */

'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
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
    mat.emissiveIntensity = 0.3 + Math.sin(clock.elapsedTime * 0.25) * 0.08
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial
        color="#1a2a5a"
        emissive="#2a3a8a"
        emissiveIntensity={0.3}
        metalness={0.8}
        roughness={0.2}
        transparent
        opacity={0.95}
      />
    </mesh>
  )
}

function WaterSparkles() {
  const ref = useRef<THREE.Points>(null)
  const count = 300

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (seeded(i + 100) - 0.5) * 50
      pos[i * 3 + 1] = -0.4
      pos[i * 3 + 2] = (seeded(i + 200) - 0.5) * 50 - 8
    }
    return pos
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.PointsMaterial
    mat.opacity = 0.45 + Math.sin(clock.elapsedTime * 0.4) * 0.12
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#99ccff"
        size={0.12}
        transparent
        opacity={0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

function FloatingLotus({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const ref = useRef<THREE.Group>(null)
  const baseY = position[1]

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = baseY + Math.sin(clock.elapsedTime * 0.4 + position[0]) * 0.08
    ref.current.rotation.y = clock.elapsedTime * 0.05
  })

  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <circleGeometry args={[0.45, 20]} />
        <meshStandardMaterial
          color="#2a7a3a"
          emissive="#1a5a2a"
          emissiveIntensity={0.3}
          transparent
          opacity={0.65}
          side={THREE.DoubleSide}
        />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={i}
          position={[Math.cos((i / 8) * Math.PI * 2) * 0.22, 0.06, Math.sin((i / 8) * Math.PI * 2) * 0.22]}
          rotation={[0.4, (i / 8) * Math.PI * 2, 0]}
        >
          <coneGeometry args={[0.1, 0.24, 6]} />
          <meshStandardMaterial
            color="#ffb0c8"
            emissive="#ff77aa"
            emissiveIntensity={1.2}
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh
          key={`in-${i}`}
          position={[Math.cos((i / 5) * Math.PI * 2) * 0.1, 0.12, Math.sin((i / 5) * Math.PI * 2) * 0.1]}
          rotation={[0.3, (i / 5) * Math.PI * 2, 0]}
        >
          <coneGeometry args={[0.06, 0.16, 6]} />
          <meshStandardMaterial
            color="#ffd4e0"
            emissive="#ffaacc"
            emissiveIntensity={1.5}
            transparent
            opacity={0.92}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      <mesh position={[0, 0.14, 0]}>
        <sphereGeometry args={[0.04, 10, 10]} />
        <meshBasicMaterial color="#ffd700" />
      </mesh>
      <pointLight position={[0, 0.2, 0]} intensity={0.8} color="#ffaacc" distance={4} decay={2} />
    </group>
  )
}

function NebulaFog() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.12 + Math.sin(clock.elapsedTime * 0.12) * 0.04
    ref.current.rotation.y = clock.elapsedTime * 0.008
  })

  return (
    <mesh position={[0, 6, -8]}>
      <sphereGeometry args={[50, 16, 16]} />
      <meshBasicMaterial color="#3a2a5a" transparent opacity={0.12} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  )
}

function CelestialMotes() {
  const ref = useRef<THREE.Points>(null)
  const count = 200

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = seeded(i + 4000) * Math.PI * 2
      const r = 3 + seeded(i + 5000) * 22
      pos[i * 3] = Math.cos(theta) * r
      pos[i * 3 + 1] = 1 + seeded(i + 6000) * 12
      pos[i * 3 + 2] = Math.sin(theta) * r - 12
    }
    return pos
  }, [])

  const colors = useMemo(() => {
    const c = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const type = seeded(i + 7000)
      if (type < 0.4) { c[i * 3] = 1; c[i * 3 + 1] = 0.9; c[i * 3 + 2] = 0.5 }
      else if (type < 0.7) { c[i * 3] = 0.55; c[i * 3 + 1] = 0.7; c[i * 3 + 2] = 1.0 }
      else { c[i * 3] = 0.85; c[i * 3 + 1] = 0.6; c[i * 3 + 2] = 1.0 }
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
      <pointsMaterial
        size={0.15}
        transparent
        opacity={0.85}
        vertexColors
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

export default function CosmicOceanScene() {
  return (
    <group>
      <CosmicWater />
      <WaterSparkles />

      <FloatingLotus position={[-3, -0.3, -4]} scale={1.1} />
      <FloatingLotus position={[2.5, -0.3, -6]} />
      <FloatingLotus position={[-5.5, -0.3, -9]} scale={0.8} />
      <FloatingLotus position={[4.5, -0.3, -3]} scale={0.9} />
      <FloatingLotus position={[-1, -0.3, -12]} scale={0.6} />
      <FloatingLotus position={[6, -0.3, -8]} scale={0.7} />

      <NebulaFog />
      <CelestialMotes />

      {/* Strong golden celestial illumination */}
      <pointLight position={[0, 18, -6]} intensity={4.0} color="#ffd700" distance={70} decay={1.0} />
      <pointLight position={[-10, 10, -12]} intensity={1.8} color="#4488cc" distance={40} decay={1.2} />
      <pointLight position={[10, 10, -12]} intensity={1.8} color="#8866cc" distance={40} decay={1.2} />
      <pointLight position={[0, 3, 4]} intensity={0.8} color="#aa88dd" distance={14} decay={1.5} />

      <ambientLight intensity={0.25} color="#2a2a5a" />

      <fog attach="fog" args={['#151530', 20, 90]} />
    </group>
  )
}
