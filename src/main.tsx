import WebGL from 'three/addons/capabilities/WebGL.js'
import { fallBackToPlainPage, forcedNoWebGL, sendToPlainPage, wants3D } from './lib/fallback'
import { isLikelyMobile } from './lib/device'
import { setBootStatus } from './lib/boot'
import './index.css'

// Entry point, kept tiny on purpose: decide whether this device gets the 3D
// world BEFORE downloading its ~1.2 MB bundle.
//   • No WebGL 2 (three.js needs it) → the plain page, with a notice.
//     `?nowebgl=1` forces this, for testing.
//   • A phone → the plain page; the world is built for keyboard + mouse.
//     `?view=3d` opts back in (the plain page's "3D world" links add it).
if (forcedNoWebGL() || !WebGL.isWebGL2Available()) {
  fallBackToPlainPage()
} else if (isLikelyMobile() && !wants3D()) {
  sendToPlainPage()
} else {
  import('./start').catch(() => {
    // Usually a dropped connection mid-load. The loading screen's links and
    // "Skip to projects" still work, so say so rather than spin forever.
    setBootStatus("The 3D world couldn't load. Skip to projects for everything in plain text.")
  })
}
