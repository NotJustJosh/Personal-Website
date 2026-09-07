import { useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// ─────────────────────────────────────────────────────────────────────────────
//  GLTF + Draco loader, ready for you to drop in .glb models.
// ─────────────────────────────────────────────────────────────────────────────
//  drei's useGLTF wires up three's GLTFLoader. Passing a decoder path as the 2nd
//  argument enables Draco-compressed meshes (smaller files). The default path
//  below pulls the WASM decoder from Google's CDN — works out of the box online.
//
//  To SELF-HOST the decoder (full offline support / no CDN dependency):
//    1. Copy node_modules/three/examples/jsm/libs/draco/ → public/draco/
//    2. Change DRACO_DECODER_PATH to `${import.meta.env.BASE_URL}draco/`
//
//  Usage in a component:
//    const { scene } = useModel(modelUrl('models/avatar.glb'))
//    return <primitive object={scene} />
// ─────────────────────────────────────────────────────────────────────────────

const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'

/** Build a base-path-aware URL for a model stored in /public. */
export function modelUrl(path: string): string {
  const base = import.meta.env.BASE_URL
  return base.replace(/\/$/, '') + '/' + path.replace(/^\//, '')
}

/** Load a (optionally Draco-compressed) .glb/.gltf model. */
export function useModel(url: string) {
  return useGLTF(url, DRACO_DECODER_PATH)
}

/** Start downloading a model ahead of time (call at module scope). */
export function preloadModel(url: string) {
  useGLTF.preload(url, DRACO_DECODER_PATH)
}

/**
 * Load a GLB (under /public) and return its first mesh's geometry, with the
 * node transform BAKED in (final proportions) and re-anchored: 'base' puts the
 * bottom at y=0, 'top' the top at y=0; both centered on x/z. Also returns the
 * world-space bounding-box `size` so callers can scale it to fit. Computed once
 * per (path, anchor) and shared across instances (useGLTF caches the scene).
 */
export function useBakedGeometry(path: string, anchor: 'base' | 'top', rotateY = 0) {
  const { scene } = useGLTF(modelUrl(path))
  return useMemo(() => {
    scene.updateMatrixWorld(true)

    // Merge EVERY mesh in the file, not just the first one — pillar.glb is four
    // separate meshes, and taking only the first rendered a quarter of it.
    // Attributes are trimmed to the common set so the merge can't fail on a
    // model that carries extras (tangents, vertex colors) on some parts only.
    const parts: THREE.BufferGeometry[] = []
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      const g = m.geometry.clone()
      g.applyMatrix4(m.matrixWorld)
      for (const name of Object.keys(g.attributes)) {
        if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name)
      }
      if (!g.attributes.normal) g.computeVertexNormals()
      if (!g.attributes.uv) {
        g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2))
      }
      parts.push(g.index ? g.toNonIndexed() : g)
    })
    const geometry = parts.length === 1 ? parts[0] : mergeGeometries(parts, false)!

    if (rotateY) geometry.rotateY((rotateY * Math.PI) / 180)
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
  }, [scene, anchor, rotateY])
}

/**
 * How far the mesh's TOP face reaches from its centre along a horizontal
 * bearing, in the geometry's own units — multiply by the caller's uniform
 * scale to get world units. Expects 'top'-anchored geometry (top face at y=0).
 *
 * Bridges need this because islands are NOT circles. xscaledisland.glb carries
 * a node scale of [0.52, 1, 1], so once it's rotated and fitted to `size` on X
 * it reaches 15 units along X but only 7.8 along Z. Deriving the attach point
 * from `size` alone therefore left the deck floating 3.6 units off the rim on
 * the short axis, while the polygon's corners reach 12.8 on the diagonals.
 * Projecting onto the bearing handles ellipses and irregular outlines alike.
 */
export function topFaceReach(
  geometry: THREE.BufferGeometry,
  dirX: number,
  dirZ: number,
): number {
  const pos = geometry.attributes.position as THREE.BufferAttribute
  if (!pos) return 0

  let topY = -Infinity
  for (let i = 0; i < pos.count; i++) topY = Math.max(topY, pos.getY(i))

  // Support function over the top face only: the walkable rim is what a deck
  // has to land on, not the wider silhouette of the tapered underside.
  const EPS = 1e-3
  let best = 0
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) < topY - EPS) continue
    best = Math.max(best, pos.getX(i) * dirX + pos.getZ(i) * dirZ)
  }
  return best
}
