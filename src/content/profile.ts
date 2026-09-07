/**
 * The readable content layer — everything below the cinematic scroll. Real,
 * drafted from Muhammad_Rehan_Master_Career_Profile.md plus the civic /
 * open-source / mentorship material supplied directly. Project case-study
 * slots are marked; fill them in as material becomes available.
 */

export interface ImpactItem {
  label: string
  body: string
}

export const IMPACT: ImpactItem[] = [
  {
    label: 'Civic impact & governance',
    body: "Selected as an approved community evaluator in the UAE's Zero Bureaucracy Program, assessing digital public services for operational efficiency, transparency, and accessibility.",
  },
  {
    label: 'Open source & economic inclusion',
    body: 'Builds and publishes open-source tools — including inventory and management systems for small-enterprise owners — lowering the barrier to entry for local businesses and independent creators.',
  },
  {
    label: 'Mentorship & digital literacy',
    body: 'Regularly mentors aspiring engineers and takes part in forward-looking initiatives, including international AI learning challenges and hackathons.',
  },
  {
    label: 'Mission-critical engineering',
    body: 'Builds software for sectors where correctness matters: healthcare access and pharmacy distribution, and cross-border logistics.',
  },
]

export interface Trait {
  label: string
  body: string
}

export const TRAITS: Trait[] = [
  {
    label: 'Cross-cultural adaptability',
    body: 'Experienced collaborating across diverse, multicultural teams in a global hub, building mutual respect and shared goals.',
  },
  {
    label: 'Empathetic leadership',
    body: 'Focused on active listening, mentorship, and building consensus across different viewpoints.',
  },
  {
    label: 'Pragmatic problem-solving',
    body: 'Driven to turn high-level ideals — equitable access, transparency, sustainable development — into tangible, working tools.',
  },
]

export interface ExperienceEntry {
  company: string
  role: string
  period: string
  location: string
  summary: string
  highlights: string[]
}

export const EXPERIENCE: ExperienceEntry[] = [
  {
    company: 'Gulf Agency Company (GAC)',
    role: 'Software Engineer, Full-Stack',
    period: 'Nov 2024 — Present',
    location: 'Dubai, UAE',
    summary: 'Shipping and logistics company. Hired for front-end, expanded into full-stack, DevOps, and release management.',
    highlights: [
      'Leads the front-end side of active projects — React, Angular, and TypeScript with shared state management and component libraries',
      'Contributes to microservices architecture; writes and debugs REST APIs and SQL',
      'Runs CI/CD via Git, Bitbucket, and Azure DevOps with Docker',
      'Works directly with business analysts and external clients on integration requirements',
    ],
  },
  {
    company: 'Phoenix Group',
    role: 'Senior Software Engineer',
    period: 'Nov 2023 — Oct 2024',
    location: 'Dubai, UAE',
    summary: 'Bitcoin mining operator running 300,000+ miners across the UAE, Oman, and elsewhere.',
    highlights: [
      'Built the individual-miner monitoring system from scratch — cut update-related downtime from 30–60 minutes to near-zero',
      'Administered a 75+ node Kubernetes cluster on AWS; built the CI/CD pipeline, cutting deployment cycles by 40%+',
      'Integrated RabbitMQ and Kafka for real-time, event-driven communication across the mining pool and monitoring infrastructure',
      'Automated wallet creation, cutting setup time from 20–30 minutes to about 3 seconds',
      'Mentored junior developers in React and Strapi',
    ],
  },
  {
    company: 'Amadeus',
    role: 'Software Engineer (via Astek Middle East IT)',
    period: 'Sep/Oct 2021 — Nov 2023',
    location: 'Dubai, UAE',
    summary: 'Booking systems for airlines including Etihad Airways, Saudi Airlines, Royal Air Morocco, and Kuwait Airline.',
    highlights: [
      'Built the Saudi Airline booking system',
      "Worked on Etihad Airways' manage-booking flow and its destination-specific servicing section",
      'Added purchasable service-line functionality for Royal Air Morocco',
      'Angular + Spring Boot; Azure CI/CD; multi-step transaction integrity across systems serving millions of users',
    ],
  },
  {
    company: 'Winsoft Solutions',
    role: 'Software Developer',
    period: 'Sep 2019 — Sep 2021',
    location: 'Dubai, UAE',
    summary: 'Healthcare software used by insurance companies, health authorities, and pharmaceutical companies.',
    highlights: [
      'Led the monolith-to-microservices migration, applying domain-driven design to define service boundaries; personally built ~30% of the APIs',
      'Developed the "Unified Medical File" EMR system, exporting patient records into HL7 (7.2+) for the US',
      'Built the doctor-facing mobile app end to end, including a shareable prescription-template feature',
      'Built the pipeline sending prescriptions to health authorities (HAAD/DHA) and on to PBM software for insurance billing',
      'Led "Dawa24," a Flutter + .NET medicine-delivery app, as a two-person team',
    ],
  },
  {
    company: 'Freelance / Independent',
    role: 'Software Developer',
    period: '2018 — 2019',
    location: 'Pakistan',
    summary: 'Bridged the period between graduating and joining Winsoft with freelance technical work.',
    highlights: [
      'Built a multi-branch, multi-brand point-of-sale system for a restaurant holding company — cloud-kitchen order routing, delivery integration, table booking, recipe-based cost calculation',
    ],
  },
]

export interface WorkItem {
  name: string
  tag: string
  summary: string
  url?: string
  /** True while there's no write-up / screenshots yet — renders a light placeholder state. */
  slot?: boolean
}

export const WORK: WorkItem[] = [
  {
    name: 'FixCors',
    tag: 'Micro-SaaS',
    summary: 'Resolves CORS configuration issues for cloud-native apps; an HLS proxy for redirecting video streams is in development.',
    url: 'https://fixcors.com',
    slot: true,
  },
  {
    name: 'NoBoxTV',
    tag: 'Streaming',
    summary: 'Free, browser-based TV on public IPTV streams with local recording — a NestJS/MySQL control plane separated from an Nginx + MediaMTX data plane that relays HLS media.',
    url: 'https://noboxtv.com',
    slot: true,
  },
  {
    name: 'Nearby Services',
    tag: 'Local discovery',
    summary: 'Google Maps-based local service discovery built on MongoDB 2dsphere geospatial queries — find services nearby without creating an account.',
    slot: true,
  },
  {
    name: 'Textile POS & Inventory',
    tag: 'Open source',
    summary: 'Point-of-sale and inventory system for textile businesses, published on GitHub.',
    slot: true,
  },
  {
    name: 'PCS Pte Ltd',
    tag: 'Consulting · Singapore',
    summary: 'Revamped monitoring and observability, automated workflows, ran a live production database migration via a parallel-stack approach, cut downtime 20%.',
    slot: true,
  },
  {
    name: 'Fast-Recovery',
    tag: 'Consulting · Dubai',
    summary: "Led the technical launch of a car-towing startup — website, digital campaigns, end-to-end digital operations.",
    slot: true,
  },
]

export interface RecognitionItem {
  title: string
  issuer: string
  year: string
}

export const RECOGNITION: RecognitionItem[] = [
  {
    title: 'Guinness World Records title',
    issuer: 'Participant, Kanz AI Hackathon — certified as the largest online AI lesson in history',
    year: '2025',
  },
  {
    title: '2nd Runner-up, Hack2Hire 2.0',
    issuer: 'HCLTech international programming competition',
    year: '2025',
  },
  {
    title: 'MongoDB CRUD Operations & Aggregation in Node.js',
    issuer: 'MongoDB, Inc.',
    year: '2025',
  },
  {
    title: 'Angular: The Complete Guide',
    issuer: 'Udemy',
    year: '2025',
  },
  {
    title: 'Certificate of Excellence, On-Spot Programming',
    issuer: "Visio Spark'15",
    year: '2015',
  },
]
