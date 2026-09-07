import { Suspense } from 'react'
import { Text, Billboard, useGLTF } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import type { Island as IslandData } from '../content'
import { islandRadius, islandHasOrbit, groundModelOf } from '../lib/world'
import { ISLAND } from '../config'
import { useModel, modelUrl, useBakedGeometry } from '../lib/gltf'
import { OrbitingItems } from './OrbitingItems'
import { Waypoint } from './Waypoint'

// A single floating island, generated from its data entry:
//   • the user's island.glb as the visual body (auto-scaled to `size`, top at
//     island.position.y), with a cylinder physics collider (what you stand on),
//   • a touch of procedural grass on top,
//   • an accent point-light washing the island in its color,
//   • a pedestal + glowing cube centerpiece, a floating label, and (if it has
//     items) the orbiting icons + tag-puffs.

const ISLAND_COLOR = '#867c64' // natural earthy tone (the accent light tints it)

// Optional extra .glb set dressing. Only mounted when `model` is set in content.ts.
function ModelDressing({ url }: { url: string }) {
  const { scene } = useModel(modelUrl(url))
  return <primitive object={scene} />
}

// The island body, scaled so its horizontal radius matches `radius` and its top
// sits at the surface (local y = 0).
function IslandModel({ radius, url, rotateY }: { radius: number; url: string; rotateY: number }) {
  const { geometry, size } = useBakedGeometry(url, 'top', rotateY)
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
      {/* Physics + visual body. Islands standing ON a platform skip this — the
          platform underneath provides the ground and the collider. */}
      {!island.onPlatform && (
        // `colliders="hull"` builds the collider from the SCALED mesh itself.
        // A cylinder of `radius` used to under-cover it: island.glb's top face is
        // a polygon whose corners reach 1.126× its bbox half-width, so the last
        // ~12% of visible ground at each corner had nothing underneath — walk out
        // there and you dropped straight through. That gap scaled with the island,
        // so it was ~0.9 units on a small island and ~2.5 on the big platform.
        <RigidBody type="fixed" colliders="hull" friction={1}>
          <IslandModel
            radius={radius}
            url={groundModelOf(island)}
            rotateY={island.groundRotation ?? 0}
          />
        </RigidBody>
      )}

      {/* Accent light washing the island in its color. Bigger disks need the
          lamp higher and brighter or their rim falls into the dark — inverse
          square means a 20-unit platform can't use a 7-unit island's settings. */}
      <pointLight
        position={[0, Math.max(4, radius * 0.5), 0]}
        color={island.accentColor}
        intensity={11 * Math.max(1, radius / ISLAND.RADIUS)}
        distance={radius * 4}
        decay={2}
      />

      {/* Optional extra set-dressing model */}
      {island.model && (
        <Suspense fallback={null}>
          <ModelDressing url={island.model} />
        </Suspense>
      )}

      {/* Centerpiece: pedestal + glowing spinning/bobbing cube. A platform is
          scenery, so it gets no pedestal — the sections standing on it do. */}
      {!island.platform && <Waypoint accentColor={island.accentColor} />}

      {/* Floating label, always facing the camera. A platform's name sits higher
          and larger, so it reads as a district sign above the pedestal labels. */}
      <Billboard position={[0, island.platform ? 9.5 : 3.8, 0]}>
        <Text
          fontSize={island.platform ? 1.2 : 0.9}
          color="#eef2ff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#05070f"
        >
          {island.label}
        </Text>
      </Billboard>

      {/* Orbiting item icons (only while you're on the island) */}
      {islandHasOrbit(island) && <OrbitingItems island={island} />}
    </group>
  )
}

useGLTF.preload(modelUrl('models/island.glb'))
