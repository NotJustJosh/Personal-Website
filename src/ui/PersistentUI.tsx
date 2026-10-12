import { content } from '../content'
import { asset } from '../lib/paths'
import { useGame } from '../store'
import { FastTravelMenu } from './FastTravelMenu'

// Always-visible controls anchored to a fixed corner, reachable from anywhere:
// a fast-travel menu, a Resume button (opens/downloads the resume) and a
// graphics toggle. The way out to the plain page is SkipLink, top-left.
export function PersistentUI() {
  const quality = useGame((s) => s.quality)
  const toggleQuality = useGame((s) => s.toggleQuality)
  const low = quality === 'low'

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
      <button
        className="btn btn--ghost"
        onClick={toggleQuality}
        title={
          low
            ? 'Turn the glow, aurora and full resolution back on'
            : 'Drop bloom, the aurora and render resolution for a smoother frame rate'
        }
        aria-pressed={low}
      >
        {low ? 'Full graphics' : 'Reduce graphics'}
      </button>
    </div>
  )
}
