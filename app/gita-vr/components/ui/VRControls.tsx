/**
 * VRControls — WebXR VR mode controls
 *
 * "Enter VR" button and VR session management.
 * Also handles desktop orbit controls and mobile touch.
 */

'use client'

import { OrbitControls } from '@react-three/drei'
import { useGitaVRStore } from '@/stores/gitaVRStore'

export default function VRControls() {
  const vrMode = useGitaVRStore((s) => s.vrMode)

  // Desktop and mobile get OrbitControls
  if (vrMode !== 'vr-headset') {
    return (
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={25}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.8}
        target={[0, 1.5, 0]}
        autoRotate={false}
        autoRotateSpeed={0.3}
        dampingFactor={0.05}
        enableDamping
      />
    )
  }

  // VR headset mode uses XR controller-based locomotion
  return null
}
