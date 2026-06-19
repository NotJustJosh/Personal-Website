import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────────────────────
//  A light, procedural scatter of grass on an island's top — instanced (one draw
//  call per island), placed in a ring (clear of the central pedestal and the
//  rim), with a gentle wind sway injected into the standard material's shader.
//  Tuned to be tasteful, not a full lawn.
// ─────────────────────────────────────────────────────────────────────────────

const BLADE_W = 0.13
const BLADE_H = 0.5
const DENSITY = 18 // blades per unit of radius (≈126 at r7, ≈162 at r9)
const INNER = 0.16 // ring start (fraction of radius) — leaves the centre clear
const OUTER = 0.92 // ring end — keeps grass off the very rim
const TAU = Math.PI * 2

export function Grass({ radius }: { radius: number }) {
  const count = Math.max(20, Math.round(radius * DENSITY))
  const ref = useRef<THREE.InstancedMesh>(null)
  const time = useRef({ value: 0 })

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(BLADE_W, BLADE_H, 1, 3)
    g.translate(0, BLADE_H / 2, 0) // base at y = 0
    return g
  }, [])

  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: '#5f8d4e',
      side: THREE.DoubleSide,
      roughness: 1,
      metalness: 0,
    })
    const u = time.current
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = u
      shader.vertexShader =
        'uniform float uTime;\n' +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           float gphase = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.9;
           float gh = clamp(uv.y, 0.0, 1.0);
           transformed.x += sin(uTime * 1.6 + gphase) * 0.13 * gh * gh;`,
        )
    }
    return m
  }, [])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const p = new THREE.Vector3()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const s = new THREE.Vector3()
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * TAU
      const rr = radius * (INNER + (OUTER - INNER) * Math.sqrt(Math.random()))
      p.set(Math.cos(ang) * rr, 0, Math.sin(ang) * rr)
      e.set((Math.random() - 0.5) * 0.3, Math.random() * TAU, (Math.random() - 0.5) * 0.3)
      q.setFromEuler(e)
      const sc = 0.7 + Math.random() * 0.7
      s.set(sc, sc * (0.8 + Math.random() * 0.5), sc)
      mesh.setMatrixAt(i, m.compose(p, q, s))
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [count, radius])

  useFrame((state) => {
    time.current.value = state.clock.elapsedTime
  })

  return (
    <instancedMesh ref={ref} args={[geometry, material, count]} frustumCulled={false} />
  )
}
