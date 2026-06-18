# 3D Personal Portfolio

An explorable, single-player **open-world style** personal site that runs entirely
in the browser and deploys to **GitHub Pages** as static files. Walk a character
around a 3D world, step into labeled zones, and press **E** to open clean HTML
panels with your content. Phones and no-WebGL browsers automatically get a clean
2D **Classic view**.

> No backend, no multiplayer, no networking — it all builds to static files.

## Tech stack

- **Vite + React + TypeScript**
- **React Three Fiber** (`@react-three/fiber`) — the 3D scene
- **drei** (`@react-three/drei`) — Sky, Grid, Text, loaders, helpers
- **Rapier** (`@react-three/rapier`) — physics + the character controller
- **zustand** — tiny shared state between the 3D scene and the DOM UI

## Controls

| Action | Input |
| --- | --- |
| Move | `W` `A` `S` `D` / arrow keys |
| Jump | `Space` |
| Look around | drag the mouse |
| Zoom | scroll wheel |
| Interact (open a zone's panel) | `E` |
| Close a panel | `Esc` or the × button |

---

## Run it locally

```bash
npm install      # first time only
npm run dev      # start the dev server, then open the printed http://localhost URL
```

Build the static site and preview the production output:

```bash
npm run build    # type-checks then writes static files to ./dist
npm run preview  # serve ./dist locally to sanity-check the build
```

---

## Project structure

```
src/
  content.ts            ← EDIT THIS: all site content (zones, labels, panels, links)
  store.ts              ← shared UI state (zustand)
  App.tsx               ← chooses 3D world vs Classic view; lays out the DOM UI
  main.tsx              ← React entry point

  components/
    Player.tsx          ← physics capsule + third-person character controller
    CameraRig.tsx       ← drag-to-orbit follow camera
    Zone.tsx            ← a zone's 3D marker + floating label
    Avatar.tsx          ← example .glb avatar (not used by default)

  scene/
    World.tsx           ← the <Canvas>
    Experience.tsx      ← ground, physics, sky, lighting, zones, player

  ui/                   ← plain HTML/DOM, layered over the canvas
    LoadingScreen.tsx   ← progress overlay while assets load
    Hud.tsx             ← controls legend + "Press E" prompt
    Panel.tsx           ← the content overlay panel
    PanelOverlay.tsx    ← renders whichever panel is open
    PersistentUI.tsx    ← always-visible Resume button + Classic view switch
    InputManager.tsx    ← global E / Esc handling
    ClassicView.tsx     ← the 2D fallback, rendered from content.ts

  lib/
    paths.ts            ← base-path-aware URL helper for assets/links
    device.ts           ← WebGL + mobile detection
    gltf.ts             ← GLTF loader with Draco support
  hooks/
    useMovementKeys.ts  ← held-key movement state
```

---

## How to update the site (edit `src/content.ts`)

**Everything you see is driven by `src/content.ts`.** You normally never touch the
components. Both the 3D world and the Classic view read from this one file.

### Add or edit a project

Open `src/content.ts` and edit the `panels.projects.projects` array:

```ts
{
  name: 'My New Project',
  description: 'One or two sentences about it.',
  tags: ['React', 'TypeScript'],
  links: [
    { label: 'Live', url: 'https://my-project.com' },
    { label: 'Code', url: 'https://github.com/me/my-project' },
  ],
},
```

### Change your name / tagline / contact / about

Edit the top fields (`name`, `tagline`, `resumeUrl`) and the `panels.about` /
`panels.contact` entries.

### Add your resume

Drop `resume.pdf` into the **`public/`** folder. It's already linked via
`resumeUrl: 'resume.pdf'`. (Or set `resumeUrl` to a full `https://…` URL.)

### Move or restyle a zone

Each entry in `zones` has a `position: [x, y, z]`, an interaction `radius`, a
`label`, and a `color`. Change them and the world updates automatically.

> Link/URL rule: anything that isn't a full URL (`https://…`, `mailto:…`) is
> treated as a file in `public/` and is automatically prefixed with the GitHub
> Pages base path. So `resume.pdf` "just works" on the sub-path.

---

## How to swap in a `.glb` avatar (Draco-ready)

1. Put your model at `public/models/avatar.glb` (Draco-compressed is fine — the
   loader in `src/lib/gltf.ts` already supports it).
2. In `src/components/Player.tsx`, replace the capsule `<mesh>…</mesh>` with
   `<Avatar />` (import it from `../components/Avatar`).
3. Adjust the avatar's `scale`/`position` so its feet sit at the capsule's bottom
   (the capsule's origin is its centre; feet are ~0.9 units below it).

To self-host the Draco decoder (no CDN dependency), copy
`node_modules/three/examples/jsm/libs/draco/` into `public/draco/` and update
`DRACO_DECODER_PATH` in `src/lib/gltf.ts` to `` `${import.meta.env.BASE_URL}draco/` ``.

---

## Deploy to GitHub Pages

This repo ships a workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
that builds and deploys automatically on every push to `main`.

### ⚠️ Step 1 — set the base path (the #1 cause of a blank page)

GitHub Pages serves a **project** repo from a sub-path:
`https://<username>.github.io/<REPO_NAME>/`. Every asset URL must include that
sub-path, so open [`vite.config.ts`](vite.config.ts) and set:

```ts
const REPO_NAME = 'your-repo-name' // ← must match your GitHub repo name exactly
```

Set `base` to `'/'` instead **only if**:
- your repo is literally `<username>.github.io` (a user/org site), **or**
- you use a custom domain (CNAME).

If the base path is wrong, the deployed page loads `index.html` but then 404s on
its JS/CSS and shows a **blank page**. All asset and content paths in this project
already respect the base path, so once `REPO_NAME` is correct, you're set.

### Step 2 — push to `main`

```bash
git add -A
git commit -m "Initial portfolio"
git branch -M main
git remote add origin https://github.com/<username>/<REPO_NAME>.git
git push -u origin main
```

### Step 3 — one-time manual setup in GitHub (required)

After your first push:

1. Go to your repo on GitHub → **Settings** → **Pages**.
2. Under **Build and deployment** → **Source**, choose **GitHub Actions**.

That's it. The next push (or re-running the workflow from the **Actions** tab)
builds and publishes the site. The live URL appears in the workflow's `deploy`
job and under Settings → Pages.

---

## The base-path gotcha (quick reference)

- **Project site** (`user.github.io/REPO/`) → `base: '/REPO/'`
- **User/org site** (`user.github.io`) → `base: '/'`
- **Custom domain** → `base: '/'`
- Reference local files (resume, models) by a **relative** path in `content.ts`
  (e.g. `resume.pdf`, `models/avatar.glb`) — the helpers prefix the base for you.
- Don't hardcode absolute `/asset.png` URLs in your own code; use `asset(...)`
  from `src/lib/paths.ts` or `modelUrl(...)` from `src/lib/gltf.ts`.

---

## Notes & next steps

- **Mobile/low-end**: phones and no-WebGL browsers get the Classic view
  automatically (`src/lib/device.ts`). Desktop users can switch any time with the
  **Classic view** button, and switch back with **Enter 3D world**.
- This is an MVP foundation — obvious next steps: a real `.glb` avatar with walk
  animation, richer environment props, footstep/ambient audio, and per-project
  detail pages.
```
