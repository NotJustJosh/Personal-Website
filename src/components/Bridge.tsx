import { useMemo } from 'react'
import * as THREE from 'three'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import type { Island } from '../content'

// A slender, walkable light-bridge between two islands. Generated procedurally
// from a neighbor pair (see lib/world.ts getBridges) — never placed by hand.
//
// The deck RAMPS to connect islands at different heights, staying flush with both
// island surfaces. It's oriented with yaw (heading) + pitch (slope) only — never
// roll — so it tilts up/down like a ramp but never banks sideways. Two islands at
// the same height get a perfectly flat bridge automatically (pitch = 0).

const WIDTH = 2 // walkable width
const THICKNESS = 0.2 // visual deck thickness
// The collider is much thicker than the thin visual deck so the player can't
// fall through it; its TOP still lines up with the deck surface you walk on.
const COLLIDER_HALF = 0.5

const UP = new THREE.Vector3(0, 1, 0)
const FWD = new THREE.Vector3(0, 0, 1) // local axis we rotate about for pitch

export function Bridge({ a, b }: { a: Island; b: Island }) {
  const { position, rotation, length, color } = useMemo(() => {
    const [ax, ay, az] = a.position
    const [bx, by, bz] = b.position
    const dx = bx - ax
    const dy = by - ay
    const dz = bz - az

    const horiz = Math.hypot(dx, dz)
    const len = Math.hypot(horiz, dy) // full sloped span (a → b)
    const yaw = Math.atan2(-dz, dx) // point the deck's +X axis along the heading
    const pitch = Math.atan2(dy, horiz) // tilt +X up toward the higher island

    // q = Ry(yaw) · Rz(pitch). Pitch rotates about Z (the width axis), so the
    // width stays horizontal after the yaw → the deck never banks (no roll).
    const q = new THREE.Quaternion()
      .setFromAxisAngle(UP, yaw)
      .multiply(new THREE.Quaternion().setFromAxisAngle(FWD, pitch))
    const e = new THREE.Euler().setFromQuaternion(q)

    return {
      position: [(ax + bx) / 2, (ay + by) / 2 - THICKNESS / 2, (az + bz) / 2] as [
        number,
        number,
        number,
      ],
      rotation: [e.x, e.y, e.z] as [number, number, number],
      length: len,
      color: a.accentColor,
    }
  }, [a, b])

  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation={rotation} friction={1}>
      <CuboidCollider
        args={[length / 2, COLLIDER_HALF, WIDTH / 2]}
        position={[0, THICKNESS / 2 - COLLIDER_HALF, 0]}
      />

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
