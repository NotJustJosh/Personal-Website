import { useEffect } from 'react'
import { useGame } from '../store'

// A quick screen fade used for respawn + fast-travel. When `fading` flips true
// the overlay snaps to opaque (covering the teleport), then we clear the flag so
// it fades back out, revealing the new location.
export function FadeOverlay() {
  const fading = useGame((s) => s.fading)
  const setFading = useGame((s) => s.setFading)

  useEffect(() => {
    if (!fading) return
    const t = setTimeout(() => setFading(false), 450)
    return () => clearTimeout(t)
  }, [fading, setFading])

  return <div className={`fade${fading ? ' fade--active' : ''}`} aria-hidden />
}
