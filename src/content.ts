// ─────────────────────────────────────────────────────────────────────────────
//  src/content.ts — THE SINGLE SOURCE OF TRUTH FOR THE WHOLE WORLD
// ─────────────────────────────────────────────────────────────────────────────
//  The entire site is generated from the `islands` array below. Editing it is
//  the ONLY thing you need to do to add/remove/move a section. Adding an entry
//  automatically:
//    • spawns the island geometry at its position,
//    • adds it to the fast-travel menu,
//    • makes it a valid fall-respawn target,
//    • generates light-bridges to the ids listed in its `neighbors`,
//    • wires its interaction zone + content panel,
//    • (projects / experience / about / honors / resources also feed the
//      plain page at projects/ — see `plainPage` at the bottom).
//
//  ─── HOW TO ADD A NEW ISLAND ───────────────────────────────────────────────
//  Append an object to `islands`:
//
//    {
//      id: 'blog',                          // unique id (used in `neighbors`)
//      label: 'Blog',                       // shown on the floating label + menus
//      position: [40, 6, -20],              // [x, y, z]; y is the surface height
//      accentColor: '#c77dff',              // color washing the island
//      size: 7,                             // island radius (optional, default 7)
//      neighbors: ['about'],                // bridges are drawn to these ids
//      content: {                           // the panel/section content
//        body: ['Some paragraphs...'],
//        links: [{ label: 'RSS', url: 'https://…' }],
//      },
//      // model: 'models/blog.glb',         // optional .glb in /public (Draco ok)
//    }
//
//  ─── PUTTING SEVERAL SECTIONS ON ONE LANDMASS ──────────────────────────────
//  Set `platform: true` on a big island to make it pure scenery (ground only —
//  no pedestal, no panel, hidden from the menus). Then give the sections that
//  live on it `onPlatform: true` plus the platform's `y`, and they'll render
//  their pedestal + label + panel with no ground of their own.
//
//    { id: 'showcase', label: 'My Work', platform: true, size: 20,
//      position: [0, 3, 42], neighbors: ['about'] },
//    { id: 'projects', onPlatform: true, size: 5, position: [-11, 3, 38], … },
//
//  Keep the pedestals far enough apart that their interaction zones
//  (`size` + 1) don't overlap, or walking between them gets ambiguous.
//
//  Rules:
//    • Exactly ONE island should have `isHub: true` — that's the spawn point.
//    • `neighbors` is bidirectional & de-duplicated, so list a bridge on either
//      island (you don't need to list it on both).
//    • Bridges RAMP between islands of different `y`, staying flush with both
//      ends (they tilt up/down but never bank). Same-height neighbors just get a
//      flat bridge. Keep slopes reasonable so they're comfortable to walk up.
//    • Tune movement speeds in src/components/Player.tsx and world size / respawn
//      in src/config.ts.
//
//  ─── FORMATTING PROSE (descriptions + body) ────────────────────────────────
//  Long text is wrapped across source lines here just to keep this file
//  readable, and those wrapping newlines are the SAME character as a literal
//  "\n" that you type on purpose — so a bare newline can NOT mean
//  "line break". The rules are explicit instead:
//
//    • a line starting with "- "  → a bullet in a list
//    • a BLANK line               → a new paragraph
//    • anything else              → flows into the line above
//
//  So this:
//      description: `- Built the thing
//                    that does the job
//                    - Shipped it`
//  renders as two bullets, the first reading "Built the thing that does the job".
//
//  (A project's `name`/`title` is different — there EVERY newline breaks, which
//  is what the multi-line Honors entries below rely on.)
//
//  ─── SLIDESHOWS (the intro deck) ───────────────────────────────────────────
//  Give an island `slides` and its panel becomes a click-through deck instead
//  of a wall of text. Each slide can carry a title, a subtitle, a little body,
//  ONE big image, key-cap rows (for a controls tutorial) and buttons:
//
//    slides: [
//      { hero: true, title: 'Josh Yuen', subtitle: 'EE + Physics',
//        image: 'images/me.jpg' },
//      { title: 'What I do', body: ['- Optics', '- Embedded systems'] },
//      { title: 'Moving around', only: '3d',
//        keys: [{ keys: ['W', 'A', 'S', 'D'], label: 'Walk' }] },
//    ]
//
//  Title and subtitle always render ABOVE the image. `hero: true` makes the
//  title extra-large + full-width — use it on the opening slide.
//  Navigate with the on-screen arrows, the dots, or the ← / → keys.
//  `only: '3d'` keeps a slide out of the plain page (projects/), which shows
//  the deck as headed paragraphs — use it for the walk-around tutorial, which
//  means nothing in 2D. `only: 'plain'` does the reverse.
//  Slides REPLACE the island's `body` + `images`; `groups`, `projects` and
//  `links` still render underneath.
//
//  ─── NESTING CONTENT IN A SECTION ──────────────────────────────────────────
//  Use `groups` when one island holds several distinct things (see Resume
//  below). Each group is a headed block with its own body, images and links:
//
//    groups: [
//      { title: 'Transcript',
//        body: ['Unofficial transcript.'],
//        images: ['images/transcript-preview.png'],
//        links: [{ label: 'Download (PDF)', url: 'transcript.pdf' }] },
//    ]
//
//  ─── HOW TO ADD IMAGES ─────────────────────────────────────────────────────
//  Drop the files in public/images/, then reference them by path. Any project
//  (and any island) can take an `images` array:
//
//    images: [
//      'images/glove-v2.jpg',                        // simplest form
//      { src: 'images/paper.png',                    // …or with extras
//        caption: 'Published in JPGSS Vol. 39',
//        thumb: 'images/paper-thumb.png',            // lighter file for previews
//        href: 'https://example.com/paper.pdf' },    // click-through in the lightbox
//    ]
//
//  What you get for free:
//    • the FIRST image is the cover thumbnail beside the project's title,
//    • a thumbnail strip on the project card in the 3D panel; clicking any
//      thumbnail opens a full-size gallery with ←/→ arrows, captions, and Esc
//      to close (the plain page shows them large, one per figure),
//    • island-level `content.images` for photos that aren't tied to one project.
//
//  ─── A 3D MARKER FOR AN ORBITING ITEM ──────────────────────────────────────
//  Give a project `model: 'models/foo.glb'` and that model orbits the island
//  in place of the item's glowing gem, in the same glowing material (the
//  island's accent color, brighter when you walk up to it). Model it as a flat
//  silhouette, extruded a little, lying flat — it's stood up to face the camera
//  and scaled to fit ORBIT.MODEL_WIDTH/HEIGHT. The same file can mark several
//  items.
//
//  ─── HOW TO ADD A LOOPING VIDEO ────────────────────────────────────────────
//  For things better shown moving. Drop the clip in public/videos/, then give
//  the project a `video` (one per card, rendered under the thumbnails):
//
//    video: 'videos/spider-robot.mp4'               // simplest form
//    video: { src: 'videos/spider-robot.mp4',       // …or with extras
//             poster: 'images/spider-robot.jpg',    // still shown while loading
//             caption: 'Gait test — servo PWM from the DE10-Nano' }
//
//  It autoplays MUTED and loops forever — browsers block autoplay with sound,
//  so any audio track is ignored. Keep clips to 3-8 seconds and a few MB; they
//  load with the card, and Pages caps a single file at 100 MB. Anyone with
//  "reduce motion" set gets a paused frame plus controls instead.
//  (On the plain page the same clip gets controls and never autoplays.)
//
//  ─── THE PLAIN PAGE (projects/) ────────────────────────────────────────────
//  This file also feeds a plain-HTML version of the site at projects/, built
//  without three.js. Projects there take extra write-up fields (`summary`,
//  `problem`, `hardPart`, `scope`, `decisions`, `results`, `rev2` — see the
//  Project interface); the 3D panels ignore them. Blank ones don't render, and
//  `npm run dev` / `npm run build` print the list of what's still blank.
//  Order and plain-page-only entries: `plainPage`, at the very bottom.
// ─────────────────────────────────────────────────────────────────────────────

import { ZONE_ACCENTS } from './config'

export type IslandId = string

export interface LinkItem {
  label: string
  /** Absolute URL (https://…, mailto:…), a bare email, OR a file in /public. */
  url: string
  /**
   * When true, clicking COPIES `url` to the clipboard (minus any mailto:/tel:
   * prefix) and shows a toast, instead of navigating. Handy for an email
   * address you'd rather hand over as text than open a mail client with.
   */
  copy?: boolean
  /** Optional short glyph (letter/number/symbol) for the orbiting icon. */
  icon?: string
}

/**
 * An image entry. Write it as a bare string for the simple case:
 *
 *     images: ['images/rover.jpg', 'images/rover-2.jpg']
 *
 * …or as an object when you want a caption / a lighter thumbnail / a link:
 *
 *     images: [
 *       { src: 'images/paper.png', caption: 'Published in JPGSS Vol. 39',
 *         thumb: 'images/paper-thumb.png', href: 'https://…' },
 *     ]
 *
 * `src`/`thumb`/`href` follow the same rules as link URLs: a full https:// URL,
 * or a file dropped in /public (e.g. 'images/foo.jpg') — local files get the
 * GitHub Pages base path added automatically.
 */
export interface MediaItem {
  /** Full-size image: a file in /public (e.g. 'images/foo.jpg') or a full URL. */
  src: string
  /**
   * What the image shows, for screen readers. The plain page needs it; until
   * it's written the caption stands in, and the build lists it as empty.
   */
  alt?: string
  /** Caption shown under the image in the gallery + lightbox. Doubles as alt text. */
  caption?: string
  /** Optional smaller file for thumbnails + the 3D preview. Defaults to `src`. */
  thumb?: string
  /** Optional click-through (the paper PDF, the article, the repo…). */
  href?: string
}

/** An image, written either as a bare URL string or as a full {@link MediaItem}. */
export type Media = string | MediaItem

/**
 * A short looping clip — the video counterpart of {@link MediaItem}. Drop the
 * file in public/videos/ and reference it by path:
 *
 *     video: 'videos/spider-robot.mp4'
 *
 * …or as an object for a caption / a still frame to show while it loads:
 *
 *     video: { src: 'videos/spider-robot.mp4',
 *              poster: 'images/spider-robot.jpg',
 *              caption: 'Gait test — servo PWM driven from the DE10-Nano' }
 *
 * It plays muted and loops forever (browsers only allow autoplay without
 * sound), so keep it SHORT — a few seconds of the thing actually moving. Same
 * path rules as everything else: a file in /public, or a full https:// URL.
 */
export interface VideoItem {
  /** The clip: a file in /public (e.g. 'videos/foo.mp4') or a full URL. */
  src: string
  /** Caption shown under the clip. Doubles as the accessible label. */
  caption?: string
  /** Still frame shown before the video loads. Defaults to none. */
  poster?: string
}

/** A clip, written either as a bare URL string or as a full {@link VideoItem}. */
export type Video = string | VideoItem

export interface Project {
  name: string
  /** Label shown on the orbiting bubble in the 3D world. Defaults to `name`. */
  short?: string
  /** Optional — omit for compact entries like Honors. */
  description?: string
  /** When it happened, e.g. "2024" or "May–Aug 2024". Shown next to the title. */
  date?: string
  tags?: string[]
  links?: LinkItem[]
  /**
   * Screenshots, photos, paper/article previews… The FIRST image doubles as the
   * cover thumbnail shown beside the card's title. Clicking any thumbnail opens
   * the gallery.
   */
  images?: Media[]
  /**
   * A short looping clip, rendered under the thumbnails on this card. Plays
   * muted on repeat — for showing hardware actually moving. See {@link VideoItem}.
   */
  video?: Video
  /** Optional short glyph (letter/number/symbol) for the orbiting icon. */
  icon?: string
  /**
   * A .glb in /public (e.g. 'models/gloves.glb') that orbits the island in
   * place of this item's gem, in the gem's glowing material. A flat, lightly
   * extruded silhouette modelled lying flat works best.
   */
  model?: string
  /**
   * Dim the model's BACKING piece — the part furthest back that raised details
   * sit on (the MAPS triangle behind its laser symbol) — to this fraction of the
   * resting glow, so the details read. It stays that dim when you walk up; only
   * the details brighten. E.g. 0.4. Omit for an even glow.
   */
  modelBackingGlow?: number

  // ── Plain-page write-up (projects/) ─────────────────────────────────────
  // Everything below is read ONLY by the plain page; the 3D panels ignore it.
  // Blank fields don't render, so nothing half-written ships — and `npm run
  // dev` / `npm run build` print every blank one so you know what's left.
  // Evidence is this project's `images` + `video` above (shared with the 3D
  // card), each image ideally with `alt` text.

  /** Anchor on the plain page, for deep links: projects/#gloves. */
  id?: string
  /** One line: what it is. Shown right under the title. */
  summary?: string
  /** The problem it solves. Prose, same formatting rules as `description`. */
  problem?: string
  /** What made it hard. */
  hardPart?: string
  /** What you personally did. */
  scope?: string
  /** Design questions and your answers. A question with a blank answer is hidden. */
  decisions?: Decision[]
  /** What it achieved. */
  results?: string
  /** What you'd change in the next revision. */
  rev2?: string
}

/** One design decision on the plain page: the question renders as a subheading. */
export interface Decision {
  question: string
  answer: string
}

/** One row of a controls tutorial: some key caps and what they do. */
export interface KeyHint {
  /** Key caps, drawn left to right — e.g. ['W', 'A', 'S', 'D'] or ['Esc']. */
  keys: string[]
  /** What those keys do, shown next to them. */
  label: string
}

/**
 * One card in an island's slideshow. Give an island `slides` and its panel
 * becomes a click-through deck instead of a wall of text — an intro, a tour,
 * a tutorial. Keep each slide SHORT; that's the whole point.
 *
 *     slides: [
 *       { title: 'Josh Yuen', subtitle: 'EE + Physics', image: 'images/me.jpg' },
 *       { title: 'What I do', body: ['- Optics', '- Embedded'] },
 *       { title: 'Moving around',
 *         keys: [{ keys: ['W','A','S','D'], label: 'Move' }] },
 *     ]
 */
export interface Slide {
  /** Big heading. */
  title?: string
  /** Smaller line under the title — a tagline, a date, a one-liner. */
  subtitle?: string
  /** Paragraphs. Supports "- " bullets, same as everywhere else. */
  body?: string[]
  /** ONE image, shown large (not a thumbnail), UNDER the title/subtitle. */
  image?: Media
  /**
   * Hero treatment: renders the title extra-large and full-width. Use it on the
   * opening slide of a deck.
   */
  hero?: boolean
  /** Key-cap rows — use these for the movement/controls tutorial slides. */
  keys?: KeyHint[]
  /** Buttons at the bottom of the slide. */
  links?: LinkItem[]
  /**
   * Limit this slide to one view: the 3D world's panel, or the plain page
   * (projects/), which shows the deck as ordinary headed paragraphs. Tutorial
   * slides about walking around only make sense in 3D, so mark those
   * `only: '3d'`. Omit to show the slide in both.
   */
  only?: '3d' | 'plain'
}

/**
 * A nested sub-section inside an island — its own heading, prose, gallery and
 * buttons. Use it when one island holds several distinct things: a Resume
 * island with Resume / Transcript / Course list, a Contact island grouped by
 * channel, and so on.
 *
 *     groups: [
 *       { title: 'Resume',
 *         body: ['Updated August 2026.'],
 *         links: [{ label: 'Download Resume (PDF)', url: 'resume.pdf' }] },
 *       { title: 'Transcript',
 *         images: ['images/transcript-preview.png'],
 *         links: [{ label: 'Download Transcript (PDF)', url: 'transcript.pdf' }] },
 *     ]
 */
export interface ContentGroup {
  /** Sub-heading for this group. */
  title: string
  /** Paragraphs (supports "- " bullets, same as a project description). */
  body?: string[]
  /** Thumbnails for this group — click to open the full-size gallery. */
  images?: Media[]
  /** Buttons at the bottom of the group (downloads, external links…). */
  links?: LinkItem[]
}

/** Content shown in an island's panel in the 3D world. */
export interface PanelContent {
  title: string
  body?: string[]
  /** Island-level gallery, shown under the body text (before the project cards). */
  images?: Media[]
  /** A click-through slideshow. When present it REPLACES `body` + `images`. */
  slides?: Slide[]
  /** Nested sub-sections, each with its own heading/prose/gallery/buttons. */
  groups?: ContentGroup[]
  projects?: Project[]
  links?: LinkItem[]
}

/** Like PanelContent, but `title` is optional (defaults to the island label). */
export interface IslandContent {
  title?: string
  body?: string[]
  /** Island-level gallery, shown under the body text (before the project cards). */
  images?: Media[]
  /** A click-through slideshow. When present it REPLACES `body` + `images`. */
  slides?: Slide[]
  /** Nested sub-sections, each with its own heading/prose/gallery/buttons. */
  groups?: ContentGroup[]
  projects?: Project[]
  links?: LinkItem[]
}

export interface Island {
  /** Unique id, referenced by other islands' `neighbors`. */
  id: IslandId
  /** Floating label + menu name. */
  label: string
  /** World position [x, y, z]. `y` is the island's top surface height. */
  position: [number, number, number]
  /** Accent color washing the island + its label/bridges. */
  accentColor: string
  /** Island disk radius (world units). Defaults to ISLAND.RADIUS in config.ts. */
  size?: number
  /** Set on exactly one island — the spawn point. */
  isHub?: boolean
  /**
   * Scenery that HOLDS other islands. It renders ground, a collider and its
   * accent light, but no pedestal and no panel, and it's kept out of the
   * fast-travel menu. Use it to put several sections on
   * one landmass — see the "Showcase" island below.
   */
  platform?: boolean
  /**
   * This island SITS ON a platform: no ground or collider of its own (the
   * platform provides both), but it keeps its pedestal, label, orbiting items,
   * panel and fast-travel entry.
   *
   * Give it the SAME `y` as its platform, and a `size` small enough that the
   * interaction zones of the pedestals sharing the platform don't overlap.
   */
  onPlatform?: boolean
  /** Ids this island connects to via light-bridges (bidirectional). */
  neighbors: IslandId[]
  /** When true, the island's items orbit it as clickable icons. */
  orbit?: boolean
  /** The panel/section content. */
  content: IslandContent
  /** Optional .glb under /public for set dressing (Draco supported). */
  model?: string
  /**
   * Ground mesh for this island. Defaults to 'models/island.glb'. The physics
   * collider is built from whatever you put here, so a differently-shaped
   * landmass just works — it's scaled so its X extent matches `size` × 2.
   */
  groundModel?: string
  /**
   * Spin the ground mesh this many degrees about Y. Baked into the geometry, so
   * the physics hull turns with it. Handy for pointing an irregular landmass a
   * particular way without touching the model.
   */
  groundRotation?: number
}

/**
 * The <title>, description and link-preview (Open Graph / Twitter) tags for one
 * HTML page. These are baked into the raw HTML at build time, so they exist
 * before any JavaScript runs — which is what link unfurlers and search engines
 * read.
 */
export interface PageMeta {
  /** Browser-tab and search-result title. */
  title: string
  /** Search-result snippet. */
  description: string
  /** Title on a pasted link's preview card (Slack, LinkedIn, iMessage…). */
  ogTitle: string
  /** Description on a pasted link's preview card. */
  ogDescription: string
  /** The page's public URL — becomes og:url and the canonical link. */
  url: string
}

export interface SiteMeta {
  /**
   * Link-preview image, 1200×630. Must be an ABSOLUTE URL (preview bots don't
   * resolve relative ones); drop the file in /public so it deploys there.
   */
  ogImage: string
  /** The 3D world (index.html). */
  home: PageMeta
  /** The plain page (projects/index.html). */
  plain: PageMeta
}

export interface Contact {
  /** Bare address — links become mailto: automatically. */
  email: string
  github: string
  linkedin: string
}

/**
 * The plain page (projects/): a fast, no-WebGL version of the site, baked to
 * static HTML at build time from this file. It reads these islands by id:
 *   projects   → Projects (after `leadProjects`)
 *   experience → Experience
 *   about      → About (its slides, as headed paragraphs)
 *   honors     → About › Honors
 *   resources  → About › Documents
 */
export interface PlainPageContent {
  /** Project ids shown first, in this order. The Projects island's other entries follow. */
  leadProjects: string[]
  /** Write-ups that appear ONLY on the plain page — no island in the 3D world shows them. */
  extraProjects: Project[]
  /** One-line notice shown when the 3D scene couldn't start and sent the visitor here. */
  fallbackNotice: string
}

export interface SiteContent {
  /** Your name / site title. */
  name: string
  /** Full name, used in page titles, link previews and the plain page. */
  fullName: string
  /** The deployed site's public URL, with a trailing slash. */
  siteUrl: string
  /** Page titles, descriptions and link-preview tags. */
  meta: SiteMeta
  /** Short tagline shown under your name on the plain page. */
  tagline: string
  /** One plain sentence under your name on the loading screen and the plain page. */
  oneLiner: string
  /** Email / GitHub / LinkedIn — the Contact island and the plain page both read these. */
  contact: Contact
  /** Resume location: a full URL, or a file dropped into /public (e.g. resume.pdf). */
  resumeUrl: string
  /** The floating islands that make up the world. Edit this to change the site. */
  islands: Island[]
  /** The plain page's own settings + plain-page-only write-ups. */
  plainPage: PlainPageContent
}

// ─────────────────────────────────────────────────────────────────────────────
//  👇  EDIT EVERYTHING BELOW THIS LINE  👇
// ─────────────────────────────────────────────────────────────────────────────
const SITE_URL = 'https://notjustjosh.github.io/Personal-Website/'

// Declared up here so the Contact island below and the plain page share them.
const CONTACT: Contact = {
  email: 'yuen.jo@northeastern.edu',
  github: 'https://github.com/NotJustJosh',
  linkedin: 'https://www.linkedin.com/in/josh-yuen-a30a79322/',
}

export const content: SiteContent = {
  name: 'Josh Yuen',
  fullName: 'Joshua Yuen',
  siteUrl: SITE_URL,

  meta: {
    ogImage: `${SITE_URL}og-preview.png`,
    home: {
      title: 'Joshua Yuen | Electrical Engineering & Physics',
      description:
        'Northeastern EE & physics student. Wearable IMU input device for CAD, MEMS characterization with a Michelson interferometer, underwater ROV electronics.',
      ogTitle: 'Joshua Yuen | Engineering Portfolio',
      ogDescription: 'Wearable CAD input device, MEMS interferometry, ROV electronics.',
      url: SITE_URL,
    },
    plain: {
      title: 'Projects | Joshua Yuen',
      description:
        'Projects and experience of Joshua Yuen, Northeastern EE & physics student: a wearable IMU input device for CAD, MEMS characterization with a Michelson interferometer, underwater ROV electronics.',
      ogTitle: 'Joshua Yuen | Projects',
      ogDescription: 'Wearable CAD input device, MEMS interferometry, ROV electronics. The plain, fast version of the portfolio.',
      url: `${SITE_URL}projects/`,
    },
  },

  tagline: 'Electrical Engineering and Physics Student · Aspiring Photonics Systems & Optical Computing Researcher · Interdisciplinary Systems Advocate',
  oneLiner: 'Electrical engineering and physics student at Northeastern University.',
  contact: CONTACT,

  // Put your resume PDF at /public/resume.pdf, or use a full URL.
  resumeUrl: 'resume.pdf',

  islands: [
    // ── HUB / spawn ──────────────────────────────────────────────────────────
    {
      id: 'about',
      label: 'About',
      position: [0, 0, 0],
      accentColor: ZONE_ACCENTS.about,
      size: 9,
      isHub: true,
      neighbors: ['showcase'],
      content: {
        title: 'About Me',
        // ── The intro deck ───────────────────────────────────────────────────
        // Click-through slides instead of a wall of text. Keep each one SHORT.
        // Add `image: 'images/foo.jpg'` to any slide for a picture up top; add
        // `only: '3d'` to keep a slide off the plain page.
        slides: [
          {
            hero: true,
            // The plain page opens with your name + this portrait already.
            only: '3d',
            title: "Hi, I\'m Josh Yuen",
            // `thumb` is the small copy the plain page's intro shows; the
            // slide itself uses the full-size `src`.
            image: { src: 'images/portrait.jpg', thumb: 'images/portrait-thumb.webp', alt: 'Joshua Yuen' },
            subtitle: `Electrical Engineering and Physics Student · 
            Photonic Systems & Optical Computing Researcher · 
            Interdisciplinary Systems Advocate`,
            body: [``],
          },
          {
            title: 'Academics',
            // image: 'images/neu-campus.jpg',
            body: [
              `I'm a sophomore majoring in physics and electrical engineering at Northeastern University. 
              With 108 credit-hours under my belt and a 3.973 GPA, 
              I'm applying for NEU's combined BS-MS program in the fall 
              so I can graduate with a Masters degree in electrical engineering 
              concentrated in electromagnetics, plasma, and optics--wish me luck!
`,
            ],
          },
          {
            title: 'Personal Convictions',
            // image: 'images/interferometer.jpg',
            body: [
              `My greatest strengths and greatest interest has always lain in the realm of synthesis; 
              the synthesis of knowledge, the synthesis of fields, 
              and a strong conviction that life--like field theory!--can and should be unified.`, 
              `I've devoted myself to studying the interdisciplinarity of our technology-driven society 
              in a wide variety of topics including microelectromechanical systems, 
              optical character recognition/facial recognition, and wearable technology, 
              to name a few areas in particular.`,
            ],
          },
          {
            title: 'Have a look around',
            // Talks about the 3D world's menu, so it's left off the plain page.
            only: '3d',
            // image: 'images/world-overview.jpg',
            body: [
              `Feel free to take a look around my virtual world 
              (all art and models were created myself using the Blender 3D creation software), 
              or fast-forward to my resume, contact info, 
              or projects using the menu in the top-right corner.`,
            ],
          },
          {
            title: 'Getting around',
            only: '3d',
            body: ['You control the icosahedron.'],
            keys: [
              { keys: ['W', 'A', 'S', 'D'], label: 'Walk (arrow keys work too)' },
              { keys: ['Space'], label: 'Jump' },
            ],
          },
        ],
      },
    },

    // ── Showcase platform ────────────────────────────────────────────────────
    // Pure scenery: one big landmass that carries the Projects and Experience
    // pedestals (`platform: true` → no pedestal, no panel, hidden from the
    // fast-travel menu). The bridges to/from this whole area hang off THIS
    // entry, not off the two sections standing on it.
    {
      id: 'showcase',
      label: 'My Work',
      position: [0, 3, 42],
      accentColor: ZONE_ACCENTS.showcase,
      size: 15,
      platform: true,
      groundModel: 'models/xscaledisland.glb',
      groundRotation: 90,
      neighbors: ['about', 'resources', 'contact', 'honors'],
      content: {},
    },

    // ── Projects ───────────────────────────────────────────────────────────────
    {
      id: 'projects',
      label: 'Projects',
      // On the Showcase platform (same y), left-hand pedestal as you arrive.
      // The two pedestals sit either side of the platform's centre at x = ±6.
      // 12 apart keeps their interaction zones (size + 1 = 5.5 each) from
      // overlapping, so standing at one never selects the other. (The widest
      // they could go is ~±10.5: the platform is radius 15 along X.)
      position: [6, 3, 42],
      accentColor: ZONE_ACCENTS.projects,
      size: 4.5,
      onPlatform: true,
      neighbors: [],
      orbit: true,
      content: {
        title: 'Projects and Publications',
        body: ["A few things I've built or written."],
        projects: [
          {
            name: 'IMU-Based Hand Gesture Interface for 3D Design and Modeling',
            model: 'models/gloves.glb',
            short: 'IMU Hand Gesture Interface for CAD',
            date: 'August 2025 - Present',
            description:
              `Developing a wearable glove-based input system using 9-axis IMU sensors to enable real-time 
              hand gesture control and object manipulation in Blender 3D creation software.
              Exploring shape memory alloy-based haptic feedback to provide tactile responses 
              to virtual object interactions.
              `,
            tags: ['Sensing Array', 'CAD', 'Shape-Memory Alloy', 'Wearable Technology'],
            // Drop files in public/images/, then list them here. The FIRST one
            // becomes the small preview floating over this project in the 3D
            // world; clicking any thumbnail opens the full-size gallery.
            // images: [
            //   'images/glove-v2.jpg',
            //   { src: 'images/glove-imu.jpg', caption: '9-axis IMU on the index finger' },
            // ],
            images: [
              { src: 'images/gloves.webp', alt: '',
                caption: '9-axis IMUs integrated with winter gloves' },
              { src: 'images/gloves-two.webp', alt: '',
                caption: 'Data output test--UDP connection and wireless data transfer'},
            ],
            links: [
              //{ label: 'Live', url: 'https://example.com' },
              //{ label: 'Code', url: 'https://github.com/yourname/project-one' },
            ],

            // ── Plain-page write-up (projects/#gloves) ──
            id: 'gloves',
            summary: 'A wearable, mouseless interface for CAD tools. IMUs in the glove fingertips, with I2C multiplexers.',
            problem: '',
            hardPart: '',
            scope: 'I designed the system, selected the IMUs and multiplexers, soldered the components, and wrote and debugged the software.',
            decisions: [
              { question: 'Why an I2C multiplexer instead of address-select pins or separate buses?', answer: '' },
              { question: 'What does the finger wiring do to bus capacitance and rise time, and how were the pull-ups sized?', answer: '' },
              { question: 'Why I2C rather than SPI?', answer: '' },
              { question: 'What per-finger update rate does the system reach through the mux?', answer: '' },
              { question: "What's the end-to-end latency from finger motion to a CAD action, and how was it measured?", answer: '' },
              { question: 'How is gyro drift handled?', answer: '' },
              { question: 'What fails first mechanically, and where?', answer: '' },
            ],
            results: '',
            rev2: '',
          },
          {
            name: 'Deployable Solar Array for Small Satellites',
            model: 'models/cubesat.glb',
            id: 'solar-array',
            short: 'Satellite Solar Array',
            date: 'September 2025 - May 2026',
            description:
              `Designed Circuit Block Diagram and Schematic for a modular and configurable set of  
              deployable solar array panels which included temeprature and sun sensing; 
              researched and developed power budget suitable for mission duration.
              team recieved Northeastern PEAK: Base Camp grant.`,
            tags: ['Power Budget', 'Block Diagrams', 'Sensing Array', 'Serial Communication'],
            links: [{ label: 'Link to Preliminary Design Review Slides', url: 'https://docs.google.com/presentation/d/1TPAfRppdQ2muZ8xqeqJ1X1O8Zbtcnp237hdajTnDW6Y/edit?usp=sharing' }],
          },
          {
            name: 'License Plate OCR Model',
            model: 'models/licenseplate.glb',
            id: 'ocr',
            date: 'May 2026 - June 2026',
            description:
              'License plate imaging pipeline for fog occlusions and low visibility settings using grayscaling, gaussian filtering, and unsharp masking',
            tags: ['Tesseract OCR Engine', 'Open-Source Computer Vision Library (OpenCV)'],
            links: [
             { label: 'Code', url: 'https://github.com/Iloyuk/license-plate-imaging-system' }, //gotta get Jason to make this public
            ],
          },
          {
            name: 'Terasic Spider Robot: Embedded Systems',
            model: 'models/spider.glb',
            id: 'spider-robot',
            short: 'Spider Robot',
            date: 'May 2026 - June 2026',
            description:
              'Embedded Programming of DE10-nano FPGA, including PWM of servos and integration of sonar sensor.',
            tags: ['Embedded Programming', 'Field-Programmable Gate Array', 'Pulse-Width Modulation', 'Quartus Desgin Software'],
            // Drop the clip in public/videos/ and uncomment. Autoplays muted on
            // a loop, so keep it to a few seconds of the robot actually walking.
            // video: { src: 'videos/spider-robot.mp4',
            //          caption: 'Gait test — servo PWM driven from the DE10-Nano' },
            images: [
              { src: 'images/spider-robot.webp', alt: '',
                caption: 'Spider Robot' },
            ],
            links: [
              { label: 'Code', url: 'https://github.com/yourname/project-one' }, //gotta upload this jawn soon
            ],
          },
          {
            name: 'Automation of Dechlorination Tools for Aqua Pennsylvania',
            model: 'models/aqua.glb',
            id: 'aqua',
            short: 'Dechlorination Automation Tool',
            date: 'August 2024 - May 2025',
            description: ' Led development of automation solutions to improve water treatment efficiency that applied engineering principles to real-world challenges in partnership with Aqua Pennsylvania, a utility company; Co-created and taught an accredited class that developed and implemented real-world projects.',
            tags: ['Sensing Array'],
            images: [
              { src: 'images/aqua-project.webp', alt: '',
                caption: 'Leadership team at the job site with Aqua Representative' },
            ],
          },
          {
            name: 'Publication: Hide and Seek: A Multimodal Approach to Human Detection',
            model: 'models/Spy-vs-AI-spy.glb',
            id: 'hide-and-seek',
            short: 'Human Detection through Facial Recognition Software',
            date: 'July 2024',
            description: `Investigated the results of integrating IR sensing, motion profiling, and mmWave sensing into an open source 
            facial recognition software with the goal of increasing accuracy in detecting occluded faces and darker skin tones. 
            Implemented a machine learning model to interpret results.  Published in the 39th Volume of the Journal of the Pennsylvania Governor\’s School for the Sciences.`,
            tags: ['Facial Recognition', 'Machine Learning/Artificial Intelligence', 'Sensing Array'],
            images: [
              { src: 'images/hide-and-seek-paper.png', alt: '',
                caption: 'Hide and Seek: A Multimodal Approach to Human Detection',
                href: 'hide-and-seek-paper.pdf' },
            ],
            links: [
              { label: 'Read the Full Publication Here', url: 'hide-and-seek-paper.pdf' },
            ],
          },
        ],
      },
    },

    // ── Experience ───────────────────────────────────────────────────────────
    {
      id: 'experience',
      label: 'Experience',
      // On the Showcase platform, right-hand pedestal as you arrive.
      position: [-6, 3, 42],
      accentColor: ZONE_ACCENTS.experience,
      size: 4.5,
      onPlatform: true,
      neighbors: [],
      orbit: true,
      content: {
        title: 'Experience',
        body: ['Roles, internships, and research positions'],
        projects: [
          {
            name: 'Research Assistant: Microscale Acoustic and Photonic Systems Laboratory, Northeastern University',
            model: 'models/MAPS.glb',
            // Dim the triangle so the laser symbol raised on it reads.
            modelBackingGlow: 0.4,
            id: 'maps-lab',
            short: 'MAPS Lab',
            date: 'Sep 2025 \– Present',
            description: `- Developing single-shot Michelson Interferometer to allow for better 
            characterization of microelectromechanical systems (MEMS). \n - Designed & assembled 
            $6,000 high-magnification optical system to assist in the characterization of MEMS devices in a cryogenic vacuum probe station 
            \n - Updated and redesigned MATLAB program which calculates displacement of MEMS devices in a Michelson Interferometer under the quadrature condition 
            using the signal-to-noise ratio calculated using experimental parameters from a spectrum analyzer, photodetector, and an oscilloscope.
            \n - Learning Ansys Lumerical Software to assist in work simulating MEMS`,
            tags: [],
            images: [
              { src: 'images/maps.png',
                caption: 'Logo for the Microscale Acoustic and Photonic Systems Laboratory' },
              { src: 'images/MAPS-team.jpg',
              caption: 'The MAPS Team'},
              { src: 'images/maps-microscope.png', alt: '',
                caption: 'MAPS microscope' },
            ],
            links: [
              { label: 'MAPS Website', url: 'https://sites.google.com/view/mapslab' },
            ],
          },
          {
            name: 'Hourly Course Assistant (HCA): EECE2160 Embedded Design: Enabling Robotics, Northeastern University',
            model: 'models/spider.glb',
            id: 'ta-eece2160',
            short: 'Embedded Design Course Assistant',
            date: 'Sep 2026 - Present',
            description: `- Working as a paid assistant (15 hrs/wk) for the electrical engineering fundamental
            introducing students to embedded design, field-programmable gate arrays, and other related skills 
            \n - Primarily assist students by giving feedback and checking work during their 
            allotted lab times and open lab hours, 
            hosted additional office hours for homework help, and graded homeworks and exams
            \n - Sharpening communication skills and independence via office hours with no professor present; develop
            relevent framework for effective communication and explanations to facilitate learning.`,
            // Plain page only — the line under the title.
            summary: 'Teaching assistant for EECE 2160 at Northeastern: FPGA/digital logic labs with Quartus and the DE1-SoC board.',
            images: [
              { src: 'images/NEUCOE-logo.png',
                caption: 'Northeastern College of Engineering Logo' },
            ],
            tags: [],
          },
          {
            name: 'Electrical Team Deputy, Solar Array Project Electrical Lead: NEU Satellite Labs',
            model: 'models/cubesat.glb',
            id: 'nsl',
            short: 'NEU Satellite Labs',
            date: 'Sep 2025 - May 2026',
            description: `- As Overal EE Deputy: Worked as second-in-command under NEU Satellite Labs Electrical Team Lead to: 
            coordinate and assign electrical projects, serve as a resource for club members 
            seeking assistance with said projects, and instruct new members through the creation of a set onboarding curriculum.
            \n - As Solar Array EE Lead: Researched and developed open-source deployable solar arrays for CubeSat power generation;
            investigated power budgets and researched possible circuit schematics for integrating sensing arrays.`,
            images: [
              { src: 'images/project-horizon.png',
                caption: 'Project Horizon Logo (Project Horizon was the original name of NSL\'s first satellite intiative)' },
            ],
            tags: [],
          },
        ],
      },
    },

    // ── Contact ──────────────────────────────────────────────────────────────
    {
      id: 'contact',
      label: 'Contact',
      // Behind the Showcase platform, off to the right.
      position: [26, 5, 68],
      accentColor: ZONE_ACCENTS.contact,
      neighbors: [],
      content: {
        title: 'Contact',
        body: ['Want to get in touch? Pick whichever works for you.'],
        links: [
          // Values come from CONTACT at the top of this section.
          { label: 'Email (click to copy)', url: CONTACT.email, copy: true },
          { label: 'GitHub', url: CONTACT.github },
          { label: 'LinkedIn', url: CONTACT.linkedin },
        ],
      },
    },

    // ── Resources ───────────────────────────────────────────────────────────────
    {
      id: 'resources',
      label: 'Resources',
      // Behind the Showcase platform, off to the left.
      position: [-26, 5, 68],
      accentColor: ZONE_ACCENTS.resources,
      neighbors: [],
      content: {
        title: 'Resources',
        body: ['Grab a copy of my documents below.'],
        // `groups` = nested sub-sections. Each gets its own heading, text,
        // image gallery and buttons — add as many as you like.
        groups: [
          {
            title: 'Resume',
            body: ['Full resume, kept up to date.'],
            links: [{ label: 'Download Resume (PDF)', url: 'resume.pdf' }],
          },
          {
            title: 'Transcript',
            body: ['Unofficial transcript — Northeastern University.'],
            links: [{ label: 'Download Transcript (PDF)', url: 'transcript.pdf' }],
          },
        ],
      },
    },
    // ── Honors ──────────────────────────────────────────────────────────────
    {
      id: 'honors',
      label: 'Honors',
      // Its own island behind the Showcase platform, in the middle of the back
      // row between Resources and Contact (same height), bridged straight to
      // the platform (that bridge is listed on `showcase`).
      position: [0, 5, 68],
      accentColor: ZONE_ACCENTS.honors,
      neighbors: [],
      // Honors is a compact list: names + dates only (no descriptions, no body).
      content: {
        title: 'Honors',
        projects: [
          { name: `National Merit Scholar 
                  Sponsored by Northeastern University.`, date: '2025 - Present' },
          { name: `Member of Engineering Honors Society Tau Beta Pi and Electrical and Computer
                  Engineering Honors Society IEEE-Eta Kappa Nu`, date: '2026 - Present '},
          { name: `John Martinson Honors College Member: 
                  \n- Honors Self-Directed Learner Badge 
                  \n- Honors Impact Badge 
                  \n- Honors Community Engagement Badge`, date: '2025-Present' },
          { name: 'Gerald F. Tonks Endowed Scholarship', date: '2026' },
          { name: 'Delaware County Christian School Co-Salutatorian', date: '2025'},
          { name: 'Qualified for High School VEX VRC Robotics World Championship', date: '2025' },
        ],
      },
    },
  ],

  // ── Plain page (projects/) ───────────────────────────────────────────────
  // A fast, plain-HTML version of the site, for anyone who wants the project
  // write-ups without the 3D world. See PlainPageContent above for which
  // islands it reads. Blank fields stay hidden until you write them.
  plainPage: {
    leadProjects: ['gloves', 'lab', 'rov'],
    fallbackNotice:
      "The 3D scene couldn't start on this device, so this is the plain version of the portfolio.",

    // These two exist only on the plain page — adding them to an island would
    // put new orbiting items in the 3D world.
    extraProjects: [
      {
        id: 'lab',
        name: 'MEMS Characterization with a Michelson Interferometer',
        date: '',
        summary:
          'Microscale Acoustic and Photonic Systems Lab, Northeastern. Characterizing MEMS devices with a Michelson interferometer.',
        description: '',
        problem: '',
        hardPart: '',
        scope: '',
        decisions: [],
        images: [],
        results: '',
        rev2: '',
        links: [{ label: 'MAPS Lab website', url: 'https://sites.google.com/view/mapslab' }],
      },
      {
        id: 'rov',
        name: 'Underwater ROV Electronics',
        date: '',
        summary: 'NU Robotics: circuits for the underwater ROV.',
        description: '',
        problem: '',
        hardPart: '',
        scope: '',
        decisions: [],
        images: [],
        results: '',
        rev2: '',
        links: [],
      },
    ],
  },
}
