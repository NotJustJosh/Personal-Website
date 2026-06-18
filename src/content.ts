// ─────────────────────────────────────────────────────────────────────────────
//  src/content.ts — THE SINGLE SOURCE OF TRUTH FOR THE WHOLE SITE
// ─────────────────────────────────────────────────────────────────────────────
//  Edit ONLY this file to change what the site shows:
//    • where the zones sit in the 3D world (and their labels/colors)
//    • the text, projects, and links inside every panel
//    • your name, tagline, and resume link
//
//  BOTH the 3D world and the Classic (2D) fallback read from this file, so you
//  never have to touch the components to update content.
// ─────────────────────────────────────────────────────────────────────────────

/** The four sections of the site. Add/rename here if you change the zones. */
export type SectionId = 'projects' | 'about' | 'contact' | 'resume'

export interface LinkItem {
  label: string
  /** Absolute URL (https://…, mailto:…) OR a path under /public (e.g. "resume.pdf"). */
  url: string
}

export interface Project {
  name: string
  description: string
  /** Optional little tech tags shown as chips. */
  tags?: string[]
  /** Optional links (live demo, source, etc). */
  links?: LinkItem[]
}

/**
 * The DOM overlay shown when you press E inside a zone (or click a persistent
 * button). Every field is optional — the <Panel> renders whichever are present,
 * in this order: body → projects → links.
 */
export interface PanelContent {
  title: string
  /** One or more intro paragraphs. */
  body?: string[]
  /** Project cards (typically only the Projects panel uses this). */
  projects?: Project[]
  /** Generic link buttons (contact links, resume download, etc). */
  links?: LinkItem[]
}

export interface Zone {
  id: SectionId
  /** Floating label shown above the zone in the 3D world. */
  label: string
  /** World position [x, y, z]. Keep y at 0 to sit on the ground. */
  position: [number, number, number]
  /** How close (world units) the player must be to interact. */
  radius: number
  /** Accent color for the zone marker + floating label. */
  color: string
}

export interface SiteContent {
  /** Your name / site title. */
  name: string
  /** Short tagline shown under your name. */
  tagline: string
  /**
   * Resume location. Either a full "https://…" URL, or a file you drop into the
   * /public folder (e.g. "resume.pdf" → served at <base>/resume.pdf).
   */
  resumeUrl: string
  /** The interactable zones placed around the map. */
  zones: Zone[]
  /** The content rendered inside each section's panel. */
  panels: Record<SectionId, PanelContent>
}

// ─────────────────────────────────────────────────────────────────────────────
//  👇  EDIT EVERYTHING BELOW THIS LINE  👇   (placeholder content — replace it)
// ─────────────────────────────────────────────────────────────────────────────
export const content: SiteContent = {
  name: 'Josh Yuen',
  tagline: 'Electrical Engineering · Physics · Explorer',

  // Put your resume PDF at /public/resume.pdf, or use a full URL.
  resumeUrl: 'resume.pdf',

  // Zones are laid out around the spawn point (the player starts at [0,_,0]).
  // Tweak position/radius/color freely; the world updates automatically.
  zones: [
    { id: 'projects', label: 'Projects', position: [14, 0, 0], radius: 4, color: '#ffb703' },
    { id: 'about', label: 'About', position: [0, 0, 14], radius: 4, color: '#8ecae6' },
    { id: 'contact', label: 'Contact', position: [-14, 0, 0], radius: 4, color: '#90be6d' },
    { id: 'resume', label: 'Resume', position: [0, 0, -14], radius: 4, color: '#ef476f' },
  ],

  panels: {
    projects: {
      title: 'Projects',
      body: ['A few things I have built. Replace these with your own work.'],
      projects: [
        {
          name: 'Project One',
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
          description: 'Another project. Keep descriptions tight — one or two sentences works best.',
          tags: ['Node', 'PostgreSQL'],
          links: [{ label: 'Code', url: 'https://github.com/yourname/project-two' }],
        },
        {
          name: 'Project Three',
          description: 'A side project, experiment, or research piece you are proud of.',
          tags: ['Python', 'ML'],
        },
      ],
    },

    about: {
      title: 'About',
      body: [
        'Hi! I am a software engineer who likes building things people enjoy using. Replace this with a couple of short paragraphs about yourself.',
        'Talk about your background, what you are excited about, and what you are looking for next. Keep it conversational.',
      ],
    },

    contact: {
      title: 'Contact',
      body: ['Want to get in touch? Pick whichever works for you.'],
      links: [
        { label: 'Email', url: 'mailto:joshua.y3141@gmail.com' },
        { label: 'GitHub', url: 'https://github.com/NotJustJosh' },
        { label: 'LinkedIn', url: 'https://www.linkedin.com/in/josh-yuen-a30a79322/ ' },
      ],
    },

    resume: {
      title: 'Resume',
      body: ['Grab a copy of my resume below.'],
      links: [{ label: 'Download Resume (PDF)', url: 'resume.pdf' }],
    },
  },
}
