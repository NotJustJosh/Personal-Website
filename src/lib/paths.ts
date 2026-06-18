// Resolve a content URL to something safe to use in an href/src.
//
// • External links (https://, http://, //, mailto:, tel:) are returned as-is.
// • A bare email address (e.g. "you@example.com") is turned into a mailto: link,
//   so you don't have to remember the prefix in content.ts.
// • Everything else is treated as a file living in /public and is prefixed with
//   Vite's base path (import.meta.env.BASE_URL) so it keeps working when the
//   site is served from a GitHub Pages sub-path like /My-Repo/.
export function asset(url: string): string {
  url = url.trim() // tolerate stray whitespace in content.ts
  // Already an absolute URL or a known scheme — leave it alone.
  if (/^([a-z]+:)?\/\//i.test(url) || /^(mailto:|tel:)/i.test(url)) {
    return url
  }
  // Bare email address → mailto:
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url)) {
    return `mailto:${url}`
  }
  // Otherwise it's a local file in /public — prefix the base path.
  const base = import.meta.env.BASE_URL // e.g. "/Personal-Website/" or "/"
  return base.replace(/\/$/, '') + '/' + url.replace(/^\//, '')
}
