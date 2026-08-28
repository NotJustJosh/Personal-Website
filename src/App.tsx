import { useState } from 'react'
import { World } from './scene/World'
import { LoadingScreen } from './ui/LoadingScreen'
import { Hud } from './ui/Hud'
import { PanelOverlay } from './ui/PanelOverlay'
import { PersistentUI } from './ui/PersistentUI'
import { InputManager } from './ui/InputManager'
import { FadeOverlay } from './ui/FadeOverlay'
import { ClassicView } from './ui/ClassicView'
import { Toast } from './ui/Toast'
import { shouldUseClassicView, isWebGLAvailable } from './lib/device'

type Mode = '3d' | 'classic'

export default function App() {
  // Pick the initial mode once: Classic for phones / no-WebGL, else the 3D world.
  const [mode, setMode] = useState<Mode>(() => (shouldUseClassicView() ? 'classic' : '3d'))
  // Only offer "Enter 3D world" from Classic if WebGL actually works.
  const [canUse3D] = useState(isWebGLAvailable)

  if (mode === 'classic') {
    return (
      <>
        <ClassicView canUse3D={canUse3D} onEnter3D={() => setMode('3d')} />
        <Toast />
      </>
    )
  }

  return (
    <div className="app">
      <World />
      {/* DOM UI layered over the canvas */}
      <LoadingScreen />
      <Hud />
      <PanelOverlay />
      <PersistentUI onClassicView={() => setMode('classic')} />
      <FadeOverlay />
      <InputManager />
      <Toast />
    </div>
  )
}
