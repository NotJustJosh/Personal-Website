import WebGL from 'three/addons/capabilities/WebGL.js'
import { fallBackToPlainPage, forcedNoWebGL } from './lib/fallback'
import { setBootStatus } from './lib/boot'
import './index.css'

// Entry point, kept tiny on purpose. three.js needs WebGL 2, so check for it
// BEFORE downloading the 3D bundle: a device that can't run the scene goes
// straight to the plain page instead of fetching ~1.2 MB of JavaScript first.
// `?nowebgl=1` forces that path, for testing.
if (forcedNoWebGL() || !WebGL.isWebGL2Available()) {
  fallBackToPlainPage()
} else {
  import('./start').catch(() => {
    // Usually a dropped connection mid-load. The loading screen's links and
    // "Skip to projects" still work, so say so rather than spin forever.
    setBootStatus("The 3D world couldn't load. Skip to projects for everything in plain text.")
  })
}
