import { content } from '../content'
import { useGame } from '../store'
import { Panel } from './Panel'

// Renders the currently-open panel (driven by the global store), or nothing.
export function PanelOverlay() {
  const openPanel = useGame((s) => s.openPanel)
  const closePanel = useGame((s) => s.closePanel)
  if (!openPanel) return null
  return <Panel data={content.panels[openPanel]} onClose={closePanel} />
}
