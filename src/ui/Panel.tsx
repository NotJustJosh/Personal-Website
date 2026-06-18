import type { PanelContent } from '../content'
import { asset } from '../lib/paths'

// The HTML/DOM overlay shown when you interact with a zone (press E) or click a
// persistent button. Pure DOM — not 3D text — so it's crisp and accessible.
export function Panel({ data, onClose }: { data: PanelContent; onClose: () => void }) {
  return (
    <div className="panel__backdrop" onClick={onClose}>
      <div
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
          <div className="panel__links">
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
      </div>
    </div>
  )
}
