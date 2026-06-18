import { Suspense } from 'react'
import { Text, Billboard } from '@react-three/drei'
import { RigidBody, CylinderCollider } from '@react-three/rapier'
import type { Island as IslandData } from '../content'
import { islandRadius, islandHasOrbit } from '../lib/world'
import { useModel, modelUrl } from '../lib/gltf'
import { ISLAND } from '../config'
import { OrbitingItems } from './OrbitingItems'

// A single floating island, generated entirely from its data entry:
//   • a static cylinder physics collider (the only thing you can stand on),
//   • a visual slab whose TOP surface sits exactly at island.position.y,
//   • a tapered underside for the "floating rock" look,
//   • an accent point-light washing the space in the island's color,
//   • a billboarded 3D label (panels themselves are DOM — see ui/Panel.tsx),
//   • an optional .glb model placeholder (set `model` in content.ts).

const THICKNESS = ISLAND.THICKNESS // visual slab thickness
const COLLIDER_DEPTH = 4 // physics collider depth (deeper than the slab; anti-tunnel)

// Optional .glb set dressing. Only mounted when `model` is set in content.ts.
function ModelDressing({ url }: { url: string }) {
  const { scene } = useModel(modelUrl(url))
  return <primitive object={scene} />
}

export function Island({ island }: { island: IslandData }) {
  const [x, y, z] = island.position
  const radius = islandRadius(island)
  const coneHeight = radius * 1.4

  return (
    <group position={[x, y, z]}>
      {/* Physics: a cylinder whose top sits at local y = 0 (world surface = y). */}
      <RigidBody type="fixed" colliders={false} friction={1}>
        {/* Collider is deeper than the visual slab (top still at the surface) so
            a fast fall can never tunnel through it. */}
        <CylinderCollider args={[COLLIDER_DEPTH / 2, radius]} position={[0, -COLLIDER_DEPTH / 2, 0]} />

        {/* Top slab */}
        <mesh position={[0, -THICKNESS / 2, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[radius, radius, THICKNESS, 48]} />
          <meshStandardMaterial color={island.accentColor} roughness={0.85} metalness={0.05} />
        </mesh>

        {/* Tapered underside (decorative, no collision) */}
        <mesh position={[0, -THICKNESS - coneHeight / 2, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[radius * 0.92, coneHeight, 36]} />
          <meshStandardMaterial color={island.accentColor} roughness={1} metalness={0} />
        </mesh>
      </RigidBody>

      {/* Accent light washing the island in its color */}
      <pointLight
        position={[0, 4, 0]}
        color={island.accentColor}
        intensity={18}
        distance={radius * 4}
        decay={2}
      />

      {/* Optional set-dressing model, or a small placeholder accent crystal */}
      {island.model ? (
        <Suspense fallback={null}>
          <ModelDressing url={island.model} />
        </Suspense>
      ) : (
        <mesh position={[0, 1.6, 0]} castShadow>
          <octahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial
            color={island.accentColor}
            emissive={island.accentColor}
            emissiveIntensity={0.4}
            roughness={0.3}
          />
        </mesh>
      )}

      {/* Floating label, always facing the camera */}
      <Billboard position={[0, 3.8, 0]}>
        <Text
          fontSize={0.9}
          color="#eef2ff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#05070f"
        >
          {island.label}
        </Text>
      </Billboard>

      {/* Item icons that orbit the island while you're standing on it */}
      {islandHasOrbit(island) && <OrbitingItems island={island} />}
    </group>
  )
}
