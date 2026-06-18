import { useEffect } from 'react'
import { useGame } from '../store'

// Global one-shot key handling that lives outside the 3D canvas:
//   • E      → open the panel for the zone you're standing in
//   • Escape → close the open panel
// (Held movement keys are handled separately in useMovementKeys.)
export function InputManager() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') {
        const { openPanel, nearbyZone, openSection } = useGame.getState()
        if (!openPanel && nearbyZone) openSection(nearbyZone)
      } else if (e.code === 'Escape') {
        const { openPanel, closePanel } = useGame.getState()
        if (openPanel) closePanel()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return null
}
