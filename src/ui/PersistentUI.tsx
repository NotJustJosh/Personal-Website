import { content } from '../content'
import { asset } from '../lib/paths'
import { FastTravelMenu } from './FastTravelMenu'

// Always-visible controls anchored to a fixed corner, reachable from anywhere:
// a fast-travel menu, a Resume button (opens/downloads the resume), and a
// Classic-view switch.
export function PersistentUI({ onClassicView }: { onClassicView: () => void }) {
  return (
    <div className="persistent">
      <FastTravelMenu />
      <a
        className="btn btn--primary"
        href={asset(content.resumeUrl)}
        target="_blank"
        rel="noreferrer noopener"
      >
        Resume
      </a>
      <button className="btn btn--ghost" onClick={onClassicView}>
        Classic view
      </button>
    </div>
  )
}
