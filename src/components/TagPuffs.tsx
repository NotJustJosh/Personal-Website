import { useMemo, useRef } from 'react'
import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Island } from '../content'
import { islandItems, orbitRadius, orbitOffset } from '../lib/world'
import { tagColor } from '../lib/tags'
import { useGame } from '../store'

// ─────────────────────────────────────────────────────────────────────────────
//  When the player is next to a project's orbiting icon (it's lit/selected), a
//  few of that project's tags puff up out of the icon and fade as they rise.
//  Each tag is a billboarded label that grows from nothing, drifts upward, then
//  shrinks away — looping in a gentle stagger while you stay near.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_PUFFS = 4
const RISE = 1.7 // how far a tag drifts up over its life
const START_Y = 0.7 // starting height above the icon
const SPEED = 0.5 // life cycles per second
const SPREAD = 0.4 // horizontal scatter

export function TagPuffs({ island }: { island: Island }) {
  const items = useMemo(() => islandItems(island), [island])
  const radius = orbitRadius(island)
  const count = items.length

  const nearbyItem = useGame((s) => s.nearbyItem)
  const onThis = !!nearbyItem && nearbyItem.islandId === island.id

  // Tags of the selected project (only projects carry tags).
  const tags = useMemo(() => {
    if (!onThis) return [] as string[]
    const item = items[nearbyItem!.index]
    if (!item || item.kind !== 'project') return []
    return (island.content.projects?.[item.index]?.tags ?? []).slice(0, MAX_PUFFS)
  }, [onThis, nearbyItem, items, island])

  const group = useRef<THREE.Group>(null)
  const slots = useRef<(THREE.Group | null)[]>([])

  useFrame((state) => {
    const g = group.current
    if (!g) return
    if (!onThis || tags.length === 0) {
      g.visible = false
      return
    }
    g.visible = true
    const t = state.clock.elapsedTime
    const o = orbitOffset(nearbyItem!.index, count, radius, t)
    g.position.set(o.x, o.y, o.z)

    for (let i = 0; i < MAX_PUFFS; i++) {
      const slot = slots.current[i]
      if (!slot) continue
      if (i >= tags.length) {
        slot.scale.setScalar(0)
        continue
      }
      const loop = (((t * SPEED + i / tags.length) % 1) + 1) % 1
      const env = Math.sin(loop * Math.PI) // 0 → 1 → 0 (puff in, fade out)
      slot.position.set(Math.cos(i * 2.3) * SPREAD, START_Y + loop * RISE, Math.sin(i * 2.3) * SPREAD)
      slot.scale.setScalar(env)
    }
  })

  return (
    <group ref={group} visible={false}>
      {Array.from({ length: MAX_PUFFS }).map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            slots.current[i] = el
          }}
          scale={0}
        >
          <Billboard>
            <Text
              fontSize={0.3}
              anchorX="center"
              anchorY="middle"
              color={tags[i] ? tagColor(tags[i]) : '#ffffff'}
              outlineWidth={0.025}
              outlineColor="#05070f"
            >
              {tags[i] ?? ''}
            </Text>
          </Billboard>
        </group>
      ))}
    </group>
  )
}
