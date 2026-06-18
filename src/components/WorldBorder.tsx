import { BackSide } from 'three'
import { WORLD } from '../config'

// A faint shimmer wall at the edge of the playable area. This is the VISUAL hint
// only — the actual blocking happens in Player.tsx by clamping the player inside
// WORLD.BORDER_RADIUS. Seen from the inside (BackSide) so it never occludes.
export function WorldBorder() {
  const R = WORLD.BORDER_RADIUS
  return (
    <mesh position={[0, 0, 0]} renderOrder={-1}>
      {/* open-ended cylinder: [top, bottom, height, segments, heightSegs, openEnded] */}
      <cylinderGeometry args={[R, R, 160, 96, 1, true]} />
      <meshBasicMaterial
        color="#a9c6f5"
        transparent
        opacity={0.08}
        side={BackSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}
