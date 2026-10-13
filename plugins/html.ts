import type { PageMeta, SiteContent } from '../src/content'
import { resolveUrl } from '../src/lib/url'

// Small string-building helpers for the HTML that site-pages.ts bakes in.

/** Escape text for use inside an HTML element or a double-quoted attribute. */
export function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** <title>, description, canonical link and Open Graph / Twitter tags. */
export function renderHead(meta: PageMeta, ogImage: string): string {
  return [
    `<title>${esc(meta.title)}</title>`,
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<link rel="canonical" href="${esc(meta.url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${esc(meta.ogTitle)}" />`,
    `<meta property="og:description" content="${esc(meta.ogDescription)}" />`,
    `<meta property="og:url" content="${esc(meta.url)}" />`,
    `<meta property="og:image" content="${esc(ogImage)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join('\n    ')
}

/**
 * The 3D world's loading screen (#boot): who this is, how to reach them, and a
 * way to the plain page — real HTML that's there before any JavaScript runs.
 * src/lib/boot.ts fills the progress bar and fades it out once the scene is
 * ready. Outside links open in a new tab so the world keeps loading here.
 */
export function renderIntro(content: SiteContent, base: string): string {
  const url = (u: string) => esc(resolveUrl(u, base))
  const newTab = ' target="_blank" rel="noopener noreferrer"'
  return `<div id="boot" class="boot">
      <div class="boot__card">
        <h1 class="boot__name">${esc(content.fullName)}</h1>
        <p class="boot__line">${esc(content.oneLiner)}</p>
        <a class="boot__skip" href="${url('projects/')}">Skip to projects</a>
        <ul class="boot__links">
          <li><a href="${url(content.resumeUrl)}"${newTab}>Résumé</a></li>
          <li><a href="${url(content.contact.github)}"${newTab}>GitHub</a></li>
          <li><a href="${url(content.contact.linkedin)}"${newTab}>LinkedIn</a></li>
          <li><a href="${url(content.contact.email)}">${esc(content.contact.email)}</a></li>
        </ul>
        <div class="boot__progress">
          <div class="boot__track" role="progressbar" aria-label="Loading the 3D world" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="boot__fill"></div></div>
          <p class="boot__status">Loading the 3D world…</p>
        </div>
        <noscript><p class="boot__status">The 3D world needs JavaScript; the projects page doesn't.</p></noscript>
      </div>
    </div>`
}
