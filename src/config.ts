// ─────────────────────────────────────────────────────────────────────────────
//  World tuning constants — safe to tweak.
//  (Movement speeds + jump count live at the top of src/components/Player.tsx.)
// ─────────────────────────────────────────────────────────────────────────────

export const WORLD = {
  /** Physics gravity (negative = down). Pairs with JUMP_SPEED in Player.tsx. */
  GRAVITY: -20,

  /**
   * Playable radius from the world origin. The player is gently stopped at this
   * distance so they can't wander forever into the void. A faint shimmer wall is
   * drawn here (see components/WorldBorder.tsx). This is THE world-border size.
   */
  BORDER_RADIUS: 80,

  /**
   * Fall below this Y and the player is gently respawned on the nearest island.
   * Keep it comfortably below the lowest island.
   */
  RESPAWN_Y: -30,
}

export const ISLAND = {
  /** Default island disk radius (override per-island with `size` in content.ts). */
  RADIUS: 7,
  /** Island slab thickness. The top surface sits exactly at the island's `position.y`. */
  THICKNESS: 1.6,
}

export const ORBIT = {
  /** Icon ring radius as a fraction of the island radius. */
  RADIUS_FACTOR: 0.78,
  /** How high above the island surface the icons float. */
  HEIGHT: 2.2,
  /** Orbit speed in radians/second (keep slow so icons are easy to approach). */
  SPEED: 0.15,
  /** How close (horizontal world units) you must be to an icon to select it. */
  REACH: 4,
}
