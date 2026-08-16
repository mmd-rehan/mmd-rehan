/**
 * Single source of truth for the scroll narrative.
 *
 * The whole experience is one deterministic timeline t ∈ [0, 1]. Each chapter
 * owns a slice of that timeline. The particle field morphs between the target
 * shape of one chapter and the next as `t` crosses the boundary between them.
 *
 * Editing copy? This is the only file you need to touch.
 */

/** The shapes the single particle buffer can take. */
export type TargetKey =
  | 'portrait'
  | 'nerves'
  | 'signal'
  | 'flightArc'
  | 'hashGrid'
  | 'torus'

export interface Chapter {
  id: string
  /** Start of this chapter's slice of the timeline (inclusive). */
  start: number
  /** End of this chapter's slice of the timeline (exclusive, except the last). */
  end: number
  /** Which particle shape represents this chapter. */
  target: TargetKey
  eyebrow: string
  headline: string
  proof: string
  /** Short label used by the right-edge index. Omit to hide from the index. */
  indexLabel?: string
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'intro',
    start: 0.0,
    end: 0.1,
    target: 'portrait',
    eyebrow: 'Software Engineer · Dubai',
    headline: 'Building reliable web and backend software.',
    proof:
      'Software engineer with 7+ years of experience across healthcare, aviation, crypto infrastructure, and logistics.',
    indexLabel: 'Intro',
  },
  {
    id: 'nervous',
    start: 0.1,
    end: 0.26,
    target: 'nerves',
    eyebrow: 'Background',
    headline: 'Full-stack engineering for production systems.',
    proof:
      'Developing responsive frontends, backend APIs, and microservices for core operations.',
    indexLabel: 'Overview',
  },
  {
    id: 'health',
    start: 0.26,
    end: 0.42,
    target: 'signal',
    eyebrow: 'Healthcare',
    headline: 'Healthcare Systems',
    proof:
      'Developed the Unified Medical File EMR, supporting HL7 standards for patient record export.',
    indexLabel: 'Health',
  },
  {
    id: 'aviation',
    start: 0.42,
    end: 0.56,
    target: 'flightArc',
    eyebrow: 'Aviation',
    headline: 'Airline Booking Platforms',
    proof:
      'Worked on booking and reservation flows at Amadeus for international airlines including Saudia and Etihad.',
    indexLabel: 'Aviation',
  },
  {
    id: 'crypto',
    start: 0.56,
    end: 0.7,
    target: 'hashGrid',
    eyebrow: 'Crypto Infrastructure',
    headline: 'Mining Operations & Monitoring',
    proof:
      'Built miner monitoring tools from scratch to track equipment status and reduce downtime.',
    indexLabel: 'Crypto',
  },
  {
    id: 'logistics',
    start: 0.7,
    end: 0.85,
    target: 'torus',
    eyebrow: 'Logistics & Shipping',
    headline: 'Logistics & Supply Chain Applications',
    proof:
      "Developing frontend components and interfaces for enterprise logistics platforms.",
    indexLabel: 'Logistics',
  },
  {
    id: 'contact',
    start: 0.85,
    end: 1.0001, // inclusive of t = 1
    target: 'portrait',
    eyebrow: "Let's build",
    headline: 'The same hands can build yours.',
    proof: 'Frontend · backend · mobile · DevOps - end to end.',
    indexLabel: 'Contact',
  },
]

export const CONTACT = {
  name: 'Muhammad Rehan',
  title: 'Software Engineer',
  location: 'Dubai, UAE',
  email: 'hi@mmd-rehan.com',
  phone: '+971 56 805 2044',
  linkedin: 'https://linkedin.com/in/mmd-rehan',
  medium: 'https://medium.com/@mrrehan',
} as const

/** Nav items in the header pill. Each scrolls to its chapter's position. */
export const NAV_ITEMS = [
  { label: 'Domains', chapterId: 'health' },
  { label: 'Work', chapterId: 'crypto' },
  { label: 'About', chapterId: 'intro' },
  { label: 'Contact', chapterId: 'contact' },
] as const

export interface ProjectLink {
  label: string
  url: string
}

export interface ProjectMetric {
  label: string
  value: string
}

export interface ProjectDetail {
  id: string
  company: string
  period: string
  title: string
  role: string
  summary: string
  metrics: ProjectMetric[]
  highlights: string[]
  technologies: string[]
  links?: ProjectLink[]
}

