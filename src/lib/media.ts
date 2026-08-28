import type { Media, MediaItem } from '../content'
import { asset } from './paths'

// ─────────────────────────────────────────────────────────────────────────────
//  Turn the loose `images` entries authored in content.ts (bare strings OR
//  MediaItem objects) into one normalized, base-path-aware shape that every
//  consumer can rely on: the DOM gallery/lightbox and the 3D orbiting preview.
// ─────────────────────────────────────────────────────────────────────────────

export interface ResolvedImage {
  /** Full-size image URL, ready to drop into a src attribute. */
  src: string
  /** Smaller URL for card thumbnails + the 3D preview (falls back to `src`). */
  thumb: string
  /** Caption under the image; also used as the alt text. May be empty. */
  caption: string
  /** Optional click-through (paper PDF, article, repo) offered in the lightbox. */
  href?: string
}

function toItem(m: Media): MediaItem {
  return typeof m === 'string' ? { src: m } : m
}

/**
 * Normalize + resolve an `images` array. Entries without a `src` are dropped, so
 * a stray empty string in content.ts never renders a broken image.
 */
export function resolveImages(list?: Media[]): ResolvedImage[] {
  if (!list?.length) return []
  return list
    .map(toItem)
    .filter((m) => m?.src?.trim())
    .map((m) => ({
      src: asset(m.src),
      thumb: asset(m.thumb?.trim() ? m.thumb : m.src),
      caption: m.caption?.trim() ?? '',
      href: m.href?.trim() ? asset(m.href) : undefined,
    }))
}

/**
 * The cover image — the first entry. It's what floats above the item's orbiting
 * icon in the 3D world. Reorder `images` in content.ts to pick a different one.
 */
export function coverImage(list?: Media[]): ResolvedImage | null {
  return resolveImages(list)[0] ?? null
}
