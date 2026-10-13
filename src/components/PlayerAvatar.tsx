import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useBakedGeometry, modelUrl, preloadModel } from '../lib/gltf'
import { useGame } from '../store'
import { getIsland } from '../lib/world'
import { VISUALS } from '../config'

// ─────────────────────────────────────────────────────────────────────────────
//  The player: a clear glass icosahedron with a small glowing core — the same
//  glowing material as the cubes on the island pedestals (Waypoint.tsx) —
//  drifting above the ground and trailing smoke.
//
//  The glass refracts the world behind it and reflects a night sky made here
//  (nightReflections), so its facets catch the light. On low quality it skips
//  the costly refraction and is simply see-through + reflective.
//
//  The glass tint, the core and the smoke all take the accent colour of
//  whatever island you're standing on and ease between them, so the avatar
//  tells you which section you're in. Off-island it keeps the last colour.
// ─────────────────────────────────────────────────────────────────────────────

const MODEL = 'models/player.glb'
const SHELL_SIZE = 0.95 // the icosahedron's height (the player capsule is 1.8 tall)
const FLOAT_HEIGHT = 0.15
const BOB_AMP = 0.09
const BOB_SPEED = 1.6
const SPIN_SPEED = 0.35
const COLOR_LERP = 2.5
const FALLBACK = '#8ecae6'
const LIGHT_INTENSITY = 4.5 // the glow the avatar casts on the ground around it
const CORE_SIZE = 0.17 // radius of the glowing core inside the glass
const GLASS_TINT = 0.25 // how much of the island colour tints the glass (0 = clear)
const GLASS_GLOW = 0.12 // faint self-glow of the glass itself
const GLASS_LOW_OPACITY = 0.3 // low quality: no refraction, just see-through
const WHITE = new THREE.Color('#ffffff')

// ── Smoke trail ──────────────────────────────────────────────────────────────
// A few large, soft puffs rather than many fine dots: each one swells, rises
// and thins out over PUFF_LIFE. Drawn with normal (not additive) blending, so
// overlapping puffs build up like smoke instead of sparkling.
const EMIT_RATE = 26 // puffs per second, smeared along the path travelled
const PUFF_LIFE = 3.4 // seconds before a puff has fully faded
const PUFFS = Math.ceil(EMIT_RATE * PUFF_LIFE) + 8 // pool covering every live puff
const PUFF_START = 0.4 // diameter at birth (world units)
const PUFF_GROW = 1.6 // how much it swells by the time it's gone
const PUFF_SCATTER = 0.3 // random offset so it's a cloud, not a line
const PUFF_DRIFT = 0.45 // upward drift, slowing as puffs age
const PUFF_ALPHA = 0.3 // per-puff strength; they stack, so keep each one soft
const SMOKE_GREY = new THREE.Color('#9ea7bb') // the island colour is mixed toward this
const SMOKE_GREYNESS = 0.55

// ─────────────────────────────────────────────────────────────────────────────

const PUFF_VERT = /* glsl */ `
  attribute float aAge;   // 0 = just born, 1 = fully faded
  attribute float aSeed;
  varying float vAge;
  varying float vSeed;
  varying vec2 vSpin;
  uniform float uStart;
  uniform float uGrow;
  uniform float uScale;   // pixels per world unit at distance 1
  void main() {
    vAge = aAge;
    vSeed = aSeed;
    // Each puff gets its own fixed tilt, so the lumps don't all line up.
    float ang = aSeed * 6.2832;
    vSpin = vec2(cos(ang), sin(ang));
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // Billows out quickly, then keeps spreading slowly.
    float size = uStart + uGrow * sqrt(aAge);
    gl_PointSize = size * uScale / max(-mv.z, 0.001);
    gl_Position = projectionMatrix * mv;
  }
`

// Soft, slightly lumpy puff, no texture needed.
const PUFF_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  varying float vAge;
  varying float vSeed;
  varying vec2 vSpin;
  void main() {
    vec2 d = gl_PointCoord - vec2(0.5);
    float r = length(d) * 2.0;
    if (r > 1.0) discard;
    // Gaussian falloff, reaching zero at the rim.
    float soft = (exp(-r * r * 3.0) - exp(-3.0)) / (1.0 - exp(-3.0));
    // Low-frequency lumps, so overlapping puffs read as billowing smoke.
    vec2 q = mat2(vSpin.x, -vSpin.y, vSpin.y, vSpin.x) * d;
    float lump = 0.75 + 0.25 * sin(q.x * 9.0 + vSeed * 40.0) * sin(q.y * 7.0 + vSeed * 23.0);
    // Fade in fast (no pop at birth), then thin out slowly.
    float fade = smoothstep(0.0, 0.1, vAge) * pow(1.0 - vAge, 1.6);
    gl_FragColor = vec4(uColor * mix(1.0, 0.75, vAge), soft * lump * fade * uAlpha);
  }
`

/**
 * A small environment map for the glass to reflect: dark overhead, a navy
 * horizon with the aurora's green-to-violet glow just above it, and a bright
 * moon so the facets catch a highlight. Rendered once into a PMREM so it's
 * cheap per frame; used by this material only (the scene has no environment).
 */
function nightReflections(gl: THREE.WebGLRenderer): THREE.WebGLRenderTarget {
  const scene = new THREE.Scene()
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        float y = vDir.y;
        vec3 below = vec3(0.02, 0.03, 0.07);
        vec3 horizon = vec3(0.10, 0.17, 0.33);
        vec3 zenith = vec3(0.01, 0.015, 0.04);
        vec3 col = y < 0.0
          ? mix(horizon, below, smoothstep(0.0, 0.5, -y))
          : mix(horizon, zenith, smoothstep(0.0, 0.8, y));
        float band = smoothstep(0.02, 0.18, y) * (1.0 - smoothstep(0.25, 0.6, y));
        col += mix(vec3(0.18, 1.0, 0.63), vec3(0.65, 0.55, 0.98), smoothstep(0.1, 0.5, y)) * band * 0.6;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  })
  const sky = new THREE.Mesh(new THREE.SphereGeometry(10, 48, 24), skyMat)
  const moonMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 4.2, 4.5) })
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 8), moonMat)
  moon.position.set(150, 50, 150).normalize().multiplyScalar(8) // where the scene's moon is
  scene.add(sky, moon)

  const pmrem = new THREE.PMREMGenerator(gl)
  const target = pmrem.fromScene(scene, 0.02)
  pmrem.dispose()
  sky.geometry.dispose()
  skyMat.dispose()
  moon.geometry.dispose()
  moonMat.dispose()
  return target
}

export function PlayerAvatar() {
  const { geometry, size } = useBakedGeometry(MODEL, 'base')
  const scale = SHELL_SIZE / Math.max(size.y, 1e-3)

  const shell = useRef<THREE.Group>(null)
  const light = useRef<THREE.PointLight>(null)
  const points = useRef<THREE.Points>(null)

  const current = useMemo(() => new THREE.Color(FALLBACK), [])
  const target = useMemo(() => new THREE.Color(FALLBACK), [])
  const lastIsland = useRef<string | null>(null)

  const gl = useThree((s) => s.gl)
  const highQuality = useGame((s) => s.quality) === 'high'
  const reflections = useMemo(() => nightReflections(gl), [gl])
  useEffect(() => () => reflections.dispose(), [reflections])

  // Glass: smooth, clear-coated and reflective. High quality refracts the world
  // behind it (transmission); low quality is just see-through.
  const shellMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: FALLBACK,
        emissive: FALLBACK,
        emissiveIntensity: GLASS_GLOW,
        metalness: 0,
        roughness: 0.04,
        envMap: reflections.texture,
        envMapIntensity: 2,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        ior: 1.5,
        thickness: 0.6,
        ...(highQuality ? { transmission: 1 } : { transparent: true, opacity: GLASS_LOW_OPACITY }),
      }),
    [reflections, highQuality],
  )
  useEffect(() => () => shellMat.dispose(), [shellMat])

  // The core: same as the pedestal cubes — the island's colour, glowing
  // through the bloom.
  const coreMat = useMemo(
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
          uScale: { value: 1 },
          uAlpha: { value: PUFF_ALPHA },
        },
        vertexShader: PUFF_VERT,
        fragmentShader: PUFF_FRAG,
        transparent: true,
        depthWrite: false,
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
      /** Fractional puffs owed, so emission follows time, not frame rate. */
      owed: { n: 0 },
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
    shellMat.color.copy(current).lerp(WHITE, 1 - GLASS_TINT)
    shellMat.emissive.copy(current)
    coreMat.color.copy(current)
    coreMat.emissive.copy(current)
    puffMat.uniforms.uColor.value.copy(current).lerp(SMOKE_GREY, SMOKE_GREYNESS)
    if (light.current) light.current.color.copy(current)

    const y = FLOAT_HEIGHT + Math.sin(t * BOB_SPEED) * BOB_AMP
    if (shell.current) {
      shell.current.position.y = y
      shell.current.rotation.y = t * SPIN_SPEED
      shell.current.rotation.x = Math.sin(t * 0.4) * 0.25
    }
    if (light.current) light.current.position.y = y

    // ── Smoke ────────────────────────────────────────────────────────────────
    const pts = points.current
    if (!pts) return
    pts.getWorldPosition(worldPos)
    const emitY = worldPos.y + y

    // Puff sizes are in world units: convert with the camera's pixels-per-unit.
    const cam = state.camera as THREE.PerspectiveCamera
    puffMat.uniforms.uScale.value =
      (state.size.height * state.gl.getPixelRatio()) / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2))

    if (!puffs.seeded.done) {
      puffs.seeded.done = true
      puffs.prev.set(worldPos.x, emitY, worldPos.z)
    }
    puffs.owed.n += EMIT_RATE * delta
    const emit = Math.min(Math.floor(puffs.owed.n), 8) // capped: no burst after a stall
    puffs.owed.n -= Math.floor(puffs.owed.n)
    for (let k = 0; k < emit; k++) {
      const f = (k + 1) / emit
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
      // Puffs rise, slowing as they thin out.
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
        {/* Centred in the shell (its geometry stands on y = 0), so it turns with it. */}
        <mesh position={[0, SHELL_SIZE / 2, 0]} material={coreMat}>
          <icosahedronGeometry args={[CORE_SIZE, 0]} />
        </mesh>
      </group>

      <pointLight ref={light} intensity={LIGHT_INTENSITY} distance={6} decay={2} />

      {/* Smoke trail. frustumCulled off: its bounding box is stale by design. */}
      <points ref={points} geometry={puffs.geometry} material={puffMat} frustumCulled={false} />
    </group>
  )
}

preloadModel(modelUrl(MODEL))
