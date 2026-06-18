import { content } from '../content'
import { useGame } from '../store'

// Heads-up display: a persistent controls legend plus the "Press E" prompt that
// appears when the player is standing inside an interactable zone.
export function Hud() {
  const nearbyZone = useGame((s) => s.nearbyZone)
  const openPanel = useGame((s) => s.openPanel)
  const zone = nearbyZone ? content.zones.find((z) => z.id === nearbyZone) : null

  return (
    <>
      <div className="controls">
        <span>
          <kbd>W</kbd>
          <kbd>A</kbd>
          <kbd>S</kbd>
          <kbd>D</kbd> move
        </span>
        <span>
          <kbd>Space</kbd> jump
        </span>
        <span>drag to look · scroll to zoom</span>
        <span>
          <kbd>E</kbd> interact
        </span>
      </div>

      {zone && !openPanel && (
        <div className="prompt">
          Press <kbd>E</kbd> to open <strong>{zone.label}</strong>
        </div>
      )}
    </>
  )
}
