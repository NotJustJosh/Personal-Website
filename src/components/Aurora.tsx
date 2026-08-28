import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { VISUALS } from '../config'

// ─────────────────────────────────────────────────────────────────────────────
//  Northern-lights curtains drifting in the sky behind the islands.
//
//  A few big additive planes, each running layered value noise scrolled upward
//  so it reads as wispy vertical streaks rather than a flat gradient band. They
//  fade to nothing at top and bottom, sit at different depths/speeds for
//  parallax, and are bright enough that the bloom pass picks them up.
//
//  Knobs live in VISUALS.AURORA (src/config.ts).
// ─────────────────────────────────────────────────────────────────────────────

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3  uLow;
  uniform vec3  uMid;
  uniform vec3  uHigh;
  uniform float uIntensity;
  uniform float uSpeed;
  uniform float uSeed;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  // Four octaves is plenty for a soft curtain and keeps the fill cost sane.
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;

    // Stretched horizontally + scrolled vertically => drifting vertical streaks.
    vec2 q = vec2(uv.x * 6.0, uv.y * 1.6 - uTime * uSpeed) + uSeed;
    float n = fbm(q);
    n = pow(clamp(n, 0.0, 1.0), 1.6); // sharpen the wisps, but keep them visible

    // Slow horizontal banding so the curtain breaks into separate ribbons.
    float ribbons = fbm(vec2(uv.x * 4.0 + uSeed, uTime * uSpeed * 0.35));
    n *= smoothstep(0.18, 0.72, ribbons);

    // Fade out at the top and bottom edges so the plane never shows itself.
    float mask = smoothstep(0.0, 0.38, uv.y) * (1.0 - smoothstep(0.55, 1.0, uv.y));

    vec3 col = mix(uLow, uMid, smoothstep(0.0, 0.55, uv.y));
    col = mix(col, uHigh, smoothstep(0.45, 1.0, uv.y));

    float a = n * mask * uIntensity;
    // Additive: colour carries the brightness, alpha keeps it from darkening.
    gl_FragColor = vec4(col * a, a);
  }
`

/** One curtain. `depth` pushes it further out and slows it down (parallax). */
function Curtain({ index }: { index: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null)

  const { uniforms, position, size } = useMemo(() => {
    const a = VISUALS.AURORA
    // Each layer sits further away, wider, and drifts a little slower.
    const back = 175 + index * 45
    return {
      uniforms: {
        uTime: { value: 0 },
        uLow: { value: new THREE.Color(a.low) },
        uMid: { value: new THREE.Color(a.mid) },
        uHigh: { value: new THREE.Color(a.high) },
        uIntensity: { value: a.intensity * (1 - index * 0.22) },
        uSpeed: { value: a.speed * (1 - index * 0.25) },
        uSeed: { value: index * 17.3 },
      },
      position: [0, 20 + index * 6, back] as [number, number, number],
      size: [340 + index * 70, 140 + index * 18] as [number, number],
    }
  }, [index])

  useFrame((state) => {
    if (mat.current) mat.current.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    // Faces back toward the world origin. It sits INSIDE the sky dome (radius
    // 320) and renders in the transparent pass, so the dome is already painted
    // behind it; depthTest keeps the islands correctly in front. depthWrite is
    // off so the curtains never occlude each other.
    <mesh position={position} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={size} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        toneMapped={false}
        fog={false}
      />
    </mesh>
  )
}

export function Aurora() {
  const layers = Math.max(1, VISUALS.AURORA.layers)
  return (
    <group>
      {Array.from({ length: layers }, (_, i) => (
        <Curtain key={i} index={i} />
      ))}
    </group>
  )
}
