/**
 * DivineAura — Golden aura shader around Krishna
 *
 * Pulsating golden radial glow with Fresnel-based rim lighting.
 * Intensity increases during speech/teaching moments.
 */

'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGitaVRStore } from '@/stores/gitaVRStore'

const auraVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`

const auraFragmentShader = `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    // Fresnel rim effect
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = 1.0 - abs(dot(viewDir, vNormal));
    fresnel = pow(fresnel, 2.5);

    // Pulsating intensity
    float pulse = 0.7 + 0.3 * sin(uTime * 2.0);
    float intensity = fresnel * pulse * uIntensity;

    // Golden color with slight variation
    vec3 color = uColor * intensity;

    gl_FragColor = vec4(color, intensity * 0.6);
  }
`

export default function DivineAura() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const krishnaState = useGitaVRStore((s) => s.krishnaState)

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uIntensity: { value: 0.8 },
    uColor: { value: new THREE.Color('#FFD700') },
  }), [])

  useFrame((state) => {
    if (!materialRef.current) return

    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime

    // Increase intensity during speaking/blessing
    const targetIntensity = (krishnaState === 'speaking' || krishnaState === 'blessing') ? 1.5 : 0.8
    materialRef.current.uniforms.uIntensity.value = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uIntensity.value,
      targetIntensity,
      0.05
    )
  })

  return (
    <mesh position={[0.3, 1.4, 0]} scale={[1.8, 2.2, 1.8]}>
      <sphereGeometry args={[1, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={auraVertexShader}
        fragmentShader={auraFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
      />
    </mesh>
  )
}
