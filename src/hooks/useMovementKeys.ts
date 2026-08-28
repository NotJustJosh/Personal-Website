import { useEffect, useRef } from 'react'

// Held-key movement state, read every frame by the Player. We use a ref (not
// React state) so that key changes never trigger re-renders — the physics loop
// just reads the latest values directly.

export interface MovementKeys {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  jump: boolean
}

// Map both WASD and arrow keys onto movement intents.
const KEY_MAP: Record<string, keyof MovementKeys> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'backward',
  ArrowDown: 'backward',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  Space: 'jump',
}

export function useMovementKeys() {
  const keys = useRef<MovementKeys>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  })

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const intent = KEY_MAP[e.code]
      if (!intent) return
      // Stop the spacebar from scrolling the page.
      if (e.code === 'Space') e.preventDefault()
      keys.current[intent] = true
    }
    const onUp = (e: KeyboardEvent) => {
      const intent = KEY_MAP[e.code]
      if (intent) keys.current[intent] = false
    }
    // Reset everything if the window loses focus (prevents "stuck" keys).
    const onBlur = () => {
      keys.current = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
      }
    }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  return keys
}
