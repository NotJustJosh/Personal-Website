import { useEffect, useMemo, useState } from 'react'
import type { Slide } from '../content'
import { resolveImages } from '../lib/media'
import { RichText } from './RichText'
import { ContentLink } from './ContentLink'

// ─────────────────────────────────────────────────────────────────────────────
//  A click-through slide deck for an island (see `slides` in content.ts).
//
//  Used for the intro on the hub island: a hero slide, a few short slides with
//  pictures, then the movement tutorial — instead of one long block of text.
//
//  Navigation: the ‹ › arrows, the dots, or ← / →. Key handling runs in the
//  CAPTURE phase and stops propagation so the arrows drive the deck rather than
//  leaking into the player controls behind the panel.
// ─────────────────────────────────────────────────────────────────────────────

export function Slides({
  slides: all,
  view,
  /** Called by the "Done" button on the last slide — the panel passes onClose. */
  onDone,
  /** Fires whenever the visible slide changes — the panel hides its own heading
   *  after slide 1, so it needs to know where we are. */
  onIndexChange,
}: {
  slides: Slide[]
  /** Which view we're in, so `only: '3d'` / `only: 'classic'` slides can be dropped. */
  view: '3d' | 'classic'
  onDone?: () => void
  onIndexChange?: (index: number) => void
}) {
  const [index, setIndex] = useState(0)

  // Drop slides that don't belong in this view (e.g. the walk-around tutorial
  // is meaningless in Classic view).
  const slides = useMemo(() => all.filter((s) => !s.only || s.only === view), [all, view])

  // Snap back to the first slide whenever the deck itself changes (new island).
  useEffect(() => {
    setIndex(0)
  }, [slides])

  const count = slides.length
  const safeIndex = Math.min(index, Math.max(count - 1, 0))
  const slide = slides[safeIndex]

  const image = useMemo(
    () => (slide?.image ? resolveImages([slide.image])[0] : null),
    [slide],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.stopPropagation()
        setIndex((i) => Math.min(i + 1, count - 1))
      } else if (e.key === 'ArrowLeft') {
        e.stopPropagation()
        setIndex((i) => Math.max(i - 1, 0))
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [count])

  useEffect(() => {
    onIndexChange?.(safeIndex)
  }, [safeIndex, onIndexChange])

  if (!slide) return null

  const isFirst = safeIndex === 0
  const isLast = safeIndex === count - 1

  return (
    <div className="slides">
      {/* key= restarts the fade whenever you move to another slide */}
      <div key={safeIndex} className={`slide${slide.hero ? ' slide--hero' : ''}`}>
        {/* Title first, then the picture — read the heading, then see it. */}
        {slide.title && (
          <h3 className={`slide__title${slide.hero ? ' slide__title--hero' : ''}`}>
            {slide.title}
          </h3>
        )}
        {slide.subtitle && <p className="slide__subtitle">{slide.subtitle}</p>}

        {image && (
          <img
            className="slide__image"
            src={image.src}
            alt={image.caption || slide.title || 'Slide image'}
            decoding="async"
          />
        )}

        {slide.body?.map((paragraph, i) => (
          <RichText key={i} text={paragraph} className="slide__body" />
        ))}

        {slide.keys && slide.keys.length > 0 && (
          <dl className="slide__keys">
            {slide.keys.map((hint, i) => (
              <div key={i} className="slide__keyrow">
                <dt className="slide__keycaps">
                  {hint.keys.map((cap, k) => (
                    <kbd key={k}>{cap}</kbd>
                  ))}
                </dt>
                <dd className="slide__keylabel">{hint.label}</dd>
              </div>
            ))}
          </dl>
        )}

        {slide.links && slide.links.length > 0 && (
          <div className="slide__links">
            {slide.links.map((link) => (
              <ContentLink key={link.url} link={link} className="btn btn--primary" />
            ))}
          </div>
        )}
      </div>

      <div className="slides__nav">
        <button
          className="btn btn--ghost"
          onClick={() => setIndex((i) => Math.max(i - 1, 0))}
          disabled={isFirst}
          aria-label="Previous slide"
        >
          ‹ Back
        </button>

        <div className="slides__dots" role="tablist" aria-label="Slides">
          {slides.map((s, i) => (
            <button
              key={i}
              className={`slides__dot${i === safeIndex ? ' is-active' : ''}`}
              onClick={() => setIndex(i)}
              role="tab"
              aria-selected={i === safeIndex}
              aria-label={s.title ? `Slide ${i + 1}: ${s.title}` : `Slide ${i + 1}`}
            />
          ))}
        </div>

        {isLast ? (
          <button className="btn btn--primary" onClick={onDone} disabled={!onDone}>
            Let's go →
          </button>
        ) : (
          <button className="btn btn--primary" onClick={() => setIndex((i) => i + 1)}>
            Next ›
          </button>
        )}
      </div>
    </div>
  )
}
