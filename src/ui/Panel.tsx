import { useEffect, useRef } from 'react'
import type { PanelContent } from '../content'
import { asset } from '../lib/paths'

// The HTML/DOM overlay shown when you interact with an island (press E) or click
// a persistent button. Pure DOM — not 3D text — so it's crisp and accessible.
//
// `focusKey` (e.g. "project-2" or "link-0") scrolls that entry into view and
// highlights it yellow — used when you open the panel from an orbiting item icon.
export function Panel({
  data,
  focusKey,
  onClose,
}: {
  data: PanelContent
  focusKey?: string | null
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Scroll the focused entry into view when the panel opens / focus changes.
  useEffect(() => {
    if (!focusKey) return
    const el = panelRef.current?.querySelector<HTMLElement>(`[data-itemkey="${focusKey}"]`)
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [focusKey])

  return (
    <div className="panel__backdrop" onClick={onClose}>
      <div
        ref={panelRef}
        className="panel"
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
          <p key={i} className="panel__body">
            {paragraph}
          </p>
        ))}

        {data.projects && (
          <div className="panel__projects">
            {data.projects.map((proj, i) => {
              const key = `project-${i}`
              return (
                <article
                  key={proj.name}
                  data-itemkey={key}
                  className={`project${focusKey === key ? ' is-focused' : ''}`}
                >
                  <div className="project__head">
                    <h3 className="project__name">{proj.name}</h3>
                    {proj.date && <span className="project__date">{proj.date}</span>}
                  </div>
                  {proj.description && <p className="project__desc">{proj.description}</p>}
                  {proj.tags && (
                    <ul className="project__tags">
                      {proj.tags.map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                  )}
                  {proj.links && (
                    <div className="project__links">
                      {proj.links.map((link) => (
                        <a
                          key={link.url}
                          href={asset(link.url)}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}

        {data.links && (
          <div className="panel__links">
            {data.links.map((link, i) => {
              const key = `link-${i}`
              return (
                <a
                  key={link.url}
                  data-itemkey={key}
                  className={`btn btn--primary${focusKey === key ? ' is-focused' : ''}`}
                  href={asset(link.url)}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {link.label}
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
