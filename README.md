# 3D Personal Portfolio — Floating Islands

An explorable, single-player **open-world style** personal site: a world of **floating
islands in a soft pale void**, connected by light-bridges. Walk a character across the
islands, step onto one, and press **E** to open a clean HTML panel with that section's
content. The entire world is **data-driven from one file** (`src/content.ts`). Phones and
no-WebGL browsers automatically get a clean, scrollable 2D **Classic view** with a nav
menu. It builds to static files and deploys to **GitHub Pages**.

> No backend, no multiplayer, no networking — it all builds to static files.

## Tech stack

- **Vite + React + TypeScript**
- **React Three Fiber** (`@react-three/fiber`) — the 3D scene
- **drei** (`@react-three/drei`) — Text, loaders, helpers
- **Rapier** (`@react-three/rapier`) — physics + the character controller
- **zustand** — shared state between the 3D scene and the DOM UI

## Controls

| Action | Input |
| --- | --- |
| Move | `W` `A` `S` `D` / arrow keys |
| Sprint | hold `Shift` |
| Jump / double-jump | `Space` (twice) |
| Look around | drag the mouse |
| Zoom | scroll wheel |
| Interact (open an island's panel) | `E` |
| Close a panel | `Esc` or the × button |
| Fast-travel | the **Fast travel** menu (top-right) |

Fall off the world? You're gently respawned on the nearest island — no penalty.

---

## Run it locally

```bash
npm install      # first time only
npm run dev      # then open the printed http://localhost URL
```

Build the static site and preview the production output:

```bash
npm run build    # type-checks, then writes static files to ./dist
npm run preview  # serve ./dist locally to sanity-check the build
```

---

## ✦ The most important file: `src/content.ts`

**The entire world is generated from the `islands` array in `src/content.ts`.** Add,
remove, or move an island by editing ONLY that array — no other code changes. Adding an
entry automatically:

- spawns the island geometry at its position,
- adds it to the **fast-travel menu**,
- makes it a valid **fall-respawn** target,
- generates **light-bridges** to the ids in its `neighbors`,
- wires its **interaction zone + content panel**,
- adds it to the **Classic view** page and its **nav menu**.

### Add an island

Append an object to `islands`:

```ts
{
  id: 'blog',                      // unique id (referenced by other islands' neighbors)
  label: 'Blog',                   // floating label + menu name
  position: [40, 6, -20],          // [x, y, z]; y is the surface height
  accentColor: '#c77dff',          // color washing the island + its bridges/label
  size: 7,                         // island radius (optional; default in src/config.ts)
  neighbors: ['about'],            // light-bridges are drawn to these island ids
  content: {
    body: ['A paragraph or two...'],
    projects: [/* optional cards */],
    links: [{ label: 'RSS', url: 'https://…' }],
  },
  // model: 'models/blog.glb',      // optional .glb in /public (Draco supported)
}
```

Rules:
- Exactly **one** island has `isHub: true` — that's the **spawn point** (currently `about`).
- `neighbors` is **bidirectional & de-duplicated** — list a bridge on either island.
- A typo'd neighbor id is skipped with a console warning (it never crashes the world).
- Link URLs: a full `https://…`, a bare email (auto-`mailto:`), or a file in `/public`
  (e.g. `resume.pdf`) — local files get the GitHub Pages base path automatically.

### Remove an island
Delete its entry **and** remove its id from any other island's `neighbors`.

---

## Tuning the feel

| What | Where |
| --- | --- |
| Walk speed, sprint speed, jump speed, **jump count (double jump)** | constants at the top of [`src/components/Player.tsx`](src/components/Player.tsx) |
| **World-border size**, fall-**respawn** Y, gravity | [`src/config.ts`](src/config.ts) (`WORLD`) |
| Default island radius / thickness | [`src/config.ts`](src/config.ts) (`ISLAND`) |
| Camera distance, pitch clamp, sensitivity, anti-clip padding | constants at the top of [`src/components/CameraRig.tsx`](src/components/CameraRig.tsx) |
| Void color / fog distance | [`src/scene/World.tsx`](src/scene/World.tsx) |

`WORLD.BORDER_RADIUS` is the single constant controlling the world border; the faint
shimmer wall ([`WorldBorder.tsx`](src/components/WorldBorder.tsx)) and the player's clamp
both read it.

---

## Swap in a `.glb` avatar or island model

- **Avatar:** put your model at `public/models/avatar.glb`, then in
  [`Player.tsx`](src/components/Player.tsx) replace the capsule `<mesh>` with `<Avatar />`
  (from [`components/Avatar.tsx`](src/components/Avatar.tsx)). Adjust `scale`/`position` so
  the feet sit at the capsule bottom (~0.9 units below its centre).
- **Island set dressing:** set `model: 'models/your-thing.glb'` on an island in
  `content.ts`. It loads in place of the placeholder crystal.

Draco compression is already configured in [`src/lib/gltf.ts`](src/lib/gltf.ts). To
self-host the decoder (no CDN), copy `node_modules/three/examples/jsm/libs/draco/` into
`public/draco/` and point `DRACO_DECODER_PATH` at `` `${import.meta.env.BASE_URL}draco/` ``.

---

## Project structure

```
src/
  content.ts            ← EDIT THIS: the islands array = the whole world
  config.ts             ← world border, respawn Y, gravity, island dimensions
  store.ts              ← shared UI/teleport/fade state (zustand)
  App.tsx               ← 3D world vs Classic view; DOM UI layout
  scene/
    World.tsx           ← the <Canvas> + pale-void background/fog
    Experience.tsx      ← islands + bridges + border + lights + player + camera
  components/
    Island.tsx          ← one island (collider, slab, accent light, label) from data
    Bridge.tsx          ← procedural walkable light-bridge between two islands
    WorldBorder.tsx     ← faint shimmer wall at the playable edge
    Player.tsx          ← controller: move/sprint/double-jump/respawn/border/teleport
    CameraRig.tsx       ← orbit camera w/ pitch clamp + raycast anti-clip
    Avatar.tsx          ← example .glb avatar (not used by default)
  ui/                   ← plain HTML/DOM over the canvas
    LoadingScreen, Hud, Panel, PanelOverlay, PersistentUI,
    FastTravelMenu, FadeOverlay, InputManager, ClassicView
  lib/
    world.ts            ← derived helpers: bridges, nearest island, spawn, panel adapter
    paths.ts            ← base-path-aware URL helper
    device.ts           ← WebGL + mobile detection
    gltf.ts             ← GLTF loader with Draco support
  hooks/
    useMovementKeys.ts  ← held-key movement state (incl. Shift sprint)
```

---

## Deploy to GitHub Pages

The workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and
deploys automatically on every push to `main`.

### ⚠️ Step 1 — set the base path (the #1 cause of a blank page)

GitHub Pages serves a **project** repo from a sub-path
(`https://<username>.github.io/<REPO_NAME>/`), so every asset URL must include it. Open
[`vite.config.ts`](vite.config.ts) and set:

```ts
const REPO_NAME = 'your-repo-name' // ← must match your GitHub repo name exactly
```

Set `base` to `'/'` instead **only if** your repo is `<username>.github.io` (a user/org
site) or you use a custom domain. All asset/content/model/resume paths in this project
already respect the base path, so once `REPO_NAME` is correct you're set.

### Step 2 — push to `main`

```bash
git add -A
git commit -m "Floating-islands portfolio"
git branch -M main
git remote add origin https://github.com/<username>/<REPO_NAME>.git
git push -u origin main
```

### Step 3 — one-time GitHub setting (required)

Repo → **Settings** → **Pages** → **Build and deployment** → **Source** →
**GitHub Actions**. The next push builds and publishes; the live URL appears in the
workflow's `deploy` job and under Settings → Pages.

---

## Notes

- **Mobile/low-end:** phones and no-WebGL browsers get the Classic view automatically
  ([`lib/device.ts`](src/lib/device.ts)); desktop users can toggle any time.
- The build prints a chunk-size warning — that's Three.js + Rapier's WASM (~1.2 MB
  gzipped), normal for a 3D app, not an error.
- This is an MVP foundation. Obvious next steps: a real `.glb` avatar with walk
  animation, richer island set-dressing, ambient audio, and per-project detail pages.
```
