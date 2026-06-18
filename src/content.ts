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

/** The sections of the site. Add or rename an id here whenever you add/rename a zone. */
export type SectionId = 'projects' | 'about' | 'contact' | 'resume' | 'experience'

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
  tagline: 'Electrical Engineering · Physics · Research',

  // Put your resume PDF at /public/resume.pdf, or use a full URL.
  resumeUrl: 'resume.pdf',

  // Zones are laid out around the spawn point (the player starts at [0,_,0]).
  // Tweak position/radius/color freely; the world updates automatically.
  zones: [
    { id: 'projects', label: 'Projects', position: [10, 0, 10], radius: 2, color: '#ffb703' },
    { id: 'about', label: 'About', position: [0, 0, 2], radius: 2, color: '#8ecae6' },
    { id: 'contact', label: 'Contact', position: [-10, 0, 10], radius: 2, color: '#90be6d' },
    { id: 'resume', label: 'Resume', position: [0, 0, 10], radius: 2, color: '#ef476f' },
    { id: 'experience', label: 'Experience', position: [-20, 0, 10], radius: 2, color: '#ffffff' },
  ],

  panels: {
    projects: {
      title: 'Projects and Publications',
      body: ['A few things I\'ve built or written.'],
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
        `Hello! I\'m Josh Yuen, a sophomore majoring in physics and electrical 
        engineering at Northeastern University. With 108 credit-hours under my belt
        and a 3.961 GPA, I'm applying for NEU's combined BS-MS program in the 
        fall so I can graduate with a Masters degree in electrical engineering 
        concentrated in electromagnetics, plasma, and optics--wish me luck!
        `,
        `My greatest strengths and greatest interest has always lain in the realm
        of synthesis; the synthesis of knowledge, the synthesis of fields, and a strong
        conviction that life--like field theory!--can and should be unified.
        I've devoted myself to studying the interdisciplinarity of our technology-driven
        society in a wide variety of topics including microelectromechanical 
        systems, optical character recognition/facial recognition, and wearable technology,
        to name a few areas in particular.
        `,
        `Feel free to take a look around my virtual world, or fast-forward to my resume, contact info
        or projects using the "Classic View" button in the top left!
        `
      ],
    },

    contact: {
      title: 'Contact',
      body: ['Want to get in touch? Pick whichever works for you.'],
      links: [
        { label: 'Email', url: 'mailto:joshua.y3141@gmail.com' },
        //{ label: 'GitHub', url: 'https://github.com/NotJustJosh' },
        { label: 'LinkedIn', url: 'https://www.linkedin.com/in/josh-yuen-a30a79322/ ' },
      ],
    },

    resume: {
      title: 'Resume',
      body: ['Grab a copy of my resume below.'],
      links: [{ label: 'Download Resume (PDF)', url: 'resume.pdf' }],
    },

    experience: {
      title: 'Experience',
      body: ['Roles, internships, and research positions — replace with your own.'],
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
  },
}
