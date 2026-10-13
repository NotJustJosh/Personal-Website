import { useEffect } from 'react'
import { useProgress } from '@react-three/drei'
import { useGame } from '../store'
import { finishBoot, setBootProgress } from '../lib/boot'

// Drives the loading screen. Its markup is static HTML in index.html (#boot —
// name, links, "Skip to projects", progress bar), so it's readable before any
// JavaScript runs; this fills the bar with asset progress, then fades it out
// once the world is ready. `useProgress` reads three's loading manager, so it
// works here outside the <Canvas>.
export function LoadingScreen() {
  const ready = useGame((s) => s.ready)
  const { progress } = useProgress()

  useEffect(() => {
    setBootProgress(ready ? 100 : Math.max(Math.round(progress), 6))
  }, [ready, progress])

  useEffect(() => {
    if (!ready) return
    return finishBoot() // fade out, then hide
  }, [ready])

  return null
}
