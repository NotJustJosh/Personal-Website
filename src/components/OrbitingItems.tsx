import { useEffect, useMemo, useRef } from 'react'
import { Billboard, Text, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Island } from '../content'
import { ISLANDS, islandItems, orbitRadius, orbitOffset } from '../lib/world'
import { modelUrl } from '../lib/gltf'
import { useGame } from '../store'
import { VISUALS } from '../config'
import { ItemModel } from './ItemModel'

// ─────────────────────────────────────────────────────────────────────────────
//  Item markers that circle an island when you're standing on it. Each marker
//  maps to one item (a project or a contact link) and shows that item's NAME
//  above a glowing gem — or, if the project has a `model` in content.ts, that
//  3D model in the gem's place, in the same glowing material. Walk up to one
//  (Player.tsx picks the nearest within ORBIT.REACH) and it brightens + grows in
//  the island's accent color; press E to open the panel focused on that item
//  (where the full gallery lives).
// ─────────────────────────────────────────────────────────────────────────────

// Dimmer than the centerpiece cube (emissiveIntensity 2.2 in Waypoint.tsx).
const BASE_GLOW = VISUALS.EMISSIVE.itemIdle
const SELECTED_GLOW = VISUALS.EMISSIVE.itemSelected

// The item models are small, so fetch them all with the rest of the world: by
// the time you step onto an island they're cached, and they grow in with their
// markers instead of popping in a moment later.
for (const path of new Set(ISLANDS.flatMap((i) => islandItems(i).flatMap((it) => it.model ?? [])))) {
  useGLTF.preload(modelUrl(path))
}

// Trim noisy prefixes and cap length so the orbiting labels stay readable.
function shortLabel(name: string) {
  const n = name.replace(/^(Project|Publication|Research Assistant)\s*:\s*/i, '')
  return n.length > 26 ? n.slice(0, 25).trimEnd() + '…' : n
}

export function OrbitingItems({ island }: { island: Island }) {
  const items = islandItems(island)
  const radius = orbitRadius(island)
  const groupRefs = useRef<(THREE.Group | null)[]>([])

  // One glowing material per item, shared by its gem or its model, so the
  // highlight below brightens whichever marker it has.
  const materials = useMemo(
    () =>
      items.map(
        () =>
          new THREE.MeshStandardMaterial({
            color: island.accentColor,
            emissive: island.accentColor,
            emissiveIntensity: BASE_GLOW,
            roughness: 0.3,
            toneMapped: false,
          }),
      ),
    // `items` is rebuilt every render; only its length matters here.
    [items.length, island.accentColor],
  )
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const { nearbyIsland, nearbyItem } = useGame.getState()
    const active = nearbyIsland === island.id

    for (let i = 0; i < items.length; i++) {
      const g = groupRefs.current[i]
      if (!g) continue

      const o = orbitOffset(i, items.length, radius, t)
      g.position.set(o.x, o.y, o.z)

      const selected =
        active && nearbyItem?.islandId === island.id && nearbyItem.index === i
      // Hidden (scale 0) until you're on the island; selected pops a bit bigger.
      const target = active ? (selected ? 1.4 : 1) : 0
      g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, target, 0.18))

      // Highlight = the island's own color, just brighter (no separate hue).
      materials[i].emissiveIntensity = selected ? SELECTED_GLOW : BASE_GLOW
    }
  })

  return (
    <group>
      {items.map((item, i) => {
        // tiny glowing, vertically-elongated octahedron — the default marker
        const gem = (
          <mesh scale={[1, 1.9, 1]} material={materials[i]}>
            <octahedronGeometry args={[0.26, 0]} />
          </mesh>
        )
        return (
          <group
            key={item.kind + item.index}
            ref={(el) => {
              groupRefs.current[i] = el
            }}
            scale={0}
          >
            {item.model ? <ItemModel path={item.model} material={materials[i]} fallback={gem} /> : gem}
            {/* name label above, always facing the camera */}
            <Billboard position={[0, 0.85, 0]}>
              <Text
                fontSize={0.34}
                maxWidth={7}
                textAlign="center"
                anchorX="center"
                anchorY="bottom"
                color="#eef2ff"
                outlineWidth={0.035}
                outlineColor="#05070f"
              >
                {item.short ?? shortLabel(item.label)}
              </Text>
            </Billboard>
          </group>
        )
      })}
    </group>
  )
}
