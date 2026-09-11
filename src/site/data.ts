export type Role = {
  years: string
  company: string
  title: string
  industry: string
  body: string
  tags: string[]
  outcomes?: { figure: string; label: string }[]
  sourceNote?: string
  open?: boolean
}

export const ROLES: Role[] = [
  {
    years: '2024 – PRESENT',
    company: 'Gulf Agency Company',
    title: 'Software Engineer, Full-Stack',
    industry: 'Logistics',
    body: 'Building React and Angular applications for shipping and logistics, with work extending into APIs, SQL, CI/CD, and release management. Leading the frontend side of active projects and collaborating with business analysts and clients.',
    tags: ['React / Angular', 'TypeScript', 'Azure DevOps', 'Docker'],
    open: true,
  },
  {
    years: '2023 – 2024',
    company: 'Phoenix Group',
    title: 'Senior Software Engineer',
    industry: 'Mining infrastructure',
    body: 'Built individual-miner monitoring, operational dashboards, and APIs. Improved deployment reliability with Kubernetes and CI/CD, automated wallet creation, and mentored developers in React and Strapi.',
    outcomes: [
      { figure: '25%+', label: 'fewer downtime incidents' },
      { figure: '40%+', label: 'shorter deployment cycles' },
    ],
    sourceNote: 'Outcomes reported in Abdul Rahman’s professional recommendation.',
    tags: ['Kubernetes', 'AWS', 'React Native', 'RabbitMQ / Kafka'],
  },
  {
    years: '2021 – 2023',
    company: 'Amadeus',
    title: 'Software Engineer · via Astek Middle East',
    industry: 'Aviation',
    body: 'Developed airline booking and servicing experiences, including Saudia’s booking system, Etihad’s manage-booking flow, and purchasable services for Royal Air Maroc. Worked across distributed teams on multi-step customer journeys.',
    tags: ['Angular', 'Spring Boot', 'Azure CI/CD'],
  },
  {
    years: '2019 – 2021',
    company: 'Winsoft Solutions',
    title: 'Software Developer',
    industry: 'Healthcare',
    body: 'Architected the Unified Medical File EMR, contributed to a migration from a monolith to microservices, and built doctor-facing mobile workflows. Co-led Dawa24, a medicine-delivery application, and developed integrations for prescription and insurance workflows.',
    tags: ['Node.js', 'Angular', 'HL7 interoperability', 'Flutter / .NET'],
  },
]

export const TOOLKIT = [
  { group: 'Interfaces', items: ['React · Angular · TypeScript', 'Flutter · React Native'] },
  { group: 'Systems', items: ['Node.js · NestJS · Express', 'SQL · MongoDB'] },
  { group: 'Delivery', items: ['Docker · Kubernetes · AWS', 'CI/CD · Nginx'] },
]

export const COMPANIES = [
  { name: 'GAC', className: '' },
  { name: 'PHOENIX GROUP', className: 'phoenix' },
  { name: 'amadeus', className: 'amadeus' },
  { name: 'Winsoft', className: '', suffix: ' Solutions' },
]

export type Testimonial = {
  name: string
  role: string
  /** How they knew each other — the detail that makes a quote credible. */
  relationship: string
  quote: string
}

/** Excerpts from the recommendations on linkedin.com/in/mmd-rehan, each
 *  trimmed to its strongest line or two. Full text lives on LinkedIn. */
export const FEATURED_TESTIMONIAL: Testimonial = {
  name: 'Salah Uddin',
  role: 'Senior Android Developer at Amadeus',
  relationship: 'Sat alongside Rehan at Amadeus',
  quote:
    'His positive attitude and willingness to help made him a great colleague to have around.',
}

export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Athena Rahmatie',
    role: 'Project & Operation Manager',
    relationship: 'Worked with Rehan across teams',
    quote:
      'Rehan is not only incredibly skilled but also has a great work ethic and a professional attitude that makes working with him a pleasure.',
  },
  {
    name: 'Atta Ur Rehman',
    role: 'Chief Technology Officer at Santra',
    relationship: 'Managed Rehan directly',
    quote:
      'He consistently demonstrated strong technical skills, a proactive attitude, and the ability to tackle challenges effectively.',
  },
  {
    name: 'Muiz Mahdi',
    role: 'Software Engineer at Stripe',
    relationship: 'Same team at Amadeus',
    quote:
      'He approaches problems methodically and is always willing to find effective solutions.',
  },
  {
    name: 'Abdulhamid Tork',
    role: 'Tech Leader & Founder, Oona One',
    relationship: 'Same team at Winsoft Solutions',
    quote:
      'His dedication, creativity, and problem-solving abilities have been invaluable to our team.',
  },
  {
    name: 'Bakht Munir',
    role: 'Software Engineer',
    relationship: 'Worked under Rehan at Winsoft Solutions',
    quote:
      'His innovative approach, attention to detail, and strong problem-solving skills consistently contributed to our project’s success.',
  },
  {
    name: 'Asad Syed',
    role: 'Mobile Architect · iOS & Flutter',
    relationship: 'Collaborated at Shisheo',
    quote:
      'Rehan brings a rare blend of technical expertise and creative problem-solving to the table.',
  },
]

export type Reference = {
  name: string
  /** Current designation only — no contact details. */
  title: string
  context: string
  /** Paraphrased summary of the letter, not a quotation. */
  summary: string
}

/** Summarised from written recommendation letters held on file. Bakht Munir
 *  also wrote one; he already appears in TESTIMONIALS, so he is not repeated. */
export const REFERENCES: Reference[] = [
  {
    name: 'Abdul Rahman',
    title: 'HCI & UX Project Delivery Consultant, American University of Sharjah',
    context: 'Head of Product Design at Phoenix Group',
    summary:
      'Credits Rehan with the real-time miner monitoring dashboards and APIs, a drop of more than 25% in downtime incidents, and deployment cycles cut by over 40% after the move to Kubernetes and CI/CD. Notes his habit of translating between business and engineering goals.',
  },
  {
    name: 'Abdul Basit',
    title: 'Product Architect, Rakuten Singapore',
    context: 'Joint projects over seven years',
    summary:
      'Describes rebuilding a client’s observability stack in live production, where Rehan proposed a parallel-stack migration that let customers move across with minimal risk, alongside per-flow bandwidth monitoring and alerting that cut downtime in critical systems by 20%.',
  },
  {
    name: 'Danyal Tariq',
    title: 'Software Engineer, Phoenix Group',
    context: 'Reported to Rehan for two years',
    summary:
      'Writes about the mentoring side: learning React and Strapi directly from Rehan, and crediting much of his own progress as a developer to that guidance. Describes Rehan setting the architecture and technical direction for the monitoring work.',
  },
  {
    name: 'Muhammad Ahmed',
    title: 'Engineering Cutting-Edge HPC and AI Infrastructure | University of Cambridge',
    context: 'IT Services Lead at the American University of Sharjah',
    summary:
      'Recalls Rehan’s ERP and CRM work at AUS, including the transition off the legacy Ellucian Banner system onto Oracle Fusion, and describes the work as reliable and well organised across faculty, staff and student systems.',
  },
  {
    name: 'Sameed Kashif',
    title: 'IT Administration Supervisor, Corsec Services, Australia',
    context: 'Studied together at COMSATS',
    summary:
      'Recalls Rehan helping shape his final-year breast cancer detection project and organising programming competitions for their cohort, and says he has remained a person he turns to for advice on cloud technologies since.',
  },
  {
    name: 'Muneeb Ahmad',
    title: 'Senior Department Manager, Australia · MSc Data Science',
    context: 'Studied together at COMSATS',
    summary:
      'Writes from thirteen years of knowing him: consistently strong in programming, robotics and networking at university, usually the first to pick up a new technology, and regularly helping classmates untangle their own projects.',
  },
]

export type JourneyEntry = {
  start: string
  end: string
  company: string
  role: string
  blurb: string
  industry: string
  /** Marks the role still in progress — renders the Current pill + filled dot. */
  current?: boolean
}

export const JOURNEY: JourneyEntry[] = [
  {
    start: 'NOV 2024',
    end: 'PRESENT',
    company: 'Gulf Agency Company',
    role: 'Software Engineer · via TASC',
    blurb: 'Enterprise frontends, reusable components, REST APIs, and integrations for logistics.',
    industry: 'Logistics',
    current: true,
  },
  {
    start: 'NOV 2023',
    end: 'OCT 2024',
    company: 'Phoenix Group',
    role: 'Senior Software Engineer',
    blurb: 'Digital mining platforms, monitoring dashboards, APIs, and deployment workflows.',
    industry: 'Digital infrastructure',
  },
  {
    start: 'SEP 2021',
    end: 'NOV 2023',
    company: 'Amadeus',
    role: 'Software Engineer · via Astek Middle East',
    blurb: 'Travel technology, enterprise applications, user experiences, and Azure CI/CD.',
    industry: 'Aviation',
  },
  {
    start: 'SEP 2019',
    end: 'SEP 2021',
    company: 'Winsoft Solutions',
    role: 'Software Developer',
    blurb: 'Healthcare web and mobile applications, backend services, and developer mentorship.',
    industry: 'Healthcare',
  },
  {
    start: 'JAN 2018',
    end: 'SEP 2019',
    company: 'Freelance / Independent',
    role: 'Software Developer',
    blurb: 'A multi-branch, multi-brand restaurant point-of-sale system, built end to end.',
    industry: 'Retail systems',
  },
]

export type PlaygroundId =
  | 'apis'
  | 'streaming'
  | 'healthcare'
  | 'aviation'
  | 'logistics'
  | 'cloud'

export type PlaygroundEntry = {
  id: PlaygroundId
  /** Label on the category tab in the explore bar. */
  category: string
  /** Which body of work this object stands for. */
  project: string
  eyebrow: string
  title: string
  body: string
  /** Label on the card's primary button — also replays the object animation. */
  cta: string
  /** Bottom-left micro-caption shown while this object is selected. */
  caption: string
  storyHref: string
  /** Resting position on the platform, [x, y, z] in world units. */
}

export const PLAYGROUND: PlaygroundEntry[] = [
  {
    id: 'apis',
    category: 'APIs',
    project: 'FixCors',
    eyebrow: 'DEVELOPER TOOLS',
    title: 'FixCors',
    body: 'Less friction between an idea and the API it needs.',
    cta: 'Send a packet',
    caption: 'A cleaner path for every request.',
    storyHref: 'https://fixcors.com',
  },
  {
    id: 'streaming',
    category: 'Streaming',
    project: 'NoBoxTV',
    eyebrow: 'INDEPENDENT PRODUCT',
    title: 'NoBoxTV',
    body: 'A browser, a stream, and a simpler way to watch.',
    cta: 'Change channel',
    caption: 'A new channel. Same curiosity.',
    storyHref: 'https://noboxtv.com',
  },
  {
    id: 'healthcare',
    category: 'Healthcare',
    project: 'Winsoft / Prescriptionly',
    eyebrow: 'HEALTHCARE · WINSOFT',
    title: 'Records that follow the patient.',
    body: 'EMR systems and prescription workflows built where correctness matters.',
    cta: 'Open the file',
    caption: 'Built where correctness matters.',
    storyHref: 'https://github.com/Prescriptionly/app',
  },
  {
    id: 'aviation',
    category: 'Aviation',
    project: 'Amadeus',
    eyebrow: 'AVIATION · AMADEUS',
    title: 'Booking the journey.',
    body: 'Airline booking and servicing flows serving millions of travellers.',
    cta: 'Take off',
    caption: 'Every seat, every leg, in sync.',
    storyHref: '#work',
  },
  {
    id: 'logistics',
    category: 'Logistics',
    project: 'Gulf Agency Company',
    eyebrow: 'GAC · 2024–PRESENT',
    title: 'Keeping things moving.',
    body: 'Connected interfaces and services for global logistics.',
    cta: 'Dispatch cargo',
    caption: 'A closer look at the work.',
    storyHref: '#work',
  },
  {
    id: 'cloud',
    category: 'Cloud',
    project: 'Phoenix Group',
    eyebrow: 'PHOENIX GROUP · 2023–2024',
    title: 'Behind the uptime.',
    body: 'Real-time dashboards and infrastructure built to keep running.',
    cta: 'Pulse the servers',
    caption: 'Systems that stay up.',
    storyHref: '#work',
  },
]

export type Repo = {
  name: string
  href: string
  blurb: string
  tags: string[]
  /** Only set where the numbers are worth showing. */
  meta?: string
}

export const REPOS: Repo[] = [
  {
    name: 'ADMS Server for ZKTeco',
    href: 'https://github.com/mmd-rehan/ADMS-server-ZKTeco',
    blurb:
      'An ADMS server for ZKTeco SpeedFace terminals, so attendance hardware can push records straight into your own system instead of the vendor’s software.',
    tags: ['PHP', 'Attendance hardware', 'Self-hosted'],
    meta: '27 stars · 16 forks',
  },
  {
    name: 'Prescriptionly',
    href: 'https://github.com/Prescriptionly/app',
    blurb:
      'A personal health app for capturing, storing and tracking your medication history, and sharing it with the people treating you.',
    tags: ['TypeScript', 'Health', 'In progress'],
  },
  {
    name: 'Textile POS & Inventory',
    href: 'https://github.com/mmd-rehan/textile-pos',
    blurb:
      'Software shaped around the realities of fabric retail: rolls, inventory, sales, and the details that generic POS systems miss.',
    tags: ['TypeScript', 'MySQL', 'Retail operations'],
  },
]
