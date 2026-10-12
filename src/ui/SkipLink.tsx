import { useGame } from '../store'
import { PLAIN_PAGE } from '../lib/fallback'

// "Skip to projects" — the way out to the plain page, always on screen in the
// 3D world. It sits top-left, first in tab order, and ABOVE an open panel's
// backdrop (which blurs everything under it and closes the panel on click),
// so it's never hidden or blocked. If the browser takes the WebGL context
// away, a notice under it explains why the scene froze.
export function SkipLink() {
  const contextLost = useGame((s) => s.contextLost)

  return (
    <div className="skip">
      <a className="btn btn--ghost skip-link" href={PLAIN_PAGE}>
        Skip to projects
      </a>
      {contextLost && (
        <p className="skip__notice" role="alert">
          The 3D scene stopped responding. The projects page has everything in plain text.
        </p>
      )}
    </div>
  )
}
