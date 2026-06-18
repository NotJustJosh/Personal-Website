import { useMemo } from 'react'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import type { Island } from '../content'

// A slender, walkable light-bridge between two islands. Generated procedurally
// from a neighbor pair (see lib/world.ts getBridges) — never placed by hand.
//
// The deck is FLAT (horizontal): it's rotated only around Y (yaw), so it never
// tilts or banks. Its top surface is laid flush with the island surface, so it
// reads as a level walkway. Keep connected islands at the same `y` (see the note
// in content.ts) so both ends stay flush.

const WIDTH = 2 // walkable width
const THICKNESS = 0.2

export function Bridge({ a, b }: { a: Island; b: Island }) {
  const { position, rotation, length, color } = useMemo(() => {
    const dx = b.position[0] - a.position[0]
    const dz = b.position[2] - a.position[2]
    // Horizontal span only — the bridge stays flat regardless of any height diff.
    const len = Math.hypot(dx, dz)

    // Sit flush with the (higher) island surface; place the deck so its TOP face
    // is level with the surface rather than its centre.
    const surface = Math.max(a.position[1], b.position[1])
    const midX = (a.position[0] + b.position[0]) / 2
    const midZ = (a.position[2] + b.position[2]) / 2

    // Yaw only: rotate the box's local +X to point along the horizontal direction.
    const yaw = Math.atan2(-dz, dx)

    return {
      position: [midX, surface - THICKNESS / 2, midZ] as [number, number, number],
      rotation: [0, yaw, 0] as [number, number, number],
      length: len,
      color: a.accentColor,
    }
  }, [a, b])

  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation={rotation} friction={1}>
      <CuboidCollider args={[length / 2, THICKNESS / 2, WIDTH / 2]} />

      {/* Deck */}
      <mesh receiveShadow>
        <boxGeometry args={[length, THICKNESS, WIDTH]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.45}
          transparent
          opacity={0.6}
          toneMapped={false}
        />
      </mesh>

      {/* Glowing edge rails */}
      <mesh position={[0, 0.08, WIDTH / 2 - 0.05]}>
        <boxGeometry args={[length, 0.07, 0.07]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.08, -WIDTH / 2 + 0.05]}>
        <boxGeometry args={[length, 0.07, 0.07]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </RigidBody>
  )
}
