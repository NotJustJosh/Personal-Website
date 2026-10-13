import { Component, Suspense, useMemo, type ReactNode } from 'react'
import { Billboard, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { ORBIT } from '../config'
import { modelUrl } from '../lib/gltf'

// ─────────────────────────────────────────────────────────────────────────────
//  An orbiting item's marker drawn as its own 3D model — the project's `model`
//  in content.ts (a .glb in public/models/) — in place of the default gem.
//
//  The models are flat silhouettes extruded a little, modelled lying flat;
//  this stands them up to face the camera (a Billboard, so they always read)
//  and fits them inside ORBIT.MODEL_WIDTH/HEIGHT. Every part is drawn with the
//  `material` passed in — the gem's own glowing material, which OrbitingItems
//  brightens when you walk up to the item.
//
//  While the file loads, or if it fails to, the `fallback` (the gem) shows
//  instead: loading has its own <Suspense> so it never stalls the scene, and an
//  error boundary so a BROKEN file costs one marker, not the whole world.
// ─────────────────────────────────────────────────────────────────────────────

function Model({ path, material }: { path: string; material: THREE.Material }) {
  const { scene } = useGLTF(modelUrl(path))

  const { root, scale } = useMemo(() => {
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
    const box = new THREE.Box3().setFromObject(root)
    const size = box.getSize(new THREE.Vector3())
    model.position.sub(box.getCenter(new THREE.Vector3())) // centre it where the gem sits

    // Fit inside the marker box without distorting.
    const scale = Math.min(ORBIT.MODEL_WIDTH / size.x, ORBIT.MODEL_HEIGHT / size.y)
    return { root, scale }
  }, [scene, material])

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
  fallback,
}: {
  path: string
  material: THREE.Material
  /** Shown while the model loads, or instead of it if it fails. */
  fallback: ReactNode
}) {
  return (
    // Keyed on `path` so pointing at a different file clears a previous failure
    // and gives the new one a fresh attempt.
    <ModelBoundary key={path} fallback={fallback}>
      <Suspense fallback={fallback}>
        <Model path={path} material={material} />
      </Suspense>
    </ModelBoundary>
  )
}
