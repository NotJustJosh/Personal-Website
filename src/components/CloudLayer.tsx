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
      <mesh position={[0, -9, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-2}>
        <planeGeometry args={[600, 600]} />
        <meshBasicMaterial color={FOG_BASE} />
      </mesh>

      {/* Dense, close cloud sea (top ≈ y -1, just below the lowest island). */}
      <Clouds material={THREE.MeshBasicMaterial} limit={500} frustumCulled={false}>
        <Cloud
          seed={1}
          position={[0, -5, 0]}
          bounds={[200, 8, 200]}
          segments={64}
          volume={180}
          color="#4a5a82"
          opacity={0.92}
          speed={0.05}
          fade={220}
        />
        <Cloud
          seed={2}
          position={[-45, -5, 35]}
          bounds={[130, 7, 130]}
          segments={34}
          volume={90}
          color="#3c4a70"
          opacity={0.88}
          speed={0.04}
          fade={220}
        />
        <Cloud
          seed={3}
          position={[50, -5, -40]}
          bounds={[130, 7, 130]}
          segments={34}
          volume={90}
          color="#566699"
          opacity={0.88}
          speed={0.04}
          fade={220}
        />
      </Clouds>
    </group>
  )
}
