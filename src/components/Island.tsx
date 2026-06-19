import { Suspense } from 'react'
import { Text, Billboard, useGLTF } from '@react-three/drei'
import { RigidBody, CylinderCollider } from '@react-three/rapier'
import type { Island as IslandData } from '../content'
import { islandRadius, islandHasOrbit } from '../lib/world'
import { useModel, modelUrl, useBakedGeometry } from '../lib/gltf'
import { OrbitingItems } from './OrbitingItems'
import { TagPuffs } from './TagPuffs'
import { Waypoint } from './Waypoint'
import { Grass } from './Grass'

// A single floating island, generated from its data entry:
//   • the user's island.glb as the visual body (auto-scaled to `size`, top at
//     island.position.y), with a cylinder physics collider (what you stand on),
//   • a touch of procedural grass on top,
//   • an accent point-light washing the island in its color,
//   • a pedestal + glowing cube centerpiece, a floating label, and (if it has
//     items) the orbiting icons + tag-puffs.

const COLLIDER_DEPTH = 4 // physics collider depth (deeper than the model; anti-tunnel)
const ISLAND_COLOR = '#867c64' // natural earthy tone (the accent light tints it)

// Optional extra .glb set dressing. Only mounted when `model` is set in content.ts.
function ModelDressing({ url }: { url: string }) {
  const { scene } = useModel(modelUrl(url))
  return <primitive object={scene} />
}

// The island.glb body, scaled so its horizontal radius matches `radius` and its
// top sits at the surface (local y = 0).
function IslandModel({ radius }: { radius: number }) {
  const { geometry, size } = useBakedGeometry('models/island.glb', 'top')
  const scale = radius / Math.max(size.x / 2, 1e-3)
  return (
    <mesh geometry={geometry} scale={scale} castShadow receiveShadow>
      <meshStandardMaterial color={ISLAND_COLOR} roughness={1} metalness={0} />
    </mesh>
  )
}

export function Island({ island }: { island: IslandData }) {
  const [x, y, z] = island.position
  const radius = islandRadius(island)

  return (
    <group position={[x, y, z]}>
      {/* Physics + visual body */}
      <RigidBody type="fixed" colliders={false} friction={1}>
        {/* Deep cylinder collider; its top is at the surface (local y = 0). */}
        <CylinderCollider args={[COLLIDER_DEPTH / 2, radius]} position={[0, -COLLIDER_DEPTH / 2, 0]} />
        <IslandModel radius={radius} />
      </RigidBody>

      {/* A tasteful scatter of grass across the top */}
      <Grass radius={radius} />

      {/* Accent light washing the island in its color */}
      <pointLight
        position={[0, 4, 0]}
        color={island.accentColor}
        intensity={11}
        distance={radius * 4}
        decay={2}
      />

      {/* Optional extra set-dressing model */}
      {island.model && (
        <Suspense fallback={null}>
          <ModelDressing url={island.model} />
        </Suspense>
      )}

      {/* Centerpiece: pedestal + glowing spinning/bobbing cube */}
      <Waypoint accentColor={island.accentColor} />

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

      {/* Orbiting item icons + tag-puffs (only while you're on the island) */}
      {islandHasOrbit(island) && (
        <>
          <OrbitingItems island={island} />
          <TagPuffs island={island} />
        </>
      )}
    </group>
  )
}

useGLTF.preload(modelUrl('models/island.glb'))
