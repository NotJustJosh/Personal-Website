import { asset } from './paths'

// ─────────────────────────────────────────────────────────────────────────────
//  The way out of the 3D world: the plain page at projects/ (static HTML, no
//  WebGL). Used by the skip links, and as the fallback when the scene can't
//  start — no WebGL 2, or the renderer throws while being created.
// ─────────────────────────────────────────────────────────────────────────────

/** The plain page, base-path aware. */
export const PLAIN_PAGE = asset('projects/')

/** `?nowebgl=1` forces the no-WebGL path, for testing the fallback. */
export function forcedNoWebGL(): boolean {
  return new URLSearchParams(window.location.search).get('nowebgl') === '1'
}

/**
 * Send the visitor to the plain page. `?reason=webgl` makes it show a one-line
 * notice explaining why they landed there. `replace` keeps the broken 3D page
 * out of the back-button history.
 */
export function fallBackToPlainPage() {
  window.location.replace(`${PLAIN_PAGE}?reason=webgl`)
}
