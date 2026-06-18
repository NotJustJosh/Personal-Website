import { content } from '../content'
import { asset } from '../lib/paths'
import type { PanelContent, SectionId } from '../content'

// Preferred order for the 2D view. Any panel NOT listed here is appended at the
// end, so newly-added zones automatically show up in the Classic view too.
const SECTION_ORDER: SectionId[] = ['about', 'experience', 'projects', 'contact', 'resume']

// Renders one section (title → body → project cards → links), mirroring the 3D
// Panel but laid out as a flat page section. Works for any PanelContent.
function Section({ data }: { data: PanelContent }) {
  return (
    <section className="classic__section">
      <h2>{data.title}</h2>

      {data.body?.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}

      {data.projects && (
        <div className="classic__projects">
          {data.projects.map((proj) => (
            <article key={proj.name} className="project">
              <h3 className="project__name">{proj.name}</h3>
              <p className="project__desc">{proj.description}</p>
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

// A clean 2D version of the entire site, rendered straight from content.ts.
// Shown automatically on phones / no-WebGL devices, and reachable via the
// "Classic view" button at any time.
export function ClassicView({
  canUse3D,
  onEnter3D,
}: {
  canUse3D: boolean
  onEnter3D: () => void
}) {
  // Explicit order first, then any extra panels not in the order list.
  const ids = Object.keys(content.panels) as SectionId[]
  const ordered = [
    ...SECTION_ORDER.filter((id) => ids.includes(id)),
    ...ids.filter((id) => !SECTION_ORDER.includes(id)),
  ]

  return (
    <div className="classic">
      <header className="classic__header">
        <div>
          <h1 className="classic__name">{content.name}</h1>
          <p className="classic__tagline">{content.tagline}</p>
        </div>
        <div className="classic__actions">
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

      <main className="classic__main">
        {ordered.map((id) => (
          <Section key={id} data={content.panels[id]} />
        ))}
      </main>

      <footer className="classic__footer">© {content.name}</footer>
    </div>
  )
}
