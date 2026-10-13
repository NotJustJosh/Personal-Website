import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useBakedGeometry, modelUrl, preloadModel } from '../lib/gltf'
import { useGame } from '../store'
import { getIsland } from '../lib/world'
import { VISUALS } from '../config'

// ─────────────────────────────────────────────────────────────────────────────
//  The player: a glowing icosahedron — the same glowing material as the cubes
//  on the island pedestals (Waypoint.tsx) — drifting above the ground and
//  trailing a soft misty plume.
//
//  The shell and the plume both take the accent colour of whatever island
//  you're standing on and ease between them, so the avatar tells you which
//  section you're in. Off-island it keeps the last colour rather than going grey.
// ─────────────────────────────────────────────────────────────────────────────

const MODEL = 'models/player.glb'
const SHELL_SIZE = 0.95 // the icosahedron's height (the player capsule is 1.8 tall)
const FLOAT_HEIGHT = 0.15
const BOB_AMP = 0.09
const BOB_SPEED = 1.6
const SPIN_SPEED = 0.35
const COLOR_LERP = 2.5
const FALLBACK = '#8ecae6'

// ── Misty plume ──────────────────────────────────────────────────────────────
// Tail length is set by PUFF_LIFE; DENSITY is set by how many go out per frame.
// The pool has to cover LIFE x PER_FRAME x framerate, hence 640.
const PUFFS = 640
const EMIT_PER_FRAME = 4 // emitted every frame, smeared along the path travelled
const PUFF_LIFE = 3.2 // seconds before a puff has fully faded
const PUFF_START = 30 // starting point size (px at 1 unit)
const PUFF_GROW = 150 // how much a puff swells over its life — this is the mist
const PUFF_SCATTER = 0.2 // random offset so it's a cloud, not a line
const PUFF_DRIFT = 0.35 // upward drift as puffs age
const PUFF_ALPHA = 0.32 // per-puff strength; they stack, so keep each one soft

// ─────────────────────────────────────────────────────────────────────────────

const PUFF_VERT = /* glsl */ `
  attribute float aAge;   // 0 = just born, 1 = fully faded
  attribute float aSeed;
  varying float vAge;
  varying float vSeed;
  uniform float uStart;
  uniform float uGrow;
  void main() {
    vAge = aAge;
    vSeed = aSeed;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // Swell as it ages — a small ember becoming a broad puff of mist.
    gl_PointSize = (uStart + uGrow * aAge) / max(-mv.z, 0.001);
    gl_Position = projectionMatrix * mv;
  }
`

// Soft-edged blob, no texture needed: alpha falls off from the point centre.
const PUFF_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  varying float vAge;
  varying float vSeed;
  void main() {
    vec2 d = gl_PointCoord - vec2(0.5);
    float r = length(d) * 2.0;
    if (r > 1.0) discard;
    // Very soft shoulder => mist rather than a hard dot.
    float soft = pow(1.0 - r, 2.6);
    // Fade out over the lifetime, quickly at first then lingering.
    float fade = pow(1.0 - vAge, 1.8);
    float a = soft * fade * uAlpha;
    vec3 col = mix(uColor, vec3(1.0), (1.0 - vAge) * 0.5);
    gl_FragColor = vec4(col * a, a);
  }
`

export function PlayerAvatar() {
  const { geometry, size } = useBakedGeometry(MODEL, 'base')
  const scale = SHELL_SIZE / Math.max(size.y, 1e-3)

  const shell = useRef<THREE.Group>(null)
  const light = useRef<THREE.PointLight>(null)
  const points = useRef<THREE.Points>(null)

  const current = useMemo(() => new THREE.Color(FALLBACK), [])
  const target = useMemo(() => new THREE.Color(FALLBACK), [])
  const lastIsland = useRef<string | null>(null)

  // Same as the pedestal cubes: the island's color, glowing through the bloom.
  // Its color is eased each frame below.
  const shellMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: FALLBACK,
        emissive: FALLBACK,
        emissiveIntensity: VISUALS.EMISSIVE.marker,
        roughness: 0.3,
        toneMapped: false,
      }),
    [],
  )

  const puffMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(FALLBACK) },
          uStart: { value: PUFF_START },
          uGrow: { value: PUFF_GROW },
          uAlpha: { value: PUFF_ALPHA },
        },
        vertexShader: PUFF_VERT,
        fragmentShader: PUFF_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [],
  )

  // Ring buffer of puffs. Positions are kept in WORLD space and rebased to the
  // avatar's local space each frame, so the plume stays put as the player moves.
  const puffs = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PUFFS * 3), 3))
    g.setAttribute('aAge', new THREE.BufferAttribute(new Float32Array(PUFFS).fill(1), 1))
    g.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(PUFFS), 1))
    return {
      geometry: g,
      world: new Float32Array(PUFFS * 3),
      born: new Float32Array(PUFFS).fill(-1e9),
      next: { i: 0 },
      prev: new THREE.Vector3(),
      seeded: { done: false },
    }
  }, [])

  const worldPos = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime

    const nearby = useGame.getState().nearbyIsland
    if (nearby && nearby !== lastIsland.current) {
      lastIsland.current = nearby
      const island = getIsland(nearby)
      if (island) target.set(island.accentColor)
    }
    current.lerp(target, 1 - Math.exp(-COLOR_LERP * delta))
    shellMat.color.copy(current)
    shellMat.emissive.copy(current)
    puffMat.uniforms.uColor.value.copy(current)
    if (light.current) light.current.color.copy(current)

    const y = FLOAT_HEIGHT + Math.sin(t * BOB_SPEED) * BOB_AMP
    if (shell.current) {
      shell.current.position.y = y
      shell.current.rotation.y = t * SPIN_SPEED
      shell.current.rotation.x = Math.sin(t * 0.4) * 0.25
    }
    if (light.current) light.current.position.y = y

    // ── Plume ────────────────────────────────────────────────────────────────
    const pts = points.current
    if (!pts) return
    pts.getWorldPosition(worldPos)
    const emitY = worldPos.y + y

    if (!puffs.seeded.done) {
      puffs.seeded.done = true
      puffs.prev.set(worldPos.x, emitY, worldPos.z)
    }
    for (let k = 0; k < EMIT_PER_FRAME; k++) {
      const f = (k + 1) / EMIT_PER_FRAME
      const i = puffs.next.i
      puffs.world[i * 3] = puffs.prev.x + (worldPos.x - puffs.prev.x) * f + (Math.random() - 0.5) * PUFF_SCATTER
      puffs.world[i * 3 + 1] = puffs.prev.y + (emitY - puffs.prev.y) * f + (Math.random() - 0.5) * PUFF_SCATTER
      puffs.world[i * 3 + 2] = puffs.prev.z + (worldPos.z - puffs.prev.z) * f + (Math.random() - 0.5) * PUFF_SCATTER
      puffs.born[i] = t
      puffs.geometry.attributes.aSeed.setX(i, Math.random())
      puffs.next.i = (i + 1) % PUFFS
    }
    puffs.geometry.attributes.aSeed.needsUpdate = true
    puffs.prev.set(worldPos.x, emitY, worldPos.z)

    const pos = puffs.geometry.attributes.position as THREE.BufferAttribute
    const age = puffs.geometry.attributes.aAge as THREE.BufferAttribute
    for (let i = 0; i < PUFFS; i++) {
      const a = Math.min(1, (t - puffs.born[i]) / PUFF_LIFE)
      age.setX(i, a)
      // Older puffs drift gently upward, like smoke.
      puffs.world[i * 3 + 1] += PUFF_DRIFT * delta * (1 - a)
      pos.setXYZ(
        i,
        puffs.world[i * 3] - worldPos.x,
        puffs.world[i * 3 + 1] - worldPos.y,
        puffs.world[i * 3 + 2] - worldPos.z,
      )
    }
    pos.needsUpdate = true
    age.needsUpdate = true
  })

  return (
    <group>
      <group ref={shell}>
        <mesh geometry={geometry} scale={scale} material={shellMat} castShadow />
      </group>

      <pointLight ref={light} intensity={VISUALS.EMISSIVE.marker} distance={6} decay={2} />

      {/* Misty plume. frustumCulled off: its bounding box is stale by design. */}
      <points ref={points} geometry={puffs.geometry} material={puffMat} frustumCulled={false} />
    </group>
  )
}

preloadModel(modelUrl(MODEL))
