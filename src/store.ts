import { create } from 'zustand'
import type { IslandId } from './content'
import { spawnIsland } from './lib/world'

// ─────────────────────────────────────────────────────────────────────────────
//  Tiny global store (zustand).
//
//  Why zustand and not React context? The 3D scene runs inside React Three
//  Fiber's OWN reconciler, so a normal React context provider in the DOM tree
//  does NOT reach components rendered inside <Canvas>. zustand is an external
//  store, so the scene (Player/islands) and the DOM UI (HUD/panels/menus) share
//  state across that boundary without prop-drilling through the Canvas.
// ─────────────────────────────────────────────────────────────────────────────

/** Points at one interactable item (a project/link) on an island. */
export interface ItemRef {
  islandId: IslandId
  index: number
}

function sameItem(a: ItemRef | null, b: ItemRef | null): boolean {
  if (a === b) return true
  if (!a || !b) return false
  return a.islandId === b.islandId && a.index === b.index
}

interface GameState {
  /** The island whose panel is open as a DOM overlay, or null. */
  openPanel: IslandId | null
  /** The island the player is currently standing on/near (drives the "Press E" HUD). */
  nearbyIsland: IslandId | null
  /** The orbiting item icon the player is closest to (if any), or null. */
  nearbyItem: ItemRef | null
  /** While a panel is open, the item to scroll to + highlight (or null). */
  focusItem: ItemRef | null
  /** Becomes true once the 3D scene has finished loading. */
  ready: boolean

  /** Fast-travel: target island + a nonce the Player watches to perform the jump. */
  teleportTarget: IslandId | null
  teleportNonce: number

  /** Screen fade for respawn / teleport polish. */
  fading: boolean

  /** Open an island's panel, optionally focused on one of its items. */
  openSection: (id: IslandId, focusIndex?: number) => void
  closePanel: () => void
  setNearbyIsland: (id: IslandId | null) => void
  setNearbyItem: (item: ItemRef | null) => void
  setReady: (ready: boolean) => void
  /** Request a fast-travel jump to an island (also closes any open panel + fades). */
  requestTeleport: (id: IslandId) => void
  setFading: (fading: boolean) => void
}

export const useGame = create<GameState>((set) => ({
  // Open the hub (About) panel by default on load.
  openPanel: spawnIsland().id,
  nearbyIsland: null,
  nearbyItem: null,
  focusItem: null,
  ready: false,
  teleportTarget: null,
  teleportNonce: 0,
  fading: false,

  openSection: (id, focusIndex) =>
    set({
      openPanel: id,
      focusItem: focusIndex != null ? { islandId: id, index: focusIndex } : null,
    }),
  closePanel: () => set({ openPanel: null, focusItem: null }),
  setNearbyIsland: (id) => set((s) => (s.nearbyIsland === id ? s : { nearbyIsland: id })),
  setNearbyItem: (item) => set((s) => (sameItem(s.nearbyItem, item) ? s : { nearbyItem: item })),
  setReady: (ready) => set({ ready }),
  requestTeleport: (id) =>
    set((s) => ({
      teleportTarget: id,
      teleportNonce: s.teleportNonce + 1,
      openPanel: null,
      focusItem: null,
      fading: true,
    })),
  setFading: (fading) => set({ fading }),
}))
