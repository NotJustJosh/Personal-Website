import type { LinkItem } from '../content'
import { asset, bareValue } from '../lib/paths'
import { copyText } from '../lib/clipboard'
import { useToast } from './Toast'

// Renders one LinkItem. Normally an <a>, but when the entry sets `copy: true`
// it becomes a button that copies the value to the clipboard and raises a
// toast — used for the email address, so visitors get the text instead of
// having a mail client thrown at them.
//
// Shared by Panel, ClassicView, ContentGroups and ProjectCard so every link in
// the site behaves the same way.
export function ContentLink({
  link,
  className,
  itemKey,
}: {
  link: LinkItem
  className?: string
  /** Panel-only: scroll/highlight target for the orbiting-icon focus. */
  itemKey?: string
}) {
  if (link.copy) {
    const value = bareValue(link.url)
    const onClick = async () => {
      const ok = await copyText(value)
      useToast.getState().show(ok ? `Copied ${value} to clipboard` : `Couldn't copy — ${value}`)
    }
    return (
      <button type="button" data-itemkey={itemKey} className={className} onClick={onClick} title={`Copy ${value}`}>
        {link.label}
      </button>
    )
  }

  return (
    <a
      data-itemkey={itemKey}
      className={className}
      href={asset(link.url)}
      target="_blank"
      rel="noreferrer noopener"
    >
      {link.label}
    </a>
  )
}
