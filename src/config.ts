// ─────────────────────────────────────────────────────────────────────────────
//  World tuning constants — safe to tweak.
//  (Movement speeds + jump count live at the top of src/components/Player.tsx.)
// ─────────────────────────────────────────────────────────────────────────────

export const WORLD = {
  /** Physics gravity (negative = down). Heavier = less floaty. Pairs with
   *  JUMP_SPEED + FALL_MULTIPLIER in Player.tsx. */
  GRAVITY: -28,

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

// ─────────────────────────────────────────────────────────────────────────────
//  VISUALS — every look-and-feel knob lives here. Colour comes from glowing
//  accents against a dark base, so the night mood survives: raise EMISSIVE or
//  BLOOM.intensity to make things glow MORE, don't raise the light intensities.
// ─────────────────────────────────────────────────────────────────────────────

/** One accent per section. Drives its marker glow, pad, light and bridges. */
export const ZONE_ACCENTS: Record<string, string> = {
  about: '#FF7A59', // coral
  projects: '#E0479E', // magenta
  experience: '#38BDF8', // cyan
  honors: '#FBBF24', // gold
  contact: '#34D399', // mint
  resources: '#A78BFA', // violet
  showcase: '#F2C14E', // the platform the three work sections stand on
}

export const VISUALS = {
  /** ACES filmic tone mapping exposure. ~1 keeps highlights from clipping. */
  EXPOSURE: 1.0,

  /** Only things BRIGHTER than the threshold bloom — keeps the dark base dark. */
  BLOOM: {
    intensity: 0.8,
    radius: 0.4,
    luminanceThreshold: 0.85,
    luminanceSmoothing: 0.12,
  },

  /** Emissive strengths. These are what actually glow through the bloom pass. */
  EMISSIVE: {
    /** The spinning cube on each pedestal. */
    marker: 4.5,
    /** The orbiting project icons: resting, and when you're next to one. */
    itemIdle: 3.0,
    itemSelected: 6.5,
  },

  /** Key/fill/bounce. Cool key + warm fill gives geometry a colour axis. */
  LIGHTS: {
    keyColor: '#7C6DF2', // cool blue-violet
    keyIntensity: 1.0,
    fillColor: '#FF8A5C', // warm coral, opposite side, no shadows
    fillIntensity: 0.5,
    hemiSky: '#3A4A7A',
    hemiGround: '#0A0E1A',
    hemiIntensity: 0.3,
    /** Kept very low on purpose — flat ambient is what washed the scene out. */
    ambientIntensity: 0.1,
  },

  /** Drifting aurora curtains behind the islands. */
  AURORA: {
    /** Colours low → mid → high up the curtain. */
    low: '#2EFFA0', // green
    mid: '#38BDF8', // cyan
    high: '#A78BFA', // violet
    /** Overall brightness; this is what bloom picks up. */
    intensity: 1.5,
    /** Vertical scroll speed of the noise. */
    speed: 0.035,
    /** How many curtains, each further back and slower (parallax). */
    layers: 3,
  },
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

  /** Max size of the small preview image floating above an item that has one.
   *  The image is fitted inside this box, so its aspect ratio is preserved. */
  PREVIEW_WIDTH: 2.6,
  PREVIEW_HEIGHT: 1.7,
  /** How far above the icon the preview's bottom edge sits (clears the label). */
  PREVIEW_BASE_Y: 1.8,
}
