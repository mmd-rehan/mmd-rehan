import { useState } from 'react'
import type { Repo } from './data'

/** Blurbs longer than this get clamped to three lines with a toggle. */
const CLAMP_AT = 150

export function RepoCard({ repo }: { repo: Repo }) {
  const [expanded, setExpanded] = useState(false)
  const clampable = repo.blurb.length > CLAMP_AT

  return (
    <article className="repo">
      <div className="repo-head">
        <h3>{repo.name}</h3>
        <a
          href={repo.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${repo.name} on GitHub`}
        >
          ↗
        </a>
      </div>

      <p className={clampable && !expanded ? 'repo-blurb clamp-3' : 'repo-blurb'}>
        {repo.blurb}
      </p>
      {clampable && (
        <button
          type="button"
          className="repo-more"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'See less' : 'See more'}
        </button>
      )}

      <div className="tags">
        {repo.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>

      <div className="repo-meta">{repo.meta ?? ''}</div>
    </article>
  )
}
