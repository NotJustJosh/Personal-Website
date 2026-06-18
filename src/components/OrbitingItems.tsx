import { useRef } from 'react'
import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Island } from '../content'
import { islandItems, orbitRadius, orbitOffset } from '../lib/world'
import { useGame } from '../store'

// ─────────────────────────────────────────────────────────────────────────────
//  Little item icons that circle an island when you're standing on it. Each icon
//  maps to one item (a project or a contact link). Walk up to one (Player.tsx
//  picks the nearest within ORBIT.REACH) and it highlights; press E to open the
//  island's panel focused on that item.
//
//  Positions come from the shared orbitOffset() so the Player computes identical
//  positions for proximity. Visibility/scale animate via the player's nearby
//  state (read with getState() in the frame loop — no re-renders).
// ─────────────────────────────────────────────────────────────────────────────

const HIGHLIGHT = '#ffd60a'
const GLYPH_COLOR = '#10202e'

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
      const s = THREE.MathUtils.lerp(g.scale.x, target, 0.18)
      g.scale.setScalar(s)

      const mat = matRefs.current[i]
      if (mat) {
        const color = selected ? HIGHLIGHT : island.accentColor
        mat.color.set(color)
        mat.emissive.set(color)
      }
    }
  })

  return (
    <group>
      {items.map((item, i) => (
        <group key={item.kind + item.index} ref={(el) => (groupRefs.current[i] = el)} scale={0}>
          <Billboard>
            {/* disc */}
            <mesh>
              <circleGeometry args={[0.6, 32]} />
              <meshStandardMaterial
                ref={(el) => (matRefs.current[i] = el)}
                color={island.accentColor}
                emissive={island.accentColor}
                emissiveIntensity={0.6}
                toneMapped={false}
              />
            </mesh>
            {/* outline ring */}
            <mesh position={[0, 0, -0.01]}>
              <ringGeometry args={[0.6, 0.72, 32]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.85} toneMapped={false} />
            </mesh>
            {/* glyph */}
            <Text position={[0, 0, 0.02]} fontSize={0.55} anchorX="center" anchorY="middle" color={GLYPH_COLOR}>
              {item.icon}
            </Text>
          </Billboard>
        </group>
      ))}
    </group>
  )
}
