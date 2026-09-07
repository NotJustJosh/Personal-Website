import { content } from '../content'
import type { Island, IslandId, PanelContent } from '../content'
import { ISLAND, ORBIT } from '../config'
import { coverImage } from './media'
import type { ResolvedImage } from './media'

// Derived, read-only helpers computed FROM the data in content.ts. Nothing here
// is island-specific — add islands by editing content.ts only.

export const ISLANDS = content.islands

/**
 * Islands with their own section/panel — i.e. everything except scenery
 * platforms. This is what the fast-travel menu and Classic view list.
 */
export const CONTENT_ISLANDS = ISLANDS.filter((i) => !i.platform)

/**
 * The radius of an island (its `size`, or the default).
 *
 * NOTE: this is the radius its ground mesh is scaled to on the X axis, so it's
 * only the true rim distance for a ROUND island. A stretched ground model (see
 * `groundModel`) reaches less far on its short axis — anything that needs the
 * actual rim in a given direction wants {@link topFaceReach} instead.
 */
export function islandRadius(island: Island): number {
  return island.size ?? ISLAND.RADIUS
}

/** Ground mesh used when an island doesn't name its own. */
export const DEFAULT_GROUND_MODEL = 'models/island.glb'

/** The ground mesh for an island: its `groundModel`, or the default. */
export function groundModelOf(island: Island): string {
  return island.groundModel ?? DEFAULT_GROUND_MODEL
}

export function getIsland(id: IslandId): Island | undefined {
  return ISLANDS.find((i) => i.id === id)
}

/** The spawn island: the one flagged `isHub`, else the first island. */
export function spawnIsland(): Island {
  return ISLANDS.find((i) => i.isHub) ?? ISLANDS[0]
}

export interface Bridge {
  a: Island
  b: Island
}

/**
 * Unique, de-duplicated list of bridges derived from every island's `neighbors`.
 * A↔B and B↔A collapse to one bridge. Unknown neighbor ids are skipped (with a
 * dev-time warning) so a typo never crashes the world.
 */
export function getBridges(): Bridge[] {
  const seen = new Set<string>()
  const bridges: Bridge[] = []
  for (const island of ISLANDS) {
    for (const neighborId of island.neighbors) {
      const other = getIsland(neighborId)
      if (!other) {
        if (import.meta.env.DEV) {
          console.warn(
            `[world] island "${island.id}" lists unknown neighbor "${neighborId}" — skipping that bridge.`,
          )
        }
        continue
      }
      const key = [island.id, other.id].sort().join('::')
      if (seen.has(key)) continue
      seen.add(key)
      bridges.push({ a: island, b: other })
    }
  }
  return bridges
}

/** Nearest island to a horizontal (x, z) position — used for fall-respawn. */
export function nearestIsland(x: number, z: number): Island {
  let best = ISLANDS[0]
  let bestDist = Infinity
  for (const island of ISLANDS) {
    const dx = x - island.position[0]
    const dz = z - island.position[2]
    const d = dx * dx + dz * dz
    if (d < bestDist) {
      bestDist = d
      best = island
    }
  }
  return best
}

/** Adapt an island's content into a fully-formed PanelContent (title defaults to label). */
export function islandPanel(island: Island): PanelContent {
  return {
    title: island.content.title ?? island.label,
    body: island.content.body,
    images: island.content.images,
    slides: island.content.slides,
    groups: island.content.groups,
    projects: island.content.projects,
    links: island.content.links,
  }
}

// ── Orbiting items ───────────────────────────────────────────────────────────
// An island's "items" are its projects (preferred) or, failing that, its links.
// These drive the orbiting icons and the per-item panel focus.

export interface IslandItem {
  /** Index into the source array (projects[] or links[]). */
  index: number
  /** Which source array it came from. */
  kind: 'project' | 'link'
  /** Display label (project name or link label). */
  label: string
  /** Optional override for the orbiting bubble label (projects' `short`). */
  short?: string
  /** Short glyph for the orbiting icon (defaults to the item number). */
  icon: string
  /** Cover image (the first of a project's `images`), floated as a 3D preview. */
  image?: ResolvedImage
}

/** Normalized list of an island's interactable items. */
export function islandItems(island: Island): IslandItem[] {
  const c = island.content
  if (c.projects?.length) {
    return c.projects.map((p, i) => ({
      index: i,
      kind: 'project' as const,
      label: p.name,
      short: p.short,
      icon: p.icon ?? String(i + 1),
      image: coverImage(p.images) ?? undefined,
    }))
  }
  if (c.links?.length) {
    return c.links.map((l, i) => ({
      index: i,
      kind: 'link' as const,
      label: l.label,
      icon: l.icon ?? String(i + 1),
    }))
  }
  return []
}

/** True if this island should show orbiting item icons. */
export function islandHasOrbit(island: Island): boolean {
  return !!island.orbit && islandItems(island).length > 0
}

/** Radius of the orbiting-icon ring for an island. */
export function orbitRadius(island: Island): number {
  return islandRadius(island) * ORBIT.RADIUS_FACTOR
}

const TAU = Math.PI * 2

/**
 * Local position (relative to the island centre) of orbiting item `index` at a
 * given elapsed time. Pure function so the scene (icons) and the Player
 * (proximity) compute identical positions from the shared clock.
 */
export function orbitOffset(
  index: number,
  count: number,
  radius: number,
  elapsed: number,
): { x: number; y: number; z: number } {
  const angle = (index / count) * TAU + elapsed * ORBIT.SPEED
  return { x: Math.cos(angle) * radius, y: ORBIT.HEIGHT, z: Math.sin(angle) * radius }
}
