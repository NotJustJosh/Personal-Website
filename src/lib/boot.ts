// ─────────────────────────────────────────────────────────────────────────────
//  The loading screen (#boot) is plain HTML baked into index.html at build
//  time — name, contact links, "Skip to projects" and a progress bar — so it's
//  readable before any JavaScript arrives. These helpers let the app drive it
//  once it's running: fill the bar, then fade it out when the world is ready.
//  All of them do nothing if #boot isn't on the page.
// ─────────────────────────────────────────────────────────────────────────────

/** Matches the fade duration on .boot--done in index.html. */
const FADE_MS = 700

const boot = () => document.getElementById('boot')

/** Show it again (e.g. entering the 3D world from Classic view). */
export function showBoot() {
  const el = boot()
  if (!el) return
  el.hidden = false
  el.classList.remove('boot--done')
  el.removeAttribute('aria-hidden')
}

export function setBootProgress(percent: number) {
  const el = boot()
  if (!el) return
  const fill = el.querySelector<HTMLElement>('.boot__fill')
  if (fill) fill.style.width = `${percent}%`
  el.querySelector('[role="progressbar"]')?.setAttribute('aria-valuenow', String(Math.round(percent)))
}

/** Replace the "Loading the 3D world…" line, e.g. when the bundle fails to load. */
export function setBootStatus(text: string) {
  const status = boot()?.querySelector('.boot__status')
  if (status) status.textContent = text
}

/** Fade out, then hide. Returns a cancel function (for effect cleanup). */
export function finishBoot(): () => void {
  const el = boot()
  if (!el) return () => {}
  el.classList.add('boot--done')
  el.setAttribute('aria-hidden', 'true')
  const t = setTimeout(() => (el.hidden = true), FADE_MS)
  return () => clearTimeout(t)
}

/** Hide immediately (Classic view has no loading phase). */
export function hideBoot() {
  const el = boot()
  if (el) el.hidden = true
}
