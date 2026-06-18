import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useMovementKeys } from '../hooks/useMovementKeys'
import { useGame } from '../store'
import { content } from '../content'
import type { SectionId } from '../content'

// ─────────────────────────────────────────────────────────────────────────────
//  Third-person physics character controller.
//
//  • A dynamic Rapier capsule with locked rotations (so it never tips over).
//  • WASD/arrows move RELATIVE to where the camera is looking.
//  • Space jumps, but only when a downward raycast says we're on the ground.
//  • Movement pauses while a content panel is open.
//
//  To use a real avatar instead of the capsule, see ../components/Avatar.tsx and
//  swap the <mesh> below for <Avatar />.
// ─────────────────────────────────────────────────────────────────────────────

// Capsule dimensions — shared by the collider and the visible mesh.
const RADIUS = 0.4
const HALF_HEIGHT = 0.5 // half of the cylinder section; total height = 1.8
const CENTER_TO_FEET = HALF_HEIGHT + RADIUS // 0.9

const MOVE_SPEED = 6 // world units / second
const JUMP_SPEED = 7
const GROUND_RAY_LENGTH = 2
const GROUNDED_THRESHOLD = CENTER_TO_FEET + 0.18 // ground is "close enough" below us

interface PlayerProps {
  /** Shared vector the camera reads to follow the player. */
  targetRef: React.RefObject<THREE.Vector3>
}

export function Player({ targetRef }: PlayerProps) {
  const body = useRef<RapierRigidBody>(null)
  const keys = useMovementKeys()
  const { rapier, world } = useRapier()

  // Reusable vectors (avoid allocating every frame).
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())
  const move = useRef(new THREE.Vector3())
  const up = useRef(new THREE.Vector3(0, 1, 0))

  const lastNearby = useRef<SectionId | null>(null)
  const jumpCooldown = useRef(0)

  const isGrounded = (rb: RapierRigidBody): boolean => {
    const t = rb.translation()
    const ray = new rapier.Ray({ x: t.x, y: t.y, z: t.z }, { x: 0, y: -1, z: 0 })
    // Exclude our own body so we don't detect our own collider.
    const hit = world.castRay(ray, GROUND_RAY_LENGTH, true, undefined, undefined, undefined, rb)
    return hit !== null && hit.timeOfImpact <= GROUNDED_THRESHOLD
  }

  useFrame((state, delta) => {
    const rb = body.current
    if (!rb) return

    const t = rb.translation()
    // Publish position so the camera can follow and we can do zone detection.
    targetRef.current.set(t.x, t.y, t.z)

    const panelOpen = useGame.getState().openPanel !== null
    const linvel = rb.linvel()

    if (panelOpen) {
      // Freeze horizontal motion while reading a panel (keep gravity on Y).
      rb.setLinvel({ x: 0, y: linvel.y, z: 0 }, true)
    } else {
      // Build a camera-relative basis flattened onto the ground plane.
      state.camera.getWorldDirection(forward.current)
      forward.current.y = 0
      forward.current.normalize()
      right.current.crossVectors(forward.current, up.current).normalize()

      const f = (keys.current.forward ? 1 : 0) - (keys.current.backward ? 1 : 0)
      const r = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0)

      move.current.set(0, 0, 0)
      move.current.addScaledVector(forward.current, f)
      move.current.addScaledVector(right.current, r)
      if (move.current.lengthSq() > 0) {
        move.current.normalize().multiplyScalar(MOVE_SPEED)
      }
      rb.setLinvel({ x: move.current.x, y: linvel.y, z: move.current.z }, true)

      // Jump (with a short cooldown to avoid multi-jumps at the apex).
      jumpCooldown.current = Math.max(0, jumpCooldown.current - delta)
      if (keys.current.jump && jumpCooldown.current === 0 && isGrounded(rb)) {
        rb.setLinvel({ x: linvel.x, y: JUMP_SPEED, z: linvel.z }, true)
        jumpCooldown.current = 0.3
      }
    }

    // Nearest zone within its interaction radius (XZ distance).
    let nearby: SectionId | null = null
    let best = Infinity
    for (const zone of content.zones) {
      const dx = t.x - zone.position[0]
      const dz = t.z - zone.position[2]
      const dist = Math.hypot(dx, dz)
      if (dist <= zone.radius && dist < best) {
        best = dist
        nearby = zone.id
      }
    }
    if (nearby !== lastNearby.current) {
      lastNearby.current = nearby
      useGame.getState().setNearbyZone(nearby)
    }
  })

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={[0, 2, 0]}
      enabledRotations={[false, false, false]}
      linearDamping={0}
      friction={0.2}
      canSleep={false}
    >
      <CapsuleCollider args={[HALF_HEIGHT, RADIUS]} />

      {/* Visible player. Swap this <mesh> for <Avatar /> to use a .glb model. */}
      <mesh castShadow>
        <capsuleGeometry args={[RADIUS, HALF_HEIGHT * 2, 8, 16]} />
        <meshStandardMaterial color="#5b8cff" roughness={0.4} metalness={0.1} />
      </mesh>
    </RigidBody>
  )
}
