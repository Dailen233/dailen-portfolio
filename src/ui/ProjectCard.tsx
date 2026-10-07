import type { Project } from '../content/types'

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="project-card">
      <h3>{project.name}</h3>
      <p className="project-status">{project.status}</p>
      <p className="project-summary">{project.summary}</p>

      <div className="project-links">
        {project.demoUrl ? (
          <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
            在线演示 ↗
          </a>
        ) : (
          <span className="muted">演示地址待补充</span>
        )}
        {project.sourceUrl ? (
          <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer">
            源码 ↗
          </a>
        ) : (
          <span className="muted" aria-disabled="true">
            源码地址待补充
          </span>
        )}
      </div>

      <div className="project-details">
        <p>技术栈：{project.stack?.length ? project.stack.join('、') : '待补充'}</p>
        <p>本人工作：{project.myWork ?? '待补充'}</p>
      </div>
    </article>
  )
}
