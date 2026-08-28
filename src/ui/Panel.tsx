import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { PanelContent } from '../content'
import { ContentLink } from './ContentLink'
import { Gallery } from './Gallery'
import { RichText } from './RichText'
import { ContentGroups } from './ContentGroups'
import { ProjectCard, chipStyle } from './ProjectCard'
import { CATEGORY_META, tagCategory } from '../lib/tags'
import type { TagCategory } from '../lib/tags'

const CATEGORY_ORDER: TagCategory[] = ['field', 'tool', 'method', 'general']

// The HTML/DOM overlay shown when you interact with an island (press E) or click
// a persistent button. Pure DOM — crisp + accessible.
//
// `focusKey` scrolls that entry into view and highlights it in the island accent.
// Tags are color-coded by category and clickable to filter the project list.
// Cards (incl. their image galleries) come from the shared ProjectCard, so the
// Classic 2D view renders exactly the same thing.
export function Panel({
  data,
  focusKey,
  accentColor = '#ffd60a',
  onClose,
}: {
  data: PanelContent
  focusKey?: string | null
  accentColor?: string
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)

  // Scroll the focused entry into view when the panel opens / focus changes.
  useEffect(() => {
    if (!focusKey) return
    const el = panelRef.current?.querySelector<HTMLElement>(`[data-itemkey="${focusKey}"]`)
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [focusKey])

  // Reset the filter when switching to a different section.
  useEffect(() => {
    setActiveTag(null)
    setFilterOpen(false)
  }, [data.title])

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

  const indexed = projects.map((p, i) => ({ p, i }))
  const shown = activeTag ? indexed.filter(({ p }) => p.tags?.includes(activeTag)) : indexed
  const toggle = (t: string) => setActiveTag((cur) => (cur === t ? null : t))

  return (
    <div className="panel__backdrop" onClick={onClose}>
      <div
        ref={panelRef}
        className="panel"
        style={{ ['--accent']: accentColor } as CSSProperties}
        role="dialog"
        aria-modal="true"
        aria-label={data.title}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="panel__close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <h2 className="panel__title">{data.title}</h2>

        {data.body?.map((paragraph, i) => (
          <RichText key={i} text={paragraph} className="panel__body" />
        ))}

        {/* Island-level gallery (photos not tied to a single project) */}
        <Gallery images={data.images} label={data.title} />

        {/* Nested sub-sections (e.g. Resume / Transcript on the Resume island) */}
        <ContentGroups groups={data.groups} />

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
          <div className="panel__projects">
            {shown.map(({ p, i }) => {
              const key = `project-${i}`
              return (
                <ProjectCard
                  key={p.name}
                  project={p}
                  itemKey={key}
                  focused={focusKey === key}
                  activeTag={activeTag}
                  onToggleTag={toggle}
                />
              )
            })}
            {shown.length === 0 && (
              <p className="panel__body">
                No entries tagged “{activeTag}”.
              </p>
            )}
          </div>
        )}

        {data.links && (
          <div className="panel__links">
            {data.links.map((link, i) => {
              const key = `link-${i}`
              return (
                <ContentLink
                  key={link.url}
                  link={link}
                  itemKey={key}
                  className={`btn btn--primary${focusKey === key ? ' is-focused' : ''}`}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
