import fs from 'node:fs'

// Pixel dimensions of a PNG, JPEG or WebP, read from the file header — so the
// plain page can give every <img> an explicit width/height (no layout shift)
// without pulling in an image library. Returns null for anything else.

export interface Size {
  width: number
  height: number
}

/** JPEG start-of-frame markers (baseline, progressive, …) — they carry the size. */
const SOF = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf])

function parse(b: Buffer): Size | null {
  // PNG: fixed IHDR right after the 8-byte signature.
  if (b.length >= 24 && b.readUInt32BE(0) === 0x89504e47) {
    return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) }
  }

  // JPEG: walk the marker segments until a start-of-frame.
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null
      const marker = b[i + 1]
      if (SOF.has(marker)) return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) }
      i += 2 + b.readUInt16BE(i + 2)
    }
    return null
  }

  // WebP: RIFF container, then a lossy / lossless / extended chunk.
  if (b.length >= 30 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = b.toString('ascii', 12, 16)
    if (chunk === 'VP8 ') {
      return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff }
    }
    if (chunk === 'VP8L') {
      const bits = b.readUInt32LE(21)
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
    }
    if (chunk === 'VP8X') {
      return { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 }
    }
  }

  return null
}

export function imageSize(file: string): Size | null {
  try {
    return parse(fs.readFileSync(file))
  } catch {
    return null
  }
}
