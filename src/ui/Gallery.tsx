import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Media } from '../content'
import { resolveImages } from '../lib/media'
import type { ResolvedImage } from '../lib/media'

// ─────────────────────────────────────────────────────────────────────────────
//  Image gallery — a thumbnail strip that opens a full-size lightbox.
//
//  Shared by the 3D panel (Panel.tsx) and the Classic 2D view (ClassicView.tsx)
//  via ProjectCard, so a project's images look and behave the same in both.
//
//  The lightbox is portalled to <body> so it sits ABOVE the panel backdrop and
//  its clicks never bubble into the panel (which would close it). Its key
//  handling runs in the CAPTURE phase and stops propagation, so ←/→/Esc drive
//  the gallery instead of walking the player / closing the panel underneath.
// ─────────────────────────────────────────────────────────────────────────────

// Keys the lightbox swallows so the world behind it stays put while you browse.
const SWALLOWED = /^(KeyW|KeyA|KeyS|KeyD|KeyE|Space|Arrow(Up|Down|Left|Right))$/

function Lightbox({
  images,
  index,
  onIndex,
  onClose,
}: {
  images: ResolvedImage[]
  index: number
  onIndex: (i: number) => void
  onClose: () => void
}) {
  const many = images.length > 1
  const step = useCallback(
    (delta: number) => onIndex((index + delta + images.length) % images.length),
    [index, images.length, onIndex],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      } else if (e.key === 'ArrowRight') {
        e.stopPropagation()
        step(1)
      } else if (e.key === 'ArrowLeft') {
        e.stopPropagation()
        step(-1)
      } else if (SWALLOWED.test(e.code)) {
        e.stopPropagation()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [step, onClose])

  const img = images[index]

  return createPortal(
    <div className="lightbox" onClick={onClose} role="dialog" aria-modal="true" aria-label="Image viewer">
      <button className="lightbox__close" onClick={onClose} aria-label="Close">
        ×
      </button>

      {many && (
        <button
          className="lightbox__nav lightbox__nav--prev"
          onClick={(e) => {
            e.stopPropagation()
            step(-1)
          }}
          aria-label="Previous image"
        >
          ‹
        </button>
      )}

      <figure className="lightbox__figure" onClick={(e) => e.stopPropagation()}>
        <img className="lightbox__img" src={img.src} alt={img.caption || 'Project image'} />
        <figcaption className="lightbox__bar">
          <span className="lightbox__cap">{img.caption}</span>
          <span className="lightbox__meta">
            {img.href && (
              <a href={img.href} target="_blank" rel="noreferrer noopener">
                Open source ↗
              </a>
            )}
            {many && (
              <span className="lightbox__count">
                {index + 1} / {images.length}
              </span>
            )}
          </span>
        </figcaption>
      </figure>

      {many && (
        <button
          className="lightbox__nav lightbox__nav--next"
          onClick={(e) => {
            e.stopPropagation()
            step(1)
          }}
          aria-label="Next image"
        >
          ›
        </button>
      )}
    </div>,
    document.body,
  )
}

/**
 * Thumbnail grid for an `images` array. Renders nothing when there are none, so
 * callers can drop `<Gallery images={p.images} />` in unconditionally.
 */
export function Gallery({ images, label }: { images?: Media[]; label?: string }) {
  const [open, setOpen] = useState<number | null>(null)
  const resolved = useMemo(() => resolveImages(images), [images])
  if (resolved.length === 0) return null

  return (
    <>
      <div className="gallery">
        {resolved.map((img, i) => (
          <button
            key={img.src + i}
            className="gallery__item"
            onClick={() => setOpen(i)}
            aria-label={img.caption || `View image ${i + 1}${label ? ` of ${label}` : ''}`}
            title={img.caption || undefined}
          >
            <img src={img.thumb} alt={img.caption || ''} loading="lazy" decoding="async" />
            {img.caption && <span className="gallery__cap">{img.caption}</span>}
          </button>
        ))}
      </div>

      {open !== null && (
        <Lightbox images={resolved} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
      )}
    </>
  )
}
