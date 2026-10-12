// ─────────────────────────────────────────────────────────────────────────────
//  End-to-end checks on the PRODUCTION build:  npm run smoke
//
//  Builds the site, serves dist/ with `vite preview`, and drives the Chrome
//  installed on this machine (playwright-core — no browser download). The
//  browser runs with every hostname except localhost made unresolvable, so the
//  whole run is effectively offline: any request to another site fails and is
//  reported. Screenshots and a print-to-PDF land in smoke-output/.
//
//  SMOKE_BROWSER=msedge npm run smoke   — use Edge instead of Chrome.
// ─────────────────────────────────────────────────────────────────────────────

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { preview } from 'vite'
import { chromium, devices } from 'playwright-core'

const ROOT = path.resolve(import.meta.dirname, '..')
const DIST = path.join(ROOT, 'dist')
const OUT = path.join(ROOT, 'smoke-output')
const PORT = 4179
const NAME = 'Joshua Yuen'

let failures = 0
function check(name, ok, detail = '') {
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`)
}
const section = (title) => console.log(`\n── ${title}`)

fs.mkdirSync(OUT, { recursive: true })

// ── 1. Build, and the blank-field report ─────────────────────────────────────
section('Build')
const build = spawnSync('npm run build', { cwd: ROOT, shell: true, encoding: 'utf8' })
check('npm run build succeeds', build.status === 0, build.status === 0 ? '' : build.stderr.slice(-400))
if (build.status !== 0) process.exit(1)
const report = build.stdout.split('\n').filter((l) => /^Plain page:|^ {2}\S/.test(l))
check('build prints the blank-field list', report.length > 0, report[0])

// ── 2. The raw HTML, before any JavaScript ───────────────────────────────────
section('Built HTML source')
const home = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
const meta = (attr, key) => home.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`))?.[1] ?? ''
check('index.html <title> has the name', home.match(/<title>([^<]*)<\/title>/)?.[1].includes(NAME))
check('index.html meta description', meta('name', 'description').length > 40, meta('name', 'description'))
for (const k of ['og:title', 'og:description', 'og:url', 'og:image']) {
  check(`index.html ${k}`, meta('property', k).length > 0, meta('property', k))
}
check('index.html og:title has the name', meta('property', 'og:title').includes(NAME))
check('index.html twitter:card', meta('name', 'twitter:card') === 'summary_large_image')
const boot = home.match(/<div id="boot"[\s\S]*?<div id="root">/)?.[0] ?? ''
check('static intro has the name', boot.includes(`>${NAME}<`))
for (const [what, re] of [
  ['résumé', /href="[^"]*resume\.pdf"/],
  ['GitHub', /href="https:\/\/github\.com\//],
  ['LinkedIn', /href="https:\/\/www\.linkedin\.com\//],
  ['email', /href="mailto:/],
  ['plain page', /href="[^"]*projects\/"/],
]) {
  check(`static intro links to ${what}`, re.test(boot))
}
check('viewport allows zoom', !/user-scalable=no|maximum-scale/.test(home))

const plain = fs.readFileSync(path.join(DIST, 'projects', 'index.html'), 'utf8')
check('projects/ has its own title + OG tags', /<title>[^<]*Projects[^<]*<\/title>/.test(plain) && /og:url" content="[^"]*projects\/"/.test(plain))
check('projects/ references no script file', !/<script[^>]+src=/.test(plain))
check('every project has an anchor id', ['gloves', 'lab', 'rov'].every((id) => plain.includes(`<article class="project" id="${id}">`)))
// Blank fields: no heading that's immediately followed by another heading or the end.
const orphan = plain.match(/<h[45]>[^<]*<\/h[45]>\s*(?=<h[2-5]|<\/article>|<\/section>)/g)
check('no heading renders without content under it', !orphan, orphan?.join(' '))
const gloves = plain.match(/<article class="project" id="gloves">[\s\S]*?<\/article>/)?.[0] ?? ''
check('gloves: blank Problem / Results / Rev 2 are not rendered', !/<h4>(Problem|Results|Rev 2|The hard part)<\/h4>/.test(gloves))
check('gloves: unanswered design questions are not rendered', !gloves.includes('Why I2C rather than SPI?') && !gloves.includes('<h5>'))
check('gloves: filled-in scope is rendered', gloves.includes('<h4>My scope</h4>'))

// ── 3. In the browser, offline ───────────────────────────────────────────────
const server = await preview({ root: ROOT, logLevel: 'silent', preview: { port: PORT, strictPort: true } })
const BASE = `http://localhost:${PORT}/Personal-Website/`
const browser = await chromium.launch({
  channel: process.env.SMOKE_BROWSER ?? 'chrome',
  // No DNS for anything but localhost = no network for this browser.
  args: ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost', '--enable-gpu'],
})

/** A context that records (and blocks) any request leaving localhost. */
async function offlineContext(options = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 850 }, ...options })
  ctx.external = []
  await ctx.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (url.hostname === 'localhost' || url.protocol === 'blob:' || url.protocol === 'data:') return route.continue()
    ctx.external.push(url.href)
    return route.abort('internetdisconnected')
  })
  return ctx
}

function watch(page) {
  const seen = { requests: [], errors: [] }
  page.on('request', (r) => seen.requests.push(r.url()))
  page.on('pageerror', (e) => seen.errors.push(e.message.slice(0, 160)))
  page.on('requestfailed', (r) => seen.errors.push(`request failed: ${r.url()} ${r.failure()?.errorText}`))
  return seen
}

const focused = (page) =>
  page.evaluate(() => {
    const a = document.activeElement
    const cs = getComputedStyle(a)
    return { text: a?.textContent?.trim(), focusVisible: a.matches(':focus-visible'), outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2 }
  })

section('3D world (offline)')
{
  const ctx = await offlineContext()
  const page = await ctx.newPage()
  const seen = watch(page)
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  check('loading screen shows the name + skip control', (await page.isVisible('#boot .boot__name')) && (await page.isVisible('#boot .boot__skip')))
  await page.screenshot({ path: path.join(OUT, '3d-loading-screen.png') })
  await page.keyboard.press('Tab')
  const f1 = await focused(page)
  check('loading screen: first Tab reaches "Skip to projects" with a visible focus ring', f1.text === 'Skip to projects' && f1.focusVisible && f1.outline, JSON.stringify(f1))

  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#boot', { state: 'hidden', timeout: 60000 })
  check('loading screen gives way once the scene is ready', true)
  check('scene shows a persistent "Skip to projects"', await page.isVisible('.skip-link'))
  await page.keyboard.press('Tab')
  const f2 = await focused(page)
  check('scene: first Tab reaches "Skip to projects" with a visible focus ring', f2.text === 'Skip to projects' && f2.focusVisible && f2.outline, JSON.stringify(f2))
  const onTop = await page.evaluate(() => {
    const r = document.querySelector('.skip-link').getBoundingClientRect()
    return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('.skip-link') !== null
  })
  check('scene skip link sits above the open About panel', onTop && (await page.isVisible('.panel')))
  await page.screenshot({ path: path.join(OUT, '3d-scene-skip-focus.png') })

  // Walk the world a bit so island assets (cover images, labels) load too.
  await page.keyboard.press('Escape')
  for (const label of ['Projects', 'Experience', 'Honors', 'Contact', 'Resources']) {
    await page.click('text=Fast travel')
    await page.click(`.fasttravel__item:has-text("${label}")`)
    await page.waitForTimeout(2500)
  }
  await page.screenshot({ path: path.join(OUT, '3d-offline-after-travel.png') })
  check('canvas keeps touch-action: none', (await page.$eval('canvas', (c) => getComputedStyle(c).touchAction)) === 'none')

  await page.evaluate(() => document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext())
  check('losing the WebGL context surfaces a notice by the skip link', await page.waitForSelector('.skip__notice', { timeout: 5000 }).then(() => true, () => false))

  check('3D world: no requests to other sites', ctx.external.length === 0, ctx.external.join(', '))
  check('3D world: no page errors or failed requests', seen.errors.length === 0, seen.errors.join(' | '))
  await ctx.close()
}

section('Plain page (offline)')
{
  const ctx = await offlineContext()
  const page = await ctx.newPage()
  const seen = watch(page)
  await page.goto(BASE + 'projects/', { waitUntil: 'networkidle' })
  // Scroll through so every lazy image is requested.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 60))
    }
  })
  await page.waitForLoadState('networkidle')
  const local = seen.requests.map((u) => new URL(u).pathname)
  const heavy = local.filter((p) => /\.(js|mjs|glb|gltf|wasm|woff2?)$|\/(models|textures|fonts|draco)\//.test(p))
  check('projects/ requests no JS, models, textures or fonts', heavy.length === 0, heavy.join(', '))
  const broken = await page.$$eval('img', (imgs) => imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src))
  check('projects/ every image loads', broken.length === 0, broken.join(', '))
  const sized = await page.$$eval('img:not(.print-only)', (imgs) => imgs.every((i) => i.getAttribute('width') && i.getAttribute('height') && i.alt))
  check('projects/ images have width, height and alt', sized)
  check('projects/ shows no fallback notice when visited directly', await page.isHidden('#fallback-notice'))
  check('plain page: no requests to other sites', ctx.external.length === 0, ctx.external.join(', '))
  check('plain page: no page errors or failed requests', seen.errors.length === 0, seen.errors.join(' | '))
  const names = [...new Set(local.map((p) => p.split('/').slice(-1)[0] || 'projects/'))]
  console.log(`      (${local.length} requests: ${names.join(', ')})`)

  section('Print')
  await page.emulateMedia({ media: 'print' })
  const print = await page.evaluate(() => {
    const cs = (sel, pseudo) => getComputedStyle(document.querySelector(sel), pseudo)
    const projects = document.querySelectorAll('.project')
    return {
      bg: cs('body').backgroundColor,
      color: cs('body').color,
      navHidden: cs('nav.toc').display === 'none' && cs('footer').display === 'none',
      breakBefore: getComputedStyle(projects[1]).breakBefore,
      figure: cs('figure').breakInside,
      linkUrl: getComputedStyle(document.querySelector('.contact a[href^="https://github.com"]'), '::after').content,
      resumeUrl: getComputedStyle(document.querySelector('.contact a[data-print-url]'), '::after').content,
    }
  })
  check('print: white background, black text', print.bg === 'rgb(255, 255, 255)' && print.color === 'rgb(0, 0, 0)', `${print.bg} / ${print.color}`)
  check('print: nav and 3D links hidden', print.navHidden)
  check('print: each project starts a new page', print.breakBefore === 'page')
  check('print: figures never split', print.figure === 'avoid')
  check('print: external link URLs written out', print.linkUrl.includes('https://github.com/'), print.linkUrl)
  check('print: on-site files print their public URL', print.resumeUrl.includes('notjustjosh.github.io'), print.resumeUrl)
  const pdf = path.join(OUT, 'projects-print.pdf')
  await page.pdf({ path: pdf, format: 'Letter', preferCSSPageSize: true })
  const pages = (fs.readFileSync(pdf, 'latin1').match(/\/Type\s*\/Page(?!s)/g) ?? []).length
  check('print: PDF written', pages > 0, `${pages} pages → smoke-output/projects-print.pdf`)
  await ctx.close()
}

section('Fallback')
{
  const ctx = await offlineContext()
  const page = await ctx.newPage()
  const seen = watch(page)
  await page.goto(BASE + '?nowebgl=1')
  await page.waitForURL(/projects\/\?reason=webgl$/, { timeout: 15000 }).catch(() => {})
  check('?nowebgl=1 lands on projects/?reason=webgl', page.url().endsWith('projects/?reason=webgl'), page.url())
  check('…with the one-line notice', (await page.isVisible('#fallback-notice')) && (await page.textContent('#fallback-notice')).includes("couldn't start"))
  check('…without downloading the 3D bundle', !seen.requests.some((u) => /\/assets\/start-[^/]*\.js$/.test(u)))
  await page.screenshot({ path: path.join(OUT, 'fallback-notice.png') })
  await ctx.close()
}
{
  // WebGL 2 is there, but creating the renderer's context fails.
  const ctx = await offlineContext()
  await ctx.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, attrs, ...rest) {
      // Only the renderer passes context attributes; capability checks don't.
      if (type === 'webgl2' && attrs && 'powerPreference' in attrs) return null
      return getContext.call(this, type, attrs, ...rest)
    }
  })
  const page = await ctx.newPage()
  await page.goto(BASE)
  await page.waitForURL(/reason=webgl/, { timeout: 30000 }).catch(() => {})
  check('a renderer that throws on creation also lands on the plain page', page.url().endsWith('projects/?reason=webgl'), page.url())
  await ctx.close()
}

section('Phone (Pixel 7 emulation)')
{
  /** Two fingers spreading apart at (x, y); returns the resulting page zoom. */
  async function spread(page, x, y) {
    const cdp = await page.context().newCDPSession(page)
    const pts = (d) => [{ x: x - d, y, id: 0 }, { x: x + d, y, id: 1 }]
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts(20) })
    for (let d = 24; d <= 140; d += 4) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts(d) })
      await page.waitForTimeout(16)
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await page.waitForTimeout(500)
    return page.evaluate(() => visualViewport.scale)
  }

  const ctx = await offlineContext({ ...devices['Pixel 7'] })
  const page = await ctx.newPage()
  await page.goto(BASE + 'projects/')
  const zoom = await spread(page, 200, 350)
  check('plain page: pinch-zoom works', zoom > 1.2, `scale ${zoom.toFixed(2)}`)

  await page.goto(BASE)
  await page.waitForSelector('.classic', { timeout: 30000 })
  check('phones still get the Classic view, loading screen cleared', await page.isHidden('#boot'))
  await page.click('text=Enter 3D world')
  await page.waitForSelector('#boot', { state: 'hidden', timeout: 60000 })
  await page.keyboard.press('Escape')
  const box = await page.$eval('canvas', (c) => {
    const r = c.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height * 0.8 }
  })
  await page.evaluate(() => {
    window.__touches = 0
    document.querySelector('canvas').addEventListener('pointerdown', () => window.__touches++)
  })
  const canvasZoom = await spread(page, box.x, box.y)
  const touches = await page.evaluate(() => window.__touches)
  check('3D canvas: a pinch reaches the scene instead of zooming the page', canvasZoom === 1 && touches >= 2, `scale ${canvasZoom}, ${touches} pointers on the canvas`)
  await page.screenshot({ path: path.join(OUT, 'phone-3d.png') })
  await ctx.close()
}

await browser.close()
await new Promise((r) => server.httpServer.close(r))

console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed.')
process.exit(failures ? 1 : 0)
