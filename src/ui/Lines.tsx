// Render a string as separate lines. Splits on newlines, trims each line, and
// drops blank/indent-only lines — so a multi-line `name` authored in content.ts
// (e.g. an honor with several badges) shows each part on its own line, no matter
// how the newlines/indentation were written.
export function Lines({ text }: { text: string }) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {line}
        </span>
      ))}
    </>
  )
}
