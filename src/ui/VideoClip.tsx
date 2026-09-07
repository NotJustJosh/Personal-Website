import { useEffect, useState } from 'react'
import type { Video } from '../content'
import { resolveVideo } from '../lib/media'

// A short looping clip under a project card — the video counterpart of Gallery.
// Rendered by the shared ProjectCard, so a project's clip looks and behaves the
// same in the 3D panel and the Classic 2D view.
//
// It autoplays MUTED and loops: browsers refuse to autoplay anything with
// sound, and a silent few-second loop of hardware moving reads as part of the
// page rather than as a video the visitor has to go press play on.
//
// Visitors who've asked their OS to reduce motion get a paused first frame plus
// real controls instead, so nothing starts moving until they choose to.
export function VideoClip({ video, label }: { video?: Video; label?: string }) {
  // Read the preference during the first render, not in an effect — the
  // <video> needs the right `autoPlay` on its very first commit, because
  // flipping the attribute afterwards won't start an already-loaded clip.
  const [reduced, setReduced] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  )

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const clip = resolveVideo(video)
  if (!clip) return null

  return (
    <figure className="clip">
      <video
        className="clip__video"
        src={clip.src}
        poster={clip.poster}
        loop
        muted
        playsInline
        autoPlay={!reduced}
        controls={reduced}
        // Only the poster/metadata up front — the clip itself is fetched when
        // the browser gets around to autoplaying it, so a card the visitor
        // never opens costs them nothing.
        preload="metadata"
        aria-label={clip.caption || label}
      />
      {clip.caption && <figcaption className="clip__cap">{clip.caption}</figcaption>}
    </figure>
  )
}
