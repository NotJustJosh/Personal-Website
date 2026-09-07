import type { Media, MediaItem, Video } from '../content'
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

export interface ResolvedVideo {
  /** Clip URL, ready to drop into a src attribute. */
  src: string
  /** Still frame shown before the clip loads. May be undefined. */
  poster?: string
  /** Caption under the clip; also used as the accessible label. May be empty. */
  caption: string
}

/**
 * Normalize + resolve a `video` entry, mirroring {@link resolveImages}. Returns
 * null for a missing or blank `src`, so an empty string in content.ts renders
 * nothing rather than an empty player.
 */
export function resolveVideo(v?: Video): ResolvedVideo | null {
  if (!v) return null
  const item = typeof v === 'string' ? { src: v } : v
  if (!item.src?.trim()) return null
  return {
    src: asset(item.src),
    poster: item.poster?.trim() ? asset(item.poster) : undefined,
    caption: item.caption?.trim() ?? '',
  }
}
