import { create } from 'zustand'
import type { SectionId } from './content'

// ─────────────────────────────────────────────────────────────────────────────
//  Tiny global store (zustand).
//
//  Why zustand and not React context? The 3D scene runs inside React Three
//  Fiber's OWN reconciler, so a normal React context provider in the DOM tree
//  does NOT reach components rendered inside <Canvas>. zustand is an external
//  store, so the scene (Player/zones) and the DOM UI (HUD/panels) can share
//  state across that boundary without prop-drilling through the Canvas.
// ─────────────────────────────────────────────────────────────────────────────

interface GameState {
  /** The section whose panel is open as a DOM overlay, or null if none. */
  openPanel: SectionId | null
  /** The zone the player is currently within range of (drives the "Press E" HUD). */
  nearbyZone: SectionId | null
  /** Becomes true once the 3D scene has finished loading. */
  ready: boolean

  openSection: (id: SectionId) => void
  closePanel: () => void
  setNearbyZone: (id: SectionId | null) => void
  setReady: (ready: boolean) => void
}

export const useGame = create<GameState>((set) => ({
  openPanel: null,
  nearbyZone: null,
  ready: false,

  openSection: (id) => set({ openPanel: id }),
  closePanel: () => set({ openPanel: null }),
  setNearbyZone: (id) => set((s) => (s.nearbyZone === id ? s : { nearbyZone: id })),
  setReady: (ready) => set({ ready }),
}))
