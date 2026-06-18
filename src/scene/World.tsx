import { Canvas } from '@react-three/fiber'
import { Experience } from './Experience'

// The R3F <Canvas>. Everything 3D lives under <Experience />. The DOM UI is
// rendered as siblings of this component (see App.tsx), layered on top.
//
// Night void: a dark background plus matching fog so distant islands + the cloud
// sea fade softly into the dark. The gradient sky dome + stars (see Experience)
// render with fog disabled so they stay crisp behind this fog.
const NIGHT_COLOR = '#05070f'
const FOG_COLOR = '#0a1024'

export function World() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 60, near: 0.1, far: 1000, position: [0, 8, 14] }}
    >
      <color attach="background" args={[NIGHT_COLOR]} />
      <fog attach="fog" args={[FOG_COLOR, 60, 300]} />
      <Experience />
    </Canvas>
  )
}
