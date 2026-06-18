import { useGame } from '../store'
import { getIsland, islandItems } from '../lib/world'

function truncate(s: string, max = 48): string {
  return s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s
}

// Heads-up display: a persistent controls legend plus the "Press E" prompt that
// appears when the player is on an island (or next to one of its orbiting items).
export function Hud() {
  const nearbyIsland = useGame((s) => s.nearbyIsland)
  const nearbyItem = useGame((s) => s.nearbyItem)
  const openPanel = useGame((s) => s.openPanel)

  const island = nearbyIsland ? getIsland(nearbyIsland) : null

  // Prefer the specific orbiting item's label, falling back to the island label.
  let promptLabel: string | null = island ? island.label : null
  if (nearbyItem) {
    const isl = getIsland(nearbyItem.islandId)
    const item = isl ? islandItems(isl)[nearbyItem.index] : undefined
    if (item) promptLabel = truncate(item.label)
  }

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
          <kbd>Shift</kbd> sprint
        </span>
        <span>
          <kbd>Space</kbd> jump ×2
        </span>
        <span>click to look · scroll to zoom</span>
        <span>
          <kbd>E</kbd> interact
        </span>
        <span>
          <kbd>Esc</kbd> free cursor
        </span>
      </div>

      {promptLabel && !openPanel && (
        <div className="prompt">
          Press <kbd>E</kbd> to open <strong>{promptLabel}</strong>
        </div>
      )}
    </>
  )
}
