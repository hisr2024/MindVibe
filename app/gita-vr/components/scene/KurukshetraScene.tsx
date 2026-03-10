/**
 * KurukshetraScene — Main 3D battlefield environment
 *
 * Assembles the complete Kurukshetra battlefield:
 * sky dome, ground terrain, divine chariot, army formations,
 * and sacred atmospheric effects with golden sunset lighting.
 */

'use client'

import SkyDome from './SkyDome'
import BattlefieldGround from './BattlefieldGround'
import DivineChariot from './DivineChariot'
import ArmyFormations from './ArmyFormations'
import SacredEffects from './SacredEffects'

export default function KurukshetraScene() {
  return (
    <group>
      {/* Sky */}
      <SkyDome />

      {/* Ground */}
      <BattlefieldGround />

      {/* Central chariot */}
      <DivineChariot />

      {/* Armies on both flanks */}
      <ArmyFormations />

      {/* Atmospheric effects */}
      <SacredEffects />

      {/* Lighting */}
      {/* Sunset directional light — warm golden */}
      <directionalLight
        position={[30, 20, -15]}
        intensity={1.2}
        color="#FFB366"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* Ambient fill — subtle purple from sky */}
      <ambientLight intensity={0.15} color="#8866AA" />

      {/* Hemisphere light — sky/ground blend */}
      <hemisphereLight
        args={['#FF8844', '#332211', 0.3]}
      />

      {/* Divine spotlight on chariot area */}
      <spotLight
        position={[0, 15, 5]}
        angle={0.4}
        penumbra={0.8}
        intensity={0.6}
        color="#FFD700"
        target-position={[0, 1, 0]}
        castShadow
      />

      {/* Scene fog */}
      <fog attach="fog" args={['#1a0a20', 30, 150]} />
    </group>
  )
}
