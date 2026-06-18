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
// ─────────────────────────────────────────────────────────────────────────────

export type IslandId = string

export interface LinkItem {
  label: string
  /** Absolute URL (https://…, mailto:…), a bare email, OR a file in /public. */
  url: string
  /** Optional short glyph (letter/number/symbol) for the orbiting icon. */
  icon?: string
}

export interface Project {
  name: string
  /** Optional — omit for compact entries like Honors. */
  description?: string
  /** When it happened, e.g. "2024" or "May–Aug 2024". Shown next to the title. */
  date?: string
  tags?: string[]
  links?: LinkItem[]
  /** Optional short glyph (letter/number/symbol) for the orbiting icon. */
  icon?: string
}

/** Content shown in an island's panel (3D) and its Classic-view section (2D). */
export interface PanelContent {
  title: string
  body?: string[]
  projects?: Project[]
  links?: LinkItem[]
}

/** Like PanelContent, but `title` is optional (defaults to the island label). */
export interface IslandContent {
  title?: string
  body?: string[]
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
  tagline: 'Electrical Engineering · Physics · Research',

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
      neighbors: ['projects', 'experience', 'contact', 'resume'],
      content: {
        title: 'About',
        body: [
          `Hello! I'm Josh Yuen, a sophomore majoring in physics and electrical
          engineering at Northeastern University. With 108 credit-hours under my belt
          and a 3.961 GPA, I'm applying for NEU's combined BS-MS program in the
          fall so I can graduate with a Masters degree in electrical engineering
          concentrated in electromagnetics, plasma, and optics--wish me luck!`,
          `My greatest strengths and greatest interest has always lain in the realm
          of synthesis; the synthesis of knowledge, the synthesis of fields, and a strong
          conviction that life--like field theory!--can and should be unified.
          I've devoted myself to studying the interdisciplinarity of our technology-driven
          society in a wide variety of topics including microelectromechanical
          systems, optical character recognition/facial recognition, and wearable technology,
          to name a few areas in particular.`,
          `Feel free to take a look around my virtual world, or fast-forward to my resume,
          contact info or projects using the menu in the top-right corner!`,
        ],
      },
    },

    // ── Projects ───────────────────────────────────────────────────────────────
    {
      id: 'projects',
      label: 'Projects',
      position: [34, 5, 8],
      accentColor: '#ffb703',
      neighbors: ['experience'],
      orbit: true,
      content: {
        title: 'Projects and Publications',
        body: ["A few things I've built or written."],
        projects: [
          {
            name: 'Project: IMU-Based Hand Gesture Interface for 3D Design and Modeling',
            date: 'August 2025 - Present',
            description:
              `Developing a wearable glove-based input system using 9-axis IMU sensors to enable real-time 
              hand gesture control and object manipulation in Blender 3D creation software.
              Exploring shape memory alloy-based haptic feedback to provide tactile responses 
              to virtual object interactions.
              `,
            tags: ['Sensing Array', 'CAD', 'Shape-Memory Alloy', 'Wearable Technology'],
            links: [
              //{ label: 'Live', url: 'https://example.com' },
              //{ label: 'Code', url: 'https://github.com/yourname/project-one' },
            ],
          },
          {
            name: 'Project: Deployable Solar Array for Small Satellites',
            date: 'September 2025 - May 2026',
            description:
              `Designed Circuit Block Diagram and Schematic for a modular and configurable set of  
              deployable solar array panels which included temeprature and sun sensing; 
              researched and developed power budget suitable for mission duration.
              team recieved Northeastern PEAK: Base Camp grant.`,
            tags: ['Power Budget', 'Block Diagrams', 'Sensing Array', 'Serial Communication'],
            // links: [{ label: 'Code', url: 'https://github.com/yourname/project-two' }],
          },
          {
            name: 'Project: License Plate OCR Model',
            date: 'May 2026 - June 2026',
            description:
              'License plate imaging pipeline for fog occlusions and low visibility settings using grayscaling, gaussian filtering, and unsharp masking',
            tags: ['Tesseract OCR Engine', 'Open-Source Computer Vision Library (OpenCV)'],
            //links: [
            //  { label: 'Live', url: 'https://example.com' },
            // { label: 'Code', url: 'https://github.com/yourname/project-one' },
            //],
          },
          {
            name: 'Project: Terasic Spider Robot',
            date: 'May 2026 - June 2026',
            description:
              'Embedded Programming of DE10-nano FPGA, including PWM of servos and integration of sonar sensor.',
            tags: ['Embedded Programming', 'Field-Programmable Gate Array', 'Pulse-Width Modulation', 'Quartus Desgin Software'],
            //links: [
            //  { label: 'Live', url: 'https://example.com' },
            //  { label: 'Code', url: 'https://github.com/yourname/project-one' },
            //],
          },
          {
            name: 'Project: Automation of Dechlorination Tools for Aqua Pennsylvania',
            date: 'August 2024 - May 2025',
            description: ' Led development of automation solutions to improve water treatment efficiency that applied engineering principles to real-world challenges in partnership with Aqua Pennsylvania, a utility company; Co-created and taught an accredited class that developed and implemented real-world projects.',
            tags: ['idk', 'Sensing Array'],
          },
          {
            name: 'Publication: Hide and Seek: A Multimodal Approach to Human Detection',
            date: 'July 2024',
            description: `Investigated the results of integrating IR sensing, motion profiling, and mmWave sensing into an open source 
            facial recognition software with the goal of increasing accuracy in detecting occluded faces and darker skin tones. 
            Implemented a machine learning model to interpret results.  Published in the 39th Volume of the Journal of the Pennsylvania Governor\’s School for the Sciences.`,
            tags: ['Facial Recognition', 'Machine Learning', 'Sensing Array', 'Motion Profiling'],
            links: [
              { label: 'Publication', url: 'https://example.com' },
              { label: 'Article Published on Carnegie Mellon University Website', url: 'https://example.com' },
            ],
          },
        ],
      },
    },

    // ── Experience ───────────────────────────────────────────────────────────
    {
      id: 'experience',
      label: 'Experience',
      position: [8, -4, 34],
      accentColor: '#9d6bff',
      neighbors: [],
      orbit: true,
      content: {
        title: 'Experience',
        body: ['Roles, internships, and research positions'],
        projects: [
          {
            name: 'Research Assistant: Microscale Acoustic and Photonic Systems Laboratory, Northeastern University',
            date: 'Sep 2024 \– Present',
            description:
              'A short description of what it does, the problem it solves, and what makes it interesting.',
            tags: ['React', 'TypeScript', 'WebGL'],
            links: [
              { label: 'Live', url: 'https://example.com' },
              { label: 'Code', url: 'https://github.com/yourname/project-one' },
            ],
          },
          {
            name: 'Project Two',
            date: '2024',
            description:
              'Another project. Keep descriptions tight — one or two sentences works best.',
            tags: ['Node', 'PostgreSQL'],
            links: [{ label: 'Code', url: 'https://github.com/yourname/project-two' }],
          },
          {
            name: 'Project Three',
            date: '2023',
            description: 'A side project, experiment, or research piece you are proud of.',
            tags: ['Python', 'ML'],
          },
        ],
      },
    },

    // ── Contact ──────────────────────────────────────────────────────────────
    {
      id: 'contact',
      label: 'Contact',
      position: [-32, 8, 12],
      accentColor: '#90be6d',
      neighbors: ['resume', 'experience'],
      content: {
        title: 'Contact',
        body: ['Want to get in touch? Pick whichever works for you.'],
        links: [
          { label: 'Email', url: 'mailto:joshua.y3141@gmail.com' },
          // { label: 'GitHub', url: 'https://github.com/NotJustJosh' },
          { label: 'LinkedIn', url: 'https://www.linkedin.com/in/josh-yuen-a30a79322/' },
        ],
      },
    },

    // ── Resume ───────────────────────────────────────────────────────────────
    {
      id: 'resume',
      label: 'Resume',
      position: [-12, 3, -32],
      accentColor: '#ef476f',
      neighbors: [],
      content: {
        title: 'Resume',
        body: ['Grab a copy of my resume below.'],
        links: [{ label: 'Download Resume (PDF)', url: 'resume.pdf' }],
      },
    },
    // ── Honors ──────────────────────────────────────────────────────────────
    {
      id: 'honors',
      label: 'Honors',
      position: [32, -2, -12],
      accentColor: '#06d6a0',
      neighbors: ['resume', 'projects', 'about'],
      // Honors is a compact list: names + dates only (no descriptions, no body).
      content: {
        title: 'Honors',
        projects: [
          { name: `National Merit Scholar 
                  Sponsored by Northeastern University.`, date: '2025 - Present' },
          { name: `John Martinson Honors College Member: 
                  \n- Honors Self-Directed Learner Badge 
                  \n- Honors Impact Badge 
                  \n- Honors Community Engagement Badge`, date: '2025-Present' },
          { name: 'Gerald F. Tonks Endowed Scholarship', date: '2026' },
          { name: 'Qualified: VEX VRC Robotics World Championship', date: '2025' },
        ],
      },
    },
  ],
}
