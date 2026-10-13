import { resolveUrl } from './url'

// Resolve a content URL to something safe to use in an href/src.
//
// • External links (https://, http://, //, mailto:, tel:) are returned as-is.
// • A bare email address (e.g. "you@example.com") is turned into a mailto: link,
//   so you don't have to remember the prefix in content.ts.
// • Everything else is treated as a file living in /public and is prefixed with
//   Vite's base path (import.meta.env.BASE_URL) so it keeps working when the
//   site is served from a GitHub Pages sub-path like /My-Repo/.
export function bareValue(url: string): string {
  return url.trim().replace(/^(mailto:|tel:)/i, '')
}

export function asset(url: string): string {
  return resolveUrl(url, import.meta.env.BASE_URL) // e.g. "/Personal-Website/" or "/"
}
