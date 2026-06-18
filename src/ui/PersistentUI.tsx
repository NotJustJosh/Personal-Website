import { useGame } from '../store'

// Always-visible controls anchored to a fixed corner, reachable from anywhere:
// a Resume button (opens the Resume panel) and a Classic-view switch.
export function PersistentUI({ onClassicView }: { onClassicView: () => void }) {
  const openSection = useGame((s) => s.openSection)

  return (
    <div className="persistent">
      <button className="btn btn--primary" onClick={() => openSection('resume')}>
        Resume
      </button>
      <button className="btn btn--ghost" onClick={onClassicView}>
        Classic view
      </button>
    </div>
  )
}
