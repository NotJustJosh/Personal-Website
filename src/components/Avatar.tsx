import type { ThreeElements } from '@react-three/fiber'
import { useModel, modelUrl } from '../lib/gltf'

// ─────────────────────────────────────────────────────────────────────────────
//  Example avatar — NOT used by default (Player.tsx renders a capsule).
//
//  To drop in a real character:
//    1. Put your model at  public/models/avatar.glb  (Draco-compressed is fine).
//    2. In Player.tsx, replace the capsule <mesh> with <Avatar />.
//    3. Tweak `scale`/`position` so the model's feet sit at the capsule bottom
//       (the capsule's centre is its origin; feet are 0.9 units below it).
//
//  Draco support is already configured in ../lib/gltf.ts.
// ─────────────────────────────────────────────────────────────────────────────
export function Avatar(props: ThreeElements['group']) {
  const { scene } = useModel(modelUrl('models/avatar.glb'))
  return (
    <group {...props}>
      <primitive object={scene} />
    </group>
  )
}

// Optional: start the download as soon as this module loads.
// preloadModel(modelUrl('models/avatar.glb'))
