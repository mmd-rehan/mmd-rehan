/**
 * Single source of truth for the scroll narrative.
 *
 * The whole experience is one deterministic timeline t ∈ [0, 1]. Each chapter
 * owns a slice of that timeline. The particle field morphs between the target
 * shape of one chapter and the next as `t` crosses the boundary between them.
 *
 * SLICE 1 (current): portrait → flip → neurons only. The domain chapters
 * (healthcare / aviation / crypto / logistics) and the finale come next once
 * this centrepiece moment is signed off.
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
  start: number
  end: number
  target: TargetKey
  eyebrow: string
  headline: string
  proof: string
  indexLabel?: string
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'intro',
    start: 0.0,
    end: 0.58,
    target: 'portrait',
    eyebrow: 'Muhammad Rehan · Dubai',
    headline: 'The same hands, every system.',
    proof:
      'Software engineer, seven years — healthcare, aviation, crypto infrastructure, logistics. Frontend to DevOps.',
    indexLabel: 'Intro',
  },
  {
    id: 'nerves',
    start: 0.58,
    end: 1.0001,
    target: 'nerves',
    eyebrow: 'The craft',
    headline: 'Every system starts as a nervous system.',
    proof:
      'Frontend, backend, mobile, DevOps — the whole signal path, not a slice of it.',
    indexLabel: 'The craft',
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
  { label: 'The craft', chapterId: 'nerves' },
  { label: 'About', chapterId: 'intro' },
  { label: 'Contact', chapterId: 'nerves' },
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
