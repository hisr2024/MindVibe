/**
 * GodRays — Volumetric divine light behind Krishna
 *
 * Warm golden light rays emanating from behind Krishna's head,
 * creating a divine backlight halo effect.
 */

'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const rayVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const rayFragmentShader = `
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(vUv, center);

    // Radial rays
    float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
    float rays = sin(angle * 12.0 + uTime * 0.5) * 0.5 + 0.5;
    rays = pow(rays, 3.0);

    // Falloff from center
    float falloff = 1.0 - smoothstep(0.0, 0.5, dist);
    falloff = pow(falloff, 1.5);

    float intensity = rays * falloff * 0.4;

    vec3 color = vec3(1.0, 0.85, 0.4) * intensity;

    gl_FragColor = vec4(color, intensity);
  }
`

export default function GodRays() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), [])

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta
    }
  })

  return (
    <mesh position={[0.3, 2.0, -1.5]} rotation={[0, 0, 0]}>
      <planeGeometry args={[8, 8]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={rayVertexShader}
        fragmentShader={rayFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
