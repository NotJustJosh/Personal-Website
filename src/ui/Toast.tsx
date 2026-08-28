import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { create } from 'zustand'

// ─────────────────────────────────────────────────────────────────────────────
//  A tiny transient notification ("Copied …"). Its own store rather than part of
//  useGame: this never crosses the DOM↔Canvas boundary, it's purely UI.
//
//  Call it from anywhere:  useToast.getState().show('Copied!')
//  <Toast /> is mounted once per view in App.tsx (3D and Classic both).
// ─────────────────────────────────────────────────────────────────────────────

const VISIBLE_MS = 2600

interface ToastState {
  message: string | null
  /** Bumped on every show() so repeat clicks restart the timer + animation. */
  nonce: number
  show: (message: string) => void
  clear: () => void
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  nonce: 0,
  show: (message) => set((s) => ({ message, nonce: s.nonce + 1 })),
  clear: () => set({ message: null }),
}))

export function Toast() {
  const message = useToast((s) => s.message)
  const nonce = useToast((s) => s.nonce)
  const clear = useToast((s) => s.clear)

  useEffect(() => {
    if (!message) return
    const id = setTimeout(clear, VISIBLE_MS)
    return () => clearTimeout(id)
  }, [message, nonce, clear])

  if (!message) return null

  return createPortal(
    // key={nonce} remounts the node so the slide-in animation replays.
    <div key={nonce} className="toast" role="status" aria-live="polite">
      {message}
    </div>,
    document.body,
  )
}
