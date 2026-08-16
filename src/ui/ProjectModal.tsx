import { useEffect } from 'react'
import type { ProjectDetail } from '../content/chapters'

interface ProjectModalProps {
  project: ProjectDetail | null
  onClose: () => void
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (project) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [project, onClose])

  if (!project) return null

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close project modal"
        >
          ✕
        </button>

        <div className="modal-header">
          <div className="modal-eyebrow">
            {project.company} · {project.period}
          </div>
          <h2 className="modal-title">{project.title}</h2>
          <div className="modal-subtitle">{project.role}</div>
        </div>

        <div className="modal-section">
          <p className="chapter__proof" style={{ maxWidth: '100%' }}>
            {project.summary}
          </p>
        </div>

        {project.metrics.length > 0 && (
          <div className="modal-section">
            <div className="modal-section__title">Key Impact & Metrics</div>
            <div className="chapter__metrics">
              {project.metrics.map((m: { label: string; value: string }, i: number) => (
                <div key={i} className="metric-chip">
                  <span>{m.label}:</span>
                  <span className="metric-chip__val">{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-section">
          <div className="modal-section__title">Technical Highlights</div>
          <ul className="modal-highlights">
            {project.highlights.map((h: string, i: number) => (
              <li key={i} className="modal-highlight-item">
                {h}
              </li>
            ))}
          </ul>
        </div>

        <div className="modal-section">
          <div className="modal-section__title">Technology Stack</div>
          <div className="tech-tags">
            {project.technologies.map((tech: string, i: number) => (
              <span key={i} className="tech-tag">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {project.links && project.links.length > 0 && (
          <div className="modal-section" style={{ marginBottom: 0 }}>
            <div className="modal-section__title">Links & Credentials</div>
            <div className="chapter__actions">
              {project.links.map((link: { label: string; url: string }, i: number) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--primary"
                >
                  {link.label} ↗
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
