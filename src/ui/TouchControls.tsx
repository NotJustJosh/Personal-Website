import { useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useGame } from '../store'
import { touchInput } from '../lib/touch'
import { PLAIN_PAGE } from '../lib/fallback'

// ─────────────────────────────────────────────────────────────────────────────
//  On-screen controls for touch screens (App.tsx only mounts them there):
//    • right: a see-through joystick to walk (analog — push further to go faster)
//    • left:  Jump, and Select (the E key: open whatever you're standing at)
//    • dragging anywhere else on the world looks around (CameraRig.tsx)
//  They write to `touchInput`, which the Player reads every frame. Panels open
//  above them (higher z-index), so they never get in the way of reading.
//
//  Plus RotatePrompt: the world needs a landscape screen, so in portrait a
//  full-screen card asks you to turn the phone (or skip to the plain page).
// ─────────────────────────────────────────────────────────────────────────────

/** Fraction of the joystick's reach that's ignored, so a resting thumb doesn't creep. */
const DEAD_ZONE = 0.12

function Joystick() {
  const base = useRef<HTMLDivElement>(null)
  const knob = useRef<HTMLDivElement>(null)
  const finger = useRef<number | null>(null)

  const release = () => {
    finger.current = null
    touchInput.moveX = 0
    touchInput.moveY = 0
    if (knob.current) knob.current.style.transform = ''
  }
  // Never leave the player walking if the controls unmount mid-push.
  useEffect(() => release, [])

  const steer = (e: ReactPointerEvent) => {
    const el = base.current
    if (!el || e.pointerId !== finger.current) return
    const r = el.getBoundingClientRect()
    const reach = r.width / 2
    let dx = (e.clientX - (r.left + reach)) / reach
    let dy = (e.clientY - (r.top + reach)) / reach
    const len = Math.hypot(dx, dy)
    if (len > 1) {
      // Clamp to the rim: the knob stops there, full speed.
      dx /= len
      dy /= len
    }
    const mag = Math.min(len, 1)
    if (knob.current) knob.current.style.transform = `translate(${dx * reach * 0.6}px, ${dy * reach * 0.6}px)`
    // Past the dead zone, rescale so the response still starts from zero.
    const k = mag < DEAD_ZONE ? 0 : (mag - DEAD_ZONE) / (1 - DEAD_ZONE) / mag
    touchInput.moveX = dx * k
    touchInput.moveY = -dy * k // screen up = walk forward
  }

  return (
    <div
      ref={base}
      className="touch-stick"
      role="presentation"
      onPointerDown={(e) => {
        if (finger.current !== null) return
        finger.current = e.pointerId
        e.currentTarget.setPointerCapture(e.pointerId)
        steer(e)
      }}
      onPointerMove={steer}
      onPointerUp={(e) => e.pointerId === finger.current && release()}
      onPointerCancel={(e) => e.pointerId === finger.current && release()}
    >
      <div ref={knob} className="touch-stick__knob" />
    </div>
  )
}

function JumpButton() {
  const set = (down: boolean) => (e: ReactPointerEvent) => {
    if (down) e.currentTarget.setPointerCapture(e.pointerId)
    touchInput.jump = down
  }
  useEffect(
    () => () => {
      touchInput.jump = false
    },
    [],
  )
  return (
    <button
      type="button"
      className="touch-btn"
      onPointerDown={set(true)}
      onPointerUp={set(false)}
      onPointerCancel={set(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      Jump
    </button>
  )
}

function SelectButton() {
  // Dimmed when there's nothing in reach to open.
  const canSelect = useGame((s) => !s.openPanel && !!(s.nearbyItem || s.nearbyIsland))
  return (
    <button
      type="button"
      className={`touch-btn${canSelect ? '' : ' is-idle'}`}
      onPointerDown={() => useGame.getState().interact()}
      onContextMenu={(e) => e.preventDefault()}
    >
      Select
    </button>
  )
}

export function TouchControls() {
  return (
    <div className="touch">
      <div className="touch__buttons">
        <JumpButton />
        <SelectButton />
      </div>
      <Joystick />
    </div>
  )
}

/** Portrait on a touch screen: ask for landscape (CSS shows it only in portrait). */
export function RotatePrompt() {
  return (
    <div className="rotate" role="dialog" aria-label="Turn your phone sideways">
      <div className="rotate__phone" aria-hidden="true" />
      <p className="rotate__title">Turn your phone sideways</p>
      <p className="rotate__line">The 3D world needs a landscape screen.</p>
      <a className="btn btn--ghost" href={PLAIN_PAGE}>
        Or skip to projects
      </a>
    </div>
  )
}
