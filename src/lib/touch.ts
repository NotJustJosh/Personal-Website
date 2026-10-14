import { useEffect, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
//  Touch-screen play. The on-screen controls (ui/TouchControls.tsx) write the
//  live state below; the Player reads it every frame alongside the keyboard,
//  the same way it reads useMovementKeys. A plain mutable object rather than
//  React state, so a moving thumb never triggers a re-render.
// ─────────────────────────────────────────────────────────────────────────────

export const touchInput = {
  /** Joystick, camera-relative: x = right (+) / left (−), y = forward (+) /
   *  back (−). The vector's length is 0–1, so a light push walks slowly. */
  moveX: 0,
  moveY: 0,
  /** Held while the Jump button is pressed. */
  jump: false,
}

/** A finger is the primary pointer — a phone or tablet (or DevTools' device mode). */
const COARSE = '(pointer: coarse)'

export function isTouchScreen(): boolean {
  return window.matchMedia?.(COARSE).matches ?? false
}

/** `isTouchScreen`, kept current (DevTools can switch it on and off live). */
export function useTouchScreen(): boolean {
  const [touch, setTouch] = useState(isTouchScreen)
  useEffect(() => {
    const mq = window.matchMedia?.(COARSE)
    if (!mq) return
    const onChange = (e: MediaQueryListEvent) => setTouch(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return touch
}
