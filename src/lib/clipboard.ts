// Copy text to the clipboard, resolving to whether it actually worked.
//
// The async Clipboard API is the happy path but it needs a secure context
// (https:// or localhost) and permission, so fall back to the old
// select-a-hidden-textarea trick rather than silently doing nothing.
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Blocked or unavailable — try the legacy path below.
  }

  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    // Off-screen but still selectable; `fixed` avoids scrolling the page.
    ta.style.position = 'fixed'
    ta.style.top = '0'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}
