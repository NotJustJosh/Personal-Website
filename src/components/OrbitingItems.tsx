import { useRef } from 'react'
import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Island } from '../content'
import { islandItems, orbitRadius, orbitOffset } from '../lib/world'
import { useGame } from '../store'

// ─────────────────────────────────────────────────────────────────────────────
//  Item icons that circle an island when you're standing on it. Each icon maps
//  to one item (a project or a contact link) and shows that item's NAME above a
//  glowing dot. Walk up to one (Player.tsx picks the nearest within ORBIT.REACH)
//  and it brightens + grows in the island's accent color; press E to open the
//  panel focused on that item.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_GLOW = 0.55
const SELECTED_GLOW = 1.6

// Trim noisy prefixes and cap length so the orbiting labels stay readable.
function shortLabel(name: string) {
  const n = name.replace(/^(Project|Publication|Research Assistant)\s*:\s*/i, '')
  return n.length > 26 ? n.slice(0, 25).trimEnd() + '…' : n
}

export function OrbitingItems({ island }: { island: Island }) {
  const items = islandItems(island)
  const radius = orbitRadius(island)
  const groupRefs = useRef<(THREE.Group | null)[]>([])
  const matRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([])

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
      const mat = matRefs.current[i]
      if (mat) mat.emissiveIntensity = selected ? SELECTED_GLOW : BASE_GLOW
    }
  })

  return (
    <group>
      {items.map((item, i) => (
        <group
          key={item.kind + item.index}
          ref={(el) => {
            groupRefs.current[i] = el
          }}
          scale={0}
        >
          <Billboard>
            {/* glowing dot */}
            <mesh>
              <circleGeometry args={[0.5, 32]} />
              <meshStandardMaterial
                ref={(el) => {
                  matRefs.current[i] = el
                }}
                color={island.accentColor}
                emissive={island.accentColor}
                emissiveIntensity={BASE_GLOW}
                toneMapped={false}
              />
            </mesh>
            {/* outline ring */}
            <mesh position={[0, 0, -0.01]}>
              <ringGeometry args={[0.5, 0.6, 32]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.85} toneMapped={false} />
            </mesh>
            {/* name label above the dot */}
            <Text
              position={[0, 0.92, 0]}
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
      ))}
    </group>
  )
}
