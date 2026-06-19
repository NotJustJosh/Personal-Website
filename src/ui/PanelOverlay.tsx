import { useGame } from '../store'
import { getIsland, islandPanel, islandItems } from '../lib/world'
import { Panel } from './Panel'

// Renders the currently-open island's panel (driven by the global store), or
// nothing. If a specific item was selected (via an orbiting icon), compute its
// focus key so the Panel can scroll to + highlight it.
export function PanelOverlay() {
  const openPanel = useGame((s) => s.openPanel)
  const focusItem = useGame((s) => s.focusItem)
  const closePanel = useGame((s) => s.closePanel)

  const island = openPanel ? getIsland(openPanel) : null
  if (!island) return null

  let focusKey: string | null = null
  if (focusItem && focusItem.islandId === island.id) {
    const item = islandItems(island)[focusItem.index]
    if (item) focusKey = `${item.kind}-${item.index}`
  }

  return (
    <Panel
      data={islandPanel(island)}
      focusKey={focusKey}
      accentColor={island.accentColor}
      onClose={closePanel}
    />
  )
}
