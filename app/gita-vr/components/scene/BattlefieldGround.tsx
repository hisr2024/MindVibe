/**
 * BattlefieldGround — Kurukshetra terrain ground plane
 *
 * A large ground plane with procedural dry terrain texture,
 * subtle dust particles near the camera, and cracked earth feel.
 */

'use client'

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const groundVertexShader = `
  varying vec2 vUv;
  varying float vFog;
  void main() {
    vUv = uv * 80.0;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vFog = smoothstep(50.0, 200.0, -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const groundFragmentShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vFog;

  // Simple procedural noise for terrain texture
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    float n = noise(vUv) * 0.5 + noise(vUv * 3.0) * 0.3 + noise(vUv * 7.0) * 0.2;

    // Dry earth colors
    vec3 dryEarth = vec3(0.35, 0.25, 0.15);
    vec3 crackedEarth = vec3(0.25, 0.18, 0.1);
    vec3 dustColor = vec3(0.45, 0.35, 0.22);

    vec3 color = mix(crackedEarth, dryEarth, n);
    color = mix(color, dustColor, smoothstep(0.6, 0.8, n));

    // Fog blending to dark at distance
    vec3 fogColor = vec3(0.05, 0.03, 0.08);
    color = mix(color, fogColor, vFog);

    gl_FragColor = vec4(color, 1.0);
  }
`

const DUST_PARTICLE_COUNT = 200

function generateDustData() {
  const pos = new Float32Array(DUST_PARTICLE_COUNT * 3)
  const vel = new Float32Array(DUST_PARTICLE_COUNT * 3)
  for (let i = 0; i < DUST_PARTICLE_COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 30
    pos[i * 3 + 1] = Math.random() * 3
    pos[i * 3 + 2] = (Math.random() - 0.5) * 30
    vel[i * 3] = (Math.random() - 0.5) * 0.02
    vel[i * 3 + 1] = Math.random() * 0.01
    vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02
  }
  return { positions: pos, velocities: vel }
}

function DustParticles() {
  const pointsRef = useRef<THREE.Points>(null)

  const [{ positions }] = useState(generateDustData)
  const velocitiesRef = useRef(generateDustData().velocities)

  useFrame(() => {
    if (!pointsRef.current) return
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const posArray = posAttr.array as Float32Array
    const velocities = velocitiesRef.current

    for (let i = 0; i < DUST_PARTICLE_COUNT; i++) {
      posArray[i * 3] += velocities[i * 3]
      posArray[i * 3 + 1] += velocities[i * 3 + 1]
      posArray[i * 3 + 2] += velocities[i * 3 + 2]

      // Reset particles that drift too far
      if (posArray[i * 3 + 1] > 4 || Math.abs(posArray[i * 3]) > 20) {
        posArray[i * 3] = (Math.random() - 0.5) * 30
        posArray[i * 3 + 1] = 0
        posArray[i * 3 + 2] = (Math.random() - 0.5) * 30
      }
    }
    posAttr.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#a08060"
        size={0.08}
        transparent
        opacity={0.3}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

export default function BattlefieldGround() {
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), [])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[500, 500, 1, 1]} />
        <shaderMaterial
          vertexShader={groundVertexShader}
          fragmentShader={groundFragmentShader}
          uniforms={uniforms}
        />
      </mesh>
      <DustParticles />
    </group>
  )
}
