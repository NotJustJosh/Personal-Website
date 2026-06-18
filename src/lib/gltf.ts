import { useGLTF } from '@react-three/drei'

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
