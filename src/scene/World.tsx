import { Canvas } from '@react-three/fiber'
import { Experience } from './Experience'

// The R3F <Canvas>. Everything 3D lives under <Experience />. The DOM UI is
// rendered as siblings of this component (see App.tsx), layered on top.
//
// The "void" look comes from a pale background plus matching fog, so distant
// islands softly fade into nothing instead of revealing a hard horizon.
const VOID_COLOR = '#eaf1fb'

export function World() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 60, near: 0.1, far: 1000, position: [0, 8, 14] }}
    >
      <color attach="background" args={[VOID_COLOR]} />
      <fog attach="fog" args={[VOID_COLOR, 70, 230]} />
      <Experience />
    </Canvas>
  )
}
