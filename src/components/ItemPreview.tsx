import { Suspense, useMemo } from 'react'
import { Billboard, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { ORBIT } from '../config'

// ─────────────────────────────────────────────────────────────────────────────
//  The small framed preview image that floats above an orbiting item in the 3D
//  world — the cover (first entry) of that project's `images` in content.ts.
//
//  It's a camera-facing quad, fitted inside ORBIT.PREVIEW_WIDTH/HEIGHT so the
//  photo keeps its aspect ratio whatever you drop in, backed by a slightly
//  larger quad in the island's accent color to read as a frame.
//
//  Loading is wrapped in its own <Suspense> so a slow image never stalls the
//  rest of the scene — it just fades in when it arrives.
// ─────────────────────────────────────────────────────────────────────────────

const FRAME = 0.07 // accent border thickness around the photo (world units)
const FRAME_Z = -0.012 // pull the frame behind the photo to avoid z-fighting

function Photo({ url, accentColor }: { url: string; accentColor: string }) {
  const texture = useTexture(url)

  const { width, height } = useMemo(() => {
    // Textures are color data, so tag them sRGB — neither three's TextureLoader
    // nor drei's useTexture assumes it, and an untagged map renders washed out.
    // Set before drei's initTexture effect uploads it to the GPU.
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    texture.needsUpdate = true
    const img = texture.image as { width?: number; height?: number } | undefined
    const aspect = img?.width && img?.height ? img.width / img.height : 4 / 3
    // Fit inside the preview box without distorting.
    const w = Math.min(ORBIT.PREVIEW_WIDTH, ORBIT.PREVIEW_HEIGHT * aspect)
    return { width: w, height: w / aspect }
  }, [texture])

  return (
    // Bottom edge pinned at PREVIEW_BASE_Y — the height is only known once the
    // image has loaded, which is why the Billboard lives in here.
    <Billboard position={[0, ORBIT.PREVIEW_BASE_Y + height / 2, 0]}>
      <mesh position={[0, 0, FRAME_Z]}>
        <planeGeometry args={[width + FRAME * 2, height + FRAME * 2]} />
        <meshBasicMaterial color={accentColor} toneMapped={false} transparent opacity={0.9} />
      </mesh>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </Billboard>
  )
}

export function ItemPreview({ url, accentColor }: { url: string; accentColor: string }) {
  return (
    <Suspense fallback={null}>
      <Photo url={url} accentColor={accentColor} />
    </Suspense>
  )
}
