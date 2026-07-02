import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useMovementKeys } from '../hooks/useMovementKeys'
import { useGame } from '../store'
import type { ItemRef } from '../store'
import { content } from '../content'
import type { Island, IslandId } from '../content'
import {
  nearestIsland,
  spawnIsland,
  getIsland,
  islandRadius,
  islandHasOrbit,
  islandItems,
  orbitRadius,
  orbitOffset,
} from '../lib/world'
import { WORLD, ORBIT } from '../config'

// ─────────────────────────────────────────────────────────────────────────────
//  Third-person physics character controller (floating-islands edition).
//
//  • Dynamic Rapier capsule, rotations locked so it stays upright.
//  • WASD/arrows move RELATIVE to the camera; Shift sprints; Space jumps.
//  • DOUBLE JUMP: a second jump is allowed mid-air; resets on landing.
//  • WALL JUMP: while clinging to a wall you can jump unlimited times (+ wall-slide).
//  • Weighty arc: stronger gravity + FALL_MULTIPLIER so it's not floaty.
//  • Falls into the void below RESPAWN_Y → gently respawns on the NEAREST island.
//  • WORLD BORDER: clamped inside WORLD.BORDER_RADIUS (see config.ts).
//  • Fast-travel teleports are picked up from the store.
//
//  Swap the capsule <mesh> for <Avatar /> (components/Avatar.tsx) to use a .glb.
// ─────────────────────────────────────────────────────────────────────────────

// ── TUNABLE MOVEMENT CONSTANTS ───────────────────────────────────────────────
const WALK_SPEED = 9 // snappy default (world units / second)
const SPRINT_SPEED = 16 // hold Shift; clearly faster than walking
const JUMP_SPEED = 9 // pairs with WORLD.GRAVITY for the jump arc
const MAX_JUMPS = 2 // 2 = double jump; set to 1 to disable, 3 for triple, …
// Falling faster than rising makes the jump feel weighty instead of floaty.
const FALL_MULTIPLIER = 1.5 // gravity ×this while descending (1 = symmetric)
// Terminal velocity: caps fall speed so you can't move fast enough to tunnel
// through the (thin) bridge/island colliders in a single physics step.
const MAX_FALL_SPEED = -32
// Wall jump: while clinging to a wall you can jump unlimited times.
const WALL_REACH = 0.62 // how close (horizontal) a wall must be to cling to it
const WALL_SLIDE_MAX_FALL = -4 // capped descent speed while clinging (cling feel)
// ─────────────────────────────────────────────────────────────────────────────

// Capsule dimensions — shared by the collider and the visible mesh.
const RADIUS = 0.4
const HALF_HEIGHT = 0.5 // half the cylinder section; total height = 1.8
const CENTER_TO_FEET = HALF_HEIGHT + RADIUS // 0.9

const GROUND_RAY_LENGTH = 2
const GROUNDED_THRESHOLD = CENTER_TO_FEET + 0.18
const INTERACT_MARGIN = 1 // how far past an island's edge still counts as "on it"

// Horizontal directions sampled to detect a nearby wall (for wall jump).
const WALL_DIRS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [0.707, 0.707],
  [-0.707, 0.707],
  [0.707, -0.707],
  [-0.707, -0.707],
]

interface PlayerProps {
  /** Shared vector the camera reads to follow the player. */
  targetRef: React.RefObject<THREE.Vector3>
}

// Where to drop the player so their feet rest on an island's surface.
function surfaceY(island: Island): number {
  return island.position[1] + CENTER_TO_FEET + 0.4
}

export function Player({ targetRef }: PlayerProps) {
  const body = useRef<RapierRigidBody>(null)
  const keys = useMovementKeys()
  const { rapier, world } = useRapier()

  // Reusable vectors (avoid per-frame allocation).
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())
  const move = useRef(new THREE.Vector3())
  const up = useRef(new THREE.Vector3(0, 1, 0))
  const groundN = useRef(new THREE.Vector3())

  const lastNearby = useRef<IslandId | null>(null)
  const prevJump = useRef(false)
  const jumpsRemaining = useRef(MAX_JUMPS)
  const airborneByJump = useRef(false) // set on jump, cleared on landing; gates ground movement
  const lastTeleportNonce = useRef(useGame.getState().teleportNonce)

  // Spawn a few units behind the hub's pedestal (not on top of it). The starting
  // camera looks toward +Z, so offsetting in -Z puts the pedestal/cube ahead.
  const spawn = spawnIsland()
  const SPAWN_POS: [number, number, number] = [
    spawn.position[0],
    surfaceY(spawn),
    spawn.position[2] - 4,
  ]

  // Ground probe: are we on a surface, and what's its normal? The normal lets the
  // player walk ALONG slopes (bridge droop, ramps) instead of into them.
  const groundInfo = (rb: RapierRigidBody): { grounded: boolean; nx: number; ny: number; nz: number } => {
    const t = rb.translation()
    const ray = new rapier.Ray({ x: t.x, y: t.y, z: t.z }, { x: 0, y: -1, z: 0 })
    const hit = world.castRayAndGetNormal(ray, GROUND_RAY_LENGTH, true, undefined, undefined, undefined, rb)
    if (hit && hit.timeOfImpact <= GROUNDED_THRESHOLD) {
      return { grounded: true, nx: hit.normal.x, ny: hit.normal.y, nz: hit.normal.z }
    }
    return { grounded: false, nx: 0, ny: 1, nz: 0 }
  }

  // Detect a nearby vertical surface by casting short horizontal rays. Used for
  // the wall jump: while clinging you can jump an unlimited number of times.
  const isOnWall = (rb: RapierRigidBody): boolean => {
    const t = rb.translation()
    for (const [dx, dz] of WALL_DIRS) {
      const ray = new rapier.Ray({ x: t.x, y: t.y, z: t.z }, { x: dx, y: 0, z: dz })
      const hit = world.castRay(ray, WALL_REACH, true, rapier.QueryFilterFlags.EXCLUDE_DYNAMIC)
      if (hit) return true
    }
    return false
  }

  const placeOn = (rb: RapierRigidBody, island: Island) => {
    rb.setTranslation({ x: island.position[0], y: surfaceY(island), z: island.position[2] }, true)
    rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
    jumpsRemaining.current = MAX_JUMPS
    airborneByJump.current = false
  }

  useFrame((state) => {
    const rb = body.current
    if (!rb) return

    // ── Fast-travel teleport (store nonce changed) ────────────────────────────
    const st = useGame.getState()
    if (st.teleportNonce !== lastTeleportNonce.current) {
      lastTeleportNonce.current = st.teleportNonce
      const target = st.teleportTarget ? getIsland(st.teleportTarget) : null
      if (target) placeOn(rb, target)
    }

    let t = rb.translation()

    // ── Fall respawn: never punish, just relocate to the nearest island ───────
    if (t.y < WORLD.RESPAWN_Y) {
      placeOn(rb, nearestIsland(t.x, t.z))
      useGame.getState().setFading(true)
      t = rb.translation()
    }

    // ── World border: clamp inside the playable radius ────────────────────────
    const horiz = Math.hypot(t.x, t.z)
    if (horiz > WORLD.BORDER_RADIUS) {
      const nx = t.x / horiz
      const nz = t.z / horiz
      rb.setTranslation({ x: nx * WORLD.BORDER_RADIUS, y: t.y, z: nz * WORLD.BORDER_RADIUS }, true)
      const lv = rb.linvel()
      const outward = lv.x * nx + lv.z * nz
      if (outward > 0) {
        rb.setLinvel({ x: lv.x - outward * nx, y: lv.y, z: lv.z - outward * nz }, true)
      }
      t = rb.translation()
    }

    // Publish position for the camera + interaction detection.
    targetRef.current.set(t.x, t.y, t.z)

    const panelOpen = st.openPanel !== null
    const linvel = rb.linvel()

    if (panelOpen) {
      // Freeze horizontal motion while reading a panel (gravity still applies).
      rb.setLinvel({ x: 0, y: linvel.y, z: 0 }, true)
    } else {
      // Camera-relative basis flattened onto the ground plane.
      state.camera.getWorldDirection(forward.current)
      forward.current.y = 0
      forward.current.normalize()
      right.current.crossVectors(forward.current, up.current).normalize()

      const f = (keys.current.forward ? 1 : 0) - (keys.current.backward ? 1 : 0)
      const r = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0)
      const speed = keys.current.sprint ? SPRINT_SPEED : WALK_SPEED

      move.current.set(0, 0, 0)
      move.current.addScaledVector(forward.current, f)
      move.current.addScaledVector(right.current, r)
      const moving = move.current.lengthSq() > 0
      if (moving) move.current.normalize().multiplyScalar(speed)

      // Ground/wall state. Double jump resets when resting on a surface.
      const ground = groundInfo(rb)
      const grounded = ground.grounded
      const onWall = !grounded && isOnWall(rb)
      if (grounded && linvel.y <= 0.05) jumpsRemaining.current = MAX_JUMPS

      // A jump sets airborneByJump; it stays set until we've actually landed
      // (grounded again, no upward velocity). Until then we never apply ground
      // movement — otherwise it would zero the jump's lift-off on the frame or two
      // where you're rising but the ground probe still reports you as grounded.
      if (airborneByJump.current && grounded && linvel.y <= 0.01) airborneByJump.current = false
      const groundedMove = grounded && !airborneByJump.current

      if (groundedMove && moving) {
        // Follow the surface: project the move onto the ground plane so you climb
        // / descend bridges + ramps instead of pushing horizontally into them.
        groundN.current.set(ground.nx, ground.ny, ground.nz)
        move.current.projectOnPlane(groundN.current)
        if (move.current.lengthSq() > 1e-6) move.current.setLength(speed)
        rb.setLinvel({ x: move.current.x, y: move.current.y, z: move.current.z }, true)
      } else if (groundedMove) {
        // Grounded + idle: stop dead (no sliding down slopes / off bridges).
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
      } else {
        // Airborne (or mid-jump): horizontal control, gravity/jump handle Y.
        rb.setLinvel({ x: move.current.x, y: linvel.y, z: move.current.z }, true)
      }

      // Wall cling: cap the descent speed so you "stick" and can climb the wall.
      const slideVel = rb.linvel()
      if (onWall && slideVel.y < WALL_SLIDE_MAX_FALL) {
        rb.setLinvel({ x: slideVel.x, y: WALL_SLIDE_MAX_FALL, z: slideVel.z }, true)
      }

      // Jump: ground/air jumps consume the count; wall jumps are UNLIMITED.
      const jumpHeld = keys.current.jump
      const canJump = jumpsRemaining.current > 0 || onWall
      if (jumpHeld && !prevJump.current && canJump) {
        const cur = rb.linvel()
        rb.setLinvel({ x: cur.x, y: JUMP_SPEED, z: cur.z }, true)
        airborneByJump.current = true
        if (!onWall) jumpsRemaining.current -= 1 // clinging → free, infinite jumps
      }
      prevJump.current = jumpHeld
    }

    // Snappier, less-floaty arc: fall faster than you rise.
    const vy = rb.linvel().y
    rb.setGravityScale(vy < -0.2 ? FALL_MULTIPLIER : 1, true)

    // Clamp to terminal velocity (anti-tunneling + a more natural fall).
    if (vy < MAX_FALL_SPEED) {
      const v = rb.linvel()
      rb.setLinvel({ x: v.x, y: MAX_FALL_SPEED, z: v.z }, true)
    }

    // ── Nearest island within interaction range (you're standing on/near it) ──
    let nearby: IslandId | null = null
    let best = Infinity
    for (const island of content.islands) {
      const dx = t.x - island.position[0]
      const dz = t.z - island.position[2]
      const dist = Math.hypot(dx, dz)
      const reach = islandRadius(island) + INTERACT_MARGIN
      if (dist <= reach && dist < best) {
        best = dist
        nearby = island.id
      }
    }
    if (nearby !== lastNearby.current) {
      lastNearby.current = nearby
      useGame.getState().setNearbyIsland(nearby)
    }

    // ── Nearest orbiting item icon on that island (within ORBIT.REACH) ─────────
    let item: ItemRef | null = null
    const isl = nearby ? getIsland(nearby) : undefined
    if (isl && islandHasOrbit(isl)) {
      const itemsList = islandItems(isl)
      const r = orbitRadius(isl)
      const e = state.clock.elapsedTime
      let bestItem = ORBIT.REACH
      for (let i = 0; i < itemsList.length; i++) {
        const o = orbitOffset(i, itemsList.length, r, e)
        const ix = isl.position[0] + o.x
        const iz = isl.position[2] + o.z
        const d = Math.hypot(t.x - ix, t.z - iz)
        if (d <= ORBIT.REACH && d < bestItem) {
          bestItem = d
          item = { islandId: isl.id, index: i }
        }
      }
    }
    useGame.getState().setNearbyItem(item)
  })

  return (
    <RigidBody
      ref={body}
      colliders={false}
      ccd
      position={SPAWN_POS}
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
