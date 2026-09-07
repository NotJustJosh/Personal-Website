import { useMemo, useState, type CSSProperties } from 'react'
import type { Project } from '../content'
import { tagColor } from '../lib/tags'
import { resolveImages } from '../lib/media'
import { Lines } from './Lines'
import { RichText } from './RichText'
import { GalleryGrid, Lightbox } from './Gallery'
import { VideoClip } from './VideoClip'
import { ContentLink } from './ContentLink'

// One project/honor/experience card. Shared by the 3D panel (Panel.tsx) and the
// Classic 2D view (ClassicView.tsx) so both stay in sync — including the image
// gallery, which is why this was pulled out of the two near-identical copies.
//
// Images are split: the FIRST one sits in a small box beside the title (it's the
// cover — the same image that floats over this item in the 3D world), and the
// rest form the thumbnail grid lower down. Both drive ONE lightbox over the full
// list, so browsing from either place steps through every image in order.

/** A tag chip, colored by its category. Active = filled; otherwise outlined. */
export function chipStyle(tag: string, active: boolean): CSSProperties {
  const c = tagColor(tag)
  return active
    ? { background: c, borderColor: c, color: '#0b1020' }
    : { borderColor: c, color: c, background: `color-mix(in srgb, ${c} 14%, transparent)` }
}

export function ProjectCard({
  project,
  activeTag,
  onToggleTag,
  itemKey,
  focused = false,
}: {
  project: Project
  /** Currently-filtered tag, so chips render in the active state. */
  activeTag: string | null
  onToggleTag: (tag: string) => void
  /** Scroll/highlight target key (3D panel only — set by the orbiting icons). */
  itemKey?: string
  focused?: boolean
}) {
  const images = useMemo(() => resolveImages(project.images), [project.images])
  const [open, setOpen] = useState<number | null>(null)
  const cover = images[0]
  const rest = images.slice(1)

  return (
    <article data-itemkey={itemKey} className={`project${focused ? ' is-focused' : ''}`}>
      <div className={`project__head${cover ? ' project__head--cover' : ''}`}>
        {cover && (
          <button
            className="project__cover"
            onClick={() => setOpen(0)}
            aria-label={cover.caption || `View images of ${project.name}`}
            title={cover.caption || undefined}
          >
            <img src={cover.thumb} alt={cover.caption || ''} loading="lazy" decoding="async" />
          </button>
        )}
        <h3 className="project__name">
          <Lines text={project.name} />
        </h3>
        {project.date && <span className="project__date">{project.date}</span>}
      </div>

      {project.description && <RichText text={project.description} className="project__desc" />}

      {/* Every image AFTER the cover. Indices are offset by 1 so the shared
          lightbox below still walks the full list in authored order. */}
      <GalleryGrid images={rest} onOpen={setOpen} indexOffset={1} label={project.name} />

      {open !== null && (
        <Lightbox images={images} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
      )}

      {/* A short muted loop, for projects that are better shown moving. */}
      <VideoClip video={project.video} label={project.name} />

      {project.tags && (
        <div className="project__tags">
          {project.tags.map((tag) => (
            <button
              key={tag}
              className="chip chip--sm"
              style={chipStyle(tag, activeTag === tag)}
              onClick={() => onToggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {project.links && (
        <div className="project__links">
          {project.links.map((link) => (
            <ContentLink key={link.url} link={link} />
          ))}
        </div>
      )}
    </article>
  )
}
