import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Experience } from './Experience'
import { useGame } from '../store'
import { VISUALS } from '../config'

// The R3F <Canvas>. Everything 3D lives under <Experience />. The DOM UI is
// rendered as siblings of this component (see App.tsx), layered on top.
//
// Night void: a dark background plus matching fog so distant islands + the cloud
// sea fade softly into the dark. The gradient sky dome + stars (see Experience)
// render with fog disabled so they stay crisp behind this fog.
const NIGHT_COLOR = '#05070f'
const FOG_COLOR = '#0a1024'

// Applies the quality setting at runtime so toggling it never remounts the
// scene (which would reset where the player is standing).
//
// Tone mapping: when the post-processing composer is running it owns the final
// tone map, so the renderer must NOT also apply one or the image gets mapped
// twice and goes flat. On low quality there's no composer, so the renderer does
// it directly.
function QualityManager() {
  const gl = useThree((s) => s.gl)
  const setDpr = useThree((s) => s.setDpr)
  const quality = useGame((s) => s.quality)

  useEffect(() => {
    const high = quality === 'high'
    gl.toneMapping = high ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = VISUALS.EXPOSURE
    setDpr(high ? [1, MAX_DPR] : 1)
  }, [gl, setDpr, quality])

  return null
}

// ── PERF ─────────────────────────────────────────────────────────────────────
// Render resolution is the single biggest lever here: cost scales with the
// PIXEL count, so a Retina screen at dpr 2 pushes 4× the work of dpr 1 for a
// difference most people can't see on a moving 3D scene.
//
// Cap at 1.5 and, on screens above that, drop MSAA too — at 1.5× supersampling
// the extra antialiasing buys very little and costs a lot. Standard 1× displays
// keep antialias on, where it genuinely matters.
const MAX_DPR = 1.5
const antialias = typeof window === 'undefined' || window.devicePixelRatio < 1.5

export function World() {
  return (
    <Canvas
      shadows
      dpr={[1, MAX_DPR]}
      gl={{ antialias, powerPreference: 'high-performance' }}
      camera={{ fov: 60, near: 0.1, far: 1000, position: [0, 8, 14] }}
    >
      <color attach="background" args={[NIGHT_COLOR]} />
      <fog attach="fog" args={[FOG_COLOR, 60, 300]} />
      <QualityManager />
      <Experience />
    </Canvas>
  )
}
