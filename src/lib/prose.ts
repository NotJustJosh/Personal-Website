// ─────────────────────────────────────────────────────────────────────────────
//  How prose authored in content.ts is split into blocks. Pure functions, so
//  the React views (RichText, Lines) and the build-time plain page
//  (plugins/plain-page.ts) format text identically.
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

export interface Block {
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
 * Split a title into its lines: breaks on EVERY newline, trims each line and
 * drops blank ones — so a multi-line `name` (an honor with several badges)
 * shows each part on its own line however it was indented.
 */
export function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
}
