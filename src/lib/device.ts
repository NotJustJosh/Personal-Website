// Capability detection used to decide between the 3D world and the Classic view.

/** Returns true if the browser can create a WebGL context. */
export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

/** Best-effort "is this a phone/tablet" check. */
export function isLikelyMobile(): boolean {
  // Modern, accurate signal where available (Chromium).
  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData
  if (uaData && typeof uaData.mobile === 'boolean') return uaData.mobile

  const ua = navigator.userAgent || ''
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  // iPadOS pretends to be desktop Safari, so also check for a coarse pointer.
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false
  const smallScreen = Math.min(window.screen.width, window.screen.height) < 768
  return mobileUA || (coarsePointer && smallScreen)
}

/**
 * Decide whether to show the Classic (2D) view instead of the 3D world.
 * True when WebGL is missing OR the device looks like a phone/tablet.
 */
export function shouldUseClassicView(): boolean {
  return !isWebGLAvailable() || isLikelyMobile()
}
