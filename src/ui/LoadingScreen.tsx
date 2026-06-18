import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { useGame } from '../store'

// DOM loading overlay. Shows asset progress while the scene loads, then fades
// out once the world is ready. `useProgress` reads three's loading manager, so
// it works here outside the <Canvas>.
export function LoadingScreen() {
  const ready = useGame((s) => s.ready)
  const { progress, item, active } = useProgress()
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => setHidden(true), 700) // allow the fade-out to play
    return () => clearTimeout(t)
  }, [ready])

  if (hidden) return null

  const pct = Math.round(progress)
  return (
    <div className={`loader${ready ? ' loader--done' : ''}`} aria-hidden={ready}>
      <div className="loader__inner">
        <h1 className="loader__title">Entering the world</h1>
        <div className="loader__track">
          <div
            className="loader__fill"
            style={{ width: `${ready ? 100 : Math.max(pct, 6)}%` }}
          />
        </div>
        <p className="loader__hint">
          {ready ? 'Ready' : active && item ? `Loading ${item}` : `${pct}%`}
        </p>
      </div>
    </div>
  )
}
