import { World } from './scene/World'
import { LoadingScreen } from './ui/LoadingScreen'
import { Hud } from './ui/Hud'
import { PanelOverlay } from './ui/PanelOverlay'
import { PersistentUI } from './ui/PersistentUI'
import { InputManager } from './ui/InputManager'
import { FadeOverlay } from './ui/FadeOverlay'
import { Toast } from './ui/Toast'
import { SkipLink } from './ui/SkipLink'
import { TouchControls, RotatePrompt } from './ui/TouchControls'
import { useTouchScreen } from './lib/touch'

// The 3D world plus the DOM UI layered over it. Browsers that can't run it
// never get here — main.tsx sends them to the plain page (projects/). Touch
// screens get on-screen controls, and a "turn it sideways" card in portrait.
export default function App() {
  const touch = useTouchScreen()
  return (
    <div className="app">
      {/* First in the DOM, so it's the first Tab stop. */}
      <SkipLink />
      <World />
      {/* DOM UI layered over the canvas */}
      <LoadingScreen />
      <Hud />
      <PanelOverlay />
      <PersistentUI />
      <FadeOverlay />
      <InputManager />
      {touch && <TouchControls />}
      {touch && <RotatePrompt />}
      <Toast />
    </div>
  )
}
