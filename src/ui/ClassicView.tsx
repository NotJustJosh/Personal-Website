import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { content } from '../content'
import { asset } from '../lib/paths'
import { islandPanel } from '../lib/world'
import type { PanelContent } from '../content'
import { Lines } from './Lines'
import { CATEGORY_META, tagCategory, tagColor } from '../lib/tags'
import type { TagCategory } from '../lib/tags'

const CATEGORY_ORDER: TagCategory[] = ['field', 'tool', 'method', 'general']

function chipStyle(tag: string, active: boolean): CSSProperties {
  const c = tagColor(tag)
  return active
    ? { background: c, borderColor: c, color: '#0b1020' }
    : { borderColor: c, color: c, background: `color-mix(in srgb, ${c} 14%, transparent)` }
}

// Renders one section (title → body → project cards → links). Tags are
// color-coded by category and clickable to filter this section's entries.
function Section({ id, data }: { id: string; data: PanelContent }) {
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const projects = data.projects ?? []

  const uniqueTags = useMemo(() => {
    const set = new Set<string>()
    projects.forEach((p) => p.tags?.forEach((t) => set.add(t)))
    return [...set]
  }, [projects])
  const presentCategories = useMemo(() => {
    const s = new Set<TagCategory>(uniqueTags.map(tagCategory))
    return CATEGORY_ORDER.filter((c) => s.has(c))
  }, [uniqueTags])

  const shown = activeTag ? projects.filter((p) => p.tags?.includes(activeTag)) : projects
  const toggle = (t: string) => setActiveTag((cur) => (cur === t ? null : t))

  return (
    <section className="classic__section" id={`section-${id}`}>
      <h2>{data.title}</h2>

      {data.body?.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}

      {projects.length > 0 && uniqueTags.length > 0 && (
        <div className="tagbar">
          <div className="tagbar__bar">
            <button
              className="btn btn--ghost tagbar__btn"
              onClick={() => setFilterOpen((o) => !o)}
              aria-expanded={filterOpen}
            >
              Filter by tag ▾
            </button>
            {activeTag && (
              <button
                className="chip"
                style={chipStyle(activeTag, true)}
                onClick={() => setActiveTag(null)}
                title="Clear filter"
              >
                {activeTag} ✕
              </button>
            )}
          </div>
          {filterOpen && (
            <div className="tagbar__menu">
              <div className="tag-legend">
                {presentCategories.map((c) => (
                  <span key={c} className="tag-legend__item">
                    <i style={{ background: CATEGORY_META[c].color }} />
                    {CATEGORY_META[c].label}
                  </span>
                ))}
              </div>
              <div className="tag-filter">
                {uniqueTags.map((t) => (
                  <button
                    key={t}
                    className="chip"
                    style={chipStyle(t, activeTag === t)}
                    onClick={() => {
                      toggle(t)
                      setFilterOpen(false)
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {projects.length > 0 && (
        <div className="classic__projects">
          {shown.map((proj) => (
            <article key={proj.name} className="project">
              <div className="project__head">
                <h3 className="project__name">
                  <Lines text={proj.name} />
                </h3>
                {proj.date && <span className="project__date">{proj.date}</span>}
              </div>
              {proj.description && <p className="project__desc">{proj.description}</p>}
              {proj.tags && (
                <div className="project__tags">
                  {proj.tags.map((tag) => (
                    <button
                      key={tag}
                      className="chip chip--sm"
                      style={chipStyle(tag, activeTag === tag)}
                      onClick={() => toggle(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
              {proj.links && (
                <div className="project__links">
                  {proj.links.map((link) => (
                    <a key={link.url} href={asset(link.url)} target="_blank" rel="noreferrer noopener">
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {data.links && (
        <div className="classic__links">
          {data.links.map((link) => (
            <a
              key={link.url}
              className="btn btn--primary"
              href={asset(link.url)}
              target="_blank"
              rel="noreferrer noopener"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </section>
  )
}

// A clean, scrollable 2D version of the entire site with a sticky nav menu —
// both rendered straight from the islands array, so they stay in sync. Shown
// automatically on phones / no-WebGL devices, and reachable via "Classic view".
export function ClassicView({
  canUse3D,
  onEnter3D,
}: {
  canUse3D: boolean
  onEnter3D: () => void
}) {
  return (
    <div className="classic">
      <header className="classic__nav">
        <a className="classic__brand" href="#top">
          <strong>{content.name}</strong>
        </a>
        <nav className="classic__navlinks">
          {content.islands.map((island) => (
            <a key={island.id} href={`#section-${island.id}`}>
              {island.label}
            </a>
          ))}
        </nav>
        <div className="classic__navactions">
          <a
            className="btn btn--primary"
            href={asset(content.resumeUrl)}
            target="_blank"
            rel="noreferrer noopener"
          >
            Resume
          </a>
          {canUse3D && (
            <button className="btn btn--ghost" onClick={onEnter3D}>
              Enter 3D world
            </button>
          )}
        </div>
      </header>

      <main className="classic__main" id="top">
        <section className="classic__hero">
          <h1 className="classic__name">{content.name}</h1>
          <p className="classic__tagline">{content.tagline}</p>
        </section>

        {content.islands.map((island) => (
          <Section key={island.id} id={island.id} data={islandPanel(island)} />
        ))}
      </main>

      <footer className="classic__footer">© {content.name}</footer>
    </div>
  )
}
