import type { ReactNode } from 'react'
import { parseBlocks } from '../lib/prose'

// Renders a prose string (a project `description`, an island `body` paragraph)
// as real HTML blocks: "- " lines become bullets, blank lines start a new
// paragraph, and everything else flows into the line above. The rules live in
// lib/prose.ts, shared with the plain page.

/**
 * `className` is applied to each block so callers keep their existing styling
 * (e.g. `project__desc`, `panel__body`) whether it renders as a <p> or a <ul>.
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = parseBlocks(text)
  const out: ReactNode[] = []
  let bullets: string[] = []

  const flushBullets = () => {
    if (bullets.length === 0) return
    out.push(
      <ul key={`ul-${out.length}`} className={[className, 'richtext__list'].filter(Boolean).join(' ')}>
        {bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>,
    )
    bullets = []
  }

  for (const block of blocks) {
    if (block.kind === 'li') {
      bullets.push(block.text)
      continue
    }
    flushBullets()
    out.push(
      <p key={`p-${out.length}`} className={className}>
        {block.text}
      </p>,
    )
  }
  flushBullets()

  return <>{out}</>
}
