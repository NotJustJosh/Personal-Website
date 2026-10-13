import path from 'node:path'
import type { Island, LinkItem, Media, Project, SiteContent, Video } from '../src/content'
import { parseBlocks, splitLines } from '../src/lib/prose'
import { resolveUrl } from '../src/lib/url'
import { esc } from './html'
import { imageSize } from './image-size'

// ─────────────────────────────────────────────────────────────────────────────
//  The plain page (projects/), rendered to static HTML from src/content.ts.
//  No three.js and no bundle: one HTML file plus the images it shows. (Its only
//  script is three inline lines that reveal the "3D couldn't start" notice.)
//
//  The one rule that matters: a blank field renders NOTHING — no empty
//  heading, no placeholder — so a half-written write-up never ships.
//  emptyFieldReport() lists those blanks so you know what's left to write.
// ─────────────────────────────────────────────────────────────────────────────

export interface PlainPageOptions {
  /** Vite's base path, e.g. '/Personal-Website/'. */
  base: string
  /** Absolute path of /public, for reading image dimensions. */
  publicDir: string
}

/** Links left over from a template — skipped on the plain page, and reported. */
const PLACEHOLDER_URL = /github\.com\/yourname\b|example\.com/i

/** A URL with a scheme (or protocol-relative) — anything not in /public. */
const EXTERNAL = /^([a-z]+:)?\/\//i

const blank = (s?: string) => !s?.trim()

function island(content: SiteContent, id: string): Island | undefined {
  return content.islands.find((i) => i.id === id)
}

/** Every project on the plain page, in order: `leadProjects`, then the rest of the Projects island. */
export function plainProjects(content: SiteContent): Project[] {
  const islandProjects = island(content, 'projects')?.content.projects ?? []
  const pool = [...islandProjects, ...content.plainPage.extraProjects]
  const lead = content.plainPage.leadProjects
    .map((id) => pool.find((p) => p.id === id))
    .filter((p): p is Project => !!p)
  return [...lead, ...islandProjects.filter((p) => !lead.includes(p))]
}

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const anchorOf = (p: Project) => p.id ?? slug(p.name)

// ── Text ─────────────────────────────────────────────────────────────────────

/** A prose field as <p>/<ul> blocks, using the same rules as the 3D panels. */
function prose(text: string | undefined, className?: string): string {
  if (blank(text)) return ''
  const cls = className ? ` class="${className}"` : ''
  let out = ''
  let bullets: string[] = []
  const flush = () => {
    if (bullets.length) out += `<ul${cls}>${bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>\n`
    bullets = []
  }
  for (const block of parseBlocks(text!)) {
    if (block.kind === 'li') {
      bullets.push(block.text)
      continue
    }
    flush()
    out += `<p${cls}>${esc(block.text)}</p>\n`
  }
  flush()
  return out
}

/** A title where every newline breaks (multi-line honors). */
const lines = (text: string) => splitLines(text).map(esc).join('<br />')

// ── Media ────────────────────────────────────────────────────────────────────

interface PlainImage {
  src: string
  alt: string
  caption: string
  href?: string
  width?: number
  height?: number
}

/** Local files live in /public; anything with a scheme is external. */
function localFile(url: string, o: PlainPageOptions): string | null {
  return EXTERNAL.test(url) ? null : path.join(o.publicDir, url.replace(/^\//, ''))
}

/** Images that can render: a `src`, plus `alt` (or a caption standing in for it). */
function plainImages(list: Media[] | undefined, o: PlainPageOptions): PlainImage[] {
  return (list ?? [])
    .map((m) => (typeof m === 'string' ? { src: m } : m))
    .filter((m) => !blank(m.src) && !(blank(m.alt) && blank(m.caption)))
    .map((m) => {
      const file = localFile(m.src.trim(), o)
      const size = file ? imageSize(file) : null
      return {
        src: resolveUrl(m.src, o.base),
        alt: (m.alt?.trim() || m.caption?.trim())!,
        caption: m.caption?.trim() ?? '',
        href: blank(m.href) ? undefined : resolveUrl(m.href!, o.base),
        ...size,
      }
    })
}

function sizeAttrs(img: { width?: number; height?: number }): string {
  return img.width && img.height ? ` width="${img.width}" height="${img.height}"` : ''
}

interface Ctx extends PlainPageOptions {
  /** The deployed site, for the full URLs printed on paper. */
  siteUrl: string
  /** Only the very first image on the page loads eagerly; the rest are below the fold. */
  eagerUsed: boolean
}

/** Where a content URL lives on the deployed site — what a printout should show. */
function publicUrl(url: string, ctx: Ctx): string {
  url = url.trim()
  return EXTERNAL.test(url) ? url : ctx.siteUrl + url.replace(/^\//, '')
}

/**
 * An href, plus — for a file on this site, like the résumé — `data-print-url`
 * with its public URL, which the print stylesheet shows after the link text
 * (an http(s) href is printed as-is).
 */
function hrefAttrs(url: string, ctx: Ctx): string {
  const resolved = resolveUrl(url, ctx.base)
  const onSite = !EXTERNAL.test(url.trim()) && !/^(mailto:|tel:)/i.test(resolved)
  return `href="${esc(resolved)}"` + (onSite ? ` data-print-url="${esc(publicUrl(url, ctx))}"` : '')
}

function figure(img: PlainImage, ctx: Ctx): string {
  const loading = ctx.eagerUsed ? ' loading="lazy"' : ''
  ctx.eagerUsed = true
  let el = `<img src="${esc(img.src)}" alt="${esc(img.alt)}"${sizeAttrs(img)}${loading} decoding="async" />`
  if (img.href) el = `<a href="${esc(img.href)}">${el}</a>`
  const cap = img.caption ? `<figcaption>${esc(img.caption)}</figcaption>` : ''
  return `<figure>${el}${cap}</figure>\n`
}

const VIDEO_TYPES: Record<string, string> = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime' }

function videoFigure(video: Video | undefined, ctx: Ctx): string {
  const v = typeof video === 'string' ? { src: video } : video
  if (!v || blank(v.src)) return ''
  const src = resolveUrl(v.src, ctx.base)
  const posterFile = blank(v.poster) ? null : localFile(v.poster!.trim(), ctx)
  const poster = blank(v.poster) ? '' : ` poster="${esc(resolveUrl(v.poster!, ctx.base))}"`
  const size = posterFile ? imageSize(posterFile) : null
  const type = VIDEO_TYPES[path.extname(v.src.trim()).toLowerCase()]
  const caption = v.caption?.trim() ?? ''
  // On paper the video is replaced by its poster and its URL (print-only).
  const stillAlt = caption ? `Still from the video: ${caption}` : 'Still from the video'
  const printPoster = blank(v.poster)
    ? ''
    : `<img class="print-only" src="${esc(resolveUrl(v.poster!, ctx.base))}" alt="${esc(stillAlt)}"${sizeAttrs(size ?? {})} />`
  // controls + no autoplay: nothing moves or makes noise until the visitor asks.
  return (
    `<figure>` +
    `<video controls playsinline preload="metadata"${poster}${sizeAttrs(size ?? {})}` +
    `${caption ? ` aria-label="${esc(caption)}"` : ''}>` +
    `<source src="${esc(src)}"${type ? ` type="${type}"` : ''} />` +
    `<a href="${esc(src)}">Download the video</a></video>` +
    printPoster +
    `<p class="print-only">Video: ${esc(publicUrl(v.src, ctx))}</p>` +
    (caption ? `<figcaption>${esc(caption)}</figcaption>` : '') +
    `</figure>\n`
  )
}

// ── Links ────────────────────────────────────────────────────────────────────

const realLinks = (links?: LinkItem[]) =>
  (links ?? []).filter((l) => !blank(l.url) && !blank(l.label) && !PLACEHOLDER_URL.test(l.url))

function linkList(links: LinkItem[] | undefined, ctx: Ctx): string {
  const list = realLinks(links)
  if (!list.length) return ''
  const items = list.map((l) => `<li><a ${hrefAttrs(l.url, ctx)}>${esc(l.label)}</a></li>`)
  return `<ul class="links">${items.join('')}</ul>\n`
}

// ── Sections ─────────────────────────────────────────────────────────────────

function field(heading: string, text: string | undefined): string {
  return blank(text) ? '' : `<h4>${heading}</h4>\n${prose(text)}`
}

/** A project's tags as one quiet line — the 3D cards show them as chips. */
function tagLine(p: Project): string {
  const tags = (p.tags ?? []).map((t) => t.trim()).filter(Boolean)
  return tags.length ? `<p class="tags">${tags.map(esc).join(' · ')}</p>` : ''
}

/** The intro's portrait: the About deck's hero image, using its small `thumb`. */
function portrait(content: SiteContent, o: PlainPageOptions): string {
  const hero = island(content, 'about')?.content.slides?.find((s) => s.hero && s.image)
  if (!hero?.image) return ''
  const img = typeof hero.image === 'string' ? { src: hero.image } : hero.image
  const src = (blank(img.thumb) ? img.src : img.thumb!).trim()
  if (blank(src) || blank(img.alt)) return ''
  const file = localFile(src, o)
  const size = file ? imageSize(file) : null
  return `<img class="portrait" src="${esc(resolveUrl(src, o.base))}" alt="${esc(img.alt!.trim())}"${sizeAttrs(size ?? {})} />`
}

function renderProject(p: Project, ctx: Ctx): string {
  const decisions = (p.decisions ?? []).filter((d) => !blank(d.question) && !blank(d.answer))
  const evidence = plainImages(p.images, ctx).map((img) => figure(img, ctx)).join('') + videoFigure(p.video, ctx)

  return [
    `<article class="project" id="${esc(anchorOf(p))}">`,
    `<h3>${lines(p.name)}</h3>`,
    blank(p.date) ? '' : `<p class="date">${esc(p.date!.trim())}</p>`,
    tagLine(p),
    blank(p.summary) ? '' : `<p class="summary">${esc(p.summary!.trim())}</p>`,
    prose(p.description),
    field('Problem', p.problem),
    field('The hard part', p.hardPart),
    field('My scope', p.scope),
    decisions.length
      ? `<h4>Design decisions</h4>\n` + decisions.map((d) => `<h5>${esc(d.question.trim())}</h5>\n${prose(d.answer)}`).join('')
      : '',
    evidence ? `<h4>Evidence</h4>\n${evidence}` : '',
    field('Results', p.results),
    field('Rev 2', p.rev2),
    linkList(p.links, ctx),
    `</article>`,
  ]
    .filter(Boolean)
    .join('\n')
}

function renderRole(p: Project, ctx: Ctx): string {
  return [
    `<article class="role" id="${esc(anchorOf(p))}">`,
    `<h3>${lines(p.name)}</h3>`,
    blank(p.date) ? '' : `<p class="date">${esc(p.date!.trim())}</p>`,
    tagLine(p),
    blank(p.summary) ? '' : `<p class="summary">${esc(p.summary!.trim())}</p>`,
    prose(p.description),
    linkList(p.links, ctx),
    `</article>`,
  ]
    .filter(Boolean)
    .join('\n')
}

function renderAbout(content: SiteContent, ctx: Ctx): string {
  const slides = (island(content, 'about')?.content.slides ?? []).filter(
    (s) => s.only !== '3d' && !blank(s.title),
  )
  const honors = island(content, 'honors')?.content.projects ?? []
  const docs = (island(content, 'resources')?.content.groups ?? []).flatMap((g) => realLinks(g.links))

  return [
    ...slides.map((s) => `<h3>${esc(s.title!.trim())}</h3>\n${(s.body ?? []).map((b) => prose(b)).join('')}`),
    honors.length
      ? `<h3>Honors</h3>\n<ul class="honors">` +
        honors
          .map((h) => `<li>${lines(h.name)}${blank(h.date) ? '' : ` <span class="date">${esc(h.date!.trim())}</span>`}</li>`)
          .join('') +
        `</ul>`
      : '',
    docs.length ? `<h3>Documents</h3>\n${linkList(docs, ctx)}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

/** The page body: intro, Projects, Experience, About, footer. */
export function renderPlainBody(content: SiteContent, o: PlainPageOptions): string {
  const ctx: Ctx = { ...o, siteUrl: content.siteUrl, eagerUsed: false }
  const url = (u: string) => esc(resolveUrl(u, o.base))
  const projects = plainProjects(content)
  const roles = island(content, 'experience')?.content.projects ?? []
  // ?view=3d: phones are otherwise sent straight back here (see src/main.tsx).
  const home = esc(`${o.base}?view=3d`)

  return `
<header class="intro">
<p class="notice screen-only" id="fallback-notice" hidden>${esc(content.plainPage.fallbackNotice)}</p>
<script>
  // Shown only when the 3D world sent the visitor here because it couldn't start.
  if (new URLSearchParams(location.search).get('reason') === 'webgl')
    document.getElementById('fallback-notice').hidden = false
</script>
<div class="intro__head">
<div>
<h1>${esc(content.fullName)}</h1>
<p class="lede">${esc(content.oneLiner)}</p>
${blank(content.tagline) ? '' : `<p class="tagline">${esc(content.tagline)}</p>`}
</div>
${portrait(content, o)}
</div>
<ul class="contact">
<li><a href="${url(content.contact.email)}">${esc(content.contact.email)}</a></li>
<li><a href="${url(content.contact.github)}">GitHub</a></li>
<li><a href="${url(content.contact.linkedin)}">LinkedIn</a></li>
<li><a ${hrefAttrs(content.resumeUrl, ctx)}>Résumé (PDF)</a></li>
</ul>
<nav class="toc screen-only" aria-label="On this page">
<a href="#projects">Projects</a>
<a href="#experience">Experience</a>
<a href="#about">About</a>
<a href="${home}">3D world</a>
</nav>
</header>

<main>
<section id="projects" aria-labelledby="projects-heading">
<h2 id="projects-heading">Projects</h2>
<ul class="index screen-only">
${projects.map((p) => `<li><a href="#${esc(anchorOf(p))}">${lines(p.name)}</a></li>`).join('\n')}
</ul>
${projects.map((p) => renderProject(p, ctx)).join('\n\n')}
</section>

<section id="experience" aria-labelledby="experience-heading">
<h2 id="experience-heading">Experience</h2>
${roles.map((p) => renderRole(p, ctx)).join('\n\n')}
</section>

<section id="about" aria-labelledby="about-heading">
<h2 id="about-heading">About</h2>
${renderAbout(content, ctx)}
</section>
</main>

<footer class="screen-only">
<p><a href="${home}">Back to the 3D world</a></p>
<p>© ${esc(content.fullName)}</p>
</footer>
`
}

// ── What's left to write ─────────────────────────────────────────────────────

/** "1-3, 5" from [1, 2, 3, 5]. */
function ranges(nums: number[]): string {
  const out: string[] = []
  for (let i = 0; i < nums.length; i++) {
    let j = i
    while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++
    out.push(j > i ? `${nums[i]}-${nums[j]}` : `${nums[i]}`)
    i = j
  }
  return out.join(', ')
}

/** One entry per plain-page project with blank fields: [anchor, the blank fields]. */
export function emptyFields(content: SiteContent): [string, string[]][] {
  const rows: [string, string[]][] = []
  for (const p of plainProjects(content)) {
    const missing: string[] = []
    const need = (key: keyof Project) => {
      if (blank(p[key] as string | undefined)) missing.push(key)
    }

    need('summary')
    need('problem')
    need('hardPart')
    need('scope')

    const unanswered = (p.decisions ?? []).flatMap((d, i) => (blank(d.answer) ? [i + 1] : []))
    if (!p.decisions?.length) missing.push('decisions')
    else if (unanswered.length) missing.push(`decisions ${ranges(unanswered)} (answer)`)

    const images = (p.images ?? []).map((m) => (typeof m === 'string' ? { src: m } : m)).filter((m) => !blank(m.src))
    const video = typeof p.video === 'string' ? { src: p.video } : p.video
    if (!images.length && blank(video?.src)) missing.push('evidence (images / video)')
    const standIn = images.flatMap((m, i) => (blank(m.alt) && !blank(m.caption) ? [i + 1] : []))
    const hidden = images.flatMap((m, i) => (blank(m.alt) && blank(m.caption) ? [i + 1] : []))
    if (standIn.length) missing.push(`images ${ranges(standIn)} (alt; caption stands in)`)
    if (hidden.length) missing.push(`images ${ranges(hidden)} (alt; hidden until written)`)
    if (video && !blank(video.src) && blank(video.poster)) missing.push('video (poster)')

    need('results')
    need('rev2')

    const placeholders = (p.links ?? []).flatMap((l, i) => (PLACEHOLDER_URL.test(l.url) ? [i + 1] : []))
    if (placeholders.length) missing.push(`links ${ranges(placeholders)} (placeholder URL, hidden)`)
    else if (!realLinks(p.links).length) missing.push('links')

    if (missing.length) rows.push([anchorOf(p), missing])
  }
  return rows
}
