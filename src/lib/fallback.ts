import { asset } from './paths'

// ─────────────────────────────────────────────────────────────────────────────
//  The way out of the 3D world: the plain page at projects/ (static HTML, no
//  WebGL). Used by the skip links, for phones, and as the fallback when the
//  scene can't start — no WebGL 2, or the renderer throws while being created.
// ─────────────────────────────────────────────────────────────────────────────

/** The plain page, base-path aware. */
export const PLAIN_PAGE = asset('projects/')

const param = (name: string) => new URLSearchParams(window.location.search).get(name)

/** `?nowebgl=1` forces the no-WebGL path, for testing the fallback. */
export function forcedNoWebGL(): boolean {
  return param('nowebgl') === '1'
}

/**
 * `?view=3d` keeps a phone in the 3D world instead of sending it to the plain
 * page — the plain page's "3D world" links carry it, so they don't bounce.
 */
export function wants3D(): boolean {
  return param('view') === '3d'
}

/** Phones: straight to the plain page, no notice (nothing went wrong). */
export function sendToPlainPage() {
  window.location.replace(PLAIN_PAGE)
}

/**
 * Send the visitor to the plain page. `?reason=webgl` makes it show a one-line
 * notice explaining why they landed there. `replace` keeps the broken 3D page
 * out of the back-button history.
 */
export function fallBackToPlainPage() {
  window.location.replace(`${PLAIN_PAGE}?reason=webgl`)
}
