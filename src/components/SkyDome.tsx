import * as THREE from 'three'
import { GradientTexture } from '@react-three/drei'

// A big gradient dome enclosing the world as a night sky: dark at the zenith and
// nadir with a faint navy glow near the horizon. `fog={false}` keeps it crisp —
// scene fog is reserved for adding depth to the islands/clouds, not the sky.
export function SkyDome() {
  return (
    <mesh>
      <sphereGeometry args={[320, 32, 32]} />
      <meshBasicMaterial side={THREE.BackSide} fog={false} toneMapped={false} depthWrite={false}>
        <GradientTexture
          attach="map"
          stops={[0, 0.5, 1]}
          colors={['#04060e', '#1a2b55', '#03040c']}
          size={512}
        />
      </meshBasicMaterial>
    </mesh>
  )
}
