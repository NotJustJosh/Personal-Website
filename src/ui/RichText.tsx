import type { ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
//  Renders a prose string (a project `description`, an island `body` paragraph)
//  as real HTML blocks.
//
//  WHY THIS EXISTS: in content.ts you wrap long text across several source lines
//  just to keep the file readable. Those wrapping newlines are the SAME
//  character as a `\n` you type on purpose, so "break on every newline" (what
//  Lines.tsx does for titles) would shatter every paragraph into ragged lines.
//
//  So the rule is explicit instead:
//    • a line starting with "- " (or "•" / "*")  → a bullet in a list
//    • a BLANK line                              → a new paragraph
//    • anything else                             → flows into the line above,
//                                                  joined with a space
//
//  Indentation is trimmed, so you can indent freely in content.ts.
// ─────────────────────────────────────────────────────────────────────────────

interface Block {
  kind: 'p' | 'li'
  text: string
}

const BULLET = /^[-•*]\s+(.*)$/

export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = []
  // True when the next non-empty line must START a block rather than continue
  // the previous one (i.e. right after a blank line, or at the very beginning).
  let breakBefore = true

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) {
      breakBefore = true
      continue
    }

    const bullet = BULLET.exec(line)
    if (bullet) {
      blocks.push({ kind: 'li', text: bullet[1].trim() })
      breakBefore = false
      continue
    }

    const last = blocks[blocks.length - 1]
    if (!breakBefore && last) last.text += ' ' + line
    else blocks.push({ kind: 'p', text: line })
    breakBefore = false
  }

  return blocks
}

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
