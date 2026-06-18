import { content } from '../content'
import { asset } from '../lib/paths'
import type { LinkItem } from '../content'

function LinkRow({ links }: { links?: LinkItem[] }) {
  if (!links?.length) return null
  return (
    <div className="classic__links">
      {links.map((link) => (
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
  const { projects, about, contact, resume } = content.panels

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
        <section className="classic__section">
          <h2>{about.title}</h2>
          {about.body?.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>

        <section className="classic__section">
          <h2>{projects.title}</h2>
          {projects.body?.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <div className="classic__projects">
            {projects.projects?.map((proj) => (
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
        </section>

        <section className="classic__section">
          <h2>{contact.title}</h2>
          {contact.body?.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <LinkRow links={contact.links} />
        </section>

        <section className="classic__section">
          <h2>{resume.title}</h2>
          {resume.body?.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <LinkRow links={resume.links} />
        </section>
      </main>

      <footer className="classic__footer">© {content.name}</footer>
    </div>
  )
}
