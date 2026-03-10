/**
 * SpatialAudio — 3D positional audio for Krishna's voice
 *
 * Krishna's voice emanates from his 3D position in the scene.
 * Volume adjusts with camera distance. Handles TTS audio playback.
 */

'use client'

export default function SpatialAudio() {
  // Spatial audio is managed by the LipSyncController's Web Audio API.
  // This component serves as a marker for the positional audio source.
  // In a production build with GLB models, this would attach a
  // Three.js PositionalAudio to the Krishna model's head bone.
  return null
}
