// Device detection: phones get the plain page instead of the 3D world, which
// is built for a keyboard and mouse. (The WebGL check lives in main.tsx.)

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
