import { useEffect } from 'react'
import { useGame } from '../store'

// Global one-shot key handling that lives outside the 3D canvas:
//   • E      → open the panel for the island you're standing on
//   • Escape → close the open panel
// (Held movement keys are handled separately in useMovementKeys.)
export function InputManager() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') {
        useGame.getState().interact()
      } else if (e.code === 'Escape') {
        // Free the cursor (browsers also do this natively on physical Esc) and
        // close any open panel.
        if (document.pointerLockElement) document.exitPointerLock()
        const { openPanel, closePanel } = useGame.getState()
        if (openPanel) closePanel()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return null
}
