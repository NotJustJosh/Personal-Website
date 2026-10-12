import fs from 'node:fs'
import path from 'node:path'
import { normalizePath, runnerImport } from 'vite'
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import type { SiteContent } from '../src/content'
import { renderHead } from './html'
import { emptyFields, renderPlainBody } from './plain-page'

// ─────────────────────────────────────────────────────────────────────────────
//  Bakes src/content.ts into the HTML pages — at build time, and on every
//  request in dev — so the text is edited in ONE place yet still sits in the
//  raw HTML before any JavaScript runs (which is what link previews, search
//  engines and no-WebGL visitors get).
//
//  Each page marks where generated markup goes with an HTML comment:
//    <!--site:head-->         <title>, description, Open Graph / Twitter tags
//    <!--site:plain-css-->    projects/plain.css, inlined   (projects/ only)
//    <!--site:plain-body-->   the plain page itself         (projects/ only)
//
//  A missing marker fails the build rather than shipping a page without it.
//
//  It also prints the plain page's blank fields (see emptyFields) when the dev
//  server starts, whenever content.ts changes, and on every build.
// ─────────────────────────────────────────────────────────────────────────────

const CONTENT_MODULE = 'src/content.ts'
const PLAIN_CSS = 'projects/plain.css'

type PageId = 'home' | 'plain'

/** Which page an HTML file is, by its path relative to the project root. */
const PAGES: Record<string, PageId> = {
  'index.html': 'home',
  'projects/index.html': 'plain',
}

function fill(html: string, marker: string, markup: string, file: string): string {
  const tag = `<!--site:${marker}-->`
  if (!html.includes(tag)) throw new Error(`[site-pages] ${file} is missing the ${tag} marker`)
  return html.replace(tag, () => markup)
}

/** Comments out, runs of whitespace collapsed — enough for an inline <style>. */
function compactCss(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim()
}

function formatReport(content: SiteContent): string {
  const rows = emptyFields(content)
  if (!rows.length) return 'Plain page: every field is written.'
  const width = Math.max(...rows.map(([id]) => id.length)) + 2
  const total = rows.reduce((n, [, fields]) => n + fields.length, 0)
  return [
    `Plain page: ${total} blank fields in ${CONTENT_MODULE} (hidden on projects/ until written):`,
    ...rows.map(([id, fields]) => `  ${id.padEnd(width)}${fields.join(', ')}`),
  ].join('\n')
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

  async function report() {
    config.logger.info('\n' + formatReport(await loadContent()) + '\n')
  }

  function reloadPlainPage(server: ViteDevServer) {
    server.ws.send({ type: 'full-reload', path: '/projects/index.html' })
  }

  return {
    name: 'site-pages',

    configResolved(resolved) {
      config = resolved
    },

    // Runs once per build, and once when the dev server starts.
    async buildStart() {
      await report()
    },

    configureServer(server) {
      const css = normalizePath(path.join(config.root, PLAIN_CSS))
      server.watcher.add(css)
      server.watcher.on('change', (file) => {
        const changed = normalizePath(path.resolve(file))
        if (changed === css) return reloadPlainPage(server)
        if (!watched.has(changed)) return
        cached = undefined
        // The 3D app hot-reloads content.ts by itself; the plain page has no
        // client code to do that, so reload it.
        report().then(() => reloadPlainPage(server), (err) => config.logger.error(String(err)))
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
        html = fill(html, 'head', renderHead(content.meta[page], content.meta.ogImage), file)

        if (page === 'plain') {
          const css = fs.readFileSync(path.join(config.root, PLAIN_CSS), 'utf8')
          html = fill(html, 'plain-css', `<style>${compactCss(css)}</style>`, file)
          html = fill(html, 'plain-body', renderPlainBody(content, { base: config.base, publicDir: config.publicDir }), file)
        }
        return html
      },
    },
  }
}
