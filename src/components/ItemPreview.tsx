import { Component, Suspense, useMemo, type ReactNode } from 'react'
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
//  rest of the scene — it just fades in when it arrives — and in an error
//  boundary so a BROKEN one is skipped instead of taking the world down.
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

/**
 * Renders nothing if the image underneath fails to load.
 *
 * This is load-bearing: `useTexture` THROWS when the file 404s or won't decode,
 * and <Suspense> only catches *pending* promises — not rejected ones. Without a
 * boundary here that error escapes past <Canvas> and unmounts the whole app, so
 * one typo'd path in content.ts blanks the entire site. Worse, drei caches the
 * rejection, so it keeps throwing on every re-render until a full page reload —
 * which is why it presents as "the island keeps crashing" rather than a
 * one-off. A missing cover image should cost you that one preview, nothing more.
 */
class PreviewBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    // Surfaced as a warning because it's almost always an authoring mistake:
    // a path in content.ts that doesn't match a file in public/images/.
    console.warn('[ItemPreview] skipped a cover image that failed to load:', error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export function ItemPreview({ url, accentColor }: { url: string; accentColor: string }) {
  return (
    // Keyed on `url` so pointing at a different image clears a previous failure
    // and gives the new one a fresh attempt.
    <PreviewBoundary key={url}>
      <Suspense fallback={null}>
        <Photo url={url} accentColor={accentColor} />
      </Suspense>
    </PreviewBoundary>
  )
}
