import { Component, Suspense, useEffect, useMemo, type ReactNode } from 'react'
import { Billboard, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { ORBIT, VISUALS } from '../config'
import { modelUrl } from '../lib/gltf'

// ─────────────────────────────────────────────────────────────────────────────
//  An orbiting item's marker drawn as its own 3D model — the project's `model`
//  in content.ts (a .glb in public/models/) — in place of the default gem.
//
//  The models are flat silhouettes extruded a little, modelled lying flat;
//  this stands them up to face the camera (a Billboard, so they always read)
//  and fits them inside ORBIT.MODEL_WIDTH/HEIGHT. Every part is drawn with the
//  `material` passed in — the gem's own glowing material, which OrbitingItems
//  brightens when you walk up to the item. With `backingGlow` set, the piece
//  the raised details sit on keeps a fixed, dimmer glow (a fraction of the
//  resting glow) and only the details brighten, so they read even then.
//
//  While the file loads, or if it fails to, the `fallback` (the gem) shows
//  instead: loading has its own <Suspense> so it never stalls the scene, and an
//  error boundary so a BROKEN file costs one marker, not the whole world.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Give the model's BACKING piece(s) — the connected part(s) whose front face
 * sits furthest from the camera, e.g. the MAPS triangle behind its laser
 * symbol — the `back` material, and everything else `front`.
 *
 * Pieces are found by connectivity rather than by object name, so a model
 * modelled as one joined mesh works too. Geometry is cloned first: the cached
 * GLTF (and any other item using the same file) is left untouched.
 */
function markBacking(root: THREE.Object3D, front: THREE.Material, back: THREE.Material) {
  interface Piece {
    mesh: THREE.Mesh
    tris: number[]
    /** How close its front face comes to the camera (+Z, after standing up). */
    near: number
  }
  const pieces: Piece[] = []
  const v = new THREE.Vector3()

  root.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    const pos = mesh.geometry.attributes.position as THREE.BufferAttribute
    const index = mesh.geometry.index
    const vertex = (corner: number) => (index ? index.getX(corner) : corner)
    const triCount = (index ? index.count : pos.count) / 3

    // Union-find over vertex POSITIONS: exporters split vertices along hard
    // edges (for normals/UVs), so welding by position joins a piece's faces.
    const parent = new Map<string, string>()
    const key = (i: number) => `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`
    const find = (k: string): string => {
      let r = k
      while (parent.get(r) !== r) r = parent.get(r)!
      parent.set(k, r)
      return r
    }
    for (let i = 0; i < pos.count; i++) parent.set(key(i), key(i))
    for (let t = 0; t < triCount; t++) {
      const a = find(key(vertex(3 * t)))
      for (const c of [3 * t + 1, 3 * t + 2]) {
        const b = find(key(vertex(c)))
        if (a !== b) parent.set(b, a)
      }
    }

    const byRoot = new Map<string, Piece>()
    for (let t = 0; t < triCount; t++) {
      const r = find(key(vertex(3 * t)))
      let piece = byRoot.get(r)
      if (!piece) byRoot.set(r, (piece = { mesh, tris: [], near: -Infinity }))
      piece.tris.push(t)
      for (let c = 0; c < 3; c++) {
        piece.near = Math.max(piece.near, v.fromBufferAttribute(pos, vertex(3 * t + c)).applyMatrix4(mesh.matrixWorld).z)
      }
    }
    pieces.push(...byRoot.values())
  })

  const nearest = Math.max(...pieces.map((p) => p.near))
  const depth = new THREE.Box3().setFromObject(root).getSize(v).z
  const isBacking = (p: Piece) => p.near < nearest - depth * 0.05
  if (!pieces.some(isBacking)) return

  // Per mesh: reorder triangles front-pieces-first, then one draw group each.
  for (const mesh of new Set(pieces.map((p) => p.mesh))) {
    const own = pieces.filter((p) => p.mesh === mesh)
    const geometry = mesh.geometry.clone()
    const old = geometry.index
    const corner = (t: number, c: number) => (old ? old.getX(3 * t + c) : 3 * t + c)
    const frontTris = own.filter((p) => !isBacking(p)).flatMap((p) => p.tris)
    const backTris = own.filter(isBacking).flatMap((p) => p.tris)
    const order = [...frontTris, ...backTris].flatMap((t) => [corner(t, 0), corner(t, 1), corner(t, 2)])
    geometry.setIndex(order)
    geometry.clearGroups()
    geometry.addGroup(0, frontTris.length * 3, 0)
    geometry.addGroup(frontTris.length * 3, backTris.length * 3, 1)
    mesh.geometry = geometry
    mesh.material = [front, back]
  }
}

function Model({
  path,
  material,
  backingGlow,
}: {
  path: string
  material: THREE.MeshStandardMaterial
  backingGlow?: number
}) {
  const { scene } = useGLTF(modelUrl(path))

  const { root, scale, back } = useMemo(() => {
    // A clone per item: the same file can mark two items in two colors.
    const model = scene.clone(true)
    model.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = material
    })
    // Modelled lying flat (thin along Y, the picture in the X/Z plane): tip it
    // up so the picture faces +Z, toward the camera, with its top pointing up.
    model.rotation.x = Math.PI / 2

    const root = new THREE.Group()
    root.add(model)
    root.updateMatrixWorld(true)

    // The backing piece's own, fixed glow: a fraction of the RESTING glow. It
    // doesn't follow the walk-up highlight, or at full brightness both parts
    // wash out to white and the details vanish again.
    const back = backingGlow != null ? material.clone() : null
    if (back) {
      back.emissiveIntensity = VISUALS.EMISSIVE.itemIdle * backingGlow!
      markBacking(root, material, back)
    }

    const box = new THREE.Box3().setFromObject(root)
    const size = box.getSize(new THREE.Vector3())
    model.position.sub(box.getCenter(new THREE.Vector3())) // centre it where the gem sits

    // Fit inside the marker box without distorting.
    const scale = Math.min(ORBIT.MODEL_WIDTH / size.x, ORBIT.MODEL_HEIGHT / size.y)
    return { root, scale, back }
  }, [scene, material, backingGlow])

  useEffect(() => () => back?.dispose(), [back])

  return (
    <Billboard>
      <primitive object={root} scale={scale} />
    </Billboard>
  )
}

/**
 * Shows `fallback` if the model underneath fails to load.
 *
 * This is load-bearing: `useGLTF` THROWS when the file 404s or won't parse, and
 * <Suspense> only catches *pending* promises — not rejected ones. Without a
 * boundary here that error escapes past <Canvas> and unmounts the whole app, so
 * one typo'd path in content.ts blanks the entire site.
 */
class ModelBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    // Surfaced as a warning because it's almost always an authoring mistake:
    // a `model` path in content.ts that doesn't match a file in public/models/.
    console.warn('[ItemModel] fell back to the gem for a model that failed to load:', error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export function ItemModel({
  path,
  material,
  backingGlow,
  fallback,
}: {
  path: string
  material: THREE.MeshStandardMaterial
  /** Glow of the model's backing piece, as a fraction of the resting glow (see markBacking). */
  backingGlow?: number
  /** Shown while the model loads, or instead of it if it fails. */
  fallback: ReactNode
}) {
  return (
    // Keyed on `path` so pointing at a different file clears a previous failure
    // and gives the new one a fresh attempt.
    <ModelBoundary key={path} fallback={fallback}>
      <Suspense fallback={fallback}>
        <Model path={path} material={material} backingGlow={backingGlow} />
      </Suspense>
    </ModelBoundary>
  )
}
