import { useState } from 'react'
import { content } from '../content'
import { useGame } from '../store'

// A dropdown listing every island (generated from content.ts) that teleports the
// player there. Adding an island to content.ts automatically adds it here.
export function FastTravelMenu() {
  const requestTeleport = useGame((s) => s.requestTeleport)
  const [open, setOpen] = useState(false)

  return (
    <div className="fasttravel">
      <button
        className="btn btn--ghost"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        Fast travel ▾
      </button>
      {open && (
        <ul className="fasttravel__list">
          {content.islands.map((island) => (
            <li key={island.id}>
              <button
                className="fasttravel__item"
                onClick={() => {
                  requestTeleport(island.id)
                  setOpen(false)
                }}
              >
                <span
                  className="fasttravel__dot"
                  style={{ backgroundColor: island.accentColor }}
                />
                {island.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
