import path from 'node:path'
import { normalizePath, runnerImport } from 'vite'
import type { Plugin, ResolvedConfig } from 'vite'
import type { SiteContent } from '../src/content'
import { renderHead } from './html'

// ─────────────────────────────────────────────────────────────────────────────
//  Bakes src/content.ts into the HTML pages — at build time, and on every
//  request in dev — so the text is edited in ONE place yet still sits in the
//  raw HTML before any JavaScript runs (which is what link previews, search
//  engines and no-WebGL visitors get).
//
//  Each page marks where generated markup goes with an HTML comment:
//    <!--site:head-->   <title>, description, Open Graph / Twitter tags
//
//  A missing marker fails the build rather than shipping a page without it.
// ─────────────────────────────────────────────────────────────────────────────

const CONTENT_MODULE = 'src/content.ts'

type PageId = 'home'

/** Which page an HTML file is, by its path relative to the project root. */
const PAGES: Record<string, PageId> = {
  'index.html': 'home',
}

function fill(html: string, marker: string, markup: string, file: string): string {
  const tag = `<!--site:${marker}-->`
  if (!html.includes(tag)) throw new Error(`[site-pages] ${file} is missing the ${tag} marker`)
  return html.replace(tag, () => markup)
}

export function sitePages(): Plugin {
  let config: ResolvedConfig
  // content.ts is loaded once and reused until it (or anything it imports)
  // changes on disk; `watched` is that dependency list.
  let cached: Promise<SiteContent> | undefined
  let watched = new Set<string>()

  function loadContent(): Promise<SiteContent> {
    const entry = path.join(config.root, CONTENT_MODULE)
    cached ??= runnerImport<{ content: SiteContent }>(entry)
      .then(({ module, dependencies }) => {
        watched = new Set([entry, ...dependencies].map((f) => normalizePath(path.resolve(f))))
        return module.content
      })
      .catch((err) => {
        cached = undefined // retry on the next request instead of caching the failure
        throw err
      })
    return cached
  }

  return {
    name: 'site-pages',

    configResolved(resolved) {
      config = resolved
    },

    configureServer(server) {
      server.watcher.on('change', (file) => {
        if (watched.has(normalizePath(path.resolve(file)))) cached = undefined
      })
    },

    transformIndexHtml: {
      // 'post' so Vite has already processed the template's own tags and won't
      // try to resolve the URLs inside the markup generated here.
      order: 'post',
      async handler(html, ctx) {
        const file = normalizePath(path.relative(config.root, ctx.filename))
        const page = PAGES[file]
        if (!page) return html

        const content = await loadContent()
        return fill(html, 'head', renderHead(content.meta[page], content.meta.ogImage), file)
      },
    },
  }
}
