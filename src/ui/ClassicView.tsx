import { content } from '../content'
import { asset } from '../lib/paths'
import { islandPanel } from '../lib/world'
import type { PanelContent } from '../content'

// Renders one section (title → body → project cards → links). Works for any island.
function Section({ id, data }: { id: string; data: PanelContent }) {
  return (
    <section className="classic__section" id={`section-${id}`}>
      <h2>{data.title}</h2>

      {data.body?.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}

      {data.projects && (
        <div className="classic__projects">
          {data.projects.map((proj) => (
            <article key={proj.name} className="project">
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
      {/* Sticky nav generated from the islands */}
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
