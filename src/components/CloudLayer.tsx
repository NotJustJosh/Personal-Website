import * as THREE from 'three'
import { Clouds, Cloud } from '@react-three/drei'

// A soft, slowly-drifting sea of clouds well below the islands. Purely visual
// (no collision) — it gives the void depth so looking down feels like a long
// drop to a moonlit cloud layer. Sits above WORLD.RESPAWN_Y so you fall through.
export function CloudLayer() {
  return (
    <Clouds material={THREE.MeshBasicMaterial} limit={300} frustumCulled={false}>
      <Cloud
        seed={1}
        position={[0, -22, 0]}
        bounds={[130, 6, 130]}
        segments={28}
        volume={70}
        color="#56689c"
        opacity={0.5}
        speed={0.06}
        fade={150}
      />
      <Cloud
        seed={2}
        position={[-35, -26, 35]}
        bounds={[90, 5, 90]}
        segments={20}
        volume={45}
        color="#3f4f80"
        opacity={0.42}
        speed={0.05}
        fade={150}
      />
      <Cloud
        seed={3}
        position={[40, -25, -30]}
        bounds={[90, 5, 90]}
        segments={20}
        volume={45}
        color="#637aae"
        opacity={0.42}
        speed={0.05}
        fade={150}
      />
    </Clouds>
  )
}
