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
//    • adds it to the Classic-view page + its nav menu.
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
//    • the FIRST image floats as a small framed preview above that project's
//      orbiting icon in the 3D world (island view),
//    • a thumbnail strip on the project card in BOTH the 3D panel and the
//      Classic 2D view; clicking any thumbnail opens a full-size gallery with
//      ←/→ arrows, captions, and Esc to close,
//    • island-level `content.images` for photos that aren't tied to one project.
//
//  Keep previews small (~800px wide, compressed) — every cover image is fetched
//  the first time you set foot on that island.
// ─────────────────────────────────────────────────────────────────────────────

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
  /** Caption shown under the image in the gallery + lightbox. Doubles as alt text. */
  caption?: string
  /** Optional smaller file for thumbnails + the 3D preview. Defaults to `src`. */
  thumb?: string
  /** Optional click-through (the paper PDF, the article, the repo…). */
  href?: string
}

/** An image, written either as a bare URL string or as a full {@link MediaItem}. */
export type Media = string | MediaItem

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
   * cover: it's the small preview that floats over this item in the 3D world and
   * the thumbnail shown on the card. Clicking any thumbnail opens the gallery.
   */
  images?: Media[]
  /** Optional short glyph (letter/number/symbol) for the orbiting icon. */
  icon?: string
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

/** Content shown in an island's panel (3D) and its Classic-view section (2D). */
export interface PanelContent {
  title: string
  body?: string[]
  /** Island-level gallery, shown under the body text (before the project cards). */
  images?: Media[]
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
  /** Ids this island connects to via light-bridges (bidirectional). */
  neighbors: IslandId[]
  /** When true, the island's items orbit it as clickable icons. */
  orbit?: boolean
  /** The panel/section content. */
  content: IslandContent
  /** Optional .glb under /public for set dressing (Draco supported). */
  model?: string
}

export interface SiteContent {
  /** Your name / site title. */
  name: string
  /** Short tagline shown under your name (Classic view + loading). */
  tagline: string
  /** Resume location: a full URL, or a file dropped into /public (e.g. resume.pdf). */
  resumeUrl: string
  /** The floating islands that make up the world. Edit this to change the site. */
  islands: Island[]
}

// ─────────────────────────────────────────────────────────────────────────────
//  👇  EDIT EVERYTHING BELOW THIS LINE  👇
// ─────────────────────────────────────────────────────────────────────────────
export const content: SiteContent = {
  name: 'Josh Yuen',
  tagline: 'Electrical Engineering and Physics Student · Aspiring Photonics Systems & Optical Computing Researcher · Interdisciplinary Systems Advocate',

  // Put your resume PDF at /public/resume.pdf, or use a full URL.
  resumeUrl: 'resume.pdf',

  islands: [
    // ── HUB / spawn ──────────────────────────────────────────────────────────
    {
      id: 'about',
      label: 'About',
      position: [0, 0, 0],
      accentColor: '#8ecae6',
      size: 9,
      isHub: true,
      neighbors: ['projects', 'experience', 'contact', 'resources'],
      content: {
        title: 'About',
        body: [
          `Hello! I'm Josh Yuen, a sophomore majoring in physics and electrical
          engineering at Northeastern University. With 108 credit-hours under my belt
          and a 3.973 GPA, I'm applying for NEU's combined BS-MS program in the
          fall so I can graduate with a Masters degree in electrical engineering
          concentrated in electromagnetics, plasma, and optics--wish me luck!`,
          `My greatest strengths and greatest interest has always lain in the realm
          of synthesis; the synthesis of knowledge, the synthesis of fields, and a strong
          conviction that life--like field theory!--can and should be unified.
          I've devoted myself to studying the interdisciplinarity of our technology-driven
          society in a wide variety of topics including microelectromechanical
          systems, optical character recognition/facial recognition, and wearable technology,
          to name a few areas in particular.`,
          `Feel free to take a look around my virtual world (all art and models were created myself using the Blender 3D creation software),
          or fast-forward to my resume, contact info, or projects using the menu in the top-right corner!`,
        ],
        // An island can have its own gallery too — photos that aren't tied to
        // one project (lab shots, conference photos, press clippings…):
        // images: ['images/lab-bench.jpg', 'images/vex-worlds.jpg'],
      },
    },

    // ── Projects ───────────────────────────────────────────────────────────────
    {
      id: 'projects',
      label: 'Projects',
      position: [34, 3, 8],
      accentColor: '#ffb703',
      neighbors: ['experience'],
      orbit: true,
      content: {
        title: 'Projects and Publications',
        body: ["A few things I've built or written."],
        projects: [
          {
            name: 'IMU-Based Hand Gesture Interface for 3D Design and Modeling',
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
            links: [
              //{ label: 'Live', url: 'https://example.com' },
              //{ label: 'Code', url: 'https://github.com/yourname/project-one' },
            ],
          },
          {
            name: 'Deployable Solar Array for Small Satellites',
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
            short: 'Spider Robot',
            date: 'May 2026 - June 2026',
            description:
              'Embedded Programming of DE10-nano FPGA, including PWM of servos and integration of sonar sensor.',
            tags: ['Embedded Programming', 'Field-Programmable Gate Array', 'Pulse-Width Modulation', 'Quartus Desgin Software'],
            links: [
              { label: 'Code', url: 'https://github.com/yourname/project-one' }, //gotta upload this jawn soon
            ],
          },
          {
            name: 'Automation of Dechlorination Tools for Aqua Pennsylvania',
            short: 'Dechlorination Automation Tool',
            date: 'August 2024 - May 2025',
            description: ' Led development of automation solutions to improve water treatment efficiency that applied engineering principles to real-world challenges in partnership with Aqua Pennsylvania, a utility company; Co-created and taught an accredited class that developed and implemented real-world projects.',
            tags: ['Sensing Array'],
          },
          {
            name: 'Publication: Hide and Seek: A Multimodal Approach to Human Detection',
            short: 'Human Detection through Facial Recognition Software',
            date: 'July 2024',
            description: `Investigated the results of integrating IR sensing, motion profiling, and mmWave sensing into an open source 
            facial recognition software with the goal of increasing accuracy in detecting occluded faces and darker skin tones. 
            Implemented a machine learning model to interpret results.  Published in the 39th Volume of the Journal of the Pennsylvania Governor\’s School for the Sciences.`,
            tags: ['Facial Recognition', 'Machine Learning/Artificial Intelligence', 'Sensing Array'],
            // Paper + article previews work the same way — `href` makes the
            // lightbox offer a click-through to the real thing.
            // images: [
            //   { src: 'images/hide-and-seek-paper.png',
            //     caption: 'Journal of the PA Governor’s School for the Sciences, Vol. 39',
            //     href: 'https://www.cmu.edu/news/stories/archives/2024/July/hide-and-seek-governors-school' },
            // ],
            links: [
              { label: 'Publication', url: 'https://example.com' }, //need to add actual physical journal here
              { label: 'Article Published on Carnegie Mellon University Website', url: 'https://www.cmu.edu/news/stories/archives/2024/July/hide-and-seek-governors-school' },
            ],
          },
        ],
      },
    },

    // ── Experience ───────────────────────────────────────────────────────────
    {
      id: 'experience',
      label: 'Experience',
      position: [8, 2, 34],
      accentColor: '#9d6bff',
      neighbors: [],
      orbit: true,
      content: {
        title: 'Experience',
        body: ['Roles, internships, and research positions'],
        projects: [
          {
            name: 'Research Assistant: Microscale Acoustic and Photonic Systems Laboratory, Northeastern University',
            short: 'MAPS Lab',
            date: 'Sep 2025 \– Present',
            description: `- Developing shot-noise limited Michelson Interferometer to allow for better 
            characterization of microelectromechanical systems (MEMS). \n - Designed & assembled 
            high-magnification optical system to assist in the characterization of MEMS devices in a cryogenic vacuum probe station 
            \n - Updated and redesigned MATLAB program which calculates displacement of MEMS devices in a Michelson Interferometer under the quadrature condition 
            using the signal-to-noise ratio calculated using experimental parameters from a spectrum analyzer, photodetector, and an oscilloscope.`,
            tags: [],
            links: [
              { label: 'MAPS Website', url: 'https://sites.google.com/view/mapslab' },
            ],
          },
          {
            name: 'Hourly Course Assistant (HCA): EECE2160 Embedded Design: Enabling Robotics, Northeastern University',
            short: 'Embedded Design Course Assistant',
            date: 'Sep 2026 - Present',
            description: `- Working as a paid assistant (10 hrs/wk) for the electrical engineering fundamental
            introducing students to embedded design, field-programmable gate arrays, and other related skills 
            \n - Primarily assisted students by giving feedback and checking work during their 
            allotted lab times and open lab hours, 
            hosted additional online office hours for homework help, and graded homeworks and exams`,
            tags: [],
          },
          {
            name: 'Electrical Team Deputy, Solar Array Project Electrical Lead: NEU Satellite Labs',
            short: 'NEU Satellite Labs',
            date: 'Sep 2025 - May 2026',
            description: `- As Overal EE Deputy: Worked as second-in-command under NEU Satellite Labs Electrical Team Lead to: 
            coordinate and assign electrical projects, serve as a resource for club members 
            seeking assistance with said projects, and instruct new members through the creation of a set onboarding curriculum.
            \n - As Solar Array EE Lead: Researched and developed open-source deployable solar arrays for CubeSat power generation;
            investigated power budgets and researched possible circuit schematics for integrating sensing arrays.`,
            tags: [],
          },
        ],
      },
    },

    // ── Contact ──────────────────────────────────────────────────────────────
    {
      id: 'contact',
      label: 'Contact',
      position: [-32, 4, 12],
      accentColor: '#90be6d',
      neighbors: ['resources', 'experience'],
      content: {
        title: 'Contact',
        body: ['Want to get in touch? Pick whichever works for you.'],
        links: [
          { label: 'Email (click to copy)', url: 'yuen.jo@northeastern.edu', copy: true },
          { label: 'GitHub', url: 'https://github.com/NotJustJosh' },
          { label: 'LinkedIn', url: 'https://www.linkedin.com/in/josh-yuen-a30a79322/' },
        ],
      },
    },

    // ── Resources ───────────────────────────────────────────────────────────────
    {
      id: 'resources',
      label: 'Resources',
      position: [-12, 1, -32],
      accentColor: '#ef476f',
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
      position: [32, 2, -12],
      accentColor: '#06d6a0',
      neighbors: ['resources', 'projects', 'about'],
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
}
