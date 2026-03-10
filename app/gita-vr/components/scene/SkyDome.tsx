/**
 * SkyDome — Dynamic sunset sky for Kurukshetra battlefield
 *
 * A dramatic sky sphere with animated sunset gradient colors:
 * amber, crimson, deep purple. Creates the sacred atmosphere
 * for the Gita VR experience.
 */

'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float uTime;
  varying vec3 vWorldPosition;

  void main() {
    float height = normalize(vWorldPosition).y;

    // Sunset gradient: deep purple at top → crimson → amber at horizon
    vec3 topColor = vec3(0.08, 0.02, 0.15);      // Deep purple
    vec3 midColor = vec3(0.6, 0.15, 0.1);         // Crimson
    vec3 horizonColor = vec3(0.85, 0.55, 0.15);   // Amber gold
    vec3 belowColor = vec3(0.02, 0.01, 0.03);     // Dark ground

    vec3 color;
    if (height > 0.3) {
      color = mix(midColor, topColor, smoothstep(0.3, 0.9, height));
    } else if (height > 0.0) {
      color = mix(horizonColor, midColor, smoothstep(0.0, 0.3, height));
    } else {
      color = mix(belowColor, horizonColor, smoothstep(-0.1, 0.0, height));
    }

    // Subtle animation: golden shimmer near horizon
    float shimmer = sin(uTime * 0.3 + vWorldPosition.x * 0.01) * 0.02;
    color += vec3(shimmer, shimmer * 0.5, 0.0) * smoothstep(0.2, 0.0, abs(height));

    // Sun glow at horizon center
    float sunAngle = atan(vWorldPosition.z, vWorldPosition.x);
    float sunGlow = exp(-pow(height - 0.05, 2.0) * 50.0) * exp(-pow(sunAngle - 0.5, 2.0) * 2.0);
    color += vec3(1.0, 0.7, 0.3) * sunGlow * 0.4;

    gl_FragColor = vec4(color, 1.0);
  }
`

export default function SkyDome() {
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
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}
