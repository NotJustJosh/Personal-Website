import * as THREE from 'three'
import { Clouds, Cloud } from '@react-three/drei'

// ─────────────────────────────────────────────────────────────────────────────
//  A dense fog/cloud sea just beneath the islands. It sits close up — its top
//  laps at the island undersides — and is thick + backed by an opaque plane so
//  you can't see anything below it (the drop reads as bottomless fog). Purely
//  visual; the player falls through and respawns.
// ─────────────────────────────────────────────────────────────────────────────

// Matches the scene fog color (World.tsx) so the backstop blends into the haze.
const FOG_BASE = '#0a1024'

export function CloudLayer() {
  return (
    <group>
      {/* Opaque backstop under the cloud sea — guarantees nothing shows beneath. */}
      <mesh position={[0, -28, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-2}>
        <planeGeometry args={[600, 600]} />
        <meshBasicMaterial color={FOG_BASE} />
      </mesh>

      {/* Dense cloud sea well below the islands (top ≈ y -17). */}
      <Clouds material={THREE.MeshBasicMaterial} limit={500} frustumCulled={false}>
        <Cloud
          seed={1}
          position={[0, -22, 0]}
          bounds={[220, 10, 220]}
          segments={64}
          volume={200}
          color="#4a5a82"
          opacity={0.92}
          speed={0.05}
          fade={240}
        />
        <Cloud
          seed={2}
          position={[-45, -22, 35]}
          bounds={[140, 9, 140]}
          segments={34}
          volume={100}
          color="#3c4a70"
          opacity={0.88}
          speed={0.04}
          fade={240}
        />
        <Cloud
          seed={3}
          position={[50, -22, -40]}
          bounds={[140, 9, 140]}
          segments={34}
          volume={100}
          color="#566699"
          opacity={0.88}
          speed={0.04}
          fade={240}
        />
      </Clouds>
    </group>
  )
}
