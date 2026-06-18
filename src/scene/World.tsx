import { Canvas } from '@react-three/fiber'
import { Experience } from './Experience'

// The R3F <Canvas>. Everything 3D lives under <Experience />. The DOM UI is
// rendered as siblings of this component (see App.tsx), layered on top.
export function World() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 60, near: 0.1, far: 1000, position: [0, 6, 12] }}
    >
      <color attach="background" args={['#9fc6ff']} />
      <fog attach="fog" args={['#bcd4ff', 70, 180]} />
      <Experience />
    </Canvas>
  )
}
