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
