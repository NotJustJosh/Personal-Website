import { useMemo } from 'react'
import * as THREE from 'three'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { useGLTF, Instances, Instance } from '@react-three/drei'
import type { Island } from '../content'
import { modelUrl } from '../lib/gltf'
import { islandRadius } from '../lib/world'

// ─────────────────────────────────────────────────────────────────────────────
//  A rope bridge between two islands, built from the user's post.glb + plank.glb.
//
//  • Spans EDGE-to-EDGE (posts sit at each island's rim, planks fill the gap).
//  • The deck SAGS like a real rope bridge (a parabola, flush at both ends), and
//    the physics collider is a chain of short boxes following the same sag, so
//    your footing matches the visual dip.
//  • A PAIR of (chunky) posts at each end (4 total), ~waist height, vertical.
//  • Plank copies are instanced along the deck; each is nudged/rotated/flipped a
//    little so the run doesn't look cookie-cutter.
//  • Ropes: two sagging side handrails, edge ropes along the plank sides, and
//    vertical tie-ropes linking handrail → deck.
//  • Invisible side WALLS run the length of each side so you can't fall off.
//  • The GLBs ship without materials, so we author plain wood/rope materials here.
// ─────────────────────────────────────────────────────────────────────────────

// ── Tunables ─────────────────────────────────────────────────────────────────
const WALKWAY = 2.2 // deck width (world units)
const POST_HEIGHT = 1.05 // ~waist height vs the ~1.8-unit player
const POST_THICK = 0.42 // post cross-section (chunky, independent of height)
const PLANK_GAP = 0.14 // gap between plank slats
const DECK_SAG_FACTOR = 0.05 // sag depth as a fraction of span
const DECK_SAG_MAX = 2.4
const HANDRAIL_EXTRA_SAG = 0.6 // handrails droop a little more than the deck
const TIE_SPACING = 2.4 // world units between vertical tie-ropes
const COLLIDER_SEGMENTS = 10 // chain length approximating the sag
const COLLIDER_HALF_THICK = 0.4 // half-thickness of each deck collider (anti-tunnel)
const WALL_HALF_H = 0.6 // side-wall half height (keeps you on the bridge)
const WALL_HALF_THICK = 0.06
const RAIL_RADIUS = 0.06
const ROPE_RADIUS = 0.045

// Plank variation amounts (small, so the deck still reads as a tidy walkway).
const JIT_ACROSS = 0.1
const JIT_ALONG = 0.08
const JIT_VERT = 0.03
const JIT_YAW = 0.2 // ±~5.7°
const JIT_ROLL = 0.1 // ±~2.9°

// ── Authored materials (the GLBs have none) — plain wood/rope, no tint. ───────
const WOOD = '#9a7d56'
const ROPE = '#cbb388'
const UP = new THREE.Vector3(0, 1, 0)
const AXIS_X = new THREE.Vector3(1, 0, 0)
const AXIS_Y = new THREE.Vector3(0, 1, 0)

// Deterministic per-index pseudo-random in [0,1).
function noise(n: number) {
  const r = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return r - Math.floor(r)
}
function hashString(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h % 1000
}

// Load a GLB, bake its node transform into the geometry (so proportions are
// final), and re-anchor it: 'base' puts the bottom at y=0, 'top' the top at y=0,
// both centered on x/z. Computed once per (model, anchor); shared by all bridges.
function useBakedGeometry(path: string, anchor: 'base' | 'top') {
  const { scene } = useGLTF(modelUrl(path))
  return useMemo(() => {
    scene.updateMatrixWorld(true)
    let mesh: THREE.Mesh | undefined
    scene.traverse((o) => {
      if (!mesh && (o as THREE.Mesh).isMesh) mesh = o as THREE.Mesh
    })
    const geometry = mesh!.geometry.clone()
    geometry.applyMatrix4(mesh!.matrixWorld)
    geometry.computeBoundingBox()
    const bb = geometry.boundingBox!
    const cx = (bb.min.x + bb.max.x) / 2
    const cz = (bb.min.z + bb.max.z) / 2
    const ty = anchor === 'base' ? -bb.min.y : -bb.max.y
    geometry.translate(-cx, ty, -cz)
    geometry.computeBoundingBox()
    const size = new THREE.Vector3()
    geometry.boundingBox!.getSize(size)
    return { geometry, size }
  }, [scene, anchor])
}

function tubeFromPoints(points: THREE.Vector3[], radius: number, segments: number) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segments, radius, 6, false)
}

export function RopeBridge({ a, b }: { a: Island; b: Island }) {
  const post = useBakedGeometry('models/post.glb', 'base')
  const plank = useBakedGeometry('models/plank.glb', 'top')

  // Plain wood/rope materials (no accent tint). Faint self-emissive so the
  // bridges still read out in the dark void.
  const woodMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(WOOD),
        roughness: 0.85,
        metalness: 0,
        emissive: new THREE.Color(WOOD),
        emissiveIntensity: 0.05,
      }),
    [],
  )
  const ropeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(ROPE),
        roughness: 1,
        metalness: 0,
        emissive: new THREE.Color(ROPE),
        emissiveIntensity: 0.05,
      }),
    [],
  )

  // Post: chunky cross-section, scaled to waist height (non-uniform on purpose).
  const postScale: [number, number, number] = [
    POST_THICK / Math.max(post.size.x, 1e-3),
    POST_HEIGHT / Math.max(post.size.y, 1e-3),
    POST_THICK / Math.max(post.size.z, 1e-3),
  ]
  const plankScale = WALKWAY / Math.max(plank.size.z, 1e-3) // plank long axis (Z) = across
  const plankDepth = plank.size.x * plankScale // along-span footprint, for spacing

  const geom = useMemo(() => {
    const Ra = islandRadius(a)
    const Rb = islandRadius(b)
    const dxC = b.position[0] - a.position[0]
    const dzC = b.position[2] - a.position[2]
    const horizC = Math.hypot(dxC, dzC) || 1
    const hx = dxC / horizC
    const hz = dzC / horizC

    // Endpoints at the island RIMS.
    const A = new THREE.Vector3(a.position[0] + hx * Ra, a.position[1], a.position[2] + hz * Ra)
    const B = new THREE.Vector3(b.position[0] - hx * Rb, b.position[1], b.position[2] - hz * Rb)
    const dx = B.x - A.x
    const dy = B.y - A.y
    const dz = B.z - A.z
    const horiz = Math.hypot(dx, dz) || 1

    const across = new THREE.Vector3(-dz, 0, dx).normalize()
    const half = WALKWAY / 2

    const sag =
      Math.min(DECK_SAG_MAX, horiz * DECK_SAG_FACTOR) *
      THREE.MathUtils.clamp(1 - Math.abs(dy) / horiz, 0.4, 1)

    const deckAt = (t: number, out: THREE.Vector3) =>
      out.set(A.x + dx * t, A.y + dy * t - sag * 4 * t * (1 - t), A.z + dz * t)
    const tangentAt = (t: number, out: THREE.Vector3) =>
      out.set(dx, dy - sag * 4 * (1 - 2 * t), dz).normalize()

    // ── Planks (with per-plank variation) ─────────────────────────────────────
    const seed = hashString(a.id + '-' + b.id)
    const straightLen = Math.hypot(horiz, dy)
    const nPlanks = Math.max(2, Math.round(straightLen / (plankDepth + PLANK_GAP)))
    const planks: { position: [number, number, number]; rotation: [number, number, number] }[] = []

    const p = new THREE.Vector3()
    const tmpT = new THREE.Vector3()
    const tmpN = new THREE.Vector3()
    const baseQuat = new THREE.Quaternion()
    const jit = new THREE.Quaternion()
    const eul = new THREE.Euler()
    const mtx = new THREE.Matrix4()

    for (let i = 0; i < nPlanks; i++) {
      const t = (i + 0.5) / nPlanks
      deckAt(t, p)
      tangentAt(t, tmpT)
      tmpN.crossVectors(across, tmpT).normalize()
      baseQuat.setFromRotationMatrix(mtx.makeBasis(tmpT, tmpN, across))

      const s = seed + i * 7.13
      // flip half the planks 180° in-plane, plus small yaw + roll jitter
      if (noise(s + 1) > 0.5) baseQuat.multiply(jit.setFromAxisAngle(AXIS_Y, Math.PI))
      baseQuat.multiply(jit.setFromAxisAngle(AXIS_Y, (noise(s + 2) - 0.5) * JIT_YAW))
      baseQuat.multiply(jit.setFromAxisAngle(AXIS_X, (noise(s + 3) - 0.5) * JIT_ROLL))
      eul.setFromQuaternion(baseQuat)

      const ja = (noise(s + 4) - 0.5) * JIT_ACROSS
      const jl = (noise(s + 5) - 0.5) * JIT_ALONG
      planks.push({
        position: [
          p.x + across.x * ja + tmpT.x * jl,
          p.y + (noise(s + 6) - 0.5) * JIT_VERT,
          p.z + across.z * ja + tmpT.z * jl,
        ],
        rotation: [eul.x, eul.y, eul.z],
      })
    }

    // ── Posts: a pair at each end ─────────────────────────────────────────────
    const posts: [number, number, number][] = [
      [A.x - across.x * half, A.y, A.z - across.z * half],
      [A.x + across.x * half, A.y, A.z + across.z * half],
      [B.x - across.x * half, B.y, B.z - across.z * half],
      [B.x + across.x * half, B.y, B.z + across.z * half],
    ]

    // ── Ropes ─────────────────────────────────────────────────────────────────
    const SAMPLES = 16
    const handrailSag = sag + HANDRAIL_EXTRA_SAG
    const railOffset = UP.clone().multiplyScalar(POST_HEIGHT)

    const handrail = (side: number) => {
      const pts: THREE.Vector3[] = []
      for (let i = 0; i <= SAMPLES; i++) {
        const t = i / SAMPLES
        const v = new THREE.Vector3(
          A.x + dx * t + across.x * half * side,
          A.y + dy * t,
          A.z + dz * t + across.z * half * side,
        ).add(railOffset)
        v.y -= handrailSag * 4 * t * (1 - t)
        pts.push(v)
      }
      return pts
    }
    const edge = (side: number) => {
      const pts: THREE.Vector3[] = []
      const d = new THREE.Vector3()
      for (let i = 0; i <= SAMPLES; i++) {
        deckAt(i / SAMPLES, d)
        pts.push(new THREE.Vector3(d.x + across.x * half * side, d.y, d.z + across.z * half * side))
      }
      return pts
    }

    const ropeGeoms: THREE.BufferGeometry[] = [
      tubeFromPoints(handrail(-1), RAIL_RADIUS, SAMPLES),
      tubeFromPoints(handrail(1), RAIL_RADIUS, SAMPLES),
      tubeFromPoints(edge(-1), ROPE_RADIUS, SAMPLES),
      tubeFromPoints(edge(1), ROPE_RADIUS, SAMPLES),
    ]

    const nTies = Math.max(2, Math.round(straightLen / TIE_SPACING))
    const dDeck = new THREE.Vector3()
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 1; i < nTies; i++) {
        const t = i / nTies
        deckAt(t, dDeck)
        const bottom = new THREE.Vector3(
          dDeck.x + across.x * half * side,
          dDeck.y,
          dDeck.z + across.z * half * side,
        )
        const top = new THREE.Vector3(
          A.x + dx * t + across.x * half * side,
          A.y + dy * t - handrailSag * 4 * t * (1 - t),
          A.z + dz * t + across.z * half * side,
        ).add(railOffset)
        ropeGeoms.push(tubeFromPoints([bottom, top], ROPE_RADIUS * 0.7, 1))
      }
    }

    // ── Colliders: deck chain + side walls, all following the sag ─────────────
    const segments: {
      deck: [number, number, number]
      rotation: [number, number, number]
      halfLen: number
      wallL: [number, number, number]
      wallR: [number, number, number]
    }[] = []
    const p0 = new THREE.Vector3()
    const p1 = new THREE.Vector3()
    const segDir = new THREE.Vector3()
    const segNormal = new THREE.Vector3()
    for (let i = 0; i < COLLIDER_SEGMENTS; i++) {
      deckAt(i / COLLIDER_SEGMENTS, p0)
      deckAt((i + 1) / COLLIDER_SEGMENTS, p1)
      segDir.subVectors(p1, p0)
      const segLen = segDir.length() || 1e-3
      segDir.normalize()
      segNormal.crossVectors(across, segDir).normalize()
      eul.setFromRotationMatrix(mtx.makeBasis(segDir, segNormal, across))
      const mx = (p0.x + p1.x) / 2
      const my = (p0.y + p1.y) / 2
      const mz = (p0.z + p1.z) / 2
      segments.push({
        // deck collider top sits on the curve (push centre down along the normal)
        deck: [mx - segNormal.x * COLLIDER_HALF_THICK, my - segNormal.y * COLLIDER_HALF_THICK, mz - segNormal.z * COLLIDER_HALF_THICK],
        rotation: [eul.x, eul.y, eul.z],
        halfLen: segLen / 2 + 0.02,
        wallL: [
          mx - across.x * half + segNormal.x * WALL_HALF_H,
          my - across.y * half + segNormal.y * WALL_HALF_H,
          mz - across.z * half + segNormal.z * WALL_HALF_H,
        ],
        wallR: [
          mx + across.x * half + segNormal.x * WALL_HALF_H,
          my + across.y * half + segNormal.y * WALL_HALF_H,
          mz + across.z * half + segNormal.z * WALL_HALF_H,
        ],
      })
    }

    return { planks, posts, ropeGeoms, segments }
  }, [a, b, plankDepth])

  return (
    <group>
      {/* Walkable deck collider + invisible side walls, both following the sag */}
      <RigidBody type="fixed" colliders={false} friction={1}>
        {geom.segments.map((s, i) => (
          <group key={i}>
            <CuboidCollider
              args={[s.halfLen, COLLIDER_HALF_THICK, WALKWAY / 2]}
              position={s.deck}
              rotation={s.rotation}
            />
            <CuboidCollider
              args={[s.halfLen, WALL_HALF_H, WALL_HALF_THICK]}
              position={s.wallL}
              rotation={s.rotation}
            />
            <CuboidCollider
              args={[s.halfLen, WALL_HALF_H, WALL_HALF_THICK]}
              position={s.wallR}
              rotation={s.rotation}
            />
          </group>
        ))}
      </RigidBody>

      {/* Planks (instanced, with per-plank variation) */}
      <Instances geometry={plank.geometry} material={woodMat} limit={256} castShadow receiveShadow>
        {geom.planks.map((pl, i) => (
          <Instance key={i} position={pl.position} rotation={pl.rotation} scale={plankScale} />
        ))}
      </Instances>

      {/* Posts (a pair at each end), chunky */}
      {geom.posts.map((pos, i) => (
        <mesh key={i} geometry={post.geometry} material={woodMat} position={pos} scale={postScale} castShadow />
      ))}

      {/* Ropes: handrails + edge ropes + vertical ties */}
      {geom.ropeGeoms.map((g, i) => (
        <mesh key={i} geometry={g} material={ropeMat} castShadow />
      ))}
    </group>
  )
}

useGLTF.preload(modelUrl('models/post.glb'))
useGLTF.preload(modelUrl('models/plank.glb'))
