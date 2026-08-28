import type { CSSProperties } from 'react'
import type { Project } from '../content'
import { tagColor } from '../lib/tags'
import { Lines } from './Lines'
import { RichText } from './RichText'
import { Gallery } from './Gallery'
import { ContentLink } from './ContentLink'

// One project/honor/experience card. Shared by the 3D panel (Panel.tsx) and the
// Classic 2D view (ClassicView.tsx) so both stay in sync — including the image
// gallery, which is why this was pulled out of the two near-identical copies.

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
  return (
    <article data-itemkey={itemKey} className={`project${focused ? ' is-focused' : ''}`}>
      <div className="project__head">
        <h3 className="project__name">
          <Lines text={project.name} />
        </h3>
        {project.date && <span className="project__date">{project.date}</span>}
      </div>

      {project.description && <RichText text={project.description} className="project__desc" />}

      {/* Thumbnails → click any one to open the full-size gallery. */}
      <Gallery images={project.images} label={project.name} />

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
