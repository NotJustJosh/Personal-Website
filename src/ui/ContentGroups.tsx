import type { ContentGroup } from '../content'
import { Gallery } from './Gallery'
import { RichText } from './RichText'
import { ContentLink } from './ContentLink'

// Nested sub-sections inside an island — each one a headed block with its own
// prose, image gallery and buttons. Shared by the 3D panel and the Classic 2D
// view so both render identically.
//
// Renders nothing when an island has no `groups`, so callers can drop it in
// unconditionally.
export function ContentGroups({ groups }: { groups?: ContentGroup[] }) {
  if (!groups?.length) return null

  return (
    <div className="groups">
      {groups.map((group) => (
        <section key={group.title} className="group">
          <h3 className="group__title">{group.title}</h3>

          {group.body?.map((paragraph, i) => (
            <RichText key={i} text={paragraph} className="group__body" />
          ))}

          <Gallery images={group.images} label={group.title} />

          {group.links && group.links.length > 0 && (
            <div className="group__links">
              {group.links.map((link) => (
                <ContentLink key={link.url} link={link} className="btn btn--primary" />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
