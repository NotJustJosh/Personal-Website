import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useBakedGeometry, modelUrl, preloadModel } from '../lib/gltf'
import { useGame } from '../store'
import { getIsland } from '../lib/world'
import { VISUALS } from '../config'

// ─────────────────────────────────────────────────────────────────────────────
//  The player: a glass icosahedron holding a churning ember of fog/fire, drifting
//  above the ground and trailing a soft misty plume.
//
//  The core and the plume both take the accent colour of whatever island you're
//  standing on and ease between them, so the avatar tells you which section
//  you're in. Off-island it keeps the last colour rather than going grey.
// ─────────────────────────────────────────────────────────────────────────────

const MODEL = 'models/player.glb'
const SHELL_SIZE = 0.95 // outer glass shell (the player capsule is 1.8 tall)
const CORE_SIZE = 0.34 // radius of the churning fog/fire volume
const EMBER_SIZE = 0.11 // the hard bright bead at its heart
const FLOAT_HEIGHT = 0.15
const BOB_AMP = 0.09
const BOB_SPEED = 1.6
const SPIN_SPEED = 0.35
const COLOR_LERP = 2.5
const FALLBACK = '#8ecae6'
const WHITE = new THREE.Color('#ffffff')

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

const CORE_VERT = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Churning 3D noise, hot in the middle and fading to nothing at the rim, so it
// reads as fire/fog suspended inside the shell rather than a solid object.
const CORE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3  uColor;
  uniform float uRadius;
  varying vec3 vPos;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), u.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), u.x), u.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), u.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), u.x), u.y),
      u.z
    );
  }

  float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.05; a *= 0.5; }
    return v;
  }

  void main() {
    vec3 p = vPos / uRadius;
    float r = length(p);

    // Rising, swirling noise — the flame licks upward and rotates slowly.
    vec3 q = p * 2.6;
    q.y -= uTime * 0.55;
    q.xz *= mat2(cos(uTime * 0.3), -sin(uTime * 0.3), sin(uTime * 0.3), cos(uTime * 0.3));
    float n = fbm(q);

    // Soft radial falloff: dense at the heart, gone by the shell.
    float body = smoothstep(1.0, 0.15, r);
    float density = pow(clamp(n * 1.5, 0.0, 1.0), 1.4) * body;

    // White-hot heart bleeding out into the island's accent colour.
    vec3 col = mix(uColor, vec3(1.0), smoothstep(0.45, 0.0, r) * 0.85);
    col = mix(col * 0.6, col, density);

    float a = density * 1.5;
    gl_FragColor = vec4(col * a, a);
  }
`

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
  const core = useRef<THREE.Group>(null)
  const light = useRef<THREE.PointLight>(null)
  const emberMat = useRef<THREE.MeshBasicMaterial>(null)
  const points = useRef<THREE.Points>(null)

  const current = useMemo(() => new THREE.Color(FALLBACK), [])
  const target = useMemo(() => new THREE.Color(FALLBACK), [])
  const lastIsland = useRef<string | null>(null)

  const highQuality = useGame((s) => s.quality) === 'high'

  const glass = useMemo(() => {
    if (!highQuality) {
      return new THREE.MeshStandardMaterial({
        color: '#cfe4ff',
        transparent: true,
        opacity: 0.3,
        roughness: 0.15,
        metalness: 0,
      })
    }
    return new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      transmission: 1,
      thickness: 0.55,
      ior: 1.45,
      roughness: 0.08,
      metalness: 0,
      transparent: true,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    })
  }, [highQuality])

  const coreMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(FALLBACK) },
          uRadius: { value: CORE_SIZE },
        },
        vertexShader: CORE_VERT,
        fragmentShader: CORE_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
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
    coreMat.uniforms.uColor.value.copy(current)
    puffMat.uniforms.uColor.value.copy(current)
    coreMat.uniforms.uTime.value = t
    if (light.current) light.current.color.copy(current)
    // The bead runs hotter than the accent so it stays legible on any backdrop.
    if (emberMat.current) emberMat.current.color.copy(current).lerp(WHITE, 0.65)

    const y = FLOAT_HEIGHT + Math.sin(t * BOB_SPEED) * BOB_AMP
    if (shell.current) {
      shell.current.position.y = y
      shell.current.rotation.y = t * SPIN_SPEED
      shell.current.rotation.x = Math.sin(t * 0.4) * 0.25
    }
    if (core.current) core.current.position.y = y
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
        <mesh geometry={geometry} scale={scale} material={glass} castShadow />
      </group>

      {/* Churning ember suspended inside the shell. The noise cloud alone reads
          as fog and can wash out against a bright sky, so a small opaque
          white-hot bead sits at the very centre to anchor it. */}
      <group ref={core}>
        <mesh material={coreMat}>
          <icosahedronGeometry args={[CORE_SIZE, 4]} />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[EMBER_SIZE, 2]} />
          <meshBasicMaterial ref={emberMat} toneMapped={false} />
        </mesh>
      </group>

      <pointLight ref={light} intensity={VISUALS.EMISSIVE.marker} distance={6} decay={2} />

      {/* Misty plume. frustumCulled off: its bounding box is stale by design. */}
      <points ref={points} geometry={puffs.geometry} material={puffMat} frustumCulled={false} />
    </group>
  )
}

preloadModel(modelUrl(MODEL))
