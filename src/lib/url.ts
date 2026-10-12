// Resolve a content URL against a base path. The rules behind lib/paths.ts's
// asset(), kept free of import.meta.env so build-time code (the plain page in
// plugins/plain-page.ts) can pass its own base:
//
// • External links (https://, http://, //, mailto:, tel:) are returned as-is.
// • A bare email address (e.g. "you@example.com") becomes a mailto: link.
// • Everything else is a file in /public, prefixed with the base path.
export function resolveUrl(url: string, base: string): string {
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
  return base.replace(/\/$/, '') + '/' + url.replace(/^\//, '')
}
