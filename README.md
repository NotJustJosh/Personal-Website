# 3D Personal Portfolio — Floating Islands

This is my attempt at creating an interesting and interactive portfolio to showcase
the work I've done over the past few years. Walk around, take a look at projects, and explore!
If all of this isn't for you, open up the plaintext view and get the important info fast.

The entire world is **data-driven from one file** (`src/content.ts`). Phones play it
with on-screen controls; browsers that can't run the 3D scene get a fast **plain page**
(`projects/`) built from the same file. It builds to static files and deploys to
**GitHub Pages**.

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
| Jump | `Space` |
| Look around | drag the mouse |
| Zoom | scroll wheel |
| Interact (open an island's panel) | `E` |
| Close a panel | `Esc` or the × button |
| Browse a project's images | click any thumbnail; then `←` / `→`, `Esc` to close |
| Fast-travel | the **Fast travel** menu (top-right) |

### On a phone

Phones (any touch screen, really) get on-screen controls
([`src/ui/TouchControls.tsx`](src/ui/TouchControls.tsx)), and in portrait a card asking
you to turn the phone sideways (with a link to the plain page instead).

| Action | Touch |
| --- | --- |
| Move | the see-through **joystick**, bottom-right (push further to go faster) |
| Jump | **Jump**, bottom-left |
| Interact | **Select**, bottom-left (dimmed when there's nothing in reach) |
| Look around | drag anywhere else on the world |

The controls tutorial slide shows these instead of WASD on a phone (`touchKeys` on the
slide in `content.ts`).

### Testing the phone version on a laptop

**In Chrome, no phone needed.** Run `npm run dev`, open the page, press **F12**, then
**Ctrl+Shift+M** (the "Toggle device toolbar" icon). Pick a phone (e.g. *Pixel 7* or
*iPhone 14 Pro Max*) from the device list at the top and **reload** — the controls
appear, because the emulated phone reports a touch screen. The rotate icon next to the
size switches portrait/landscape. Your mouse acts as one finger: drag the joystick,
click Jump/Select, drag the world to look. (One finger at a time, so you can't walk and
look at once there.)

**On your real phone, over Wi-Fi.** With the laptop and phone on the same network:

```bash
npm run dev:phone     # dev server, reachable from other devices on your network
npm run serve:phone   # or: the production build, the same way
```

Vite prints a **Network** address, e.g. `http://10.0.0.146:5173/Personal-Website/` —
open that on the phone. The first time, Windows may ask whether Node.js can use the
network: allow it on **private** networks. These commands share the site with your local
network only while they run; the plain `npm run dev` / `npm run serve` stay
laptop-only.

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

### Offline (a demo laptop with no Wi-Fi)

The production build makes **no requests to any other site**: three.js and every
library are bundled, and the label font, cloud texture and Draco decoder are served
from this site ([`src/lib/selfHosted.ts`](src/lib/selfHosted.ts)). One command builds it
and serves it locally:

```bash
npm run serve    # build, then serve ./dist at http://localhost:4173/Personal-Website/
```

Open **http://localhost:4173/Personal-Website/** (the 3D world) or
**http://localhost:4173/Personal-Website/projects/** (the plain page). Localhost doesn't
need a network, so this works with Wi-Fi off — run it once while you're still online if
`node_modules` isn't installed yet. Opening `dist/index.html` straight from disk
(`file://`) does **not** work: browsers block module scripts and model loading there.

### Smoke tests

```bash
npm run smoke
```

[`scripts/smoke.mjs`](scripts/smoke.mjs) builds the site, serves `dist/`, and drives the
Chrome already installed on this machine (via `playwright-core`; no browser download —
`SMOKE_BROWSER=msedge npm run smoke` uses Edge). The browser can't resolve any hostname
but `localhost`, so the run is offline and any request to another site fails the test.
It checks the built HTML (titles, link-preview tags, the static intro), the plain page
(no JS / models / textures, blank fields hidden, images sized), the skip links and
keyboard focus, `?nowebgl=1` and a failing renderer, print styles (and writes
`smoke-output/projects-print.pdf`), and phone emulation (pinch-zoom on the plain page;
the rotate card in portrait; in landscape the joystick, Jump and Select show, Select
opens a panel, the joystick walks you off the island, and touches on the 3D canvas reach
the scene instead of zooming). Screenshots go to
`smoke-output/`.

---

## ✦ The most important file: `src/content.ts`

**The entire world is generated from the `islands` array in `src/content.ts`.** Add,
remove, or move an island by editing ONLY that array — no other code changes. Adding an
entry automatically:

- spawns the island geometry at its position,
- adds it to the **fast-travel menu**,
- makes it a valid **fall-respawn** target,
- generates **light-bridges** to the ids in its `neighbors`,
- wires its **interaction zone + content panel**.

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

### Slideshows (the intro deck)

Give an island `slides` and its panel becomes a click-through deck instead of a wall of
text — that's what the hub (`about`) island uses now:

```ts
content: {
  title: 'About',
  slides: [
    { title: "Hi, I'm Josh", subtitle: 'EE + Physics', image: 'images/portrait.jpg' },
    { title: 'What I study', body: ['Short. Two sentences, tops.'] },
    { title: 'Getting around', only: '3d',
      keys: [{ keys: ['W','A','S','D'], label: 'Walk' }, { keys: ['Space'], label: 'Jump' }] },
  ],
}
```

- Navigate with the on-screen **Back / Next**, the dots, or the **← / →** keys.
- Title and subtitle render **above** the image; `hero: true` makes the title
  extra-large and full-width — use it on the opening slide.
- `image` is ONE picture shown at its natural aspect, centred and never cropped
  (a tall portrait just gets narrower rather than losing its head).
- `keys` draws key caps — use it for the controls tutorial.
- `only: '3d'` keeps a slide off the plain page (`only: 'plain'` does the reverse). The
  walk-around tutorial is marked `'3d'`, so plain-page visitors never see it.
- Slides **replace** the island's `body` + `images`; `groups`, `projects` and `links`
  still render underneath.
- The last slide's button closes the panel and drops you into the world.
- In the 3D panel the island's own heading only shows on slide 1 — after that
  each slide carries its own title.

### Copy-to-clipboard links

Add `copy: true` to a link and clicking it copies the value (minus any `mailto:` /
`tel:` prefix) and shows a toast, instead of opening a mail client:

```ts
links: [
  { label: 'Email (click to copy)', url: 'you@example.com', copy: true },
  { label: 'GitHub', url: 'https://github.com/you' },   // normal link
]
```

Works anywhere in the 3D panels. Falls back to a hidden-textarea copy if
the browser blocks the async Clipboard API.

### Formatting prose (descriptions + body text)

Long text gets wrapped across several source lines in `content.ts` just to keep the file
readable — and those wrapping newlines are the *same character* as one you type on
purpose, so a bare newline can't mean "line break". The rules are explicit instead:

| You write | You get |
| --- | --- |
| a line starting with `- ` | a bullet in a list |
| a **blank** line | a new paragraph |
| anything else | flows into the line above, joined with a space |

```ts
description: `- Built the thing
              that does the job
              - Shipped it`,
```
→ two bullets, the first reading "Built the thing that does the job".

A project's `name` is different: there **every** newline breaks, which is what the
multi-line Honors entries rely on.

### Nest content inside a section (`groups`)

When one island holds several distinct things — Resume *and* transcript, say — use
`groups`. Each is a headed block with its own text, gallery and buttons:

```ts
content: {
  title: 'Resources',
  groups: [
    { title: 'Resume',
      body: ['Full resume, kept up to date.'],
      links: [{ label: 'Download Resume (PDF)', url: 'resume.pdf' }] },
    { title: 'Transcript',
      images: ['images/transcript-preview.png'],
      links: [{ label: 'Download Transcript (PDF)', url: 'transcript.pdf' }] },
  ],
}
```

Groups render between the island's body text and its project cards in the 3D panel.

### Add images (projects, papers, articles, anything)

Drop the files into **`public/images/`**, then add an `images` array to any project —
or to an island's `content` for photos that aren't tied to one project:

```ts
{
  name: 'IMU-Based Hand Gesture Interface',
  description: '…',
  images: [
    'images/glove-v2.jpg',                        // simplest form
    { src: 'images/paper.png',                    // …or with extras
      caption: 'Published in JPGSS Vol. 39',
      thumb: 'images/paper-thumb.png',            // lighter file for previews
      href: 'https://example.com/paper.pdf' },    // click-through in the lightbox
  ],
}
```

That one array gives you, with no other changes:

- a **cover thumbnail** (the first image) beside the project's title,
- a **thumbnail strip** on the project card in the 3D panel (the plain page shows each
  image large, with its caption),
- a **full-size gallery** when you click any thumbnail — `←`/`→` to page through,
  captions, an optional link out, `Esc` to close.

Notes:
- The **first** image is the cover (the lead thumbnail). Reorder to change it.
- Paths follow the same rules as links: a file in `/public` (`images/foo.jpg`) or a full
  `https://…` URL. Local files get the GitHub Pages base path automatically.

### Give an orbiting item its own 3D marker

Names stay out of the way: an item's name only pops up while you're next to it, and an
island's own name only while you're at its pedestal. (A platform's district sign, like
"My Work", always shows.)

Each project orbits its island as a small glowing gem. Give it a `model` and that model
takes the gem's place, in the same glowing material (the island's color, brighter when
you walk up to it):

```ts
{ name: 'IMU-Based Hand Gesture Interface…', model: 'models/gloves.glb', … }
```

- Model it as a **flat silhouette, extruded a little, lying flat** (drawn in Blender's
  top view). It's stood up to face the camera and scaled to fit
  `ORBIT.MODEL_WIDTH/HEIGHT` in [`src/config.ts`](src/config.ts).
- The same file can mark several items (the spider marks both the robot and the
  course-assistant role).
- Raised details on a backing piece (the MAPS laser symbol on its triangle) can get lost
  in the glow. `modelBackingGlow: 0.4` dims the backing piece — the part furthest back,
  found by geometry, so it works even when the model is one joined mesh — and only the
  details brighten when you walk up.
- The models are fetched with the rest of the world, so they never pop in late. A
  missing or broken file just shows the gem instead.

### Photos: originals vs. what ships

The big photos are served as WebP. Their originals live in `assets-src/images/` (kept in
the repo, never deployed); [`scripts/compress-images.py`](scripts/compress-images.py)
re-encodes them into `public/images/` at the same resolution:

```bash
python scripts/compress-images.py              # all of them (needs: pip install pillow)
python scripts/compress-images.py gloves.png   # just one
```

To add a new photo, drop the original in `assets-src/images/`, add its name to `PHOTOS`
in the script, run it, and point `content.ts` at the `.webp`.

### Add a video (phone clip → web)

Compress a phone clip to 720p H.264 with `faststart` (so it starts playing before it's
fully downloaded), then grab a poster frame:

```bash
# Shorter side 720 px, whichever way the phone was held. Add -an to drop the audio.
ffmpeg -i clip.mov -vf "scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)'" -c:v libx264 -preset slow -crf 23 -profile:v high -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart public/videos/gloves-demo.mp4

# Poster: the frame 2 seconds in.
ffmpeg -ss 2 -i public/videos/gloves-demo.mp4 -frames:v 1 -q:v 3 public/images/gloves-demo-poster.jpg
```

```ts
video: { src: 'videos/gloves-demo.mp4', poster: 'images/gloves-demo-poster.jpg',
         caption: '…' },
```

The file is self-hosted, so it plays offline. On the plain page it gets controls and
never autoplays (`playsinline`, `preload="metadata"`, the poster until you press play);
in the 3D card it keeps its muted loop.

### Remove an island
Delete its entry **and** remove its id from any other island's `neighbors`.

---

## The plain page (`projects/`)

A fast, plain-HTML version of the portfolio at `projects/` — no script bundle, no
three.js, no models. It's rendered to static HTML **at build time from the same
`src/content.ts`** (by [`plugins/plain-page.ts`](plugins/plain-page.ts)), so there's
still only one place to edit text. In dev it's re-rendered on every request.

It shows Projects, Experience and About:

- **Projects**: the ids in `plainPage.leadProjects` first (gloves, lab, rov), then the
  rest of the Projects island in order. `plainPage.extraProjects` holds write-ups that
  exist **only** on this page (the lab and ROV entries) — putting them on an island
  would add orbiting items to the 3D world.
- **Experience**: the Experience island's entries (title, date, `summary`, description).
- **About**: the About island's slides (minus `only: '3d'` ones), the Honors list, and
  the Resources island's download links. The intro shows the hero slide's portrait (its
  small `thumb`) and the site `tagline`; projects show their tags as a line of text.


Every project has an `id`, which is its anchor — link straight to one with
`projects/#gloves`.

### Loading screen, skip links and the WebGL fallback

- The 3D world's **loading screen** is static HTML baked into `index.html` from
  `content.ts` — your name, `oneLiner`, résumé / GitHub / LinkedIn / email, and
  **Skip to projects** — so it's readable before any JavaScript runs. It fades once the
  scene is ready ([`src/lib/boot.ts`](src/lib/boot.ts)).
- A **Skip to projects** link stays in the scene's top-left corner, first in tab order
  and above any open panel.
- [`src/main.tsx`](src/main.tsx) checks for WebGL 2 with three.js's own helper
  **before** downloading the 3D bundle. No WebGL 2, or a renderer that throws while
  being created ([`World.tsx`](src/scene/World.tsx)), sends the visitor to
  `projects/?reason=webgl`, which shows a one-line notice (`plainPage.fallbackNotice`).
  If the GPU drops the context mid-visit, a notice appears under the skip link.
- **Test the fallback** with `?nowebgl=1`, e.g. `http://localhost:5173/Personal-Website/?nowebgl=1`.

### Write-up fields

Projects take these extra fields; the 3D panels ignore them:

```ts
{
  id: 'gloves',
  summary: 'One line: what it is.',
  problem: '',            // prose — same "- " bullet / blank-line rules as description
  hardPart: '',
  scope: '',              // what you personally did
  decisions: [
    { question: 'Why I2C rather than SPI?', answer: '' },   // question = subheading
  ],
  results: '',
  rev2: '',
  // Evidence = the project's existing `images` (+ optional `video`), shared with
  // the 3D card. Give each image `alt` text; until then its caption stands in.
}
```

**Blank fields don't render** — no empty headings, and a decision with a blank answer
is hidden — so nothing half-written ships. `npm run dev` (on start and on every
`content.ts` save) and `npm run build` print every blank field:

```
Plain page: 64 blank fields in src/content.ts (hidden on projects/ until written):
  gloves   problem, hardPart, decisions 1-7 (answer), images 1-2 (alt; caption stands in), …
```

Links to template placeholders (`github.com/yourname/…`, `example.com`) are left off
the plain page and called out in that list.

**Printing** `projects/` (Ctrl/Cmd+P → Save as PDF) gives a clean handout: white
paper, no navigation, each project on its own page, figures never split, link URLs
written out after the link text, and any video replaced by its poster plus its URL.

Page titles, descriptions and link-preview (Open Graph) tags for both pages live in
`content.meta`; the plugin bakes them into the HTML. Styles are in
[`projects/plain.css`](projects/plain.css), inlined into the page at build time.

---

## Tuning the feel

| What | Where |
| --- | --- |
| Walk speed, jump speed | constants at the top of [`src/components/Player.tsx`](src/components/Player.tsx) |
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

Draco compression is already configured in [`src/lib/gltf.ts`](src/lib/gltf.ts), with the
decoder self-hosted in `public/draco/` (copied from
`node_modules/three/examples/jsm/libs/draco/gltf/`). Meshopt-compressed models also work
offline with no setup — drei bundles the decoder.

---

## Project structure

```
index.html              ← the 3D world's page (head tags baked in from content.ts)
projects/
  index.html            ← the plain page's template (body baked in from content.ts)
  plain.css             ← its styles, inlined at build time
assets-src/images/      ← full-quality originals of the WebP photos (not deployed)
scripts/
  compress-images.py    ← originals → WebP in public/images/
  smoke.mjs             ← npm run smoke: offline end-to-end checks
plugins/
  site-pages.ts         ← Vite plugin: bakes content.ts into both HTML pages
  plain-page.ts         ← renders the plain page + lists its blank fields
  html.ts, image-size.ts
src/
  content.ts            ← EDIT THIS: the islands array = the whole world
  config.ts             ← world border, respawn Y, gravity, island dimensions
  store.ts              ← shared UI/teleport/fade state (zustand)
  main.tsx              ← entry: WebGL 2 check, then loads start.tsx (the app)
  App.tsx               ← the 3D world + its DOM UI layout
  scene/
    World.tsx           ← the <Canvas> + pale-void background/fog
    Experience.tsx      ← islands + bridges + border + lights + player + camera
  components/
    Island.tsx          ← one island (collider, slab, accent light, label) from data
    OrbitingItems.tsx   ← per-project icons circling an island (+ image previews)
    ItemPreview.tsx     ← the small framed cover image floating over an item
    Bridge.tsx          ← procedural walkable light-bridge between two islands
    WorldBorder.tsx     ← faint shimmer wall at the playable edge
    Player.tsx          ← controller: move/jump/respawn/border/teleport
    CameraRig.tsx       ← orbit camera w/ pitch clamp + raycast anti-clip
    Avatar.tsx          ← example .glb avatar (not used by default)
  ui/                   ← plain HTML/DOM over the canvas
    LoadingScreen, Hud, Panel, PanelOverlay, PersistentUI, SkipLink, TouchControls,
    FastTravelMenu, FadeOverlay, InputManager
    ProjectCard.tsx     ← one project card in a Panel
    Gallery.tsx         ← image thumbnails + the full-size lightbox
    ContentGroups.tsx   ← nested sub-sections (`groups`) inside an island
    RichText.tsx        ← "- " bullets / blank-line paragraphs in prose
    Slides.tsx          ← the click-through slide deck (`slides`)
    ContentLink.tsx     ← a link, or a copy-to-clipboard button (`copy: true`)
    Toast.tsx           ← transient "Copied …" notification
  lib/
    world.ts            ← derived helpers: bridges, nearest island, spawn, panel adapter
    paths.ts, url.ts    ← base-path-aware URL helper
    prose.ts            ← "- " bullets / paragraphs rules (shared with the plain page)
    clipboard.ts        ← clipboard copy with a legacy fallback
    media.ts            ← normalizes content.ts `images` entries into real URLs
    touch.ts            ← touch-screen detection + the joystick/jump state
    fallback.ts         ← the way out to the plain page (+ ?nowebgl=1)
    boot.ts             ← drives the static loading screen in index.html
    gltf.ts             ← GLTF loader with Draco support
  hooks/
    useMovementKeys.ts  ← held-key movement state (WASD/arrows + Space)
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

- **Mobile:** phones play the 3D world with on-screen controls (see *On a phone*).
  Slower phones and desktops can use **Reduce graphics** (top-right).
- The build prints a chunk-size warning — that's Three.js + Rapier's WASM (~1.2 MB
  gzipped), normal for a 3D app, not an error.
- This is an MVP foundation. Obvious next steps: a real `.glb` avatar with walk
  animation, richer island set-dressing, ambient audio, and per-project detail pages.
```
