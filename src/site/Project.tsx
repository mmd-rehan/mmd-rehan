import type { ReactNode } from 'react'

type Props = {
  art: ReactNode
  title: string
  href: string
  blurb: string
  tags: string[]
  detail: string
}

export function Project({ art, title, href, blurb, tags, detail }: Props) {
  return (
    <article className="project">
      {art}
      <div className="project-info">
        <div className="project-title">
          <h3>{title}</h3>
          <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${title}`}>
            ↗
          </a>
        </div>
        <p>{blurb}</p>
        <div className="tags">
          {tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <details>
          <summary>
            Behind the build <span>+</span>
          </summary>
          <p>{detail}</p>
        </details>
      </div>
    </article>
  )
}
